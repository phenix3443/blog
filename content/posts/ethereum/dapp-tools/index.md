---
title: "Dapp Tools"
description:
slug: DApp-tools
date: 2023-03-02T21:52:53+08:00
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
  - DApp-tools
  - eth-tools
---

本文介绍 DApp-tools 工具的使用。

<!--more-->

## DApp

DApp 是一个用于从命令行中构建、测试和部署智能合约的工具。

与其他工具相比，它不使用 rpc 来执行交易。相反，它直接调用 `hevm cli`。这更快，并允许很多 rpc 中没有的灵活性，如 [模糊测试 (fuzz testing)](https://github.com/dapphub/dapptools/blob/master/src/DApp/README.md#property-based-testing)、[符号执行 (symbolic execution)](https://github.com/dapphub/dapptools/blob/master/src/DApp/README.md#symbolically-executed-tests) 或 [可以修改主网状态的欺骗代码 (cheat codes to modify mainnet state)](https://github.com/dapphub/dapptools/blob/master/src/hevm/README.md#cheat-codes)。

## 参考

- [如何使用 DAppTools](https://blog.chain.link/how-to-use-dapptools-zh/)
