---
title: "Geth Overview"
description: geth 概览
slug: geth-overview
date: 2023-03-08T00:56:43+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - geth
tags:
---

## 概述

## 账号管理

geth 配合 clef 进行账号管理，可以看[account-management](https://geth.ethereum.org/docs/fundamentals/account-management)。

## 共识引擎

### Clique

Clique 共识是一个 PoA 系统，新区块只能由授权的 "签名者 "创建。EIP-225 中规定了 Clique consenus 协议。授权签名者的初始集合被配置在创世块中。签名者可以使用投票机制进行授权和取消授权，从而允许签名者的集合在区块链运行时发生变化。Clique 可以配置为针对任何区块时间（在合理范围内），因为它不与难度调整挂钩。[^1]

## 总结

## 参考

[^1]: [private network](https://geth.ethereum.org/docs/fundamentals/private-network)
