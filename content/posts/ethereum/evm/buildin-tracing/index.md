---
title: Buildin Tracing
description:
slug: buildin-tracing
date: 2023-09-01T22:36:00+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: []
categories: []
tags: []
images: []
---

Summary.

<!--more-->

Geth 捆绑了多种可通过跟踪 API 调用的跟踪器。其中一些内置跟踪器是用 Go 原生实现的，另一些则是用 Javascript 实现的。默认跟踪器是操作码记录器（又称结构记录器），它是所有方法的默认跟踪器。其他跟踪器必须通过在 API 调用中向跟踪器参数传递其名称来指定。

## 结构/操作码记录器

结构体记录器（又称操作码记录器）是一种本地 Go 跟踪器，它执行事务，并在每一步都输出操作码和执行上下文。当没有向 API 传递名称（例如 debug.traceTransaction(<txhash>)）时，将使用该跟踪器。每一步都会发出以下信息：

| field | type | description |
| --- | --- | --- |
| pc | uint64 | program counter |
| op | byte | opcode to be executed |
| gas | uint64 | remaining gas |
| gasCost | uint64 | cost for executing op |
| memory | `[]byte` | EVM memory. Enabled via enableMemory |
| memSize | int | Size of memory |
| stack | `[]uint256`` | EVM stack. Disabled via disableStack |
| returnData | `[]byte` | Last call's return data. Enabled via enableReturnData |
| storage | `map[hash]hash`` | Storage slots of current contract read from and written to. Only emitted for SLOAD and SSTORE. Disabled via disableStorage |
| depth | int | Current call depth |
| refund | uint64 | Refund counter |
| error | string | Error message if any |
