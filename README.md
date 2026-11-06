# 学术主页

根目录为 Academic Pages 学术主页，提供中英文切换。字体、字号体系及主题来自原始网页模板，不套用 PDF 简历字体。

易经项目（卦爻翻译阅读站与太极 S）已于 2026-11 迁至独立仓库 `LighTning-Quick/yijing`（本仓库旁的 `../yijing/` 文件夹），发布于 `https://lightning-quick.github.io/yijing/`；本仓库兴趣栏目链接过去，旧地址 `/site/` 与 `/hobbies/taiji/` 由跳转页与 404 脚本自动接引。

## 本地查看

    npm install
    npm run preview

打开 http://localhost:4173 。中文首页为 /zh/，兴趣栏目为 /zh/activities/。

预览直接使用 Academic Pages 原始布局、Liquid 模板和 Sass，包含网站真实导航及资源。正式发布由 GitHub Actions 执行 Jekyll 构建；本机没有 Ruby，正式 Jekyll 构建尚未在本机执行。

## 网站结构

- `/`、`/zh/`：英文与中文学术首页
- `/research/`、`/zh/research/`：研究经历
- `/publications/`、`/zh/publications/`：论文
- `/teaching/`、`/zh/teaching/`：教学与服务
- `/cv/`、`/zh/cv/`：在线简历与 PDF 下载
- `/activities/`、`/zh/activities/`：Hobbies / 兴趣（链接至独立易经仓库）
- `/site/`、`/hobbies/taiji/`：旧地址跳转页（易经阅读站与太极 S 已迁至 `lightning-quick.github.io/yijing/`）

## 修改内容

- `_pages/`：中英文个人页面。`lang` 指定语言，`alternate_url` 指向当前页面的另一语言版本。
- `_data/i18n.json`：双语侧栏及界面文字。
- `_data/navigation.yml`：双语导航。
- `_config.yml`：账号、站点域名、单位等。已配置 ResearchGate、Google Scholar、ORCID 和 GitHub。
- `_data/publications.json`：论文资料；论文正式题名保留英文。
- `files/Tingjun_Li_CV.pdf`：英文 PDF 简历，沿用现有文件。
- `assets/css/academic-custom.css`：少量间距及兴趣栏目样式；不覆盖模板字体。
- `_pages/redirect-site.html`、`_pages/redirect-taiji.html`：旧地址跳转页；`_pages/404.html` 内含 `/site/*`、`/hobbies/taiji/*` 深层旧链接的自动接引脚本。

## 同步易经项目的相关文件

易经内容现由独立仓库管理（本仓库旁 `../yijing/`），从中 OneDrive 源项目的导入、构建与发布均在那个仓库进行，见其 README。本仓库仅需在阅读站地址变化时更新兴趣栏目链接与跳转页。

## GitHub 整合与发布

当前 origin 为 `https://github.com/LighTning-Quick/LighTning-Quick.github.io.git`；整合分支为 `codex/academic-homepage-integration`，以现有远程 `main` 为基线，因此保留原仓库提交历史。该分支用于审阅整合内容；合并到 main 后由 GitHub Actions 发布。

推荐在确认本地效果后，将整合分支推送并以 PR 合并到 `main`。仓库 Settings → Pages → Source 选择 GitHub Actions，合并后由工作流构建及部署；根域名将显示个人介绍首页，CV 保持在 /cv/。

完整整合说明见 INTEGRATION.md。原模板许可见 LICENSE 与 UPSTREAM.md。
