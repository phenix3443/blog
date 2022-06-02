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
    - gRPC
tags:
    - gRPC
---


## quick start

[quick start](https://grpc.io/docs/languages/go/quickstart/)

`go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@latest`

```shell
protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    helloworld/helloworld.proto
```
