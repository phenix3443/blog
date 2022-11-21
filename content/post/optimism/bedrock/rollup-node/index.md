---
title: "optimism specification: Rollup Node"
description: optimism 源码分析：Rollup Node 规范
slug: op-rollup-node
date: 2022-11-18T18:01:26+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tag:
    - ethereum
    - optimism
    - bedrock
---

## 引言[^1]

[rollup 节点](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#rollup-node)是负责从 L1 块（及其相关收据）[推导 L2 链的组件](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-derivation)。

推导 L2 链的 rollup 节点部分称为 [rollup driver](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#rollup-driver)。 本文档目前仅关注 rollup driver 的规范。

## Driver

[rollup 节点](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#rollup-node)中 [driver](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#rollup-driver) 的任务是管理[推导过程](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-derivation)：

+ 跟踪 L1 头块
+ 跟踪 L2 链同步进度
+ 当新输入可用时迭代派生步骤

### derivation

该过程分三个步骤进行：

+ 基于最后一个 L2 区块，从 L1 选择输入：区块列表，包含交易和相关数据和收据。
+ 读取 L1 信息、 deposits 和排序批次，以生成 [payload attributes](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#payload-attributes)（本质上是一个[没有输出属性的块](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#block)）。
+ 将 payload attributes 传递给[执行引擎](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#execution-engine)，以便计算 L2 块（包括[输出块属性](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#block)）。

虽然这个过程在概念上是从 L1 链到 L2 链的纯函数，但实际上它是增量的。每当新的 L1 块添加到 L1 链时，L2 链就会扩展。同样，每当 L1 链[重组](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#re-organization)时，L2 链也会重组。

L2块推导的完整规范，请参考 [L2块推导文档]({{< ref "../derivation" >}})。

## L2 Output RPC method

Rollup 节点有自己的 RPC 方法 `optimism_outputAtBlock`，它返回对应于 [L2 output root](https://github.com/ethereum-optimism/optimism/blob/develop/specs/proposals.md#l2-output-commitment-construction) 的 32 字节散列。

### Output Method API

这里的输入和返回类型由[引擎 API 规范定义](https://github.com/ethereum/execution-apis/blob/main/src/engine/specification.md#structures)。

+ method: optimism_outputAtBlock
+ params:
  + blockNumber: QUANTITY, 64 bits - L2 integer block number
  + OR String - one of "safe", "latest", or "pending".
+ returns:
  + version: DATA, 32 Bytes - the output root version number, beginning with 0.
  + l2OutputRoot: DATA, 32 Bytes - the output root

## 总结

[^1]: [Rollup Node Specification](https://github.com/ethereum-optimism/optimism/blob/develop/specs/rollup-node.md)
