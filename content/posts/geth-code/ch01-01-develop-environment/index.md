---
title: "Geth Develop Environment"
description: 构建 geth 调试环境
date: 2022-09-15T23:19:15+08:00
slug: geth-develop-env
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
## 概述

之所以不使用 [Developer mode](https://geth.ethereum.org/docs/developers/dapp-developer/dev-mode) 是因为该模式下不方便指定有足够 eth 的测试账户，该模式随机生成测试账号，但是无法拿到私钥。

## vscode

借助 [vscode Debug 功能](https://code.visualstudio.com/docs/editor/debugging) 了解程序的运行。为此我们需要一个 `launch.json` 文件。

{{< gist phenix3443 9295f08ae43c3fed788c4ee7419bfe2d >}}
