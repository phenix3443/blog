---
title: "go cmd 参数中的 ./..."
description: what doest ... in go cmd [package] param meant
date: 2022-05-12T16:22:49+08:00
slug: how-to-special-go-package-path
image: 
math: 
license: 
hidden: false
comments: true
draft: false
tags:
    - golang
    - cmd
    - package
---

go cmd 许多命令需要指定一组 package ：

`go action [packages]`

通常，[packages] 是 import path 的列表。如果没有给出导入路径，则该操作适用于当前目录。

有四个保留路径名称不应该被用于 go tools：

- “main” 表示独立可执行文件中的顶级 package 。

- “all” 扩展所有 GOPATH tree 中找到的所有 package。例如，'go list all' 列出本地系统的所有 package。使用 module 时，“all” 扩展到 main package 及其依赖的所有 package，也包括测试的依赖项。

- "std" 和 all 一样，但是只扩展 Go 标准库。

- "cmd" 扩展 Go repo 的 commands 及其内部库。以“cmd/”开头的导入路径只匹配 Go repo 中的源码。

如果导入路径包含一个或多个“...”通配符，则它是一种模式：每个都可以匹配任何字符串，包括空字符串和包含斜杠的字符串。net/... 匹配 net 目录以及子目录中的 package，例如 net/http。

go tool 忽略以“.” 或 “\_” 开头的目录和文件，以及名为“testdata”的目录。

关于如何在 cmd 中指定 package, 参见 `go help packages` 说明。
