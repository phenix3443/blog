---
title: Golang Cmd Tools
description:
slug: golang-cmd-tools
date: 2023-09-16T19:53:39+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: [go]
tags: [tools]
images: []
---

Summary.

<!--more-->

## urfave-cli

[urfave/cli](https://github.com/urfave/cli) 是一个声明式的、简单的、快速的和有趣的软件包，用于在 Go 中构建命令行工具：

- 支持别名和前缀匹配的命令和子命令。
- 灵活的帮助系统。
- 支持 bash、zsh、fish 和 powershell 的动态 shell 完成。
- 生成 man 和 markdown 格式的文档。
- 简单类型、简单类型的 slice、time、duration 等输入标志。
- 支持复合短标志（-a -b -c ➡️ -abc）.
- 从下列项目中查找输入
  - 环境变量
  - 纯文本文件
  - 通过 [urfave/cli-altsrc](https://github.com/urfave/cli-altsrc) 支持 format 结构化文件

可以查看 [官方文档](https://cli.urfave.org/)。
