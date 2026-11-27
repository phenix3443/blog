# 项目说明

这是使用 FixIt 的 Hugo 中文技术博客。开发与检查命令见 `README.md`；Vercel 发布前读取 `VERCEL_DEPLOY.md`。

- 默认配置位于 `config/_default/`，文章位于 `content/posts/`。
- 使用 Hugo 0.170.1 和 `go.mod` 固定的 FixIt 版本，保持文章 slug 和既有路径。
- `npm ci` 安装依赖；通过 `npm run dev`、`npm run build` 使用项目内的 Dart Sass，不需要全局安装。
- FixIt v1 参数采用 snake_case，遵循主题官方配置，不添加旧主题的专用模板。
- 自定义短代码位于 `layouts/shortcodes/`。
- `make check` 检查脚本和配置；`npm test` 构建站点并运行浏览器检查。交付前都要通过。
- 主站为 `blog.panghuli.cn`；可选子域名构建通过 `--baseURL` 覆盖地址，保持生产构建环境。
- 推送到 `main` 会触发生产发布；本地验证不执行发布。
