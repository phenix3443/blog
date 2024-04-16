---
title: "Hugo"
description: 使用 Hugo 生成静态博客站点
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
math: true
---

本文介绍如何使用 hugo 搭建站点。

<!--more-->

## 概述

[hugo](https://gohugo.io/) 号称“世界上最快的静态网站生成器”。

## 使用

为 zsh 安装自动补全：

```shell
hugo completion zsh > $(brew --prefix)/share/zsh/site-functions/_hugo
```

参见 [zsh 自动补全]({{< ref "posts/zsh#auto-completion" >}})

其他 shell 安装参见 [hugo completion](https://gohugo.io/commands/hugo_completion/)

查看当前站点的配置：

```shell
hugo config --format yaml
```

更多命令行使用参见 [cli](https://gohugo.io/commands/)

### 数学公式

如果在文章中用到数学公式，通常有两个方案：

+ [mathjax](https://www.gohugo.org/doc/tutorials/mathjax/)
+ [$\LaTeX$](https://333rd.net/posts/tech/hugo%E6%B7%BB%E5%8A%A0mathjax%E6%95%B0%E5%AD%A6%E5%85%AC%E5%BC%8F%E6%94%AF%E6%8C%81/) 推荐收藏 [$\KaTeX$ 公式编辑器符号大全](https://blog.csdn.net/YuYunTan/article/details/83617781) ，每次编写都需要翻阅。完整说明查看 [文档](https://katex.org/docs/supported.html)。

### modules

Hugo modules 是 Hugo 的核心构建组件。module 可以是主项目，也可以是一个小组件，用来提供 Hugo 中定义的 7 种组件类型（`static, content, layouts, data, assets, i18n, and archetypes`）中的一种或多种。

可以任意组合 module，甚至可以挂载非 Hugo 项目的目录，形成一个虚拟的大联合文件系统。

Hugo module 由 Go module 提供支持。有关 Go module 的更多信息，请参阅：

+ <https://github.com/golang/go/wiki/Modules>
+ <https://go.dev/blog/using-go-modules>

我们可以 [通过 module 来使用 theme](https://gohugo.io/hugo-modules/use-modules/#use-a-module-for-a-theme)，比如当前博客主题就是通过 module 挂载的：

{{< code-toggle >}}
module:
  imports:
    - path: github.com/razonyang/hugo-theme-bootstrap

{{< /code-toggle >}}

[Hugo Modules: everything you need to know!](https://www.thenewdynamic.com/article/hugo-modules-everything-from-imports-to-create/)

查看 mounts 的 config：

```shell
hugo config mounts
```

## 主题

### 模板

+ 理解 template 的 [查找顺序](https://gohugo.io/templates/lookup-order/) 很重要。
+ 如果使用 prettier 格式化 go-template 模板文件需要使用 [prettier-plugin-go-template](https://github.com/NiklasPor/prettier-plugin-go-template) 插件：

{{< gist phenix3443 83f33f1f4d18cbc6ca7ce5442ea25958 >}}

### 流行主题

+ [官方主题集合](https://themes.gohugo.io/)
+ [awesome hugo theme](https://github.com/QIN2DIM/awesome-hugo-themes) 按照 Github Stars 排名，持续更新。
+ [bootstrap](https://github.com/razonyang/hugo-theme-bootstrap)
+ [even](https://github.com/olOwOlo/hugo-theme-even)，经典，但是时间久了没有更新。
+ [DoIt](https://github.com/HEIGE-PCloud/DoIt) 是 [loveIt](https://github.com/dillonzq/LoveIt) 的后续开发。
+ [FixIt](https://github.com/hugo-fixit/FixIt) 和 DoIt 有点像，但是个人感觉更好。
+ [meme](https://github.com/reuixiy/hugo-theme-meme)
+ [Docsy](https://themes.gohugo.io/themes/docsy/) A Hugo theme for technical documentation sites
+ [nexT](https://github.com/hugo-next/hugo-theme-next) 非常棒的一个主题，下次尝试。

## 部署

### Build check

Push 到仓库前可以先进行本地 build 来检查是否有错误，避免 Github Action 出错到站站点更新失败，这个功能可以通过 [husky]({{< ref "posts/husky" >}}) 配置为 git hook 来自动化。

```shell
npx husky add ./husky/pre-push "hugo && rm -fr public"
```

### GitHub Pages

官方 [Host on GitHub pages](https://gohugo.io/hosting-and-deployment/hosting-on-github/) 介绍如何通过 GitHub Action 而不是以前 branch 的方式来部署。

## 延伸阅读

+ [Awesome Hugo](https://github.com/theNewDynamic/awesome-hugo) 包含与 Hugo 有关的资源清单。
