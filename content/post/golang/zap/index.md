---
title: "zap"
slug: zap-logging
description:
date: 2022-07-06T20:45:04+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - golang
tags:
  - zap
---

## 概览

[zap](https://github.com/uber-go/zap) 是一个快速、结构化、支持日志分级的日志工具。与其他日志组件相比，最大特点是速度很快。

## 性能

对于在热点请求上打印日志的应用程序，基于反射的序列化和字符串格式化的成本过高，它们占用大量 CPU 并进行许多小的分配。换句话说，使用`encoding/json`和`fmt.Fprintf`记录大量的`interface{}`，会使应用程序运行缓慢。

Zap 采用了不同的方法。它包括一个无反射，零分配的 JSON 编码器，并且基础 logger 尽力避免序列化开销和分配。用户可以通过更高级的`SugaredLogger`在性能和易用性上做选择。

## 安装

```shell
go get -u go.uber.org/zap
```

## 使用预设 logger

使用 logger 最简单方法是使用自带的预设：`NewExample`，`NewProduction`和`NewDevelopment`：

```go
logger, err := zap.NewProduction()
if err != nil {
  log.Fatalf("can't initialize zap logger: %v", err)
}
defer logger.Sync()
```

默认情况下， logger 是无缓冲的。但是，由于 zap 的底层 API 允许缓冲，因此在退出进程之前调用 Sync 是一个好习惯。

三种预设的区别在于：

- NewExample 构建的 logger 用于 zap 的测试示例中。它将 DebugLevel 及以上的日志写成 JSON 标准输出，但省略了时间戳和调用函数，以使示例输出简短明了。
- NewDevelopment 构建的 logger 以人性化的格式将 DebugLevel 及以上的日志写入标准错误。
- NewProduction 构建了生产用的 logger ，将 InfoLevel 及以上的日志作为 JSON 写入标准错误中。这是`NewProductionConfig().Build(... Option)`的快捷方式。

## 使用 SugaredLogger

在性能不是很关键的情况下，请使用`SugaredLogger`。它比其他结构化日志记录包快 4-10 倍，并且支持结构化和 printf 样式的 API。

```go
sugar := zap.NewExample().Sugar()
defer sugar.Sync()
sugar.Infow("failed to fetch URL",
  "url", "http://example.com",
  "attempt", 3,
  "backoff", time.Second,
)
sugar.Infof("failed to fetch URL: %s", "http://example.com")
```

sugaredLoger 对于每个日志级别，它公开了三种方法：

- 用于松散类型的结构化日志记录，例如`Infow`(结构化上下文中的“info with”）
- 用于`println`样式格式化，例如`Info`
- 用于`printf`样式格式化，例如`Infof`

当性能和类型安全至关重要时，请使用`Logger`。它比`SugaredLogger`更快，并且分配的资源少得多，但仅支持结构化日志记录。

```go
logger := zap.NewExample()
defer logger.Sync()
logger.Info("failed to fetch URL",
  zap.String("url", "http://example.com"),
  zap.Int("attempt", 3),
  zap.Duration("backoff", time.Second),
)
```

logger 可以在 Logger 和 SugaredLogger 之间简单而快捷的进行转换：

```go
logger := zap.NewExample()
defer logger.Sync()
sugar := logger.Sugar()
plain := sugar.Desugar()
```

也就是说，定义一个全局的 logger ，在性能和记录方便性的情况下，在 Logger 和 sugaredLogger 之间进行切换。

## 自定义 logger

zap 提供的预设适用于小型项目，但是大型项目和组织自然需要更多的自定义设置。可以通过`Config`定制 logger，参见[BasicConfiguration](https://pkg.go.dev/go.uber.org/zap#example-package-BasicConfiguration)

更特殊的配置(输出的日志文件自动拆分，将日志发送到消息队列等) 需要直接使用`zapcore`。 示例代码参考 [AdvancedConfiguration](https://pkg.go.dev/go.uber.org/zap#example-package-AdvancedConfiguration) 。

## 动态调整日志级别

AtomicLevel 可原子性的更改的动态日志记录级别。它使您可以在运行时安全地更改 logger 树（根 logger 和通过添加上下文创建的任何子级）的日志级别。

AtomicLevel.ServeHTTP 本身是一个 http.Handler，它提供 JSON 端点来更改其级别。通过该函数，可以在程序运行期间修改日志级别，而不用重启程序。

只有使用 NewAtomicLevel 构造函数创建 AtomicLevels 才能分配其内部原子指针。

示例代码：[AtomicLevel](https://pkg.go.dev/go.uber.org/zap#AtomicLevel)

## 源码分析

TODO
