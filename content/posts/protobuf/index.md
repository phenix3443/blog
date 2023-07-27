---
title: "protobuf 实践"
description:
date: 2022-05-31T15:57:59+08:00
slug: protobuf-practices
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - protocol
tags:
  - protobuf
---

## 概述

## 编译器

## 生成 Go 代码

详细信息参阅 [Go Generated Code](https://developers.google.com/protocol-buffers/docs/reference/go-generated)。

安装`protoc`插件`protoc-gen-go`：

`go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`

这将在`$GOBIN`中安装一个`protoc-gen-go`二进制文件。设置 $GOBIN 环境变量以更改安装位置。它必须在`$PATH`中，pb 编译器才能找到它。

生成的`.pb.go`文件在输出目录中的位置取决于编译器标志。有几种输出模式：

- 如果指定了`paths=import`标志，则输出文件将放置在以 Go 包的导入路径命名的目录中。例如，Go 导入路径为`example.com/project/protos/fizz`的输入文件`protos/buzz.proto`会导致输出文件位于(当前目录下)`example.com/project/protos/fizz/buzz.pb.go`。如果未指定路径标志，这是默认输出模式。
- 如果指定了`module=$PREFIX`标志，则输出文件将放置在以 Go 包的导入路径命名的目录中，但会从输出文件名中删除指定的目录前缀。例如，输入文件`protos/buzz.proto`的 Go 导入路径为`example.com/project/protos/fizz`,`example.com/project`指定为模块前缀，导致输出文件位于`protos/fizz/buzz.pb.go`。

  在模块路径之外生成任何 Go 包都会导致错误。此模式对于将生成的文件直接输出到 Go 模块很有用。

- 如果指定了`paths=source_relative`标志，则输出文件与输入文件放置在相同的相对目录中。例如，输入文件`protos/buzz.proto`会导致输出文件位于`protos/buzz.pb.go`。实际上更多时候我们采用这种方法，将`.proto`文件和生成的代码放在同一个文件夹中。

`protoc-gen-go`的标志是通过在调用`protoc`时传递`go_opt`标志来提供的。可以传递多个`go_opt`标志。例如：

`protoc --proto_path=src --go_out=out --go_opt=paths=source_relative foo.proto bar/baz.proto`
