# 博客

使用 [Hugo](https://gohugo.io/) 和 [FixIt](https://github.com/hugo-fixit/FixIt) 构建的中文技术博客。

- 主站：<https://blog.panghuli.cn/>
- Hugo：0.170.1
- FixIt：v1.0.0-rc.5（官方当前最新发布版本，版本名称仍带候选标记）
- Dart Sass：通过项目依赖 `sass-embedded` 1.108.2 提供，不需要全局安装。

## 本地开发

准备 Node.js 22 或更高版本、Go 和 Hugo 0.170.1：

```bash
npm ci
npm run dev
```

打开终端输出的本地地址，默认是 <http://localhost:1313/>。

```bash
npm run build          # 构建到 public/，清理旧主题遗留的输出
make check             # 脚本与配置回归检查，需要 Python 3 和 ShellCheck
npx playwright install chromium
npm test               # 完整构建及浏览器检查
```

使用 npm 或 Makefile 入口时，会自动使用项目内的 Dart Sass。直接执行 `hugo` 需要自行将 `node_modules/.bin` 加入 `PATH`。

浏览器检查覆盖首页、搜索、深浅色切换和偏好保存、文章公式、归档分页、分类、标签、关于页及手机导航。截图输出到系统临时目录下的 `blog-fixit-validation/`。

## 内容和配置

- `content/posts/`：文章；文章路径和 slug 保持原有规则。
- `config/_default/`：FixIt 主站配置，使用新版的 snake_case 参数。
- `make build-fixit`：使用主站配置构建可选子域名，通过 `--baseURL` 覆盖地址。
- `archetypes/default.md`：新文章模板。
- `layouts/shortcodes/gist.html`：保留的自定义短代码。

```bash
hugo new content posts/post-name/index.md
```

旧 Bootstrap、Next 主题配置和专用模板已移除。评论服务未配置；需要启用时填写 FixIt 对应的服务参数。

## 部署

- GitHub Pages：`.github/workflows/hugo.yml`。
- Vercel：参见 [部署指南](VERCEL_DEPLOY.md)。
- PR 检查：`.github/workflows/check.yml`，运行脚本检查、完整构建和浏览器测试。

推送到 `main` 会触发现有生产发布流程。本地构建与测试不会发布。
