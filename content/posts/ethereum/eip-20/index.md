---
title: "EIP-20"
description: ERC-20 代币标准
slug: erc-20
date: 2023-03-20T17:59:24+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series: [eip 学习]
categories: [ethereum]
tags:
  - eip
  - erc-20
  - openzeppelin
---

## 概述 [^1]

代币（Token）几乎可以代表以太坊中的任何东西：

- 在线平台中的信誉点
- 游戏中角色的技能
- 彩票
- 金融资产，如公司的股份
- 法定货币，如美元
- 一盎司黄金
- 以及更多。..

以太坊如此强大的功能必须由一个强大的标准来处理，这正是 ERC-20 发挥其作用的地方。这个标准允许开发者建立可与其他产品和服务互操作的代币应用。

## ERC-20

ERC-20(`Ethereum Request for Comments 20`)，由 Fabian Vogelsteller 在 2015 年 11 月以 [EIP-20](https://eips.ethereum.org/EIPS/eip-20) 提出，作为可转换代币 (`Fungible Tokens`) 的标准，它实现了智能合约内代币的 API，比如：

- 账户间转移代币。
- 获取账户当前代币余额。
- 获取网络上可用的代币总供应量。
- 批准第三方账户花费账户一定数量的代币。

如果一个智能合约实现了 EIP-20 规定的方法和事件，它可以被称为 ERC-20 代币合约。

## 实现

已经有很多符合 ERC20 标准的代币部署在以太坊网络上。不同的团队编写了不同的实施方案，这些方案有不同的权衡：从节省 Gas 到提高安全性。比如

- [OpenZeppelin 实现](https://github.com/OpenZeppelin/openzeppelin-solidity/blob/9b3710465583284b8c4c5d2245749246bb2e0094/contracts/token/ERC20/ERC20.sol)
- [ConsenSys 实现](https://github.com/ConsenSys/Tokens/blob/fdf687c69d998266a95f15216b1955a4965a0a6d/contracts/eip20/EIP20.sol)

下面通过 OpenZeppelin 说明如何实现并部署自己的 ERC-20 代币。

## 参考

[^1]: [ERC-20 Token Standard](https://ethereum.org/en/developers/docs/standards/tokens/erc-20/)
