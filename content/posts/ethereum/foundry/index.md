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

### 不变量测试 (invariant test)

不变式测试允许对一组不变式表达式进行测试，测试的对象是来自预定义合约的预定义函数调用随机序列。在执行每次函数调用后，都会对所有已定义的不变式进行断言。

不变式测试是暴露协议中不正确逻辑的有力工具。由于函数调用序列是随机的，并且有模糊输入，因此不变式测试可以揭示边缘情况和高度复杂协议状态中的错误假设和不正确逻辑。

不变式测试活动有两个维度：运行和深度：

运行：函数调用序列生成和运行的次数。
深度：特定运行中函数调用的次数。每次函数调用后，都会断言所有已定义的不变式。如果函数调用回退，深度计数器仍会递增。
此处将对这些变量和其他不变式配置方面进行说明。

与在 Foundry 中运行标准测试时在函数名前缀上 test 相似，不变式测试也是在函数名前缀上 invariant（例如，函数 invariant_A()）。

配置不变式测试的执行
用户可通过 Forge 配置原语控制不变式测试的执行参数。配置可以全局应用，也可以按测试应用。有关此主题的详细信息，请参阅 📚 全局配置 和 📚 在线配置。

### 差异测试 (Differential Testing)

Forge 可用于 differential testing 和 differential fuzzing。甚至可以使用 [ffi cheatcode](https://book.getfoundry.sh/cheatcodes/ffi.html) 对非 EVM 可执行文件进行测试。

#### 背景

[differential testing](https://en.wikipedia.org/wiki/Differential_testing) 通过比较每个函数的输出，交叉引用同一函数的多个实现。假设我们有一个函数规范 F(X)，以及该规范的两个实现：f1(X) 和 f2(X)。我们希望 `f1(x) == f2(x)` 适用于输入空间中的所有 x。如果 `f1(x) != f2(x)`，我们就知道至少有一个函数错误地实现了 F(X)。这个测试相等性和识别差异的过程是 differential testing 的核心。

differential fuzzing 是 differential testing 的扩展。differential fuzzing 以编程方式生成许多 x 值，以发现人工选择的输入可能无法揭示的差异和边缘情况。

> 注意：这里的 `==` 运算符可以是自定义的相等定义。例如，如果测试浮点实现，可以使用具有一定容差的近似相等。

这类测试在现实生活中的一些应用包括：

- 比价升级前后的实现
- 根据已知参考实现测试代码
- 确认与第三方工具和依赖关系的兼容性

以下是 Forge 用于差异测试的一些示例。

入门： ffi 作弊码

[ffi](https://book.getfoundry.sh/cheatcodes/ffi.html) 允许您执行任意 shell 命令并捕获输出。这是一个模拟示例：

## Cast

## Anvil

## Chisel

## 总结

## 参考
