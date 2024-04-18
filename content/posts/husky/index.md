---
title: Husky
description: husky 使 Git 管理的项目更加自动化
slug: husky
date: 2023-08-22T20:49:43+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: [如何构建高效的开发工具链]
categories: []
tags: [git, husky]
images: []
---

文本介绍 husky 如何让基于 Git 的项目更加自动化

<!--more-->

## 概述

[husky](https://typicode.github.io/husky/) 让基于 [git hook](https://git-scm.com/book/zh/v2/%E8%87%AA%E5%AE%9A%E4%B9%89-Git-Git-%E9%92%A9%E5%AD%90) 的项目自动化更加容易配置，通过 husky 可以方便的在 commit 之间进行 lint/test 。

简要阅读 [官方指南](https://typicode.github.io/husky/getting-started.html) 即可上手使用：

初始化：

```shell
pnpm add --save-dev husky && pnpm exec husky init
```

上面的命令会：

- 在 package.json 中添加 prepare 脚本。
- 创建一个可以编辑的 pre-commit 示例（默认情况下，pnpm test 会在提交时运行）。
- 配置 Git 钩子路径。

可以通过创建文件来添加 git  hook:

```shell
echo "npm test" > .husky/pre-commit
```

## hook 中的条件执行

hook 本身都是 shell 脚本，所以可以编写的很复杂，比如可以结合 [lint-staged](https://github.com/lint-staged/lint-staged) 只在某些文件发生变化时候对其进行 lint，这适用于添加 lint 的时候不影响未修改的存量代码。
