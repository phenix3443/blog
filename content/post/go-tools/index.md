---
title: "go tools"
description: go 命令行工具
slug: go-tools
date: 2022-05-12T16:08:06+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - go
tags:
  - tools
---

## 导入路径

golang 许多命令需要指定一组 package ：

`go action [packages]`

通常，[packages] 是 import path 的列表。如果没有给出导入路径，则该操作适用于当前目录。

有四个保留路径名称不应该被用于 go tools：

- `main` 表示独立可执行文件中的顶级 package 。

- `all` 扩展所有 GOPATH tree 中找到的所有 package。例如，`go list all` 列出本地系统的所有 package。使用 module 时，“all” 扩展到 main package 及其依赖的所有 package，也包括测试的依赖项。

- `std` 和 all 一样，但是只扩展 Go 标准库。

- `cmd` 扩展 Go repo 的 commands 及其内部库。以`cmd/`开头的导入路径只匹配 Go repo 中的源码。

如果导入路径包含一个或多个`...`通配符，则它是一种模式：每个都可以匹配任何字符串，包括空字符串和包含斜杠的字符串。`net/...` 匹配 net 目录以及子目录中的 package，例如 net/http。

go tool 忽略以`.` 或 `_` 开头的目录和文件，以及名为`testdata`的目录。

关于如何在 cmd 中指定 package, 参见`go help packages`说明。

## build

Usage:

```shell
go build [-o output] [build flags] [packages]
```

Build 编译由导入路径命名的 package 及其依赖项，但不会安装结果。

如果要构建的参数是来自单个目录的 `.go` 文件列表，则 build 将它们视为指定的单个 package 的源文件列表。

编译 package 时，build 会忽略以 `_test.go` 结尾的文件。

编译单个主 package 时，build **将根据第一个源文件命名生成的可执行文件**，例如`go build ed.go rx.go` 生成的可执行文件名为 `ed` 或 `ed.exe`。但可以通过 `-o` 标志指定输出文件名或目录，如果指定的 output 是现有目录或以斜杠或反斜杠结尾，则任何生成的可执行文件都将写入该目录。

当编译多个 package 或单个非 main package 时， build 执行编译但丢弃生成的对象，仅检查 package 是否可以构建。

## test

参见[go test]({{< ref "../go-test" >}})

## lint

参见[go lint]({{< ref "../go-lint" >}})
