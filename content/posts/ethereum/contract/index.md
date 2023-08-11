---
title: "Ethereum Smart Contract"
description: "以太坊智能合约介绍"
slug: ethereum-contract
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
  - contract
---

## 概述

[智能合约 (Smart Contracts)](https://ethereum.org/en/developers/docs/smart-contracts/) 是一套运行在区块链上的程序片段。它是代码和数据的集合，位于以太坊区块链上的特定地址。

智能合约是 [以太坊账户]({{< ref "../account" >}}) 的一种。这意味着它们有余额，可以成为交易的目标。但它们不受用户控制，而是被部署到网络上并按程序运行。用户账户可以通过提交交易与智能合约互动，执行智能合约上定义的功能。智能合约可以像普通合约一样定义规则，并通过代码自动执行。智能合约默认情况下无法删除，与智能合约的交互也是不可逆的。

## 开发

### 语言

目前有两种流行的开发语言：

- [Solidity]({{< ref "../solidity" >}})
- Vyper

[更多开发语言](https://ethereum.org/en/developers/docs/smart-contracts/languages/) 对其他开发语言进行了对比。

### 框架

- [hardhat]({{< ref "../hardhat" >}})

### 验证

[如何验证以太坊合约]({{< ref  "" >}})

### 安全

[Smart Contract Security](https://ethereum.org/en/developers/docs/smart-contracts/security/)

### 升级

[Upgrade Smart Contracts](https://ethereum.org/en/developers/docs/smart-contracts/upgrading/)

## 限制

智能合约本身无法获取 "真实世界 "事件的信息，因为它们无法从链外获取数据。这意味着它们无法响应真实世界中的事件。这是设计的初衷。依赖外部信息可能会危及共识，而共识对于安全性和去中心化非常重要。

不过，区块链应用能够使用链外数据也很重要。解决方案就是 [以太坊预言机]({{< ref "../oracle" >}})，它是一种摄取链外数据并将其提供给智能合约使用的工具。

## Next
