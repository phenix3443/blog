---
title: "Ethereum Consensus"
description: 以太坊共识协议
slug: ethereum-consensus
date: 2023-03-09T13:37:53+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - consensus
---

## 共识

我们所说的共识，是指达成了广泛的一致。

对于以太坊区块链来说，达成共识的过程是标准化的，达成共识意味着全网络中至少 66% 的节点就网络的全局状态达成一致。

## 共识机制

共识机制是一整套由协议、激励和想法构成的体系，使得整个网络的节点能够就区块链状态达成一致。

## 共识机制类型

### 基于工作量证明(PoW)

### 基于权益证明(PoS)

### PoA

Clique 共识是一个 PoA 系统，新区块只能由授权的 "签名者 "创建。授权签名者的初始集合被配置在创世块中。签名者可以使用投票机制进行授权和取消授权，从而允许签名者的集合在区块链运行时发生变化。

Clique 可以配置为针对任何区块时间（在合理范围内），因为它不与难度调整挂钩。

[EIP-225](https://eips.ethereum.org/EIPS/eip-225) 中规定了 Clique consensus 协议。

## 女巫攻击

## 延伸阅读

## 参考
