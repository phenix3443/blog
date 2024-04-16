---
title: "Overview"
description:
date: 2022-11-19T02:48:14+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
  - optimism
tags:
  - bedrock
---

## Execution engine

Execution engine（[op-geth](https://github.com/ethereum-optimism/op-geth)），是一个稍加修改的 geth 版本，类似于以前版本的 l2geth[^3]，但没有与 [DTL](https://github.com/ethereum-optimism/optimism/tree/develop/packages/data-transport-layer)[^3] 等效的部分；在 EVM 等效性方面，更接近上游 geth。

从上游 geth 继承的一个重要特性是它们的 P2P （其他 Optimism execution engine）同步，这可以更快的同步 state 和 transaction。请注意， P2P 同步是允许的，而不是必需的。为了抗审查，execution engine 可以只从 rollup node 同步。有两种可能的同步类型：

- `Snap sync`，它只将状态同步到已提交到 L1 的点。
- `Unsafe block sync`，包括 定序器创建的所有内容，即使尚未写入 L1。

[op-geth](https://github.com/ethereum-optimism/op-geth) 二层网络节点，基于 Geth 1.10.x，
