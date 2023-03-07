---
title: "Geth Pieces"
description: Geth 拾遗
slug: geth-pieces
date: 2022-08-18T15:05:26+08:00
math:
license:
hidden: false
comments: true
draft: false
categories:
  - geth
  - 源码分析
tags:
---

所有内容来自 [Geth Documentation](https://geth.ethereum.org/docs/)，如果错漏，请以官方文档为准。

## 概述

[Geth](https://geth.ethereum.org/) 是以太坊协议的官方 Go 实现，可以用作以太坊的独立客户端。

## 安装

- Mac`brew install ethereum`。

## 交互示例

可以参考 [Getting Started with Geth](https://geth.ethereum.org/docs/getting-started)。

## 主网(mainnet)

关于连接网络，更多可以参考[Connecting To The Network](https://geth.ethereum.org/docs/interface/peer-to-peer)。

## 测试网络(testnet)

- Görli: Proof-of-authority test network
- 专用网(private net)

连接`goerli`测试网络：`geth --goerli --syncmode "light" --http`，更多命令命令行参数参见 [Command-line Options](https://geth.ethereum.org/docs/interface/command-line-options)

## 可信节点

Geth 支持始终允许重新连接的受信任节点，即使已达到对等限制。它们可以通过配置文件`<datadir>/geth/trusted-nodes.json`永久添加，也可以通过 RPC 调用临时添加。配置文件的格式与用于静态节点的格式相同。可以通过 js 控制台使用`admin.addTrustedPeer()`RPC 调用添加节点，并使用`admin.removeTrustedPeer()`调用删除节点。

`admin.addTrustedPeer("enode://f4642fa65af50cfdea8fa7414a5def7bb7991478b768e296f5e4a54e8b995de102e0ceae2e826f293c481b5325f89be6d207b003382e18a8ecba66fbaf6416c0@33.4.2.1:30303")`

## Merge

以太坊 Merge 后应该如何接入网络参见 [Connecting to Consensus Clients](https://geth.ethereum.org/docs/interface/consensus-clients)。
