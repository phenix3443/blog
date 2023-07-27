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
draft: true
categories:
  - hugo
tags:
---

## 概述

## Config

查看当前网站的配置：

```shell
hugo config --format yaml
```

查看 mounts 的 config：

```shell
hugo config mounts
```

## modules

- [Hugo Modules: everything you need to know!](https://www.thenewdynamic.com/article/hugo-modules-everything-from-imports-to-create/)

## template

If you're using plain `*.html` files, you'll have to override the used parser inside your `.prettierrc` file:

```shell
npm install --save-dev prettier prettier-plugin-go-template
```

```json
{
  "plugins": ["prettier-plugin-go-template"],
  "overrides": [
    {
      "files": ["*.html"],
      "options": {
        "parser": "go-template"
      }
    }
  ]
}
```

## Host on Github Pages

[Host on GitHub pages](https://gohugo.io/hosting-and-deployment/hosting-on-github/)

## themes

- [bootstrap](https://github.com/razonyang/hugo-theme-bootstrap)
- [even](https://github.com/olOwOlo/hugo-theme-even)，经典，但是时间久了没有更新。
- [eureka](https://github.com/wangchucheng/hugo-eureka)
- [DoIt](https://github.com/HEIGE-PCloud/DoIt)
- [fixit](https://github.com/hugo-fixit/FixIt) 和 DoIt 有点像。
- [meme](https://github.com/reuixiy/hugo-theme-meme)
