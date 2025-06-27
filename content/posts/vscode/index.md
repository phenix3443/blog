---
title: vscode 使用
slug: vscode
description:
date: 2022-07-01T11:20:19+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series:
  - 如何构建高效的开发工具链
categories:
  - vscode
tags:
  -
---

本文介绍在 vscode 使用过程中遇到的一些问题。所有内容出自 [官方文档](https://code.visualstudio.com/docs)。

## Debugging

## Develop Container

vscode 中的 [Container](https://code.visualstudio.com/docs/remote/containers) 描述如何在 vscode 中使用 Docker 来为单个项目创建开发容器（dev container），这简直是统一项目开发环境的福音。

## Terminal

[terminal](https://code.visualstudio.com/docs/terminal/getting-started) 是开发者在 vscode 除编辑区外使用最多的一个区域了。

### PATH 在外部 terminal 和 vscode  terminal 不一致

poetry 安装在 `~/.local/bin`, 使用发现外部 terminal 的 `PATH` 环境变量中有这个路径，但是 vscode 的 terminal 没有这个路径。

分析原因：

首先：`.local/bin` 一般是 shell 的 “profile” 里加的，大多数 Linux 用户目录下的 PATH 里有这段，是因为 shell 配置文件里手动或系统默认加了，比如：

+ `~/.profile`
+ `~/.bash_profile`
+ `~/.bashrc`

当“正常登录”Linux（比如用 ssh 进入）时：

+ 会启动一个 login shell
+ `/etc/profile` → `~/.profile` → `~/.bash_profile` 都会跑到
+ PATH 就会包含 /home/ubuntu/.local/bin

而 VSCode 远程终端不是严格的 “login shell”，这里开启的远程终端通常是

+ 非 login shell
+ 交互式，但不是 login

具体调用命令是 `bash` ，而不是 `bash --login`，所以 `.local/bin` 就不会自动加到 PATH 中。

知道了原因，解决办法就是从 [config profile](https://code.visualstudio.com/docs/terminal/profiles#_configuring-profiles) 中可以找到：自定义 vscode terminal 使用的 profile。
