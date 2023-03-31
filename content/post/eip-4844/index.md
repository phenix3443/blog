---
title: "EIP-4844"
description: Proto-Danksharding
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

[EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)它将“blobs”数据短期存储在信标节点(`beacon node`)。blob 足够小，可以保持磁盘使用的可控性，同时，blob 远大于现在的 calldata，可以更好地支持 rollup 上的高 TPS。

### 价值[^1]

## 资源

- 规范。

  对执行层（即 geth、erigon 等）和共识层（即 prysm、lighthouse 等）的修改在 [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844) 和[信标链规范](https://github.com/ethereum/consensus-specs/tree/dev/specs/eip4844)中规定。

- 客户端原型

  共识层和执行层客户端都要进行的修改的原型。你可以在[这里](https://github.com/ethereum/pm/blob/master/Breakout-Room/4844-readiness-checklist.md#client-implementation-status)关注这一方面的进展。

- 设置 KZG 信任

  EIP-4844 涉及使用 KZG 承诺。为了生成这些 seed，将会运行一个基于浏览器的[distributed ceremony](https://github.com/ethereum/KZG-Ceremony)，所以每个人都有机会确保它是正确和安全地生成。

- 开发网

  为了证明 EIP-4844 的可行性，一个开发者网络测试环境现在已经可以使用，并初步实现了这些变化。启动网络的说明可[在此](https://github.com/Inphi/eip4844-interop)获得。

- 测试网络

  一旦开发网络被证明是可行的，并且贡献者对它有信心，一个测试网将被启动，向社区展示一切是如何工作的，并允许任何人成为验证者，运行一个节点，等等。

- 准备就绪检查表

  为了确保 EIP 的设计是合理的，所有潜在的问题都得到了解决，一个[公开的列表](https://github.com/ethereum/pm/blob/master/Breakout-Room/4844-readiness-checklist.md)跟踪这些问题和潜在的解决方案。对于新的贡献者来说，这些都是很好的切入点!

## 参考

[^2]: [观点：以太坊距离大规模扩容 ，可能比我们想象的更近](https://www.8btc.com/article/6790012)
[^3]: [情人节，V 神科普的“Danksharding”到底是什么？](https://www.8btc.com/article/6729076)
[^4]: [热度飙升的 EIP-4844 究竟是什么 ？V 神亲自详细解答](https://www.tuoluo.cn/article/detail-10095959.html) 没看懂
