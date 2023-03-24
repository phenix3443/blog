---
title: "EIP-4844"
description: 以太坊数据扩容方案
slug: eip-4844
date: 2023-03-24T14:07:57+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
  - eip
tags:
---

## 概述

[EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)为以太坊引入了一种新的交易类型，它将“blobs”数据短期存储在信标节点(beacon node)，blob 足够小，以保持磁盘使用的可控性。

## 原因[^1]

- 供 rollup 使用。在短期和中期内，甚至可能在长期内，rollup 是以太坊唯一的无信任扩展解决方案。L1 交易费用是新用户和应用程序的一个重要障碍。EIP-4844 将有助于促进整个生态系统向 rollup 式发展。
- 降低费用。完整的数据分片将需要相当长的时间来完成实施和部署，然而现在 rollup 已经到来。EIP-4844 可以将 rollup 费用降低几个数量级，使以太坊在不牺牲去中心化的情况下保持竞争力。
- 向前兼容性。Blobs 基于 [KZG 承诺](https://dankradfeist.de/ethereum/2021/10/13/kate-polynomial-commitments-mandarin.html)。
- 信标节点存储。Blobs 被持久化在信标节点中，而不是在执行层中（例如，在 prysm 中，而不是在 geth 中）。未来的分片工作只需要对信标节点进行修改，使执行层能够并行地进行其他初始工作。
- 可管理的磁盘使用。blobs 包括 4096 个字段元素，每个字段 32 个字节，长期来看每个区块最多有 16 个 blobs。`4096 * 32 bytes * 16 per block = 2 MiB` 每块最大 2 MiB。单块 blob 上限可以从低开始，并在多次网络升级中增长。
- 临时存储。每 2 周后会修剪一次 blob。可用时间长到足以让 L2 的所有角色都能检索到它，短到足以让磁盘使用可控。这使得 Blobs 的价格比 CALLDATA 便宜，因为 CALLDATA 永远保存在历史中。

## 实施

- 规范。

  对执行层（即 geth、erigon 等）和共识层（即 prysm、lighthouse 等）的修改在 [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) 和[信标链规范](https://github.com/ethereum/consensus-specs/tree/dev/specs/eip4844)中规定。

- 客户端原型

  共识层和执行层客户端都要进行的修改的原型。你可以在[这里](https://github.com/ethereum/pm/blob/master/Breakout-Room/4844-readiness-checklist.md#client-implementation-status)关注这一方面的进展。

- 设置 KZG 信任

  EIP-4844 的一部分涉及使用 KZG 承诺。为了生成这些 seed，将会运行一个基于浏览器的[distributed ceremony](https://github.com/ethereum/KZG-Ceremony)，所以每个人都有机会确保它是正确和安全地生成。

- 开发网

  为了证明 EIP-4844 的可行性，一个开发者网络测试环境现在已经可以使用，并初步实现了这些变化。启动网络的说明可[在此](https://github.com/Inphi/eip4844-interop)获得。

- 测试网络

  一旦开发网络被证明是可行的，并且贡献者对它有信心，一个测试网将被启动，向社区展示一切是如何工作的，并允许任何人成为验证者，运行一个节点，等等。

- 准备就绪检查表

  为了确保 EIP 的设计是合理的，所有潜在的问题都得到了解决，一个[公开的列表](https://github.com/ethereum/pm/blob/master/Breakout-Room/4844-readiness-checklist.md)跟踪这些问题和潜在的解决方案。对于新的贡献者来说，这些都是很好的切入点!

## 参考

[^1]: [eip4844](https://www.eip4844.com/)
