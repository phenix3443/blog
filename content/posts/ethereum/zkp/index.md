---
title: ZKP
description: 零知识证明
slug: zkp
date: 2023-09-01T15:28:59+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: true
series: []
categories: []
tags: []
images: []
---

本文介绍零知识证明。

<!--more-->

## 概述

零知识证明的目标是让验证者能够确信，证明者掌握了一个满足某种关系的秘密参数，也就是“wittiness”，而无需向验证者或任何其他人揭示这个“wittiness”。

我们可以更具体地将其想象为一个程序，标记为 $C$ ，接收两个输入： $C(x, w)$ 。输入 $x$ 是公开输入（public inputs, 简称 PI），而 w 是秘密见证输入（secret wittiness）。程序的输出是布尔值，即 true 或 false 。然后，目标是给定特定的公开输入 $x$ ，证明证明者知道一个秘密输入 $w$ ，使得 $C(x,w) == true$ 。

我们将专门讨论非交互式零知识证明。这意味着证明本身是一块可以在无需证明者任何交互的情况下进行验证的数据。

## 示例

假设 Bob 得到了某个值的哈希 $H$ ，他希望有证据证明 Alice 知道哈希为 $H$ 的值 $s$ 。通常，Alice 会通过给 Bob $s$ 来证明这一点，然后 Bob 会计算哈希并检查它是否等于 H 。

然而，假设爱丽丝不想向鲍勃透露 $s$ 的值，而只是想证明她知道这个值。她可以使用 zk-SNARK 来实现这一点。

我们可以使用以下程序来描述爱丽丝的情况，这里以 Javascript 函数的形式编写：

```javascript
function C(x, w) {  return ( sha256(w) == x );}
```

换句话说：该程序接收一个公共哈希 x 和一个秘密值 w ，如果 w 的 SHA-256 哈希等于 x ，则返回 true 。

将爱丽丝的问题通过函数 $C(x,w)$ 进行翻译，我们可以看到爱丽丝需要创建一个证明（proof），证明她拥有 $s$ ，使得 $C(H, s) == true$ ，而无需揭示 $s$ 。这就是 zk-SNARKs 解决的一般问题。

## zk-SNARK 的定义

一个 zk-SNARK 由三个算法 G, P, V 组成，定义如下：

密钥生成器 G 采用一个秘密参数 lambda 和一个程序 C ，并生成两个公开可用的密钥，一个证明密钥 pk ，和一个验证密钥 vk 。这些密钥是公开参数，只需要为给定的程序 C 生成一次。

证明者 P 将证明密钥 pk 、公共输入 x 和私人见证 w 作为输入。该算法生成一个证明 $prf = P(pk, x, w)$ ，证明者知道一个见证 w ，并且该见证满足程序的要求。

验证器 V 计算 $V(vk, x, prf)$ ，如果证明是正确的，它将返回 true ，否则返回 false 。因此，如果证明者知道满足 $C(x,w) == true$ 的见证人 w ，这个函数就会返回真。

请注意在生成器中使用的秘密参数 lambda 。这个参数有时使得在现实世界的应用中使用 zk-SNARKs 变得棘手。原因在于，任何知道这个参数的人都可以生成假的证明。具体来说，给定任何程序 C 和公开输入 x ，知道 lambda 的人可以生成一个证明 fake_prf ，使得 V(vk, x, fake_prf) 评估为 true ，而无需知道秘密 w 。

## 针对我们示例程序的 zk-SNARK

在实际操作中，爱丽丝和鲍勃如何使用 zk-SNARK，以便爱丽丝证明她知道上述示例中的秘密值？

首先，如上所述，我们将使用由以下函数定义的程序：

```javascript
function C(x, w) {
  return ( sha256(w) == x );
}
```

首先，Bob 需要运行生成器 G 以创建证明密钥 pk 和验证密钥 vk。首先，随机生成 lambda，并将其作为输入：

```shell
(pk, vk) = G(C, lambda)
```

请小心处理参数 lambda，因为如果爱丽丝知道 lambda 的值，她将能够创建假的证明。鲍勃将与爱丽丝分享 pk 和 vk。

爱丽丝现在将扮演证明者的角色。她需要证明她知道哈希值 H 对应的值 s。她运行证明算法 P，使用输入 pk、H 和 s 来生成证明 prf。

```shell
prf = P(pk, H, s)
```

接下来，爱丽丝将证明 prf 呈现给鲍勃，鲍勃运行验证函数 V(vk, H, prf)。在这种情况下，由于爱丽丝正确地知道了秘密 s，所以会返回真值。鲍勃可以确信爱丽丝知道这个秘密，但爱丽丝并不需要向鲍勃透露这个秘密。

## 延伸阅读
