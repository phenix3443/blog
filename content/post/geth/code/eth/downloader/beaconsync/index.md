---
title: "beacon-sync"
description: Geth 源码解析：downloader-beacon-sync
slug: geth-downloader-beaconsync
date: 2022-11-06T22:44:20+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - geth
  - 源码分析
tags:
  - downloader
---

## beaconBackfiller

一旦`skeleton syncer`成功将所有区块头反向下载到创世块或数据库中现有的区块头，[beaconBackfiller](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L34) 就开始回填链和状态。 它的操作完全由`skeleton syncer`的头/尾事件指导。

[suspend](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L54)取消所有后台下载线程并返回最后一个成功回填的标头。
