"""Load embedding credentials without storing secrets in source files."""

import os
from pathlib import Path

from dotenv import dotenv_values
from openai import OpenAI


def create_client():
    """Use the project's Zhipu key, or explicit embedding configuration."""
    project_root = Path(__file__).resolve().parents[2]
    values = {
        **dotenv_values(project_root / ".env", encoding="utf-8-sig"),
        **os.environ,
    }
    api_key = (
        values.get("EMBEDDING_API_KEY")
        or values.get("ZHIPU_API_KEY")
        or values.get("ZHIPU_ANTHROPIC_AUTH_TOKEN")
    )
    if not api_key:
        raise RuntimeError(
            "Set EMBEDDING_API_KEY or ZHIPU_API_KEY in the environment or project .env."
        )
    return OpenAI(
        api_key=api_key,
        base_url=values.get("EMBEDDING_BASE_URL")
        or "https://open.bigmodel.cn/api/paas/v4/",
        timeout=60.0,
        max_retries=1,
    )
