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
draft: true
categories:
  - ethereum
tags:
  - evm
---

本文介绍以太坊虚拟机。

<!--more-->

## 概述

[以太坊虚拟机 (EVM)](https://docs.soliditylang.org/zh/latest/introduction-to-smart-contracts.html#index-6) 是以太坊智能合约的运行环境。它不仅是沙盒封装的，而且实际上是完全隔离的，这意味着在 EVM 内运行的代码不能访问网络，文件系统或其他进程。 甚至智能合约之间的访问也是受限的。

## 存储、内存和栈

可以进一步参考这个文章： [https://learnblockchain.cn/2019/10/05/evm-data]，不过这篇文章关于 mload 说法有错误，后续需要自己更正一下（todo）。

The EVM executes as a stack machine with a depth of 1024 items. Each item is a 256-bit word, which was chosen for the ease of use with 256-bit cryptography (such as Keccak-256 hashes or secp256k1 signatures).[^2]

被调用的合约（可以与调用者是同一个合约）将收到一个新清空的**内存实例**， 并可以访问调用的有效负载-由被称为 calldata 的独立区域所提供的数据。 在它执行完毕后，它可以返回数据，这些数据将被存储在**调用者内存中由调用者预先分配的位置**。 所有这样的调用都是完全**同步**的。

## 指令集

## 消息调用

事实上每个交易都由一个顶层消息调用组成。

## 委托调用和库

## 日志

## 创建

## 停用和自毁

## 预编译合约

## 参考

[^2]: [ETHEREUM VIRTUAL MACHINE](https://ethereum.org/en/developers/docs/evm/)
