---
title: "Hugo"
description: Hugo 静态博客生成器
slug: hugo
date: 2022-04-22T14:42:36+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - Web
tags:
  - hugo
---

## 概述

- [Awesome Hugo](https://github.com/theNewDynamic/awesome-hugo) 包含与 Hugo 有关的资源清单。

## Config

查看当前站点的配置：

```shell
hugo config --format yaml
```

查看 mounts 的 config：

```shell
hugo config mounts
```

## modules

- [通过 module 来使用 theme](https://gohugo.io/hugo-modules/use-modules/#use-a-module-for-a-theme)
- [Hugo Modules: everything you need to know!](https://www.thenewdynamic.com/article/hugo-modules-everything-from-imports-to-create/)

## template

- 理解 template 的 [查找顺序](https://gohugo.io/templates/lookup-order/) 很重要。
- 如果使用 prettier 格式化 go-template 模板文件需要使用 [prettier-plugin-go-template](https://github.com/NiklasPor/prettier-plugin-go-template) 插件：

{{< gist phenix3443 83f33f1f4d18cbc6ca7ce5442ea25958 >}}

## Deploy

### GitHub Pages

[Host on GitHub pages](https://gohugo.io/hosting-and-deployment/hosting-on-github/) 可以通过 Action 而不是以前 branch 的方式来部署。

## themes

- [awesome hugo theme](https://github.com/QIN2DIM/awesome-hugo-themes) 按照 Github Stars 排名，持续更新。
- [bootstrap](https://github.com/razonyang/hugo-theme-bootstrap)
- [even](https://github.com/olOwOlo/hugo-theme-even)，经典，但是时间久了没有更新。
- [DoIt](https://github.com/HEIGE-PCloud/DoIt)
- [fixit](https://github.com/hugo-fixit/FixIt) 和 DoIt 有点像。
- [meme](https://github.com/reuixiy/hugo-theme-meme)
- [Docsy](https://themes.gohugo.io/themes/docsy/) A Hugo theme for technical documentation sites
