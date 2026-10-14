#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""切换 Claude Code 的模型供应商。

供应商凭据保存在仓库根目录的 .env；激活配置写入
.claude/settings.local.json，供 Claude Code 直接读取。
"""

# 兼容 Python 3.8：注解延迟求值，否则 dict[str, str] 在 3.9 以下会报
# TypeError: 'type' object is not subscriptable
from __future__ import annotations

import json
import os
import sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SETTINGS = os.path.join(HERE, "settings.local.json")
ENV_FILE = os.path.join(ROOT, ".env")

PROVIDERS = {
    "claude": {},
    "deepseek": {
        "ANTHROPIC_BASE_URL": "https://api.deepseek.com/anthropic",
        "ANTHROPIC_MODEL": "deepseek-flash",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-flash",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-flash",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-flash",
        "ANTHROPIC_DEFAULT_FABLE_MODEL": "deepseek-pro",
        "ANTHROPIC_SMALL_FAST_MODEL": "deepseek-flash",
        "CLAUDE_CODE_SUBAGENT_MODEL": "deepseek-flash",
    },
    "zhipu": {
        "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
        "ANTHROPIC_MODEL": "glm-5.3-flash",
        "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.3-flash",
        "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.3-flash",
        "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.3-flash",
        "ANTHROPIC_DEFAULT_FABLE_MODEL": "glm-5.3",
        "ANTHROPIC_SMALL_FAST_MODEL": "glm-5.3-flash",
        "CLAUDE_CODE_SUBAGENT_MODEL": "glm-5.3-flash",
    },
    # OpenAI 经由本地网关（BASE_URL 由 .env 提供，见 BASE_URL_KEYS）。
    # 仅覆盖端点和凭据；主模型及子代理档位继承用户级设置。
    "openai": {},
}

TOKEN_KEYS = {
    "deepseek": "DEEPSEEK_ANTHROPIC_AUTH_TOKEN",
    "zhipu": "ZHIPU_ANTHROPIC_AUTH_TOKEN",
    "openai": "OPENAI_AUTH_TOKEN_2",
}

BASE_URL_KEYS = {
    "openai": "OPENAI_ANTHROPIC_BASE_URL",
}

USER_SETTINGS = os.path.join(os.path.expanduser("~"), ".claude", "settings.json")

MANAGED_KEYS = {
    "ANTHROPIC_BASE_URL",
    "ANTHROPIC_AUTH_TOKEN",
    "ANTHROPIC_MODEL",
    "ANTHROPIC_DEFAULT_OPUS_MODEL",
    "ANTHROPIC_DEFAULT_SONNET_MODEL",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL",
    "ANTHROPIC_DEFAULT_FABLE_MODEL",
    "ANTHROPIC_SMALL_FAST_MODEL",
    "CLAUDE_CODE_SUBAGENT_MODEL",
}


def load_settings() -> dict:
    if os.path.exists(SETTINGS):
        with open(SETTINGS, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_settings(data: dict) -> None:
    with open(SETTINGS, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")


def load_dotenv() -> dict[str, str]:
    values: dict[str, str] = {}
    if not os.path.exists(ENV_FILE):
        return values
    with open(ENV_FILE, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values[key.strip()] = value.strip().strip("'\"")
    return values


def gateway_discovery_enabled() -> bool:
    """模型发现是否开启（进程环境或用户级 settings.env 任一命中即可）。"""
    if os.environ.get("CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY") == "1":
        return True
    try:
        with open(USER_SETTINGS, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, ValueError):
        return False
    value = data.get("env", {}).get("CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY")
    return value is True or str(value) == "1"


def current_provider(data: dict) -> str:
    env = data.get("env", {})
    base = env.get("ANTHROPIC_BASE_URL", "")
    if "deepseek" in base:
        return "deepseek"
    if "bigmodel" in base:
        return "zhipu"
    # openai 走自建/中转网关，地址不定，改用令牌回认供应商
    token = env.get("ANTHROPIC_AUTH_TOKEN")
    if token:
        dotenv = load_dotenv()
        for name, key in TOKEN_KEYS.items():
            if dotenv.get(key) == token:
                return name
    return "claude（默认/未覆盖）"


def main() -> int:
    if len(sys.argv) < 2:
        data = load_settings()
        print("当前激活供应商:", current_provider(data))
        print("可用: " + " | ".join(PROVIDERS))
        return 0

    mode = sys.argv[1].lower()
    if mode not in PROVIDERS:
        print(f"未知模式: {mode}，可选 {sorted(PROVIDERS)}", file=sys.stderr)
        return 1

    data = load_settings()
    env = data.setdefault("env", {})
    for key in MANAGED_KEYS:
        env.pop(key, None)

    config = dict(PROVIDERS[mode])
    dotenv = load_dotenv()

    token_key = TOKEN_KEYS.get(mode)
    if token_key:
        token = dotenv.get(token_key)
        if not token:
            print(f"缺少 {token_key}，请先写入 {ENV_FILE}", file=sys.stderr)
            return 1
        config["ANTHROPIC_AUTH_TOKEN"] = token

    base_url_key = BASE_URL_KEYS.get(mode)
    if base_url_key:
        base_url = dotenv.get(base_url_key, "")
        if not base_url:
            print(
                f"{mode} 模式的端点地址未配置：请在 {ENV_FILE} 中取消注释并填写\n"
                f"    {base_url_key}=http://<你的网关地址>:<端口>\n"
                f"（Claude Code 无法直连 api.openai.com，需要一个 Anthropic 兼容的代理）",
                file=sys.stderr,
            )
            return 1
        if not base_url.startswith(("http://", "https://")):
            print(
                f"{base_url_key} 不是合法地址: {base_url!r}，需以 http:// 或 https:// 开头",
                file=sys.stderr,
            )
            return 1
        config["ANTHROPIC_BASE_URL"] = base_url

    env.update(config)
    if not env:
        data.pop("env", None)
    save_settings(data)

    print(f"[OK] 已切换到 {mode}")
    if mode == "openai":
        print("     主模型及子代理档位继承用户级设置；/model 可选择网关模型。")
        if not gateway_discovery_enabled():
            print(
                "     警告：未检测到 CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1，"
                "openai 模式不再写死模型名，此时 /model 里将没有可用模型。",
                file=sys.stderr,
            )
    print("     请完全重启 Claude Code（关闭会话后重新打开）以生效。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
