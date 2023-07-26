---
title: "forkchoice"
description: Geth 源码解析：forkchoice
slug: geth-forkchoice
date: 2022-11-06T21:17:22+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - geth
  - 源码分析
tags:
  - forkchoice
---

## 源码

[ForkChoice](https://github.com/ethereum/go-ethereum/blob/6d711f0c001ccb536c5ead8bd5d07828819e7d61/core/forkchoice.go#L48-L57) 是分叉选择器，eth1 中基于链总难度最高进行分叉，eth2 中使用外部分叉。 这个 ForkChoice 的主要目标不仅是在 eth1/2 合并阶段提供分叉选择，而且还保持与所有其他工作量证明网络的兼容性。
