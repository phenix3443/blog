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

`Price Oracle` 是用于查看特定资产的价格信息的工具。当在手机上看股票价格时，是在用手机作为一个 Price Oracle。同样，手机上的应用程序依靠设备来检索价格信息--可能是几个，这些信息被汇总，然后显示给你这个最终用户。这些也是 Price Oracle。

在构建与 DeFi 协议整合的智能合约时，开发者将不可避免地遇到 Price Oracle 问题。检索链上特定资产价格的最佳方式是什么？

以太坊上的许多 Oracle 设计都是在 `ad-hoc basis` 上实现的，具有不同程度的去中心化和安全性。正因为如此，该生态系统已经见证了许多出名的黑客攻击，其中主要的攻击媒介就是 Oracle 实现。[这里](https://samczsun.com/taking-undercollateralized-loans-for-fun-and-for-profit/) 将讨论其中的一些漏洞。

虽然没有一个放之四海而皆准的解决方案，但 Uniswap V2 使开发者能够建立高度分散和抗操纵的链上 Price Oracle，这可能会解决建立健壮协议所需的许多需求。

## Uniswap V2 solution

Uniswap V2 包括几项改进，以支持抗操纵的公共价格反馈。首先，每个交易对在每个区块开始时，在任何交易发生之前测量（但不存储）市场价格。这个价格的操纵成本很高，因为它是由上一个区块中的最后一笔交易设定的，无论是铸币、互换还是烧毁。

为了将测量的价格设置为与全球市场价格不同步的价格，攻击者必须在前一个区块的末尾做一笔坏的交易，通常不能保证他们会在下一个区块中套利回来。除非攻击者能够 "自私地 "连续开采两个区块，否则他们会对套利者造成损失。这种类型的攻击带来了一些挑战，迄今为止还[没有被观察到](https://arxiv.org/abs/1912.01798)。

不幸的是，仅仅这样做是不够的。如果重要的价值根据这种机制产生的价格进行结算，攻击者的利润很可能会超过损失。

相反，Uniswap V2 将这个区块结束的价格添加到核心合同中的一个单一的累积价格变量中，并根据这个价格存在的时间加权。这个变量代表了整个合约历史中每一秒钟的 Uniswap 价格的总和。

![v2_onchain_price_data](https://docs.uniswap.org/assets/images/v2_onchain_price_data-c051ebca6a5882e3f2ad758fa46cbf5e.png)

这个变量可以被外部合同用来追踪任何时间区间的准确时间加权平均价格（TWAP）。

TWAP 是通过读取所需区间开始和结束时的 ERC20 代币对的累积价格构建的。然后，这个累积价格的差异可以除以区间的长度，以创建该时期的 TWAP。

![v2_twap](https://docs.uniswap.org/assets/images/v2_twap-fdc82ab82856196510db6b421cce9204.png)

TWAPs 可以直接使用，也可以根据需要作为移动平均线（EMAs 和 SMAs）的基础。

一些注意事项:

- 对于 10 分钟的 TWAP，每 10 分钟采样一次。对于 1 周的 TWAP，每周取样一次。
- 对于一个简单的 TWAP，操纵的成本随着 Uniswap 的流动性而增加（大约是线性的），也随着你平均的时间长度而增加（大约是线性的）。
- 攻击成本的估算相对简单。在 1 小时的 TWAP 上移动 5%的价格，大约等于在 1 小时内每个区块移动 5%的价格所损失的套利和费用。

在使用 Uniswap V2 作为 Oracle 时，有一些细微的差别是值得注意的，特别是在涉及到抗操纵性时。[白皮书](https://docs.uniswap.org/whitepaper.pdf)对其中的一些进行了阐述。其他以 Oracle 为重点的开发者指南和文档将很快发布。

同时，请看我们在 Uniswap V2 基础上建立的 24 小时 TWAP Oracle 的[实现示例](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol)。

## 抗操纵性

在一个特定的时间段内，操纵价格的成本可以粗略估计为整个时期内每个区块的套利和费用损失。对于较大的流动性池和较长的时间段，这种攻击是不切实际的，因为操纵的成本通常超过了风险的价值。

其他因素，如网络拥堵，可以减少攻击的成本。关于 Uniswap V2 Price Oracle 安全性的更深入审查，请阅读 [Oracle Integrity 的安全审计部分](https://uniswap.org/audit.html#org87c8b91)。

## 构建预言机

要了解有关构建预言机的更多信息，请查看开发指南中 [building an Oracle](https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/building-an-oracle).
