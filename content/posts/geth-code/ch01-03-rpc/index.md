---
title: "Ethereum JSON RPC"
description: Geth 中的 JSON RPC 接口
date: 2022-05-23T08:56:34+08:00
slug: geth-rpc
image:
math:
license:
hidden: false
comments: true
draft: true
series:
  - 以太坊情景分析
categories: [ethereum]
tags: [geth,debug,rpc]
---

## 概述

[JSON-RPC](https://ethereum.org/en/developers/docs/apis/json-rpc/) 本文我们来分析如何在 Geth 中自定义 JSON RPC 接口并对外提供访问。

之前我们已经 [介绍]({{< ref "../ch01-01-develop-environment" >}}) 过如何借助 [vscode debugging](https://code.visualstudio.com/docs/editor/debugging) 功能 以及 geth 的开发者模式来搭建调试环境，本次依旧使用这种环境。

## 共识层 API

[Beacon API webpage](https://ethereum.github.io/beacon-APIs/#/)

## 执行层 API

[JSON-RPC API spec](https://github.com/ethereum/execution-apis)

## 订阅事件
