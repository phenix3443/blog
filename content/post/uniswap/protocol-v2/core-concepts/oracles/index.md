---
title: "Uniswap Price Oracles"
description: uniswap 价格预言机
slug: uniswap-price-oracles
date: 2023-03-09T17:59:57+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - uniswap
tags:
  - oracle
---

## 概述

`价格预言机(Price Oracle)` 是用于查看特定资产的价格信息的工具。在未引入 Oracle 时，uniswap 可能存在资产的偏差阈值较大，价格更新较慢等问题。

以太坊上的许多 Oracle 设计都是在 `ad-hoc basis` 上实现的，具有不同程度的去中心化和安全性。正因为如此，该生态系统已经见证了许多出名的黑客攻击，其中主要的攻击媒介就是 Oracle 实现。[这里](https://samczsun.com/taking-undercollateralized-loans-for-fun-and-for-profit/) 将讨论其中的一些漏洞。

Uniswap V2 使用的价格预言机称为 `TWAP(Time-Weighted Average Price)`，即时间加权平均价格。不同于 chainlink 预言机取自多个不同交易所的数据作为数据源，TWAP 的数据源来自于 Uniswap 自身的交易数据，价格的计算等操作都是在链上执行的。因此，TWAP 是属于链上预言机。

## Uniswap V2 solution

Uniswap V2 中的价格预言，其实就是通过两个公式计算而来：

![v2_onchain_price_data](https://docs.uniswap.org/assets/images/v2_onchain_price_data-c051ebca6a5882e3f2ad758fa46cbf5e.png)

如上图可知，合约第一个区块为 block 122，此时的价格和时间差都为 0。所以

`priceCumulative = 0`

到了 block 123 时，取自上个区块中最后一次交易的价格 10.2，且时间差为 7，所以可计算此时的

`priceCumulative=10.2 * 7 = 71.4`

再到下一个区块 124，去上个区块中最后一笔交易 10.3，且时间差为 8，可计算出此时的

`priceCumulative = 71.4 + (10.3 * 8) = 153.8`

block 125 同理可计算出此时的

`priceCumulative = 153.8 + (10.5 * 5) = 206.3`

有了这个基础之后，就可以计算 TWAP 了。

![v2_twap](https://docs.uniswap.org/assets/images/v2_twap-fdc82ab82856196510db6b421cce9204.png)

想必大家从上图就可以清晰的知道如何计算 TWAP。该图，是计算时间间隔为 1 小时的 TWAP，取自开始和结束时的累计价格和两个区块之间的时间戳。`用两者的累计价格相减除以时间间隔即可得到这一小时内的 TWAP 价格了`。这是 TWAP 最简单的计算方式，也称为固定时间窗口的 TWAP。还有一种方式是基于滑动时间窗口来计算的(todo: 补充链接)

虽然，TWAP 是由 Uniswap 推出的，也有很多其他 DEX （去中心化交易所）也采用了和 Uniswap 一样的底层实现，如 SushiSwap、PancakeSwap 等，所以这些 DEX 也可以用同样的算法计算出对应的 TWAP。
但使用 UniswapV2 的 TWAP，其主要缺点是需要链下程序定时触发合约中的 update()函数，存在维护成本。UniswapV3 的 TWAP 则[解决了这个问题]()。

作者：Victorian
链接：https://juejin.cn/post/7178857641421045820
来源：稀土掘金
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。

### 安全性

由上面的步骤可以看出：每个交易对在每个区块开始时，在任何交易发生之前测量市场价格。

这个价格的操纵成本很高，因为它是由上一个区块中的最后一笔交易设定的。为了将测量的价格设置为与全球市场价格不同步的价格，攻击者必须在前一个区块的末尾做一笔赔本的交易，通常不能保证他们会在下一个区块中套利回来。这种类型的攻击带来了一些挑战，迄今为止还[没有被观察到](https://arxiv.org/abs/1912.01798)。

不幸的是，仅仅这样做是不够的。如果特别重要的价值交易根据这种机制产生的价格进行结算，攻击者的利润很可能会超过损失。

Uniswap V2 将这个区块结束的价格添加到 Core Contract 中的一个单一的累积价格变量中，并根据这个价格存在的时间加权。这个变量代表了整个合约历史中每一秒钟的 Uniswap 价格的总和，也就是 TWAP（参考上述计算过程）。

一些注意事项:

- 对于 10 分钟的 TWAP，每 10 分钟采样一次。对于 1 周的 TWAP，每周取样一次。
- 对于一个简单的 TWAP，操纵的成本随着 Uniswap 的流动性而增加(大约是线性的)，也随着你平均的时间长度而增加(大约是线性的)。
- 攻击成本的估算相对简单。在 1 小时的 TWAP 上移动 5% 的价格，大约等于在 1 小时内每个区块移动 5%的价格所损失的套利和费用。

在使用 Uniswap V2 作为 Oracle 时，有一些细微的差别是值得注意的，特别是在涉及到抗操纵性时。[白皮书](https://docs.uniswap.org/whitepaper.pdf)对其中的一些进行了阐述。也可以参考在 Uniswap V2 基础上建立的 24 小时 TWAP Oracle 的[实现示例](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol)。

## 抗操纵性

在一个特定的时间段内，操纵价格的成本可以粗略估计为整个时期内每个区块的套利和费用损失。对于较大的流动性池和较长的时间段，这种攻击是不切实际的，因为操纵的成本通常超过了风险的价值。

其他因素，如网络拥堵，可以减少攻击的成本。关于 Uniswap V2 Price Oracle 安全性的更深入审查，请阅读 [Oracle Integrity 的安全审计部分](https://uniswap.org/audit.html#org87c8b91)。

## 构建预言机

要了解有关构建预言机的更多信息，请查看开发指南中 [building an Oracle](https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/building-an-oracle).

## 参考

[^1]: [DeFi:Uniswap v2 协议原理解析](https://juejin.cn/post/7178857641421045820)
