---
title: "geth 代码布局"
description: source code layout
date: 2022-05-10T23:19:15+08:00
slug: dioe-dev-env
math:
license:
hidden: false
comments: true
draft: true
series:
  - 以太坊设计与实现
categories: [ethereum]
tags: [geth]
---

## 架构

![geth architecture](images/architecture.drawio.svg)

## private network

[private network](https://geth.ethereum.org/docs/fundamentals/private-network)

启动：

```shell
./build/bin/geth init --datadir data genesis.json
./build/bin/geth  --datadir data --http --http.api eth,web3,net
```

连接控制台：`geth attach http://127.0.0.1:8545`

## vscode
