# Vercel 多主题部署指南

## 方案概述

使用 Vercel 部署 3 个独立项目，每个项目对应一个主题：

- **Bootstrap 主题** → `blog.panghuli.cn`
- **FixIt 主题** → `fixit.blog.panghuli.cn`
- **Next 主题** → `next.blog.panghuli.cn`

## 部署步骤

### 1. 准备工作

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login
```

### 2. 部署 Bootstrap 主题（主站）

```bash
# 在项目根目录执行
vercel --prod

# Vercel 会自动使用 vercel.json 配置
```

### 3. 部署 FixIt 主题

在 Vercel 仪表板创建新项目：
1. 访问 https://vercel.com/new
2. 导入同一个 GitHub 仓库
3. 项目名称：`blog-fixit`
4. 在 Settings → General → Build & Development Settings：
   - Build Command: `hugo --config config/_default,config/fixit --gc --minify`
   - Output Directory: `public`
5. 在 Settings → Domains 添加：`fixit.blog.panghuli.cn`

### 4. 部署 Next 主题

重复步骤 3，但使用：
- 项目名称：`blog-next`
- Build Command: `hugo --config config/_default,config/next --gc --minify`
- 域名：`next.blog.panghuli.cn`

### 5. DNS 配置

在你的域名提供商（如 Cloudflare、阿里云）添加：

```
类型    名称    值
A       blog    76.76.21.21
CNAME   fixit   cname.vercel-dns.com
CNAME   next    cname.vercel-dns.com
```

或者使用 Vercel 提供的具体 CNAME 值（在添加域名时会显示）。

## 自动部署

每次推送到 `main` 分支，Vercel 会自动重新部署所有 3 个项目。

## 费用

完全免费（Hobby 计划），包括：
- 无限自定义域名
- 自动 SSL 证书
- 全球 CDN
- 每月 100GB 带宽
