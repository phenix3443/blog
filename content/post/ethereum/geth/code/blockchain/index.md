---
title: "Blockchain"
description:
date: 2022-08-24T19:29:44+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
tags:
    - geth
    - ethereum
---


## ForkChoice

https://github.com/ethereum/go-ethereum/blob/6d711f0c001ccb536c5ead8bd5d07828819e7d61/core/forkchoice.go#L48-L57

ForkChoice 是分叉选择器，eth1 中基于链总难度最高进行分叉，eth2 中使用外部分叉。 这个 ForkChoice 的主要目标不仅是在 eth1/2 合并阶段提供分叉选择，而且还保持与所有其他工作量证明网络的兼容性。

[^1]: http://yangzhe.me/2019/03/24/ethereum-blockchain/