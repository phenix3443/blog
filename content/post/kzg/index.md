---
title: "KZG多项式承诺"
description: 多项式承诺
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

## KZG

KZG 多项式承诺（KZG Polynomial Commitment）也被称为卡特多项式承诺方案，是三个作者 Aniket Kate, Gregory M. Zaverucha 和 Ian Goldberg 姓氏的缩写，他们在 2010 年发表了多项式承诺方案论文“Constant-Size Commitments to Polynomials and Their Applications” ，并且这个方案在 plonk-style 的 zk-snark 协议中有很广泛的应用。

![kzg](https://www.chaincatcher.com/upload/image/20230130/1675042608317730.jpg)

### 数学原理

详细可参考 Qi Zhou 博士在 Dapp Learning 讲解的关于 [KZG 视频](https://www.youtube.com/watch?v=n4eiiCDhTes)。

在理解 KZG 之前，可以先了解一下多项式、群、环、域、椭圆曲线、生成元、配对公式、朗格朗日插值等数学定义。

KZG commitment 的流程如下：

- Prover：提供证明，计算 data 的 commitment，prover 无法改变给定的多项式，并且用于证明的 commitment 只对当前这一个多项式有效；
- Verifier：接收 prover 发送的 commitment value 并进行验证，确保 prover 提供了有效的证明。

在这个多项式方案中，证明者计算一个多项式的承诺，并可以在多项式的任意一点进行打开，该承诺方案能证明多项式在特定位置的值与指定的值一致。

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

- [KZG 多项式承诺](https://dankradfeist.de/ethereum/2021/10/13/kate-polynomial-commitments-mandarin.html)
- [深度解读 EIP-4844：Sharding 的一小步，以太坊扩容的一大步](https://www.chaincatcher.com/article/2086654)
- [如何在证明中使用 KZG 承诺](https://www.ethereum.cn/Technology/kzg-commitments-in-proofs)
