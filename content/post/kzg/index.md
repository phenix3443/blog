---
title: "KZG"
description:
slug: kzg
date: 2023-03-31T10:55:28+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
tags:
  - kzg
---

## 概述

KZG 是作者 Aniket Kate, Gregory M. Zaverucha 和 Ian Goldberg 姓氏的缩写，他们在 2010 年发表了多项式承诺方案论文“Constant-Size Commitments to Polynomials and Their Applications” ，并且这个方案在 plonk-style 的 zk-snark 协议中有很广泛的应用。

![kzg](https://www.chaincatcher.com/upload/image/20230130/1675042608317730.jpg)

参考 Dankrad Feist 演讲中的示意图，KZG root 类似 Merkle root，区别在于 KZG root 承诺一个多项式，即所有 position 都在这个多项式上。基于 proto-danksharding 的场景，KZG root 承诺了一堆数据，其中的任何一个数据都可以被验证属于这个整体

这也是为什么 KZG commitment 在兼容性上对后面实现 DAS 更友好。

KZG commitment 的流程如下：

- Prover：提供证明，计算 data 的 commitment，prover 无法改变给定的多项式，并且用于证明的 commitment 只对当前这一个多项式有效；
- Verifier：接收 prover 发送的 commitment value 并进行验证，确保 prover 提供了有效的证明。

## KZG Commitment 的优势

[KZG 承诺](https://dankradfeist.de/ethereum/2021/10/13/kate-polynomial-commitments-mandarin.html)

我认为主要出于对成本和安全性的思考，可以归纳但不局限于以下几点：

- 成本
  - KZG commitment 具备快速验证、复杂度相对更低、简洁的特点；
    - 不需要提交额外的 proof，因此成本更低、更省 bandwidth；
  - 数据触达所需的 Point evaluation precompile 可以获得更低的成本。
- 安全

  假设出现了 failure，也只会影响 commitment 对应的 blob 中的数据，而不会其他深远的影响。

- 更兼容

  纵观 sharding 的整体方案，KZG commitment 对 DAS 方案兼容，避免了重复开发的成本。

## KZG Ceremony 的流程

![kzg ceremony](https://www.chaincatcher.com/upload/image/20230130/1675042683843709.jpg)

参考 Vitalik 的流程图，任何人都可以作为 participants 贡献 secret 并与之前的结果进行混合产生一个新的 result，以此类推，通过套娃的形式获得最终的 SRS，并协助完成 KZG commitment 的 trust setup

### trust setup

- EIP-4844 中采用了一种常见的 multi-participant trust setup，即 powers-of-tau；
- 遵循 1-of-N 可信模型，不管多少人参与 generating setup 的过程，只要有一个人不泄漏自己的生成方式，可信初始化就是有效的；
- 必要性
  - KZG commitment 的 trust setup 可以简单理解为：生成一个在每次执行 cryptographic protocol 时需要依赖的一个参数，类似于 zk-snark 需要可信初始化；
  - Prover 在提供证明时，KZG commitment C = f(s)g1。其中 f 是评估函数，s 就是 KZG trusted setup 最终获得的 final secret；
  - 可以看出 final secret 是生成多项式承诺的核心参数，而作为获取这个核心参数的可信流程，这次 KZG Ceremony 对于整个 sharding 的实现非常重要。

## 参考

[^1]: [深度解读 EIP-4844：Sharding 的一小步，以太坊扩容的一大步](https://www.chaincatcher.com/article/2086654)
[^2]: [](https://foresightnews.pro/article/detail/17988)
[^3]: [如何在证明中使用 KZG 承诺](https://www.ethereum.cn/Technology/kzg-commitments-in-proofs)
