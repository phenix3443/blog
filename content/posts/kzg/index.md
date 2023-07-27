---
title: "KZG Polynomial Commitment"
description: KZG 多项式承诺
slug: kzg
date: 2023-03-31T10:55:28+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - kzg
  - commitments
  - cryptography
---

## 前置知识

- 阅读[多项式承诺]({{< ref "../polynomial-commitments" >}})，了解什么是密码学中的承诺方案，以及什么是多项式承诺。
- 阅读[区块链中的密码学]({{< ref "../cryptography" >}})，可以先了解一下多项式、群、环、域、椭圆曲线、生成元、配对公式、朗格朗日插值等数学定义。

## KZG 多项式承诺

KZG 多项式承诺（KZG Polynomial Commitment）源自于 Aniket Kate, Gregory M. Zaverucha 和 Ian Goldberg 在 2010 年发表了多项式承诺方案论文[“Constant-Size Commitments to Polynomials and Their Applications”](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf)，也被称为卡特多项式承诺方案，该方案在 plonk-style 的 zk-snark 协议中有很广泛的应用。

它具有以下优点：

- 成本
  - KZG commitment 具备快速验证、复杂度相对更低、简洁的特点；
    - 不需要提交额外的 proof，因此成本更低、更省带宽；
  - 数据触达所需的 Point evaluation precompile 可以获得更低的成本。
- 安全

  假设出现了 failure，也只会影响 commitment 对应的 blob 中的数据，而不会其他深远的影响。

- 更兼容

  纵观 sharding 的整体方案，KZG commitment 对 DAS 方案兼容，避免了重复开发的成本。

## 数学原理

- [零知识证明 KZG Commitment 1:Polynomial Commitment](https://www.youtube.com/watch?v=nkrk3jLj8Jw) 强烈推荐阅读。
- 可参考 Qi Zhou 博士在 Dapp Learning 讲解的关于 [Polynomial Commitment KZG with Examples (part 1)](https://www.youtube.com/watch?v=n4eiiCDhTes)。
- [KZG 多项式承诺](https://dankradfeist.de/ethereum/2021/10/13/kate-polynomial-commitments-mandarin.html) 比较难，看不懂。
- [详解 KZG 如何应用于 zk-rollup 以及以太坊 DA 方案](https://www.defidaonews.com/article/6784542)

### trust setup

- EIP-4844 中采用了一种常见的 multi-participant trust setup，即 powers-of-tau；
- 遵循 1-of-N 可信模型，不管多少人参与 generating setup 的过程，只要有一个人不泄漏自己的生成方式，可信初始化就是有效的；
- 必要性
  - KZG commitment 的 trust setup 可以简单理解为：生成一个在每次执行 cryptographic protocol 时需要依赖的一个参数，类似于 zk-snark 需要可信初始化；
  - Prover 在提供证明时，KZG commitment C = f(s)g1。其中 f 是评估函数，s 就是 KZG trusted setup 最终获得的 final secret；
  - 可以看出 final secret 是生成多项式承诺的核心参数，而作为获取这个核心参数的可信流程，这次 KZG Ceremony 对于整个 sharding 的实现非常重要。

## KZG Ceremony

[kzg ceremony](https://ceremony.ethereum.org/) 将为 EIP-4844（又名 proto-danksharding）等以太坊扩容工作提供密码学基础，这些类型的事件也被称为“可信设置(trust setup)”。

![kzg ceremony](https://www.chaincatcher.com/upload/image/20230130/1675042683843709.jpg)

这是一个多方参与的活动：每个贡献者创建一个秘钥，并运行一次计算，将其与之前贡献的秘密混合在一起。 然后，输出被公开并传递给下一个贡献者。最终输出将包含在未来的升级中，以帮助扩展以太坊网络。

## 延伸阅读

- [深度解读 EIP-4844：Sharding 的一小步，以太坊扩容的一大步](https://www.chaincatcher.com/article/2086654)
- [如何在证明中使用 KZG 承诺](https://www.ethereum.cn/Technology/kzg-commitments-in-proofs)
- [多项式承诺，正在重塑整个区块链](https://web3caff.com/zh/archives/38949)

## 参考
