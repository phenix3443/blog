---
title: "Solidity"
description: 使用 solidity 开发以太坊智能合约
slug: solidity
date: 2022-05-11T21:49:51+08:00
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
  - solidity
---

本文介绍如何使用 solidity 开发智能合约。

<!--more-->

## 概述

[solidity](https://soliditylang.org/) 是一种静态类型的、面向合约的高级语言，用于在以太坊平台上实现智能合约。

[中文文档](https://docs.soliditylang.org/zh/latest/)

部署 [官方示例](https://docs.soliditylang.org/zh/latest/introduction-to-smart-contracts.html):

{{< gist phenix3443 868da315757b9f430b417d27b297b3a6 >}}

## 工具链

- [hardhat]({{< ref "../hardhat" >}})
- [foundry]({{< ref "../foundry" >}})

## vscode 扩展

推荐安装以下扩展：

### solidity

[solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity) 可以用来做代码补全、跳转功能。

或者使用 hardhat 团队提供的扩展 [hardhat-solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)

### solidity-visual-auditor

[solidity-visual-auditor](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor) 为 Visual Studio Code 提供了以安全为中心的语法和语义高亮显示、详细的类大纲、专门的视图、高级 Solidity 代码洞察和增强。

主要可以用来生成调用图。

## 延伸阅读

- [Consensys 的最佳实践](https://consensys.github.io/smart-contract-best-practices/) 相当广泛，包括可以学习的 [成熟模式](https://consensys.github.io/smart-contract-best-practices/development-recommendations/) 和可以避免的 [已知陷阱](https://consensys.github.io/smart-contract-best-practices/attacks/)
