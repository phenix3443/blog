---
title: "Protocol Buffers"
description:
date: 2022-05-31T15:57:59+08:00
slug: protobuf
image:
math:
license:
hidden: false
comments: true
draft: false
series: []
categories:
  - protocol
tags:
  - protobuf
---

## 概述

[Protocol Buffers](https://protobuf.dev/)（简称 protobuf）是 Google 开发的一种语言无关的数据序列化工具。它被用于序列化结构化数据，这样可以简化在网络上相互通信的程序的开发，或用于数据存储。使用 protobuf 时，首先需要在`.proto` 文件中定义数据结构和服务，然后利用 protobuf 编译器将这些定义转换成基于特定语言的数据访问类。这些自动生成的数据访问类提供了简单的 API，用于读写结构化数据的序列化和反序列化`.proto`buf 支持多种编程语言，包括 C++、Java、Python 等，并以高效的方式处理数据编码和解码。

## protoc

protoc 是 protobuf 的编译器，用于将`.proto` 文件转换成特定编程语言的源代码。

protoc 通过插件机制支持多语言。开发者可以为 protoc 编写插件来生成任何特定语言的代码。这些插件接收由 protoc 解析的`.proto` 文件的抽象语法树（AST），然后输出对应的源代码。protoc 原生支持如 C++、Java、Python 等语言，而通过社区或第三方提供的插件，可以扩展支持其他如 Go、Ruby、PHP 等多种语言。

### protoc-gen-go

protoc-gen-go 是 protobuf 的官方插件，用于生成 Go 语言的代码。

`go install google.golang.org/protobuf/cmd/protoc-gen-go@latest`

这将在`$GOPATH/bin`中安装`protoc-gen-go`二进制文件。该目录必须在`$PATH`中，protoc 才能找到它。

```shell
export PATH="$PATH:$(go env GOPATH)/bin"
```

更多详细信息参阅 [Go Generated Code](https://developers.google.com/protocol-buffers/docs/reference/go-generated)。

#### 输出模式

 假设当前输入文件是`protos/buzz.proto`，其中定义的 Go 导入路径为`example.com/project/protos/fizz`，注意，导入路径相比文件位置多了 **fizz**。

 protoc 生成的`.pb.go`文件在输出目录中的位置取决于编译器标志，有几种输出模式：

- 如果指定了`paths=import`标志，则输出文件将放置在以 Go 包的导入路径命名的目录中。即输出文件事当前目录下的`example.com/project/protos/fizz/buzz.pb.go`。如果未指定路径标志，这是默认输出模式。
- 如果指定了`module=$PREFIX`标志，则输出文件将放置在以 Go 包的导入路径命名的目录中，但会从输出文件名中删除指定的目录前缀。即输出文件是当前目录下的`protos/fizz/buzz.pb.go`。

  在模块路径之外生成任何 Go 包都会导致错误。此模式对于将生成的文件直接输出到 Go 模块很有用。因为我们经常在项目根目录下执行生成命令。

- 如果指定了`paths=source_relative`标志，则输出文件与输入文件放置在相同的相对目录中。例如，输入文件`protos/buzz.proto`会导致输出文件位于`protos/buzz.pb.go`。有时候我们采用这种方法，将`.proto`文件和生成的代码放在同一个文件夹中。

`protoc-gen-go`的标志是通过在调用`protoc`时传递`go_opt`标志来提供的。可以传递多个`go_opt`标志。例如：

`protoc --proto_path=src --go_out=out --go_opt=paths=source_relative foo.proto bar/baz.proto`

## Buf

[Buf](https://buf.build/docs/introduction) 是新一代的 Protocol Buffers 工具，它提供了更现代化和简单的方式来构建和管理 protobuf 文件。
相比较 protoc 配合插件的开发方式，buf 优势在于：

- 速度：编译速度比 protoc 快 2 倍。
- 远程插件：避免在本地安装和维护 protoc 插件。而是指定我们的托管版本，直到版本号，以便根据需要轻松跨团队标准化或对不同项目使用不同的版本。
- 托管模式（managed mode）：通过从 .proto 文件中删除特定于用户和语言的 Protobuf 选项来生成通用 API。然后，API 使用者可以使用两行代码在配置文件中为这些选项启用智能默认值，并且再也不会考虑它们。
- 改进了模块管理，支持依赖关系跟踪和版本管理。
- 它增强了 linting 和 breaking change 检测功能，使得维护大型、多人协作的项目更为高效。

可以配合 [vscode 扩展](https://marketplace.visualstudio.com/items?itemName=bufbuild.vscode-buf) 一起使用。
