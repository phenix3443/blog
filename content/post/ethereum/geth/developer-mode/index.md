---
title: Geth Developer mode
description: 使用 Geth developer mode 辅助开发
slug: geth-developer-mode
date: 2022-08-18T16:05:26+08:00
math:
license:
hidden: false
comments: true
draft: true
tag:
  - geth
  - ethereum
---

如果更改客户端后可以快速部署和测试，但不会将真实用户或资产置于风险的环境中，这无疑会极大方便开发人员。为此，Geth 有一个`--dev`标志，可以在“开发者模式”下启动 Geth。这将创建一个与任何外部对等点没有连接的单节点以太坊测试网络。它仅存在于本地机器上。在开发者模式下启动 Geth 会执行以下操作：

- 使用测试创世块初始化数据目录。
- 将 max peers 设置为 0（意味着 Geth 不搜索对等点）。
- 关闭其他节点的发现（意味着该节点对其他节点不可见）。
- 将 gas 价格设置为 0（发送交易无需费用）。
- 使用 Clique proof-of-authority 共识引擎，允许按需挖掘区块，而不会消耗过多的 CPU 和内存。
- 使用按需块生成，在交易等待被挖掘时生成块。

这种配置使开发人员能够试验 Geth 的源代码或开发新的应用程序，而无需同步到预先存在的公共网络。只有在有待处理的交易时才会挖掘块。开发人员可以在不影响其他用户的情况下更改此网络上的内容。本文将演示如何启动本地 Geth 测试网，并将使用 Remix 在线集成开发环境 (IDE) 部署一个简单的智能合约。

## 启动 Geth

可以通过设置`--dev.period 13`来创建实际的出块频率，而不是仅在交易 pending 时创建块。

首先，必须启用 http（或 ws），以便 Javascript 控制台可以附加到 Geth 节点，并且必须指定一些命名空间，以便可以从 Javascript 控制台执行某些功能，特别是`eth`、`web3`和`personal`。也可以使用`console`命令启动 Geth。

最后，使用 Remix 将智能合约部署到节点，该节点需要将信息从外部交换到 Geth 自己的域。 为此，必须启用 net 命名空间，并且必须将 Remix URL 提供给`--http.corsdomain`。 完整的命令如下：

`geth --dev --http --http.api eth,web3,personal,net --http.corsdomain "http://remix.ethereum.org"`

连接控制台：`geth attach http://127.0.0.1:8545`

尽管尚未明确创建帐户，但包含单个地址的数组将显示在终端中。 这是“coinbase”账户。 coinbase 地址是本地网络创世时创建的以太币总量的接收者。 查询 coinbase 账户的以太币余额会返回一个非常大的数字。 coinbase 帐户可以作为 eth.accounts[0] 或 eth.coinbase 调用：

```shell
> eth.accounts
```

其他的使用示例例如部署智能合约可以参考：[Geth Developer mode](https://geth.ethereum.org/docs/getting-started/dev-mode)。

如果调试`txpool`，有时需要指定块打包间隔，可以使用`--dev.period`参数，单位 second。

`build/bin/geth --dev --dev.period 1000  --datadir dev-chain --http --http.api eth,web3,personal,net,txpool --http.corsdomain "http://remix.ethereum.org"`。
