---
title: Prettier
description: 使用 Prettier 统一代码风格
slug: prettier
date: 2023-08-20T13:30:31+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: []
categories: []
tags: []
images: []
---

本文如何使用 prettier 统一代码风格。

<!--more-->

## 概述

[prettier](https://prettier.io/docs/en/) 是一个代码格式化工具，支持多种语言。

### Prettier vs Linters

Linter 有两类规则：

- 格式规则：例如：最大长度、无混合空格和制表符、关键字间距、逗号样式。

- 代码质量规则：例如，没有未使用的变量、没有额外绑定、没有隐式球形变量、优先承诺-拒绝错误。Prettier 对这些规则毫无帮助。这些规则也是 linter 提供的最重要的规则，因为它们很可能会捕捉到代码中的真正错误！

通常使用 Prettier 来格式化代码，而使用 linters 来捕捉错误！

## 安装

```shell
npm install --save-dev --save-exact prettier
```

## 配置

[Prettier 配置文件](https://prettier.io/docs/en/configuration) 可以有多种格式，考虑到 yaml 文件可以添加注释，更愿意使用 `.prettierrc.yaml`。

```yaml
# .prettierrc or .prettierrc.yaml
trailingComma: "es5"
tabWidth: 4
semi: false
singleQuote: true
plugins:
  - prettier-plugin-foo
```

Prettier 自带了一些配置 [配置项](https://prettier.io/docs/en/options)。

通过 [.prettierignore](https://prettier.io/docs/en/ignore) 文件，让 Prettier CLI 和编辑器知道哪些文件不格式化。

## 使用

```shell
prettier [options] [file/dir/glob ...]
```

常用 options:

- `--write` 原地格式化文件。
- `--check` 查看文件是否已经格式化。

更多 options 参见 [cli](https://prettier.io/docs/en/cli)。

## 插件

[插件](https://prettier.io/docs/en/plugins) 是为 Prettier 添加新语言或格式化规则的方法。Prettier 自身对所有语言的实现都是通过插件 API 来表达的。Prettier 核心软件包内置了 JavaScript 和其他网络语言。如需其他语言，您需要安装插件。

## Editors
