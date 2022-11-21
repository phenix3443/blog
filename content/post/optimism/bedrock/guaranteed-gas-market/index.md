---
title: "Guaranteed Gas Market"
description:
date: 2022-11-21T18:08:54+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tag:
    - ethereum
    - optimism
    - bedrock
---


## 引言[^1]

[deposited transaction](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#deposited-transaction) 是在 L1 上发起的 L2 上的交易。它们在 L2 上使用的 gas 是通过在 L1 上 gas 燃烧或直接付款购买的。我们维持一个费用市场，并对单个 L1 区块中所有deposit 提供的 gas 量设置硬上限。

提供给 deposited transaction 的 gas 有时被称为“guaranteed gas ”。提供给存入交易的 gas 是独一无二的，因为它不可退还。它无法退款，因为它有时是通过燃烧 gas 支付的(todo:这里是什么逻辑？)，并且可能没有任何 ETH 可以退款。

guaranteed gas  由 gas stipend 和用户想要购买（在 L1 上）的任何 guaranteed gas  组成。

通过以下方式购买 L2 上的 guaranteed gas。 L2  gas 价格是通过 EIP-1559 风格的算法计算的。购买该 gas 所需的 ETH 总量然后计算为（`guaranteed gas * L2 deposit basefee`）。然后，合约接受该数量的 ETH（在未来的升级中）或（目前唯一的方法），燃烧与 L2 成本（`L2 cost / L1 Basefee`）相对应的 L1  gas 量。 guaranteed gas  的 L2 gas 价格与 L2 的基本费用不同步，可能会有所不同。

## gas stipend

为了抵消在 deposit 事件上花费的 gas，我们将 `gas spent * L1 basefee` ETH 计入 L2 gas 的成本，其中 gas spent 是处理 deposit 所花费的 L1 gas 的数量。如果此信用额度的 ETH 值大于请求 guaranteed gas  的 ETH 值（`requested guaranteed gas * L2 gas price`），则不会燃烧 L1 gas。

## Limiting Guaranteed Gas

必须限制单个 L1 区块中可以购买的 guaranteed gas  总量，以防止针对 L2 的拒绝服务攻击，并确保 guaranteed gas  总量保持在 L2 区块 gas 限制以下。

我们设定了每个 L1 区块 8,000,000 gas 的 guaranteed gas  限制和每个 L1 区块 2,000,000 gas 的目标。这些数字允许偶尔进行大额交易，同时保持在我们的目标和 L2 上的最大 gas 使用量之内。

由于单个区块中可以购买的有保证的 L2 gas 数量现在是有限的，因此我们实施了 EIP-1559 式的费用市场以减少 deposit 拥堵。通过将限制设置为目标的倍数，我们使deposit 能够以更高的成本暂时使用更多的 L2  gas 。

### Rationale for burning L1 Gas

如果我们直接收集 ETH 来支付 L2 gas，则 deposit 函数的每个（间接）调用者都需要用 payable 选择器标记。 这对于许多现有项目来说是不可能的。 不幸的是，这是相当浪费的。 因此，我们将提供两种购买 L2  gas 的选择：

1. 燃烧 L1  gas
2. 将 ETH 发送到 Optimism Portal（尚不支持）

付费版本（选项 2）可能会应用折扣（或者相反，#1 应用溢价）。

对于 Bedrock 的初始版本，仅支持#1。

## 总结

[^1]: [guaranteed-gas-market](https://github.com/ethereum-optimism/optimism/blob/develop/specs/guaranteed-gas-market.md)
