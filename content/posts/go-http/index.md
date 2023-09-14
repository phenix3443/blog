---
title: Go HTTP 源码分析
description:
slug: go-http
date: 2023-09-12T23:14:41+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: [go 源码分析]
categories: [go]
tags: [go,gin,echo]
images: []
---

本文介绍 Golang HTTP 相关的知识。

<!--more-->

## HTTP

[Package HTTP](https://pkg.go.dev/net/http) 提供了 golang HTTP server 和 client 方面的实现。

### 源码

待补充。

## HTTP test

[Package httptest](https://pkg.go.dev/net/http/httptest) 提供了用于 HTTP 测试的相关工具：

+ httptest.NewRequest"返回一个新的服务器接收请求，适合传递给 http.Handler 进行测试。要生成客户端 HTTP 请求，应该使用 net/http 包中的 [NewRequest](https://pkg.go.dev/net/http#NewRequest) 函数。
+ httptest.ResponseRecorder 是 http.ResponseWriter 的一个实现，它记录其变化以便在测试中进行后续检查。

这两个字段配合 http.Handler 可以方便的测试 web 服务中的请求处理逻辑。

上面的两个方法都是直接在服务端测试代码，并不能测试到服务器的路由部分，httptest.Server 启动一个 HTTP 服务器，它在本地回环接口上监听系统选择的端口，用于端到端的 HTTP 测试。

## 第三方框架

+ [Echo](https://echo.labstack.com/) 是一个高性能、可扩展、极简的 Go Web 框架。
+ [Gin](https://gin-gonic.com/zh-cn/) 是一个用 Go (Golang) 编写的 Web 框架。

相比较而言，Gin 在 Github 上的 star 更多，深入的对比等待补充。
