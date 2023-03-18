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

Uniswap 闪电互换允许你提取 Uniswap 上任何 ERC20 代币的全部储备，并执行任意的逻辑，而不需要任何前期费用，前提是在交易结束时，你要么：

- 用相应的配对代币支付所提取的 ERC20 代币。
- 将提取的 ERC20 代币连同少量费用一并归还。

闪电互换是非常有用的，因为它们避免了涉及 Uniswap 的多步骤交易的前期资本要求和不必要的操作顺序限制。

## 示例

### 无资本套利

闪电互换的一个特别有趣的用例是无资本套利。众所周知，Uniswap 设计的一个组成部分是激励套利者将 Uniswap 价格与 "公平 "市场价格进行交易。虽然在游戏理论上是合理的，但这种策略只有那些拥有足够资金来利用套利机会的人才能使用。闪电互换完全消除了这一障碍，有效地实现了套利的民主化。

想象一下这样的场景：在 Uniswap 上购买 1 个 ETH 的成本是 200DAI（通过 1 个 ETH 被指定为精确输出，调用 `getAmountIn` 来计算），而在 Oasis（或任何其他交易场所），1 个 ETH 可以购买 220DAI。对于有 200 个 DAI 的人来说，这种情况代表了 20 个 DAI 的无风险利润。不幸的是，你可能没有 200 个 DAI 在身边。然而，有了闪电互换，这种无风险的利润是任何人都可以获得的，只要他们有能力支付 gas 费用。

#### 从 Uniswap 提取 ETH

第一步是乐观地通过闪电互换从 Uniswap 提取 1 个 ETH。这将作为我们用于执行套利的资本。请注意，在这种情况下，我们假设：

- 1 个 ETH 是预先计算好的利润最大化的交易。
- 自我们计算以来，Uniswap 或 Oasis 的价格没有变化

在这种情况下，我们可能希望计算出执行时的链上利润最大化交易，这对价格的变动是稳健的。这可能有点复杂，取决于正在执行的策略。然而，一个常见的策略是尽可能地针对一个固定的外部价格进行交易以获取利润。（比如说 Oasis 上一个或多个订单的平均执行价格）。如果 Uniswap 市场价格远远高于或低于这个外部价格，[ExampleSwapToPrice.sol](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleSwapToPrice.sol) 示例包含了计算在 Uniswap 上交易的金额以获得最大利润的代码。

#### 场外交易

一旦我们从 Uniswap 获得了 1 个 ETH 的临时资金，我们现在可以在 Oasis 上用这个资金换取 220 个 DAI。一旦我们收到 DAI，我们需要向 Uniswap 还款。我们已经提到，通过 getAmountIn 计算，支付 1 个 ETH 所需的金额是 200DAI。因此，在将 200 个 DAI 送回给 Uniswap 对后，你还剩下 20 个 DAI 的利润!

#### 即时杠杆

闪电互换可以用来提高使用借贷协议和 Uniswap 的杠杆效率。

考虑 Maker 最简单的形式：一个接受 ETH 作为抵押品的系统，允许用 DAI 来抵押，同时确保 ETH 的价值永远不会低于 DAI 价值的 150%。

假设我们用这个系统存入 3 个 ETH 的本金，并铸造最大数量的 DAI。以 1ETH/200DAI 的价格，我们收到 400DAI。理论上，我们可以通过卖出 DAI 换取更多的 ETH，存入这些 ETH，铸造最大数量的 DAI（这次会更少），并重复操作，直到我们达到我们想要的杠杆水平。

使用 Uniswap 作为这个过程中 DAI 到 ETH 部分的流动性来源是很简单的。然而，以这种方式在协议中循环并不是特别优雅，而且可能会很耗 gas。

幸运的是，闪电互换使我们能够预先提取全部 ETH 金额。如果我们想用 2 倍的杠杆来对抗我们的 3ETH 本金，我们可以简单地在闪电互换中申请 3ETH，并将 6ETH 存入 Maker。这使我们有能力铸造 800 个 DAI。如果我们铸币的数量与我们的闪电交换所需的数量相同（比如 605），剩余的部分可以作为安全保证金来应对价格波动。

## 开发资源

查看如何在智能合约中集成闪电互换参考[Using Flash Swaps](https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/using-flash-swaps)。
