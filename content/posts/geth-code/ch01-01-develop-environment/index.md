---
title: "Geth Develop Environment"
description: 构建 Geth 调试环境
date: 2022-09-19T23:19:15+08:00
slug: geth-develop-env
math:
license:
hidden: false
comments: true
draft: true
series:
  - 以太坊情景分析
categories: [ethereum]
tags: [geth]
---

## 开发者模式

Geth 通过`--dev`标志可以启动“开发者模式”。这将创建一个与外部隔离的单节点以太坊测试网络。它仅存在于本地机器上。该模式会执行以下操作：

- [使用测试创世块初始化数据目录](https://github.com/phenix3443/go-ethereum/blob/f52d18e6a1e5d7cdd9daa00e6432637559246ae0/cmd/utils/flags.go#L1871)。
- 将 max peers 设置为 0（意味着 Geth 不搜索对等点），关闭其他节点的发现（意味着该节点对其他节点不可见）。[代码](https://github.com/phenix3443/go-ethereum/blob/f52d18e6a1e5d7cdd9daa00e6432637559246ae0/cmd/utils/flags.go#L1402-L1409)
- 将 gas 价格 [设置为 1](https://github.com/phenix3443/go-ethereum/blob/f52d18e6a1e5d7cdd9daa00e6432637559246ae0/cmd/utils/flags.go#L1880)（发送交易无需费用）。
- 使用 [按需块生成](https://github.com/phenix3443/go-ethereum/blob/f52d18e6a1e5d7cdd9daa00e6432637559246ae0/eth/catalyst/simulated_beacon.go#L121-L128)（在交易等待被挖掘时生成块），也可以通过`--dev.period` （单位秒）执行出块间隔，这有利于一些调试场景（比如调试 txpool）。

本文将演示如何启动本地 Geth 测试网，利用 [foundry cast 工具]({{< ref "../../ethereum/foundry#cast" >}}) 进行测试。

## 测试账户

我们需要通过`--miner.etherbase`指明“coinbase”账户，否则，geth 会 [自行创建一个账号](https://github.com/phenix3443/go-ethereum/blob/f52d18e6a1e5d7cdd9daa00e6432637559246ae0/cmd/utils/flags.go#L1856)。

{{< gist phenix3443 0ce3fc921d6c2d0f53118524b8f7ae0b >}}

`create_keystore.sh` 脚本使用 [foundry anvil]({{< ref "../../ethereum/foundry#anvil" >}}) 自带的测试账号生成测试用的 `keystore` 文件。

## 启动 Geth

{{< gist phenix3443 08a796bbfccd49a5904bc21a58ac9f3a >}}

可以通过 geth 自带的 javascript console 连接控制台后可以执行一些相关的操作了。

## 解锁账户{#unlock}

测试中往往不止使用一个账号，默认情况下，Geth 中的账户是“锁定 (locked)”的，这意味着无法从中发送交易。我们需要解锁账户才能通过 Geth 直接或通过 RPC 发送交易。为了解锁一个账户，需要提供密码，该密码用于解密与账户相关联的私钥，从而允许签署交易。

那么，如何解锁一个账户呢？有几种不同的方法可以做到这一点：

- 在运行 Geth 时解锁账户。密码参数是可选的。如果你不提供，将会提示你输入密码。
  
  ```shell
  geth --unlock <YOUR_ACCOUNT_ADDRESS> --password <YOUR_PASSWORD>
  ```

- 通过 [clef](https://geth.ethereum.org/docs/fundamentals/account-management) 来解锁。

更好的方法是通过 [foundry cast 工具]({{< ref "../../ethereum/foundry#cast" >}}) 来进行相关的测试，要比 geth console 方便很多。

## VSCode

借助 [vscode Debug 功能](https://code.visualstudio.com/docs/editor/debugging) 了解程序的运行。为此我们需要一个 `launch.json` 文件。

{{< gist phenix3443 9295f08ae43c3fed788c4ee7419bfe2d >}}
