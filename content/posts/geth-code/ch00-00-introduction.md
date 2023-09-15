---
title: "以太坊设计与实现"
description: 以太坊设计、架构与源码分析
date: 2022-04-22T14:44:16+08:00
image: ethereum-arch-and-code.webp
math:
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

代码分析基于 [go-ethereum/v1.10.17](https://github.com/ethereum/go-ethereum/tree/v1.10.17)：

```sh
git clone git@github.com:ethereum/go-ethereum.git
git checkout v1.10.17
```

使用 [go-callvis](https://github.com/ofabry/go-callvis) 查看代码调用。

切换到源码目录，执行

```shell
go-callvis  github.com/taikochain/go-taiko/cmd/geth
```
