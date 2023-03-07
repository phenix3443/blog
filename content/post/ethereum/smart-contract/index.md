---
title: "Smart Contract"
description: "智能合约"
slug: smart-contract
date: 2023-03-07T11:09:14+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - smart-contract
---

## 概述[^1]

"智能合约 "只是一个在以太坊区块链上运行的程序。它是一个代码（其功能）和数据（其状态）的集合，驻留在以太坊区块链的一个特定地址。

### 贩卖机比喻

{{< gist phenix3443 024b9e4ee0cf9109ba7a6237b285ee53 >}}

### 可组合性

可以在智能合约中调用其他智能合约，以极大地扩展可能性。合约甚至可以部署其他合约。

### 限制

单独的智能合约无法获得关于 "真实世界 "事件的信息，因为它们不能发送 HTTP 请求。这是设计上的问题。依靠外部信息可能会危及共识，这对安全和去中心化很重要。

有一些方法可以利用[预言机(oracle)]({{< ref "../oracle/" >}})来解决这个问题。

智能合约的另一个限制是最大合约大小。一个智能合约的最大容量为 24KB，否则会耗尽能量。这可以通过使用 "[钻石模式(The Diamond Pattern)](https://eips.ethereum.org/EIPS/eip-2535) "来绕过。

### 多重签名合约

Multisig（多重签名）合约是智能合约账户，需要多个有效签名来执行交易。这对于避免持有大量以太坊或其他代币的合约出现单点故障非常有用。

多重签名还将合约执行和密钥管理的责任划分给多方，并防止单一私钥的丢失导致资金的不可逆转的损失。由于这些原因，多重签名合约可用于简单的 DAO 治理。多重签名需要 M 个可能的可接受签名中的 N 个签名（其中 N≤M，且 M>1），以便于执行。N=3，M=5 和 N=4，M=7 是常用的。一个 4/7 的多重签名需要七个可能的有效签名中的四个。这意味着即使有三个签名丢失，资金仍然可以被检索到。在这种情况下，这也意味着大多数的钥匙持有者必须同意并签署，以便合约执行。

## 语言[^2]

目前有两种流行的开发语言：

- Solidity
- Vyper

[Smart contract language](https://ethereum.org/en/developers/docs/smart-contracts/languages/) 对比介绍了不同语言的优缺点

## 总结

## 参考

[^1]: [Introduction to Smart Contracts](https://ethereum.org/en/developers/docs/smart-contracts/)
