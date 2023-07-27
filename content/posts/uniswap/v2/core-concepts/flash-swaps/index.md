---
title: "Uniswap Flash Swaps"
description: uniswap 闪电互换
slug: uniswap-flash-swaps
date: 2023-03-09T17:57:59+08:00
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

## 概述

Uniswap 闪电互换(flash swap) 指的是`通过一个交易(原子操作)`来完成从 Uniswap 的流动性池中借出代币、使用这些代币进行某项操作并偿还这些代币这一多阶段流程。如果这个流程中的任意一阶段失败，所有状态更改都会撤销，相关代币重新回到对应的 Uniswap 流动池中。

## 套利交易

闪电交易的一大用例就是套利交易，而且交易者一定能在获利的同时将之前借得的代币价值归还至 Uniswap 流动性池内。交易者每次都能通过套利交易轻松获得收益。

想象一下这样的场景：在 Uniswap 上购买 1 个 ETH 的成本是 200DAI，而在 Oasis（或任何其他交易场所），1 个 ETH 可以购买 220DAI。对于有 200 个 DAI 的人来说，这种情况代表了 20 个 DAI 的无风险利润。不幸的是，你可能没有 200 个 DAI 在身边。然而，有了闪电互换，这种无风险的利润是任何人都可以获得的，只要他们有能力支付 gas 费用。

### 从 Uniswap 提取 ETH

第一步是乐观地通过闪电互换从 Uniswap 提取 1 个 ETH。这将作为我们用于执行套利的资本。请注意，在这种情况下，我们假设：

- 1 个 ETH 是预先计算好的利润最大化的交易。
- 自我们计算以来，Uniswap 或 Oasis 的价格没有变化

在这种情况下，我们可能希望计算出执行时的链上利润最大化交易，这对价格的变动是稳健的。这可能有点复杂，取决于正在执行的策略。然而，一个常见的策略是尽可能地针对一个固定的外部价格进行交易以获取利润。（比如说 Oasis 上一个或多个订单的平均执行价格）。如果 Uniswap 市场价格远远高于或低于这个外部价格，[ExampleSwapToPrice.sol](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleSwapToPrice.sol) 示例包含了计算在 Uniswap 上交易的金额以获得最大利润的代码。

### 场外交易

一旦我们从 Uniswap 获得了 1 个 ETH 的临时资金，我们现在可以在 Oasis 上用这个资金换取 220 个 DAI。一旦我们收到 DAI，我们需要向 Uniswap 还款。我们已经提到，通过 getAmountIn 计算，支付 1 个 ETH 所需的金额是 200DAI。因此，在将 200 个 DAI 送回给 Uniswap 对后，你还剩下 20 个 DAI 的利润!

### 即时杠杆

闪电互换可以用来提高使用借贷协议和 Uniswap 的杠杆效率。

考虑 Maker 最简单的形式：一个接受 ETH 作为抵押品的系统，允许用 DAI 来抵押，同时确保 ETH 的价值永远不会低于 DAI 价值的 150%。

假设我们用这个系统存入 3 个 ETH 的本金，并铸造最大数量的 DAI。以 1ETH/200DAI 的价格，我们收到 400DAI。理论上，我们可以通过卖出 DAI 换取更多的 ETH，存入这些 ETH，铸造最大数量的 DAI（这次会更少），并重复操作，直到我们达到我们想要的杠杆水平。

使用 Uniswap 作为这个过程中 DAI 到 ETH 部分的流动性来源是很简单的。然而，以这种方式在协议中循环并不是特别优雅，而且可能会很耗 gas。

幸运的是，闪电互换使我们能够预先提取全部 ETH 金额。如果我们想用 2 倍的杠杆来对抗我们的 3ETH 本金，我们可以简单地在闪电互换中申请 3ETH，并将 6ETH 存入 Maker。这使我们有能力铸造 800 个 DAI。如果我们铸币的数量与我们的闪电交换所需的数量相同（比如 605），剩余的部分可以作为安全保证金来应对价格波动。

## 流动性结算

另一个用例是使用 Uniswap 流动性池结算 Maker 金库，你可以偿还债务，并取出 Maker 金库中作为担保品的 ETH （或其它代币）来偿还 Uniswap 流动性池。相比直接使用自己持有的代币来还款，这种方式消耗的 gas 较少

## 开发资源

查看如何在智能合约中集成闪电互换参考[Using Flash Swaps](https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/using-flash-swaps)。
