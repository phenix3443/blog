---
title: "Build Private Network"
description: 利用 Geth 搭建私链
date: 2022-09-15T23:19:15+08:00
slug: geth-build-private-network
math:
license:
hidden: false
comments: true
draft: false
series:
  - 以太坊情景分析
categories: [ethereum]
tags: [geth]
---

## 概述

我们可以通过搭建 [私有网络](https://geth.ethereum.org/docs/fundamentals/private-network) 来进行测试功能。

## Genesis Block

每个区块链都从创世区块（genesis block）开始。当 Geth 首次以默认设置运行时，它会将 Mainnet 创世区块提交到数据库。对于私有网络，通常更倾向于使用不同的创世区块。创世区块是通过一个 genesis.json 文件配置的，其路径必须在启动 Geth 时提供。

在创建创世区块时，必须定义私有区块链的一些初始参数：

- 以太坊平台在启动时启用的功能。一旦区块链开始运行，启用和禁用功能就需要安排硬分叉。

- 初始区块 gas 限制。这影响了单个区块内可以进行多少 EVM 计算。通常来说，模仿主以太坊网络是一个不错的选择。区块 gas 限制可以在启动后使用`--miner.gastarget` 命令行标志进行调整。

- 初始以太币的分配。这决定了创世区块中列出的地址可用的以太币数量。随着链的发展，可以通过挖矿创建更多的以太币。

以下是一个用于 PoA 网络的 genesis.json 文件的示例：

{{< gist phenix3443 85170fcfb5a8bc1755899c4a241eb347 >}}

- Clique 用作共识算法。虽然主网络使用权益证明（PoS）来保护区块链，由于 PoA 更便于测试，所以我们使用 Clique 作为测试网络的共识算法。
- Clique 中只有被授权的“签名者”才能创建新的区块。初始的授权签名者必须通过 extradata 字段配置。

  签名者账户密钥可以通过使用 geth 账户命令生成（此命令可以运行多次以创建多个签名者密钥）。

  ```shell
  geth account new --datadir data
  ```

  记录下此命令打印的以太坊地址，将 32 个零字节、所有签名者地址和另外 65 个零字节连接起来，然后，将此连接的结果用作 extradata 键的值。

- `period`配置选项设定了链的目标区块时间。

## Init Chain

初始化区块链：

```shell
make geth
./build/bin/geth init --datadir data genesis.json
```

## Start Chain

```shell
./build/bin/geth  --datadir data --http --http.api eth,web3,net
```

连接控制台：

```shell
geth attach http://127.0.0.1:8545
```
