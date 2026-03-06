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

**方法 A：通过 Vercel 仪表板**

1. 访问 https://vercel.com/new
2. 选择 "Import Git Repository"
3. 选择你的 `blog` 仓库
4. 配置项目：
   - **Project Name**: `blog-fixit`
   - **Framework Preset**: Other
   - **Root Directory**: `./`（保持默认）
   - **Build Command**: `hugo --config config/_default,config/fixit --gc --minify`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`
5. 点击 "Deploy"
6. 部署完成后，在项目页面顶部点击 "View Domains" 或 "Settings"
7. 找到 "Domains" 部分（通常在项目概览页面或 Settings 标签下）
8. 点击 "Add" 或 "Add Domain"
9. 输入：`fixit.blog.panghuli.cn`
10. 按照提示配置 DNS

**方法 B：通过 CLI（推荐）**

```bash
# 部署 FixIt 主题
vercel --prod --name blog-fixit

# 添加域名
vercel domains add fixit.blog.panghuli.cn blog-fixit
```

### 4. 部署 Next 主题

**方法 A：通过 Vercel 仪表板**

重复步骤 3，但使用：
- **Project Name**: `blog-next`
- **Build Command**: `hugo --config config/_default,config/next --gc --minify`
- **域名**: `next.blog.panghuli.cn`

**方法 B：通过 CLI（推荐）**

```bash
# 部署 Next 主题
vercel --prod --name blog-next

# 添加域名
vercel domains add next.blog.panghuli.cn blog-next
```

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
