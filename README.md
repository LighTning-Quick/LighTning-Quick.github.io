# 学术主页与易经项目

根目录为 Academic Pages 学术主页，提供中英文切换。字体、字号体系及主题来自原始网页模板，不套用 PDF 简历字体。

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
- `/activities/`、`/zh/activities/`：Hobbies / 兴趣
- `/hobbies/iching/`：从本地 `site/` 挂载的易经阅读站
- `/hobbies/taiji/`：从本地 `卦爻分析/taichi-S/` 挂载的太极 S

译文阅读直接使用 `site/` 下已有 HTML，未另行生成译文页面。`卦爻翻译/` 保留 Markdown 源码，不生成另一套公开阅读页。`scripts/mount-hobbies.cjs` 在预览与正式构建中将现有网页挂载到 Hobbies 下，并加入返回兴趣栏目的入口。

## 修改内容

- `_pages/`：中英文个人页面。`lang` 指定语言，`alternate_url` 指向当前页面的另一语言版本。
- `_data/i18n.json`：双语侧栏及界面文字。
- `_data/navigation.yml`：双语导航。
- `_config.yml`：账号、站点域名、单位等。已配置 ResearchGate、Google Scholar、ORCID 和 GitHub。
- `_data/publications.json`：论文资料；论文正式题名保留英文。
- `files/Tingjun_Li_CV.pdf`：英文 PDF 简历，沿用现有文件。
- `assets/css/academic-custom.css`：少量间距及兴趣栏目样式；不覆盖模板字体。

## 同步易经项目的相关文件

在本文件夹运行：

    node scripts/import-iching.cjs "E:/OneDrive/文档/八卦/3.释义/周易译注黎批/易经诠释"
    npm run build:preview

导入器只读取指定的 `site/`、`卦爻分析/taichi-S/` 与 `卦爻翻译/`，并参考原项目 `.gitignore`，不会复制整份 OneDrive 项目。太极 S 是明确要求导入的内容，优先于原 ignore 中屏蔽父目录的宽泛规则。导入是复制操作，原目录不受修改；不会自动删除目标中的文件。

构建正式输出时，先执行 `bundle exec jekyll build`，再执行 `node scripts/mount-hobbies.cjs _site`。工作流已包含这两个步骤。

## GitHub 整合与发布

当前 origin 为 `https://github.com/LighTning-Quick/LighTning-Quick.github.io.git`；整合分支为 `codex/academic-homepage-integration`，以现有远程 `main` 为基线，因此保留原仓库提交历史。该分支用于审阅整合内容；合并到 main 后由 GitHub Actions 发布。

推荐在确认本地效果后，将整合分支推送并以 PR 合并到 `main`。仓库 Settings → Pages → Source 选择 GitHub Actions，合并后由工作流构建及部署；根域名将显示个人介绍首页，CV 保持在 /cv/。

完整整合说明见 INTEGRATION.md。原模板许可见 LICENSE 与 UPSTREAM.md。
