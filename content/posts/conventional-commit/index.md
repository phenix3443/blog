---
title: Conventional Commits Specification
description: 如何约定提交规范
slug: conventional-commit
date: 2023-08-10T16:21:35+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: [如何构建高效的开发工具链]
categories: [code-style]
tags: [git, github]
images: []
---

本文介绍如何约定代码提交（commit）规范。

<!--more-->

## Specification {#specification}

[Conventional Commits Specification](https://www.conventionalcommits.org/en/v1.0.0/) 是 commit 的一种轻量级约定。它为创建明确的提交历史提供了一套简便的规则，从而使在此基础上编写自动化工具变得更加容易。通过在提交消息中描述功能、修正和破坏性变更，该约定与 [SemVer](http://semver.org/) 相吻合。

约定格式如下：

```shell
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

commit 包含以下结构元素：

- fix：用于修补代码库中的一个错误（这与语义版本控制中的 `PATCH` 相关）。
- fea: 为代码库引入了一项新功能（这与语义版本控制中的 `MINOR` 相关）。
- BREAKING CHANGE：包含`BREAKING CHANGE:`脚注（footer）的 commit，或在`type/scope`之后附加`!`的 commit，会引入 API 的破坏性变更（在语义版本管理中与 MAJOR 相关）。破坏性变更可以是任何类型提交的一部分。

除了 `fix:` 和 `feat:` 之外，还允许其他类型的提交，例如 [@commitlint/config-conventional](https://github.com/conventional-changelog/commitlint/tree/master/%40commitlint/config-conventional) （基于 Angular 惯例）推荐的 `build:、chore:、ci:、docs:、style:、refactor:、perf:、test:` 等。

可以提供除 `BREAKING CHANGE: <description>` 以外的脚注，并遵循类似于 [git trailer format](https://git-scm.com/docs/git-interpret-trailers)约定。

约定提交（Conventional Commits）规范并未强制规定额外的类型（type），而且类型在语义版本控制（Semantic Versioning）中也没有隐含效果（除非它们包含了 "重大变更"（BREAKING CHANGE））。为了提供额外的上下文信息，可以为提交的类型提供一个范围，该范围包含在括号中，例如：`feat(parser): add ability to parse arrays`。

## commit lint

[commitlint](https://github.com/conventional-changelog/commitlint) 用于检查 commit 是否符合[conventional commits specification]({{< ref "#specification" >}})。

本地项目：

```shell
npm install --save-dev @commitlint/{config-conventional,cli}
```

全局安装:

```shell
npm install -g @commitlint/cli @commitlint/config-conventional @commitlint/cz-commitlint
```

- [cli](https://commitlint.js.org/#/reference-cli) 与 commitlint 交互的客户端工具。
- config-conventional 官方默认配置。配置文件有多种[格式](https://github.com/conventional-changelog/commitlint/tree/master#config)，
- cz-commitlint [交互式生成](https://commitlint.js.org/#/guides-use-prompt)符合配置文件规定的 commit。

### 配置文件

[配置文件说明](https://commitlint.js.org/#/reference-configuration)，生成项目自身配置：

```shell
echo "module.exports = {extends: ['@commitlint/config-conventional']}" > commitlint.config.js
```

还可以[引用](https://commitlint.js.org/#/concepts-shareable-config)npm 上共享的其他配置。

该工具还可以[集成常见的 ci](https://commitlint.js.org/#/guides-ci-setup)

### vscode extension

可以搭配 vscode extension [commitlint](https://marketplace.visualstudio.com/items?itemName=joshbolduc.commitlint) 一起使用，该扩展需要设置 project 或者 vscode 级别的 commitlint 配置。
