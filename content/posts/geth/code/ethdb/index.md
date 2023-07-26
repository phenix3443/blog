---
title: "ethdb"
description:
date: 2022-10-28T16:22:17+08:00
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
  - ethdb
---

## 源码

[eth.New](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/backend.go#L130) 创建了数据库。

[node.OpenDatabaseWithFreezer](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/node/node.go#L714) 从节点的数据目录中打开一个具有给定名称的现有数据库（如果找不到以前的名称，则创建一个），还附加一个链冻结器，将古老的链数据从数据库移动到不可变的仅附加文件. 如果节点是临时节点，则返回内存数据库。

[^1]: [以太坊系列 - 数据存储(2) -- StateDB 机制与 MPT 树](https://blog.csdn.net/wcc19840827/article/details/88071144)
