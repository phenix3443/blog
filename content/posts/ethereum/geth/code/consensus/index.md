---
title: "geth Consensus 源码阅读"
description: Geth 源码解析：consensus
slug: get-consensus
date: 2022-08-22T21:59:04+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - geth
  - 源码分析
tags:
  - consensus
---

## 代码目录

[eth.New](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/backend.go#L144) 创建了共识引擎。