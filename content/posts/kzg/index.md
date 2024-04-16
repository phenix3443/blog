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
math: true
series: 
  - 以太坊中的密码学
categories:
  - ethereum
tags:
  - kzg
  - cryptography
  - zkp
  - zkrollup
---

本文介绍 KZG 多项式承诺。

<!--more-->

## 前置知识

- [多项式承诺]({{< ref "posts/cryptography-commitments" >}}) 介绍密码学中承诺的概念以及实现方案，其中重点介绍了多项式承诺及其几种实现方案的对比。
- [椭圆曲线]({{< ref "posts/elliptic_curve" >}}) 介绍椭圆曲线、加法、生成元、配对公式等知识。

## 简介

KZG 多项式承诺（KZG Polynomial Commitment）源自于 Aniket Kate, Gregory M. Zaverucha 和 Ian Goldberg 在 2010 年发表了多项式承诺方案论文 [Constant-Size Commitments to Polynomials and Their Applications](https://www.iacr.org/archive/asiacrypt2010/6477178/6477178.pdf)，也被称为卡特多项式承诺方案，该方案在 plonk-style 的 zk-snark 协议中有很广泛的应用。主要特性：

1. 承诺是一个支持配对的椭圆曲线的群元素。比如说对于 [BLS12_381 曲线]({{< ref "posts/elliptic_curve#BLS12_381" >}})，大小应是 48 字节。
2. 证明大小独立于多项式大小，永远是一个群元素。验证，同样独立于多项式大小，无论多项式次数为多少都只要两次群乘法和两次配对。
3. 大多数时候该方案隐藏多项式 - 事实上，无限多的多项式将会拥有完全一样的卡特承诺。但是这并不是完美隐藏：如果你能猜多项式（比如说该多项式过于简单，或者它存在于一个很小的多项式集合中），你就可以找到这个被承诺的多项式。
4. 在一个承诺中合并任意数量的取值证明是可行的。这些性质使得卡特方案对于零知识证明系统来说非常具有吸引力，例如 PLONK 和 SONIC。同时对于一些更日常的目的，或者简单的作为一个矢量承诺来使用也是非常有趣的场景，接下来的文章中我们就会看到。

## 数学原理

经典文章：[Dankrad Feist：kzg 多项式承诺]({{< ref "posts/kate-polynomial-commitments-mandarin" >}})

可参考 Qi Zhou 博士关于 kzg 的讲解：

- [Polynomial Commitment KZG with Examples (part 1)](https://www.youtube.com/watch?v=n4eiiCDhTes)。
- [Polynomial Commitment KZG with Examples (part 2)](https://www.youtube.com/watch?v=NVvNHe_RGZ8)。

## 可信设置

- EIP-4844 中采用了一种常见的 multi-participant trust setup，即 powers-of-tau；
- 遵循 [1-of-N 可信模型](https://www.ethereum.cn/Thinking/trust-model)，不管多少人参与 generating setup 的过程，只要有一个人不泄漏自己的生成方式，可信初始化就是有效的；
- 必要性
  - KZG commitment 的 trust setup 可以简单理解为：生成一个在每次执行 cryptographic protocol 时需要依赖的一个参数，类似于 zk-snark 需要可信初始化；
  - Prover 在提供证明时，KZG commitment C = f(s)g1。其中 f 是评估函数，s 就是 KZG trusted setup 最终获得的 final secret；
  - 可以看出 final secret 是生成多项式承诺的核心参数，而作为获取这个核心参数的可信流程，这次 KZG Ceremony 对于整个 sharding 的实现非常重要。

- [vitalik: How do trusted setups work?](https://vitalik.ca/general/2022/03/14/trustedsetup.html)

## 应用

## 延伸阅读

- [多项式承诺，正在重塑整个区块链](https://web3caff.com/zh/archives/38949)

## 参考
