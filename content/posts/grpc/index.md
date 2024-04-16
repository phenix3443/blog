---
title: "gRPC 实践"
description:
date: 2022-05-31T16:14:10+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - github
tags:
  - gRPC
---

## quick start

需要提前安装好`protoc`编译器以及对应的`protoc-gen-go`插件，参见 [protobuf 实践](posts/protobuf-practices/)

`go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest`

编译`proto`文件：

```shell
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    helloworld/helloworld.proto
```

更多信息参考 [quick start](https://grpc.io/docs/languages/go/quickstart/)

## 订阅模式
