# Vercel 部署

主站和保留的子域名均使用 FixIt：

| 站点 | 配置文件 | 域名 |
| --- | --- | --- |
| 主站 | `vercel.json` | `blog.panghuli.cn` |
| 子域名 | `vercel.fixit.json` | `fixit.blog.panghuli.cn` |

构建使用 Hugo 0.170.1 和 `npm ci --include=dev` 安装的 Dart Sass。Node.js 版本要求见 `package.json`。

## 发布两个项目

先在 Vercel 确认目标项目，安装 Vercel CLI 并登录，再设置以下环境变量：

- `VERCEL_ORG_ID`：组织编号。
- `VERCEL_PROJECT_ID_BOOTSTRAP`：现有主站项目编号；沿用原变量名，以保留已有项目绑定，构建主题已改为 FixIt。
- `VERCEL_PROJECT_ID_FIXIT`：子域名项目编号。

```bash
./deploy-vercel.sh
```

该脚本直接发布生产环境，依次选择两个项目及其配置，任何一步失败都会停止。脚本不删除 `.vercel/`，不覆盖 `vercel.json`，不添加域名。域名在目标项目的设置中配置。

## 单独发布

设置 `VERCEL_ORG_ID` 和目标项目的 `VERCEL_PROJECT_ID` 后执行对应命令：

```bash
vercel deploy --local-config vercel.json --prod
vercel deploy --local-config vercel.fixit.json --prod
```

`--local-config` 指定构建配置；`VERCEL_PROJECT_ID` 指定发布项目，两者必须匹配。[Vercel 官方说明](https://vercel.com/docs/cli/global-options)。

远端构建没有完整 Git 历史，配置显式关闭 `enableGitInfo`，使用文章元数据计算修改日期，不伪造 Git 提交。

## 自动发布与检查

- `.github/workflows/deploy-main-vercel.yml` 使用原主站项目密钥 `VERCEL_PROJECT_ID_BOOTSTRAP`。
- `.github/workflows/deploy-fixit-vercel.yml` 使用 `VERCEL_PROJECT_ID_FIXIT`。
- 推送到 `main` 会触发生产发布，两个项目均构建 FixIt。

发布前运行 `make check` 和 `npm test`。检查中的 Vercel 命令由模拟程序代替，不会发布。
