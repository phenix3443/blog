---
title: Geth Build-in EVM Tracers
description: Geth 内建跟踪器
slug: geth-build-in-tracers
date: 2023-09-01T22:36:00+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: [evm-tracing]
categories: [ethereum]
tags: [geth,evm,tracing]
images: []
---

[上篇文章]({{< ref "../basic-tracing" >}}) 介绍了基本跟踪的使用，本文介绍 geth 的内建跟踪器。

<!--more-->

Geth 捆绑了多种可通过 [tracing API](https://geth.ethereum.org/docs/interacting-with-geth/rpc/ns-debug) 调用的跟踪器。其中一些内置跟踪器是用 Go 原生实现的，另一些则是用 Javascript 实现的。默认跟踪器是操作码记录器（又称结构记录器），它是所有方法的默认跟踪器。其他跟踪器必须通过在 API 调用中向 tracer 参数传递其名称来指定。

## 结构/操作码记录器

结构体记录器（又称操作码记录器）是一种原生 Go 跟踪器，它执行事务，并在每一步都输出操作码和执行上下文。当没有向 API 传递名称（例如 `debug.traceTransaction(<txhash>)`）时，将使用该跟踪器。

## 原生跟踪器

以下跟踪器是用 Go 语言实现的。这意味着它们比其他用 Javascript 编写的跟踪器性能更强。在调用跟踪 API 方法时，可通过向跟踪器参数传递跟踪器名称来选择跟踪器，例如 `debug.traceTransaction(<txhash>, { tracer: 'callTracer' })`。

### 4byteTracer

Solidity 合约函数使用其签名的 Keccak-256 哈希值的前四个字节 [寻址](https://docs.soliditylang.org/en/develop/abi-spec.html#function-selector)。因此，在调用合约函数时，调用者必须发送该函数选择器以及 ABI 编码参数作为调用数据。

4byteTracer 会收集事务生命周期内执行的每个函数的函数选择器，以及所提供的调用数据的大小。结果是一个 `map[string]int`，其中键是 `SELECTOR-CALLDATASIZE`，值是该键出现的次数。例如：

```shell
debug.traceTransaction( "0x214e597e35da083692f5386141e69f47e973b2c56e7a8073b1ea08fd7571e9de", {tracer: "4byteTracer"})
```

返回：

```json
{
  "0x27dc297e-128": 1,
  "0x38cc4831-0": 2,
  "0x524f3889-96": 1,
  "0xadf59f99-288": 1,
  "0xc281d19e-0": 1
}
```

### callTracer

callTracer 追踪一个事务中执行的所有调用帧，包括深度 0。 结果将是一个嵌套的调用帧列表，类似于 EVM 的工作方式。它们形成一棵树，树根是顶层调用，子调用是上层的子调用。

### prestateTracer

prestateTracer 有两种模式：prestate 和 diff。prestate 模式返回执行给定事务所需的账户，而 diff 模式则返回事务的前状态和后状态之间的 diff（即事务发生后的变化）。prestateTracer 默认为 prestate 模式。它会重新执行给定的事务，并跟踪所接触的每一部分状态。这与无状态见证的概念类似，不同之处在于这种跟踪器不返回任何加密证明，而只返回三叶形的叶子。结果是一个对象。密钥是账户的地址。

### noopTracer

这个追踪器是无用的。它返回一个空对象，仅用于测试设置

## Javascript 跟踪器

还有一组用 Javascript 编写的跟踪器。这些跟踪器的性能不如 Go 本地跟踪器，因为在 Geth 的 Go 环境中解释 Javascript 会产生开销。

### bigram

bigramTracer 计数 opcode bigrams，即 2 个操作码相继执行的次数。

### evmdis

evmdisTracer 从跟踪返回足够的信息以执行 evmdis 样式的反汇编。

### opcount

opcountTracer 会计算执行的操作码总数，并直接返回该数字。

### trigramTracer

trigramTracer 用于统计操作码的触发次数。Trigrams 是三个操作码的可能组合，跟踪器会报告每种组合在执行过程中出现的次数。

### unigram

unigramTracer 会计算每个操作码出现的频率。

## 状态重写

为了模拟 eth_call 的效果，可以对 Geth 进行临时状态修改。例如，可以在执行期间将一些新字节码临时部署到某个地址，然后跟踪与该地址交互的事务。这可用于场景测试或在真正执行之前确定某些假设事务的结果。

要做到这一点，跟踪器的编写与正常情况一样，但参数 `stateOverrides` 会传递一个地址和一些字节码。

## 总结

本文介绍了如何使用与 Geth 捆绑的跟踪器。其中有一组是用 Go 编写的，还有一组是用 Javascript 编写的。在调用 API 方法时，可以通过传递名称来调用它们。状态重载可与跟踪器结合使用，以精确检查 EVM 在某些假设情况下会做什么。
