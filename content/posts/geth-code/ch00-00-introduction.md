---
title: "Ethereum Introduction"
description: 以太坊技术简介
slug: geth-introduction
date: 2022-04-22T14:44:16+08:00
image: 
math: false
license:
hidden: false
comments: true
draft: true
series:
  - 以太坊设计与实现
categories:
  - ethereum
tags:
  - geth
---

本文介绍以太坊的基本概念。
<!-- more -->
## 概述

以太坊是一个点对点网络，信息直接在节点之间共享，而不是由中央服务器管理。每 12 秒，随机选择一个节点生成一个包含节点接收块应执行的交易列表的新块。这个"区块提议者"节点将新块发送给其同伴。收到新块后，每个节点都会检查它是否有效，并将其添加到他们的数据库中。这个离散块的序列被称为"区块链"。

## 区块

## 区块链

## 账户

Ethereum 上每个账户的以太币余额以及每个智能合约存储的数据。账户有两种类型：外部拥有的账户（EOAs）和合约账户。

合约账户在接收交易时执行合约代码。EOAs 是用户在本地管理以签署和提交交易的账户。每个 EOA 都是一个公私钥对，其中公钥用于为用户生成一个独特的地址，私钥用于保护账户并安全地签署消息。因此，要使用 Ethereum，首先需要生成一个 EOA（以下简称"账户"）。

## 世界状态

每个区块中提供的信息被 Geth 用来更新其"状态"

## Merge

## Geth

[Geth](https://geth.ethereum.org) 是以太坊协议的官方 Golang 执行层实现。

## 参考
