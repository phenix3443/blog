---
title: "gRPC"
description:
date: 2022-05-31T16:14:10+08:00
slug: grpc
image:
math:
license:
hidden: false
comments: true
draft: false
series: [grpc]
categories:
  - grpc
tags:
  - grpc
---

## 概述

[gRPC](https://grpc.io/) 是一个高性能、开源和通用的 RPC 框架，由 Google 主导开发，其核心在于允许服务器和客户端应用程序之间进行直接调用。gRPC 使用 Protocol Buffers 作为其接口定义语言，这使得定义服务接口和生成客户端和服务器代码变得简单高效。

## grpc-go

[grpc-go](https://grpc.io/docs/languages/go/quickstart/) 是 gRPC 的 Go 语言实现版本，它使得在 Go 应用程序中实现 gRPC 服务和客户端成为可能。这个库充分利用了 Go 的类型安全和并发特性，提供了一个高效的方式来构建分布式应用和微服务。它支持所有 gRPC 的核心功能，包括流式传输、拦截器、取消、超时以及元数据交换等，为开发者提供了丰富的 API 来创建高性能的服务。

### 前置条件

进行 gRPC 开发需要做如下准备：

+ 安装 Golang。
+ 安装 protoc、protoc-gen-go。推荐使用 v3 版本的  [protobuf]({{< ref "posts/protobuf" >}})。
+ 安装 protoc-gen-go-grpc。它是一个专为 gRPC 服务生成 Go 代码的插件。这个插件扩展了 protoc-gen-go，专门用于生成符合 gRPC 规范的服务接口代码。使用此插件，开发者可以从 `.proto` 文件自动生成 Go 语言的 gRPC 服务和客户端桩代码，这些代码包括服务定义、客户端和服务器 API 以及消息类型。

  ```shell
  go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.2
  ```

  在编写 gRPC 程序时，通常需要同时安装 protoc-gen-go 和 protoc-gen-go-grpc。protoc-gen-go 插件用于从 `.proto` 文件生成 Go 代码，包括消息类型和服务定义，而 protoc-gen-go-grpc 插件专门用于生成 gRPC 服务的客户端和服务器接口代码。两者合作提供了完整的支持，使得可以从 .proto 文件生成所有必需的 Go 代码，从而实现 gRPC 服务。

## 示例程序

官方 [quick start](https://grpc.io/docs/languages/go/quickstart/) 演示了如何编写一个 hello world 的 grpc 服务。下面我们使用更现代的 [buf]({{< ref "posts/protobuf#buf" >}}) 来重新实现一下。

+ [buf+本地插件](https://github.com/phenix3443/cosmos-starter/releases/tag/v0.0.1)
+ [buf+远程插件+managed mode](https://github.com/phenix3443/cosmos-starter/releases/tag/v0.0.2)
