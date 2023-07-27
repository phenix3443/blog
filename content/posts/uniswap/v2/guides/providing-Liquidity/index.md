---
title: "Providing Liquidity"
description: 通过合约提供流动性
date: 2023-03-18T16:35:51+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - uniswap
tags:
  - develop
---

## 概述

当从智能合约中提供流动性时，最重要的是要记住，以当前储备比率以外的任何比率存入池中的代币都容易被套利。举个例子，如果一个配对中 `x:y` 的比例是 10:2（即价格是 5），有人天真地以 5:2（价格是 2.5）增加流动性，合约将简单地接受所有的代币（将价格改为 3.75，向套利开放市场），但只发行池中的代币，使发送者有权获得以适当比例发送的资产数量，在这种情况下是 5:1。为了避免套利者得利，当务之急是以当前价格增加流动性。幸运的是，要确保满足这个条件很容易!

## 使用 Router

最简单的方法是使用 [Router](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02) 将流动性安全地添加到一个池子里，它提供了简单的方法来安全地添加流动性。使用 [addLiquidity](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02#addliquidity) 为 `ERC-20/ERC-20` 代币对添加流动性。如果涉及 WETH，使用 [addLiquidityETH](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02#addliquidityeth)。

这些方法都需要调用者确认当前价格，被编码在 `amount*Desired` 参数中。通常情况下，可以相当安全地假设，当前的公平市场价格大约是一个货币对的当前储备率（因为套利）。因此，如果一个用户想向一个池子里添加 1 个 ETH，而该池子当前的 DAI/WETH 比率是 200/1，那么合理的计算是，200 个 DAI 必须和 ETH 一起发送，这就是对 200 个 DAI/1 个 WETH 价格的隐含承诺。然而，需要注意的是，这必须在提交交易之前计算。从交易中查找储备比率并依靠它作为信任价格是不安全的，因为这个比率可以被廉价地操纵，对你不利。

然而，仍然有可能提交一笔交易，其中编码的信任价格最终是错误的，因为在交易被确认之前，真实的市场价格有较大的变化。出于这个原因，有必要传递一组额外的参数，以编码调用者对价格变化的容忍度。这些 `amount*Min` 参数通常应设置为计算出的期望价格的百分比。因此，在 1%的容忍度下，如果我们的用户发送了一个 1ETH 和 200DAI 的交易， `amountETHMin` 应该被设置为例如 0.99ETH，而 `amountTokenMin` 应该被设置为 198DAI。这意味着，在最坏的情况下，流动性将以 198DAI/1ETH 和 202.02DAI/1ETH（200DAI/.99ETH）之间的速度增加。

一旦计算出价格，必须确保你的合约：
a）至少控制与作为 `amount*Desired` 参数传递的 `tokens/ETH` 一样多。
b）已经批准 Router 提取这个数量的代币。
