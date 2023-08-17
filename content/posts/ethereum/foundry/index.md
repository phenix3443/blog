---
title: "Foundry"
description:
slug: 使用 foundry 编写智能合约
date: 2023-03-15T10:17:15+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series: [以太坊开发工具链]
categories:
  - ethereum
tags:
  - foundry
---

本文介绍如何使用 Foundry 编写智能合约。

<!--more-->

## 概述

[foundry](https://github.com/foundry-rs/foundry) 是用 Rust 编写的用于以太坊应用程序开发的快速、可移植和模块化工具包。包括：

foundry 由以下部分组成：

- [Forge](https://github.com/foundry-rs/foundry/blob/master/forge): 以太坊测试框架（类似 Truffle, Hardhat 和 DappTools）。
- [Cast](https://github.com/foundry-rs/foundry/blob/master/cast): 用于与 EVM 智能合约互动，发送交易和获取链上数据，可用于合约调试。
- [Anvil](https://github.com/foundry-rs/foundry/blob/master/anvil): 本地以太坊节点，类似于 Ganache、Hardhat 网络。
- [Chisel](https://github.com/foundry-rs/foundry/blob/master/chisel): 快速、实用、详细的 solidity [REPL](https://www.zhihu.com/question/53865469)。

### 特色

有了 `hardhat + ethers` 为什么要使用 foundry? 特色在于：

- [快速](https://github.com/foundry-rs/foundry#how-fast) 灵活的编译管道
  - 自动检测和安装 Solidity 编译器版本（在 ~/.svm 下）。
  - 增量编译和缓存：只对更改的文件进行重新编译
  - 并行编译
  - 支持非标准目录结构（如 [Hardhat repos](https://twitter.com/gakonst/status/1461289225337421829)）
- 用 Solidity 编写测试（与 DappTools 类似），可有效减少上下文切换。与 `hardhat+ethers` 组合工具相比，hardhat+ethers 合约使用 solidity，而部署测试等使用 js 或者 ts。而对于 foundry 工具，合约、部署、测试等都使用 solidity，不需要在多种编程语言之间进行切换。
- 通过缩小输入和打印反例进行快速模糊测试。
- 快速远程 RPC 分叉模式，利用类似 tokio 的 Rust 异步基础架构
- 灵活的调试日志
  - DappTools 风格，使用 `DsTest` 输出的日志
  - Hardhat 风格，使用流行的 `console.sol`` 合约
- 便携（5-10MB）且易于安装，无需 Nix 或其他软件包管理器
- 通过 [Foundry GitHub](https://github.com/foundry-rs/foundry-toolchain) 操作实现快速 CI。

## 安装

```shell
curl -L https://foundry.paradigm.xyz | bash
```

这将安装 `fourndryup`，然后只需按照屏幕上的说明进行操作，执行 `fourndryup` 命令将安装 foundry 的其他组件。

## 配置

## forge

### test

一个好的做法是将 `test_Revert[If|When]_Condition` 与 `expectRevert` cheatcode 结合使用（下一节将更详细地解释作弊代码）。

## 总结

## 参考
