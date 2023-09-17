---
title: Geth Getting Started
description:
slug: geth-getting-started
date: 2023-09-15T22:22:53+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series:
  - 以太坊设计与实现
categories: [ethereum]
tags: [geth]
images: []
---

本文介绍 geth 的基本使用。

<!--more-->

## 概述

## 安装

官方有介绍 [多种方法安装 geth](https://geth.ethereum.org/docs/getting-started/installing-geth) ，由于我们是目的阅读源码，所以本地编译 Geth，以便后续的调试和代码走读。

```shell
git clone --depth=1 git@github.com:ethereum/go-ethereum.git
make geth
```

## 生成账户

使用 Clef 生成账户被认为是最佳实践，主要是因为它将用户的密钥管理从 Geth 中解耦，使其更加模块化和灵活。

Clef 的`newaccount`功能生成新账户，它接受一个参数--keystore，用于指示存储新生成的密钥的位置。在这个例子中，密钥库的位置是一个将自动创建的新目录：`data/keystore`

```shell
mkdir -p data/keystore && clef newaccount --keystore data/keystore
```

然后根据提示操作即可生成账号。

## 启动 Clef

Clef 使用保存在密钥库中的私钥来签署交易。因此 Clef 需要与 Geth 同时运行，以便两个程序之间可以进行通信。

以下命令在 Sepolia 上启动 Clef：

{{< gist phenix3443 f49bcc8dae62ec58e41d2320203419ee >}}

在整个教程过程中，这个终端应保持运行状态。

## 启动 Geth

以下命令启动 geth：

{{< gist phenix3443 fb30b9ec0304591cfd920d387103373e >}}

- `--sepolia`: 链接的网络是 Sepolia 以太坊测试网。
- `--datadir`: Geth 应保存区块链数据的地方。
- `--http` 标志。这启用了 `http-rpc` 服务器，允许外部程序通过发送 http 请求与 Geth 交互。默认情况下，http 服务器只在本地使用端口 8545 暴露：`localhost:8545`。
- `--authrpc.*` 为共识客户端授权。
- `--singer`: 将 Geth 指向 Clef。

执行上述命令将启动 Geth。仍需要有一个共识客户端，否则 Geth 将无法正确同步区块链。

## 启动共识客户端

有五种共识客户端可供选择，所有这些客户端都以相同的方式连接到 Geth。

- [Lighthouse](https://lighthouse-book.sigmaprime.io/): written in Rust
- [Nimbus](https://nimbus.team/): written in Nim
- [Prysm](https://docs.prylabs.network/docs/getting-started/): written in Go
- [Teku](https://pegasys.tech/teku): written in Java
- [Lodestar](https://lodestar.chainsafe.io/): written in Typescript

由于测试的时候 prysm 不能正常同步 sepolia checkpoint, 改用 lighthouse:

{{< gist phenix3443 8721f2057048c2864c355eb5ba534464 >}}

默认情况下，Geth 使用 snap-sync，它从共识客户端提供的的 header 顺序下载区块，而不是创世区块。它将数据保存在`data/geth/chaindata/`的文件中。一旦验证了`header`的顺序，Geth 在开始"状态修复"阶段更新新到达数据的状态之前，会下载区块体和状态数据。这一点可以通过打印到终端的日志来确认。终端中应该有一个快速增长的日志序列，其语法如下：

```shell
INFO [04-29][15:54:09.238] Looking for peers             peercount=2 tried=0 static=0
INFO [04-29][15:54:19.393] Imported new block headers    count=2 elapsed=1.127ms  number=996288  hash=09f1e3..718c47 age=13h9m5s
INFO [04-29][15:54:19:656] Imported new block receipts   count=698  elapsed=4.464ms number=994566 hash=56dc44..007c93 age=13h9m9s
This message will be displayed periodically until state healing has finished:
```

此消息将定期显示，直到状态恢复完成为止：

```shell
INFO [10-20|20:20:09.510] State heal in progress                   accounts=313,<309@17.95MiB> slots=363,<525@28.77MiB> codes=<7222@50.73MiB> nodes=49,616,<912@12.67GiB> pending=29805
```

当状态恢复完成后，节点将同步并准备好使用。

向 http 服务器发送一个空的 Curl 请求是确认服务器已经无问题启动的快速方法。在终端中运行以下命令：

```shell
curl <http://localhost:8545>
```

如果终端没有报告错误信息，那么一切都正常。

## 配置

## 账号

## 同步网络

## 控制台

Geth Javascript 控制台是可用的，而且大部分的 JSON-RPC API 将通过 web3js 或带有 json 负载的 HTTP 请求保持可用。这些选项在 Javascript 控制台页面上有更详细的解释。Javascript 控制台可以使用以下命令在一个单独的终端中启动（假设 Geth 的 IPC 文件保存在 datadir 中）：

```shell
geth attach datadir/geth.ipc
```
