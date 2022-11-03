---
title: "使用 homebrew 管理软件的多个版本"
description:
date: 2022-05-23T10:20:19+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
    - macos
tags:
    - brew
---
安装的 go@1.18.1 版本有点问题，需要切换到 1.17 版本。

首先搜索软件包可用的版本`brew search go`， 可以查询到 go 的其他可用版本:

```shell
==> Formulae
go ✔
go@1.15
go@1.16
go@1.17
```

安装 go@1.17 版本`brew install go@1.17`

可以同时安装软件的多个版本，但是只能使用某一指定版本。首先接触当前应用程序的链接：

`brew unlink go`

指定不同的版本

`brew link go@1.17`

某些情况可能要使用 --force and --overwrite 选项:

`brew link --force --overwrite go@1.10`

[^1]: [Manage multiple versins of Go on MacOS with Homebrew](https://gist.github.com/BigOokie/d5817e88f01e0d452ed585a1590f5aeb)
