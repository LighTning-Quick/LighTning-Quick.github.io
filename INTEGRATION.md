# 整合说明

个人介绍首页位于根目录，CV 位于 /cv/。

> **2026-11 更新**：易经相关内容（`site/`、`卦爻翻译/`、`卦爻分析/taichi-S/`）已分离至独立仓库 `LighTning-Quick/yijing`，由其自带 GitHub Actions 构建发布到 `https://lightning-quick.github.io/yijing/`（阅读站）与 `.../yijing/taiji/`（太极 S）。本仓库兴趣栏目直接链接新地址；旧路径 `/site/*` 与 `/hobbies/taiji/*` 由 `_pages/redirect-site.html`、`_pages/redirect-taiji.html` 及 404 页脚本自动跳转。`scripts/mount-hobbies.cjs` 与 `scripts/import-iching.cjs` 已随迁至新仓库（或删除）。以下为分离前的整合记录，供追溯。

## 路径映射（分离后）

| 仓库源码 | 构建后网址 |
| --- | --- |
| Academic Pages `_pages/` | `/` 及 `/zh/` 下的学术页面 |
| `_pages/activities*.html` | `/activities/`、`/zh/activities/`（链接至 yijing 仓库站点） |
| `_pages/redirect-site.html` | `/site/`（跳转至 `lightning-quick.github.io/yijing/`） |
| `_pages/redirect-taiji.html` | `/hobbies/taiji/`（跳转至 `.../yijing/taiji/`） |

## 路径映射（分离前，历史记录）

| 仓库源码 | 构建后网址 |
| --- | --- |
| `site/` | `/site/`，保留其内部相对目录 |
| `卦爻分析/taichi-S/` | `/hobbies/taiji/` |
| `卦爻翻译/` | 仅作为仓库中的译文 Markdown 源码 |

分离前 `site`、`卦爻分析`、`卦爻翻译` 从 Jekyll 的直接输出中排除，Jekyll 构建后由 `scripts/mount-hobbies.cjs` 挂载到兴趣子路径并注入返回兴趣栏目的链接。

## Git 历史

- origin：`https://github.com/LighTning-Quick/LighTning-Quick.github.io.git`
- 基线：远程 main，`0b6b7312796fcb2ceebfd894fb33aa3cdcfd7e51`
- 当前分支：`codex/academic-homepage-integration`，以此基线建立
- 模板参考分支：`codex/template-reference`，保留下载的 Academic Pages 上游记录
- 保留原仓库历史，整合通过独立分支推送；未执行强制推送

模板文件作为整合分支中的新增文件，旧站文件沿用远程历史，并加入 OneDrive 本地相关文件的最新内容。原 OneDrive 仓库的 remote 仍为旧名称；没有修改该仓库。

## 导入范围

按原项目 ignore 规则筛选，只导入明确相关的网页及译文源码。本次导入 148 个文件，其中 50 个译文或项目文档 Markdown；本地忽略的六份阿语文件不带入。远程此前已经跟踪的六份阿语文件保留远程原版本，避免本次整合删除已有文件。

本次没有复制项目根部其他研究笔记、缓存、个人配置或环境文件。导入清单与逐文件 SHA-256 保存在 `.integration/iching-import.json`，该目录不参与提交或发布。

## 推荐后续流程

1. 在当前目录完善并检查双语学术主页。
2. 原 OneDrive 项目继续用于译注写作与 MkDocs 导出。
3. 易经内容的导入与构建已移至 `../yijing/` 独立仓库，由其工作流发布。
4. 将整合分支推送至同一远程，通过 PR 合入 main。
5. GitHub Pages 使用 GitHub Actions；工作流构建学术主页后部署，易经阅读站由 yijing 仓库的工作流独立发布。

不要直接将 Academic Pages 的上游 main 推到现有远程 main。当前整合分支已经以你的远程历史为起点。

## 已知验证边界

本地预览使用原版 Academic Pages 模板与 Sass；正式 Jekyll 构建已通过 GitHub Actions 验证。根目录用于学术主页；易经阅读站与太极 S 由独立仓库发布，旧地址仅保留跳转。
