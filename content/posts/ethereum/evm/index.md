---
title: "以太坊虚拟机"
description: 深入理解以太坊虚拟机
slug: evm
date: 2023-02-26T21:53:53+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - evm
---

本文介绍以太坊虚拟机。

<!--more-->

## 概述

[以太坊虚拟机 (EVM)](https://docs.soliditylang.org/zh/latest/introduction-to-smart-contracts.html#index-6) 是以太坊智能合约的运行环境。它不仅是沙盒封装的，而且实际上是完全隔离的，这意味着在 EVM 内运行的代码不能访问网络，文件系统或其他进程。 甚至智能合约之间的访问也是受限的。

## 从账本到状态机

“分布式账本”这一比喻经常被用来描述像比特币这样的区块链，它利用密码学的基本工具实现了一种去中心化的货币。分类账保存着活动记录，这些活动必须遵守一系列规则，这些规则规定了哪些人可以修改分类账，哪些人不能修改分类账。例如，一个比特币地址花费的比特币不能超过它之前收到的比特币。这些规则是比特币和许多其他区块链上所有交易的基础。

虽然以太坊有自己的原生加密货币（以太币），几乎完全遵循相同的直观规则，但它还能实现更强大的功能：[智能合约]({{< ref "../contract" >}})。对于这个更复杂的功能，需要一个更复杂的类比。与分布式账本不同，以太坊是一个分布式 [状态机](https://wikipedia.org/wiki/Finite-state_machine)。以太坊的状态是一个大型数据结构，其中不仅包含所有账户和余额，还包含一个机器状态，它可以根据预先定义的一系列规则从一个区块到另一个区块进行更改，并且可以执行任意的机器代码。从一个区块到另一个区块改变状态的具体规则由 EVM 定义。

![ethereum virtual machine](https://ethereum.org/static/e8aca8381c7b3b40c44bf8882d4ab930/302a4/evm.png)

## 存储、内存和栈

可以进一步参考这个文章： [https://learnblockchain.cn/2019/10/05/evm-data]，不过这篇文章关于 mload 说法有错误，后续需要自己更正一下（todo）。

被调用的合约（可以与调用者是同一个合约）将收到一个新清空的内存实例， 并可以访问调用的有效负载-由被称为 calldata 的独立区域所提供的数据。 在它执行完毕后，它可以返回数据，这些数据将被存储在调用者内存中由调用者预先分配的位置。 所有这样的调用都是完全同步的。

## 指令集

## 消息调用

事实上每个交易都由一个顶层消息调用组成。

## 委托调用和库

## 日志

## 创建

## 停用和自毁

## 预编译合约

## 实现

EVM 的所有实现都必须遵守 [以太坊黄皮书](https://ethereum.github.io/yellowpaper/paper.pdf) 中描述的规范。

在以太坊九年的发展历程中，EVM 经历了数次修订，目前已有多种编程语言实现了 EVM。参见 [Ethereum execution clients](https://ethereum.org/en/developers/docs/nodes-and-clients/#execution-clients)。

## 衍生阅读

- [以太坊官方 evm 介绍](https://ethereum.org/en/developers/docs/evm/)
- [Ethereum EVM illustrated](https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf)
- [solidity 的 evm 介绍](https://docs.soliditylang.org/zh/latest/introduction-to-smart-contracts.html#index-6)
