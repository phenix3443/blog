# 概述

[![Deploy Hugo site to Pages](https://github.com/phenix3443/blog/actions/workflows/hugo.yml/badge.svg)](https://github.com/phenix3443/blog/actions/workflows/hugo.yml)

- 使用 [hugo](https://gohugo.io/) 搭建的个人博客。
- 支持多主题动态切换，用户可在浏览器中实时切换主题：
  - [hugo-theme-bootstrap](https://github.com/razonyang/hugo-theme-bootstrap) - 默认主题
  - [FixIt](https://github.com/hugo-fixit/FixIt) - 现代简洁主题
  - [hugo-theme-next](https://github.com/hugo-next/hugo-theme-next) - 经典 Next 主题

## 特性

- 📱 响应式设计，支持移动端
- 🎨 三种主题可选，用户偏好自动保存
- 🚀 自动部署到 GitHub Pages
- 📝 支持 Markdown 写作
- 🔍 全文搜索功能
- 💬 评论系统集成

## 本地开发

```bash
# 启动开发服务器（默认 bootstrap 主题）
hugo server

# 使用特定主题启动
hugo server --config "config/_default,config/fixit"

# 构建所有主题
./scripts/build-all-themes.sh
```

## 访问地址

- 主站：https://blog.panghuli.cn
- Bootstrap 主题：https://blog.panghuli.cn/bootstrap/
- FixIt 主题：https://blog.panghuli.cn/fixit/
- Next 主题：https://blog.panghuli.cn/next/

