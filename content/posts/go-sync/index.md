---
title: Go Sync
description: golang 中的异步处理
slug: go-sync
date: 2023-09-13T14:37:04+08:00
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
tags: [sync]
images: []
---

本文介绍 golang 中异步处理相关的知识。

<!--more-->

[Package sync](https://pkg.go.dev/sync) 提供了基本的同步原语，如互斥锁。除了 Once 和 WaitGroup 类型外，大多数都是为低级库程序设计的。更高级别的同步更适合通过通道和通信来完成。

包含在此包中定义的类型的值不应被复制。

## Once

## Pool

## Mutex

## RWMutex

## Cond

用于同时唤醒多个等待队列。

## Map

## WaitGroup

示例代码：

{{< gist phenix3443 5ee93e77842071894f6d4cbe660040c8 >}}

## OnceFunc

```go
func OnceFunc(f func()) func()
```

OnceFunc 返回一个只调用 f 一次的函数。返回的函数可以被并发调用。

下面的代码中， incr 虽然被调用两次，但是 v 只在第一次调用的时候增加。

{{< gist phenix3443 e091dde765636a7301ea0207c22831d4 >}}

## OnceValue

```go
func OnceValue[T any](f func() T) func() T
```

OnceValue 返回一个函数，该函数仅调用 f 一次并返回 f 返回的值。返回的函数可以被并发调用。

下面的代码中，randValue 只会被执行一次。

{{< gist phenix3443 63d7efea3b3240994929cb0b728fe33b >}}

## OnceValues

除了返回两个参数外，与 onceValue 没有什么不同。

```go
func OnceValues[T1, T2 any](f func() (T1, T2)) func() (T1, T2)
```
