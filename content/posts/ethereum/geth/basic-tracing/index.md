---
title: Basic Tracing
description: Geth EVM 基本跟踪
slug: geth-basic-tracing
date: 2023-09-01T22:28:26+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: [evm-tracing]
categories: [ethereum]
tags: [geth, evm, tracing]
images: []
---

[上篇文章]({{< ref "posts/ethereum/geth/tracing" >}}) 介绍对 Geth 中的 EVM tracing 做了简要介绍，这篇文章介绍其中的跟踪类型： 基本跟踪。

<!--more-->

## 概述

Geth 能生成的最简单的交易跟踪类型是原始 EVM 操作码跟踪。对于交易执行的每一条虚拟机指令，都会生成一个结构化日志条目，其中包含所有有用的上下文元数据。其中包括程序计数器、操作码名称、操作码成本、剩余 gas、执行深度和发生的任何错误。结构化日志还可选择包含执行堆栈、执行内存和合约存储的内容。

原始 EVM 操作码跟踪的整个输出是一个 JSON 对象，其中包含几个元数据字段：消耗的 gas、失败状态、返回值；以及操作码条目列表：

```json
{
  "gas": 25523,
  "failed": false,
  "returnValue": "",
  "structLogs": []
}
```

单个操作码条目的日志示例格式如下：

```json
{
  "pc": 48,
  "op": "DIV",
  "gasCost": 5,
  "gas": 64532,
  "depth": 1,
  "error": null,
  "stack": [
    "00000000000000000000000000000000000000000000000000000000ffffffff",
    "0000000100000000000000000000000000000000000000000000000000000000",
    "2df07fbaabbe40e3244445af30759352e348ec8bebd4dd75467a9f29ec55d98d"
  ],
  "memory": [
    "0000000000000000000000000000000000000000000000000000000000000000",
    "0000000000000000000000000000000000000000000000000000000000000060"
  ],
  "storage": {}
}
```

## 生成基本跟踪

要生成原始 EVM 操作码跟踪，Geth 提供了几个 [RPC API](https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-debug) 。最常用的是 [debug_traceTransaction](https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-debug#debug_tracetransaction)。

`traceTransaction` 的最简单形式是将交易哈希值作为唯一参数。然后，它会跟踪交易，汇总所有生成的数据，并以大型 JSON 对象的形式返回。从 Geth 控制台调用的示例如下

```shell
debug.traceTransaction('0xfc9359e49278b7ba99f59edac0e3de49956e46e530a53c15aa71226b7aa92c6f');
```

同样的调用也可以通过 HTTP RPC（例如使用 Curl）从节点外部调用。在这种情况下，必须使用 `--http` 命令在 Geth 中启用 HTTP 端点，并使用 `--http.api=debug` 命令公开 debug API namespace。

```shell
curl -H "Content-Type: application/json" -d '{"id": 1, "jsonrpc": "2.0", "method": "debug_traceTransaction", "params": ["0xfc9359e49278b7ba99f59edac0e3de49956e46e530a53c15aa71226b7aa92c6f"]}' localhost:8545
```

还可以通过为四个参数传递布尔（true/false）值来配置跟踪，以调整跟踪的冗余度。默认情况下，不报告 EVM 内存和返回数据，但报告 EVM 堆栈和 EVM 存储。报告最大数据量：

```json
enableMemory: true
disableStack: false
disableStorage: false
enableReturnData: true
```

在 Geth Javascript 控制台中进行的示例调用配置为报告最大数据量，如下所示：

```shell
debug.traceTransaction('0xfc9359e49278b7ba99f59edac0e3de49956e46e530a53c15aa71226b7aa92c6f', {
  enableMemory: true,
  disableStack: false,
  disableStorage: false,
  enableReturnData: true
});
```

上述操作是在 Rinkeby 网络（现已废弃）上运行的（其中一个节点保留了足够的历史记录），结果产生了这个 [跟踪转储 (trace dump)](https://gist.github.com/karalabe/c91f95ac57f5e57f8b950ec65ecc697f)。

另外，禁用 EVM 堆栈、EVM 内存、存储和返回数据（如下面的 Curl 请求所示）会产生以下更短的 [跟踪转储](https://gist.github.com/karalabe/d74a7cb33a70f2af75e7824fc772c5b4)。

```shell
curl -H "Content-Type: application/json" -d '{"id": 1, "jsonrpc": "2.0", "method": "debug_traceTransaction", "params": ["0xfc9359e49278b7ba99f59edac0e3de49956e46e530a53c15aa71226b7aa92c6f", {"disableStack": true, "disableStorage": true}]}' localhost:8545
```

## 基本跟踪的局限性

虽然上述生成的原始操作码跟踪非常有用，但为每个操作码生成单独的日志条目对于大多数用例来说都太低级了，而且需要开发人员创建额外的工具来对跟踪进行后处理。此外，完整的操作码跟踪可轻松达到数百兆字节，因此从节点中取出并从外部处理这些跟踪会耗费大量资源。

为了避免这些问题，Geth 支持在以太坊节点内运行自定义 JavaScript 跟踪器 (tracer)，这些跟踪器可以完全访问 EVM 堆栈、内存和合约存储。这意味着开发人员只需收集实际需要的数据，并在源头进行任何处理。

## 总结

本文介绍了如何在 Geth 中进行基本跟踪。基本跟踪是非常低级的，可以生成大量数据，但这些数据可能并不都有用。因此，也可以使用一组 [内置跟踪器]({{< ref "posts/ethereum/geth/buildin-tracers" >}})，或者用 Javascript 或 Go 编写 [自定义跟踪器](https://geth.ethereum.org/docs/developers/evm-tracing/custom-tracer)。

## 参考

- [basic tracing](https://geth.ethereum.org/docs/developers/evm-tracing/basic-traces)
