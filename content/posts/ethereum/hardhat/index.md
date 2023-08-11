---
title: "Hardhat Pieces"
description: hardhat 拾遗
slug: hardhat-pieces
date: 2023-03-03T10:59:20+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - hardhat
---

## 概述

[hardhat](https://hardhat.org/) 由用于编辑、编译、调试和部署智能合约和 dApp 的不同组件组成，所有这些组件共同创建一个完整的以太坊合约开发环境。

本文是对 [官方文档](https://hardhat.org/hardhat-runner/docs/getting-started#overview) 的实践和补充。

## Config[^4]

- tasks 定义在配置文件 `hardhat.config.ts` 中。

## Network[^2]

### 本地节点网络

这个功能可以搭建本地测试网络，供其他钱包或者程序连接，有助于本地测试合约和 dapp 程序。

本地启动 hardhat node， `npx hardhat node`， 然后通过 metamask 添加网络：

### fork other network[^3]

Hardhat Network 有能力将主网区块链的状态复制到你的本地环境中，包括所有余额和部署的合约。这就是所谓的 "fork other net"。

技术上来说，hardhat 可以 fork 任何 EVM-compatible blockchain，这样我们就可以更方便的在本地测试其他现有网络，不用担心 token 不足或者目标网络没有部署合适的测试网络等问题。

## test

### Chai Matcher

[hardhat-chai-matcher](https://hardhat.org/hardhat-chai-matchers/docs/overview) 在 [Chai](https://www.chaijs.com/) 断言库中增加了 Ethereum 特有的功能，使智能合约测试易于编写和读取。

### hardhat-network-helper

[@nomicfoundation/hardhat-network-helpers](https://hardhat.org/hardhat-network-helpers/docs/reference) 为 Hardhat Network 的 [JSON-RPC](https://hardhat.org/hardhat-network/docs/reference#hardhat-network-methods) 功能提供一个方便的 JavaScript 接口，以便进行快速和简单的互动。其功能包括：挖掘达到一定时间戳或区块编号的区块的能力，操作账户属性的能力（余额、代码、nonce、存储），冒充特定账户的能力，以及拍摄和恢复快照的能力。

其中，[loadFixture(fixture)](https://hardhat.org/hardhat-runner/docs/guides/test-contracts#using-fixtures) 可用于设置测试用例中网络的的初始状态：

- 第一次调用 loadFixture 时，通过调用 `fixture` 函数设置测试网络的初始状态。
- 在第二次调用时，`loadFixture` 将不再执行 `fixture`，而是回到第一次执行时候的状态，相当于是给测试网络做了一个快照 (`snapshot`)。

相比 `mocha.beforeEach`， 这样做更快，而且可以撤销之前测试所做的任何状态改变。

### 测试覆盖率

Hardhat Toolbox 包括 [`solidity-coverage`](https://github.com/sc-forks/solidity-coverage) 插件来显示测试覆盖率：`npm hardhat coverage`

### 测量 Gas 消耗

hardhat 还包括 [`hardhat-gas-reporter`](https://hardhat.org/hardhat-runner/docs/guides/test-contracts#using-the-gas-reporter) 插件，可以根据测试的执行情况，获得 gas 使用量的指标。这有利于性能调优。

`REPORT_GAS=true npx hardhat test`

### 并行测试

还可以并行执行测试 `npm hardhat test --parallel`

### VSCode 集成

可以使用 [Mocha Test Explorer](https://marketplace.visualstudio.com/items?itemName=hbenl.vscode-mocha-test-adapter) 直接从 Visual Studio Code 运行测试。[^1]

## Deploy

## Verify Contract {#verify}

[以太坊如何合约验证]({{< ref "../contract/verify" >}}) 全面介绍了以太坊合约验证的具体细节。

使用 Hardhat 验证合约是一件非常方便的事情，部署完成后，通过命令行即可验证：

`npx hardhat verify --network <network> <address> [constructArguments]`

[hardhat-etherscan](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan) 插件更进一步，将验证自动化：

- 只要提供部署地址和构造参数，该插件就会在本地检测出要验证的合约。
- 如果合约使用 Solidity 库，该插件将检测并自动处理它们，开发者不需要对它们做任何事（比如 Etherscan 或者 Remix 需要手动 Flat 合约代码）。
- 验证过程的模拟将在本地运行，插件将检测和发现此过程中的任何错误。
- 一旦模拟成功，合约将使用 Etherscan API 进行验证。

通过该插件，我们还可以在定制的网络上进行合约验证，参见 [Adding support for other networks](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan#adding-support-for-other-networks)

还可以在脚本中执行，要从 Hardhat 任务或脚本中调用验证任务，需要使用“verify:verify”子任务，下面是一个封装好合约验证函数，可以在合约部署完成后调用：

{{< gist phenix3443 dc2fc3e23966d8a4e37b35e30006115f >}}

## tasks & scripts

通过 `subtask` 来组织结构复杂的 task。

## console

console 的执行环境与任务、脚本和测试是一样的。这意味着 `hardhat config` 已被处理，`hre` 已被初始化并注入全局范围。

与 Ethereum 网络互动，都是异步操作。因此，大多数 API 和库使用 JavaScript 的 Promise 来返回值。

为了使事情变得更容易，Hardhat 的控制台支持顶级的 `await` 语句（例如，`console.log(await ethers.getSigners())`）。

## 命令行补全 [^5]

Hardhat 有一个配套的 npm 包 (`hardhat-shorthand`)， 作为 npx hardhat 的简写 (`hh`)，同时，它可以在你的终端中实现命令行补全。可以将其全局安装，运行本地安装的 hardhat。

`npm install --global hardhat-shorthand`

## 参考

[^1]: [Running tests in Visual Studio Code](https://hardhat.org/hardhat-runner/docs/advanced/vscode-tests)
[^2]: [hardhat network](https://hardhat.org/hardhat-network/docs/overview)
[^3]: [fork other net](https://hardhat.org/hardhat-network/docs/guides/forking-other-networks)
[^4]: [hardhat config](https://hardhat.org/hardhat-runner/docs/config)
[^5]: [Command-line completion](https://hardhat.org/hardhat-runner/docs/guides/command-line-completion)
