---
title: "go build"
description:
slug: go-build
date: 2022-05-12T16:08:06+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - golang
tags:
  - test
---

Usage:

`go build [-o output] [build flags] [packages]`

Build 编译由导入路径命名的 package 及其依赖项，但不会安装结果。

如果要构建的参数是来自单个目录的 .go 文件列表，则 build 将它们视为指定的单个 package 的源文件列表。

编译 package 时，build 会忽略以 '\_test.go' 结尾的文件。

编译单个主 package 时，build 将生成的可执行文件写入**以第一个源文件命名**的输出文件（'go build ed.go rx.go' 写入 'ed' 或 'ed.exe'）或源代码目录（ 'go build unix/sam' 写入 'sam' 或 'sam.exe'）。编写 Windows 可执行文件时会添加“.exe”后缀。

当编译多个 package 或单个非 main package 时， build 编译 package 但丢弃生成的对象，仅用作检查 package 是否可以构建。

-o 标志强制构建将生成的可执行文件或对象写入指定的输出文件或目录，而不是上述两段中描述的默认行为。如果指定的 output 是现有目录或以斜杠或反斜杠结尾，则任何生成的可执行文件都将写入该目录。

-i 标志安装作为目标依赖项的 package 。 -i 标志已弃用。编译的 package 会自动缓存。

构建标志由构建、清理、获取、安装、列出、运行和测试命令共享。
