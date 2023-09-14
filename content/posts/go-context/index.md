---
title: Go Context
description: 深入理解 golang context
slug: go-context
date: 2023-09-13T13:49:20+08:00
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
tags: [context]
images: []
---

本文深入理解 golang context 的使用。

<!--more-->

## 概述

context 在 golang 中的主要作用是在不同的 goroutine 之间同步特定数据、cancel 信号以及请求的截止日期。

WithCancel、WithDeadline 和 WithTimeout 函数接受一个 Context（父级）并返回一个派生的 Context（子级）和一个 CancelFunc。调用 CancelFunc 会 cancel 子级及其子级，移除父级对子级的引用，并停止任何相关的计时器。如果未调用 CancelFunc，子级及其子级会泄露，直到父级被 cancel 或计时器触发。go vet 工具检查所有控制流路径上是否使用了 CancelFunc。

WithCancelCause 函数返回一个 CancelCauseFunc，该函数接受一个错误并将其记录为 cancel 原因。在被 cancel 的 context 或其任何子项上调用 Cause 可以检索到原因。如果没有指定原因，Cause(ctx) 将返回与 ctx.Err() 相同的值。

## 使用

使用 context 的程序应遵循以下规则，以保持各个包之间的接口一致性，并使静态分析工具能够检查 context 传播：

1. 请不要将 context 存储在结构类型中；相反，应明确地将 context 传递给每个需要它的函数。context 应该是第一个参数，通常命名为 ctx：

   ```go
   func DoSomething(ctx context.Context, arg Arg) error {
   // ... use ctx ...
   }
   ```

   [官方博客](https://go.dev/blog/context-and-structs) 介绍了为什么不应该这么做：无法为单独的函数接口指定 cancel 规则。

2. 请不要传递一个空的 Context，即使某个函数允许这样做。如果你不确定应该使用哪个 Context，那么请传递 context.TODO。
3. 仅将 context value 用于跨进程和 API 的请求范围数据，不用于向函数传递可选参数。
4. 相同的 Context 可以传递给在不同 goroutines 中运行的函数；Contexts 对于多个 goroutines 同时使用是安全的。

请参阅<https://blog.golang.org/context>，该网站有使用 Contexts 的服务器的示例代码。

### AfterFunc

```go
func AfterFunc(ctx Context, f func()) (stop func() bool)
```

1. AfterFunc 安排在 ctx 完成（cancel 或超时）后在其自己的 goroutine 中调用 f。
2. 对一个 context 进行多次 AfterFunc 调用是独立的；一个调用并不会替换另一个。
3. 调用返回的 stop 函数会终止 ctx 与 f 的关联。如果调用停止了 f 的运行，它将返回 true。如果 stop 函数返回 false，那么要么 context 已完成并且 f 已在其自己的 goroutine 中启动；要么 f 已经被停止。stop 函数不会等待 f 完成才返回。如果调用者需要知道 f 是否已完成，它必须明确地与 f 协调。

通过示例代码说明上面这几点：

{{< gist phenix3443 0ba0c0162236840c8183a7e17d862eb1 >}}

### WithCancel

```go
func WithCancel(parent Context) (ctx Context, cancel CancelFunc)
```

WithCancel 返回一个带有新 Done channel 的 parent 副本。不管是调用返回的 cancel 函数或，还是 parent 的 Done 通道关闭，返回的 context 的 Done 通道都会关闭。

cancel 此 context 会释放与之相关的资源，因此一旦在此 context 中运行的操作完成，代码应立即调用 cancel。

go 1.20 新增的 WithCancelCause 函数行为类似于 WithCancel，但它返回的是 CancelCauseFunc 而不是 CancelFunc。用非空错误调用 cancel 会在 ctx 中记录该错误；然后可以使用 Cause(ctx) 来检索它。用 nil 调用 cancel 会将原因设置为 Canceled。

```shell
func WithCancelCause(parent Context) (ctx Context, cancel CancelCauseFunc)
```

{{< gist phenix3443 84b448a8ecb78bfe8e72b72f8968b55d >}}

### WithDeadline

```go
func WithDeadline(parent Context, d time.Time) (Context, CancelFunc)
```

WithDeadline 返回一个父 context 的副本，其截止日期调整为不迟于 d。如果父 context 的截止日期已经早于 d，那么 WithDeadline(parent, d) 在语义上等同于 parent。返回的 [Context.Done] 通道在截止日期到期，返回的 cancel 函数被调用，或者父 context 的 Done 通道被关闭时关闭，以最先发生的为准。

cancel 此 context 会释放与之相关的资源，因此，一旦在此 context 中运行的操作完成，代码应立即调用 cancel。

WithDeadlineCause 的行为类似于 WithDeadline，但在超过截止日期时还会设置返回的 Context 的原因。返回的 CancelFunc 不会设置原因。

### WithTimeout

```go
func WithTimeout(parent Context, timeout time.Duration) (Context, CancelFunc)
```

WithTimeout 返回的是 WithDeadline(parent, time.Now().Add(timeout))。

cancel 此 context 会释放与之相关的资源，因此一旦在此 context 中运行的操作完成，代码应立即调用 cancel：

```go
func WithTimeoutCause(parent Context, timeout time.Duration, cause error) (Context, CancelFunc)
```

WithTimeoutCause 的行为类似于 WithTimeout，但在超时时也会设置返回的 Context 的原因。返回的 CancelFunc 不会设置原因。

### 最佳实践

如果携程是一个 for 循环，我们需要判断 ctx.Done() 来避免携程泄露：

{{< gist phenix3443 97703cce2e26f981ea6a9f4a45f9c4d3 >}}

如果 goroutine 不是 for 循环代码，那应该如何防止 goroutine 泄露呢？比如下面这种情况：

{{< gist phenix3443 84b448a8ecb78bfe8e72b72f8968b55d >}}

## 源码分析

package context 只暴露了 Context interface，没有其他的数据结构。

```go
type Context interface {
    Deadline() (deadline time.Time, ok bool)
    Done() <-chan struct{}
    Err() error
    Value(key any) any
}
```

核心数据结构是 cancelCtx, WithDeadline 与 WithTimeout 都是基于 cancelCtx。

两个核心方法：

1. cancelCtx.propagateCancel，函数内部将当天 ctx 添加到 parent 的 child 中，然后单独通过 goroutine 监听 parent 完成消息：

   ```go
   go func() {
        select {
        case <-parent.Done():
            child.cancel(false, parent.Err(), Cause(parent))
        case <-child.Done():
        }
   }()
   ```

2. cancelCtx.cancel 负责 close(doneCh)。

## 参考

- [深度解密 Go 语言之 context](https://zhuanlan.zhihu.com/p/68792989)
