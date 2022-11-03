---
title: ""
description: 以太坊块数据结构分析
date: 2022-05-10T23:12:35+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

## Block 数据结构

以太坊的区块是由区块头、交易列表和叔区块三部分组成。

![block struct]()

其中区块头包含块区号、块哈希、父块哈希等信息，其中State Root、Transaction Root、Receipt Root分别代表了状态树、交易树和交易树的哈希。

除了创世块外，每个块都有父块，用Parent Hash连成一条区块链。如下图：


## Block 验证

区块链中有2类节点，全节点和轻节点，轻节点只会存储`block header`，所以轻节点如何才能校验账号是否合法呢？

[以太坊数据结构以及以太坊的 4 棵树](https://learnblockchain.cn/2020/01/27/7c1fcd777d7b)