---
title: "go unittest"
description: golang 中的单元测试
slug: go-test
date: 2022-07-15T15:08:52+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - go
tags:
  - unittest
---

## 概述

## 运行模式

使用`testdata`目录保存测试所需的辅助数据。

Go 测试以两种不同的模式运行：

第一种称为本地目录模式，发生在没有 package 参数的情况下调用`go test`时（例如，`go test` 或`go test -v`）。在这种模式下，`go test`会编译在当前目录中找到的包和测试，然后运行生成的测试二进制文件。在这种模式下，缓存（下面讨论）被禁用。 package 测试完成后，`go test`将打印摘要行，其中显示测试状态（“ok”或“FAIL”）， package 名称和经过时间。

第二种称为程序包列表模式，发生在使用显式程序 package 参数调用`go test`时（例如`go test math`，`go test ./...`，甚至`go test .`）。在这种模式下，`go test`编译并测试命令行上列出的每个 package 。如果某个 package 测试通过，则`go test`仅打印该 package 最后的 “OK” 摘要行。如果 package 测试失败，则执行测试将打印完整的测试输出。如果使用 **-bench** 或 **-v** 标志调用，则`go test`会打印完整的输出，即使通过的 package 测试也是如此，以便显示请求的基准测试结果或详细的日志记录。在所有列出的 package 的测试完成并且输出了它们的输出之后，如果任何 package 测试失败，`go test`将打印最终的`Fail`状态。

仅在 package 列表模式下，`go test`会缓存成功的 package 测试结果，以避免不必要的重复运行测试。当可以从缓存中恢复测试结果时，`go test`将重新显示先前的输出，而不是再次运行测试二进制文件。如果发生这种情况，`go test`在摘要行中打印`(cached)`以代替经过的时间。

## 常用标志

```HTML
-bench regexp

  默认情况下，不运行任何基准测试。 要运行所有基准，请使用`-bench`。 或`-bench=`。

-cover

  启用覆盖率分析。 请注意，由于覆盖率是通过在编译之前对源代码进行注释来实现的，因此启用覆盖率的编译和测试失败可能会报告与原始源不对应的行号。

-list regexp

  不会运行任何测试，基准测试或示例。 这只会列出顶级测试。 不显示子测试或子基准。

-run regexp

  仅运行与正则表达式匹配的那些测试和示例。

-timeout d

  如果测试二进制文件的运行时间超过持续时间 d，则出现 panic。 如果 d 为 0，则禁用超时。 默认值为 10 分钟（10m）。

-v
  详细的输出：在运行所有测试时记录它们。 即使测试成功，也要打印 Log 和 Logf 调用中的所有文本。

-coverprofile cover.out

  所有测试通过后，将 coverage 配置文件写入文件。 需设置 =-cover= 。

```

## 测试覆盖率

执行结果中输入代码覆盖率：`go test ./... -cover`

生成代码覆盖率分析文件：`go test ./... -coverprofile=coverage.out`

在浏览器中浏览分析文件：`go tool cover -html=coverage.out`

查看每个函数的代码覆盖率：`go tool cover -func=coverage.out`

## 断言库

[testify](https://github.com/stretchr/testify) 是一个测试工具包，提供了 assert/require/mock/suit 等功能。 推荐使用。

## mock/stub

stackoverflow 有讨论 [dummy/stub/fake/mock 区别](https://stackoverflow.com/questions/3459287/whats-the-difference-between-a-mock-stub)，总的来说：

- dummy 只是为了满足 api 或者接口所使用的虚假值，实际并不会用到。
- fake 是创建一个可能依赖于某些外部基础设施的交互的测试实现，比如使用内存模拟 redis 缓存的调用。
- stub 复写方法来返回预期的硬编码值，主要基于状态的更改，比如配置参数等。
- mock 与 Stub 非常相似，但基于交互而不是基于状态。这意味着您不期望 Mock 返回某些值，而是假设进行了特定的方法调用顺序。和 stub 的区别在于依赖对象是否和被测对象有交互，从结果来看，stub 不会使测试失败，它只是为被测对象提供依赖的对象，并不改变测试结果，而 mock 则会根据不同的交互测试要求，很可能会更改测试的结果。stub 是 state-based，关注的是输入和输出。mock 是 interaction-based，关注的是交互过程

### gomock

[gomock](https://github.com/uber-go/mock) 是 Go 编程语言的模拟框架，之前有 google 维护，现在有 uber 维护。

### gostub

[gostub](https://github.com/prashantv/gostub) 是一个使单元测试中的存根变得容易的库。

### gomonkey

推荐使用。[gomonkey](https://github.com/agiledragon/gomonkey) 在 golang 中实现 [monkey patching](https://en.wikipedia.org/wiki/Monkey_patch)。使用该工具需要注意：

1. 如果启用内联，Monkey 有时无法 patch 函数。尝试在禁用内联的情况下运行测试，例如：`go test -gcflags=-l`。 相同的命令行参数也可用于 build。
2. gomonkey 不是线程安全的。或者任何种类的安全。

## 延伸阅读

- [golang 单元测试](https://www.cnblogs.com/youhui/articles/11265947.html)
