---
title: Geth Tutorial
description: 介绍以太坊官方客户端 Geth
slug: geth-tutorial
date: 2022-08-18T15:05:26+08:00
math:
license:
hidden: false
comments: true
draft: false
tags:
    - geth
    - 以太坊
---

所有内容来自 [Geth Documentation](https://geth.ethereum.org/docs/)，如果错漏，请以官方文档为准。

## 概述

[Geth](https://geth.ethereum.org/) 是以太坊协议的官方 Go 实现，可以用作以太坊的独立客户端。

## 安装

+ Mac `brew install ethereum`。

## 交互

可以参考 [Getting Started with Geth](https://geth.ethereum.org/docs/getting-started).

## 连接节点

为了与区块链交互，可以通过 `console` 或者 `attach` 命令使用 `Geth` 提供的 `Geth JavaScript` 控制台。 该控制台为提供了一个类似于 `node.js` 的 JavaScript 环境。

`console` 子命令先启动节点后打开控制台。 attach 子命令将控制台附加到已经运行的 geth 实例。

``` shell
geth attach /some/custom/path.ipc
geth attach http://191.168.1.1:8545
geth attach ws://191.168.1.1:8546
```

如果不想在控制台中显示 Geth 节点的打印日志（可能会干扰交互），可以 `geth console 2> /dev/null`。

默认情况下，geth 节点不会启动 HTTP 和 WebSocket 服务器，并且出于安全原因，并非所有功能都通过这些接口提供。 这些默认值可以在 geth 节点启动时被 `--http.api` 和 `--ws.api` 参数覆盖，或者被 `admin.startRPC` 和 `admin.startWS` 覆盖。

+ IPC（进程间通信）：无限制访问所有 API ，但仅在运行 geth 节点的主机上使用控制台时才有效。
+ HTTP：只能访问 eth、web3 和 net 方法命名空间。 可以通过 CURL 方式进行访问：

``` shell
curl -X POST http://127.0.0.1:8545 \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0", "method":"eth_getBalance", "params":["0xca57f3b40b42fcce3c37b8d18adbca5260ca72ec","latest"], "id":1}'
```

## 主网(mainnet)

## 测试网络(testnet)

+ Ropsten: Proof-of-work test network
+ Rinkeby: Proof-of-authority test network
+ Görli: Proof-of-authority test network
+ 专用网(private net)

连接 `goerli` 测试网络：`geth --goerli --syncmode "light" --http`，更多命令命令行参数参见 [Command-line Options](https://geth.ethereum.org/docs/interface/command-line-options)


## 可信节点

Geth 支持始终允许重新连接的受信任节点，即使已达到对等限制。它们可以通过配置文件 `<datadir>/geth/trusted-nodes.json` 永久添加，也可以通过 RPC 调用临时添加。配置文件的格式与用于静态节点的格式相同。可以通过 js 控制台使用 `admin.addTrustedPeer()` RPC 调用添加节点，并使用 `admin.removeTrustedPeer()` 调用删除节点。

`admin.addTrustedPeer("enode://f4642fa65af50cfdea8fa7414a5def7bb7991478b768e296f5e4a54e8b995de102e0ceae2e826f293c481b5325f89be6d207b003382e18a8ecba66fbaf6416c0@33.4.2.1:30303")`