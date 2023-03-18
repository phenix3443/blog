---
title: "Uniswap Swap Token"
description: uniswap 代币交换
slug: uniswap-swap
date: 2023-03-09T17:33:38+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - uniswap
tags:
  - swap
---

## 简介

![swap](https://docs.uniswap.org/assets/images/trade-b19a05be2c43a62708ab498766dc6d13.jpg)

Uniswap 中的代币交换用于将一种 ERC-20 代币交换成另一种代币。

对于终端用户来说，交换是直观的：用户选择一个输入代币和一个输出代币。他们指定一个输入金额，协议计算出他们将收到多少输出代币。然后，他们只需点击一下就可以执行交换，立即在他们的钱包中收到输出代币。

在本指南中，我们将看看在协议层面的交换过程中会发生什么，以便更深入地了解 Uniswap 的工作原理。

Uniswap 的交换与传统平台的交易不同。Uniswap 不使用订单簿来代表流动性或确定价格。Uniswap 使用自动做市商机制，提供关于利率和滑点的即时反馈。

正如我们在[协议概述]({{< ref "../../overview" >}})中所了解的，Uniswap 上的每一个交易对实际上都是由流动性池支撑的。流动性池是智能合约，持有两个代币的余额，并按照规则执行存入和提取。

这个规则是[恒积公式](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/glossary#constant-product-formula)。当任何一个代币被提取（购买）时，必须按比例存入（出售）另一个代币，以保持常数。

## swap 剖析

在最基本的层面上，Uniswap V2 中的所有交换都发生在一个名为`swap`的函数中。

`function swap(uint amount0Out, uint amount1Out, address to, bytes calldata data);`

### 接收代币

从函数签名中可能可以看出，Uniswap 要求 swap 调用者通过 `amount{0,1}Out` 参数指定他们想收到多少输出代币，这些参数对应于所需 `token{0,1}` 的数量。

### 发送代币

不太清楚的是 Uniswap 如何接收代币作为交换的付款。通常情况下，需要代币来执行某些功能的智能合约要求调用者首先在代币合约上进行批准，然后调用一个函数，再调用代币合约的 `transferFrom`。这不是 V2 对接受代币的方式。相反，配对在每次互动结束时检查他们的代币余额。然后，在下一次互动开始时，当前的余额与存储的值相减，以确定当前互动者发送的代币数量。请参阅[白皮书](https://docs.uniswap.org/whitepaper.pdf)，了解为什么要这样做。

也就是说，在调用 swap 之前，必须将代币转移到 Pairs（这一规则的一个例外是 [Flash Swaps](https://docs.uniswap.org/contracts/v2/concepts/core-concepts/flash-swaps)）。这意味着，为了安全地使用交换功能，必须从另一个智能合约中调用它。另一种方法（将代币转移到 Pair 中，然后调用 swap）在非原子上做是不安全的，因为发送的代币会容易被套利。

## 开发者资源

- 如何在智能合约中实现代币交换参阅[Trading from a smart contract](https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/trading-from-a-smart-contract).
- 如何通过接口执行交换[Trading (SDK)](https://docs.uniswap.org/sdk/2.0.0/guides/trading)。
