---
title: "Foundry"
description:
slug: foundry
date: 2023-03-15T10:17:15+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
tags:
  - foundry
---

## 概述

[foundry](https://github.com/foundry-rs/foundry)

### why

有了 `hardhat + ethers` 为什么要使用 foundry?

- 全面支持 solidity，可有效减少上下文切换。
  与 `hardhat+ethers` 组合工具相比，hardhat+ethers 合约使用 solidity，而部署测试等使用 js 或者 ts。而对于 foundry 工具，合约、部署、测试等都使用 solidity，不需要在多种编程语言之间进行切换。
- 功能更齐全。如 cast 命令可以直接从 etherscan 下载源代码，可以直接从 abi 生成 interface 等功能。
- 运行速度更快。

### 组成

foundry 由以下部分组成：

- [Forge](https://github.com/foundry-rs/foundry/blob/master/forge): 以太坊测试框架（如 Truffle, Hardhat 和 DappTools）。
- [Cast](https://github.com/foundry-rs/foundry/blob/master/cast): 用于与 EVM 智能合约互动，发送交易和获取链上数据，可用于合约调试。
- [Anvil](https://github.com/foundry-rs/foundry/blob/master/anvil): 本地以太坊节点，类似于 Ganache、Hardhat 网络。
- [Chisel](https://github.com/foundry-rs/foundry/blob/master/chisel):快速、功利、冗长的 solidity REPL。

## 使用

## 总结

## 参考
