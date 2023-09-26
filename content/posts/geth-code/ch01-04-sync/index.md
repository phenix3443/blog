---
title: Chain Syncing in Geth
description: Geth 中的区块同步
slug: geth-chain-syncing
date: 2023-09-26T00:24:09+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series:
  - 以太坊情景分析
categories: [ethereum]
tags: [geth,sync]
---

## 概述

本文介绍 geth 中的区块同步。

## 同步模式{#sync_mode}

Geth 客户端共有三种同步模式`snap`,`full`和`light`，默认是`snap`（前身为`fast`），可以通过命令行参数`--syncmode value` 进行指定。

- snap：同步所有的区块头、区块体和状态数据，但不对区块中的交易进行重放以生成状态数据，只会在后期对区块中的数据（包括交易）进行校验。
- full：同步所有的区块头，区块体，并重放区块中的交易以生成状态数据。所有区块和区块中的交易都会被逐一验证。
- light：同步所有区块头，不同步区块体和状态数据，仅在需要时从网络上其他节点处获取。不会主动进行校验（仅在读取时进行哈希校验）。

### 快照同步{#snap_sync}

快照同步的节点在内存中保存最近的 128 个块状态(`block state`)，因此可以快速访问该范围内的交易。但是，快照同步仅从相对较新的块开始处理（不同于完整节点从创世块同步）。在初始同步块和最近的 128 个块之间，节点存储偶尔的检查点(`checkpoint`)，可用于即时重建状态。这意味着交易可以追溯到用于初始同步的块。跟踪单个交易需要重新执行同一块中的所有先前交易以及所有先前块中的所有先前存储的快照(`snapshot`)。因此，快照同步的节点是完整节点，唯一的区别是初始同步需要一个检查点块来同步，而不是从创世开始一直独立验证链。然后，快照同步仅验证工作量证明和祖先-子块进展(`ancestor-child block progression`)，并假设状态转换是正确的，而不是重新执行每个块中的交易来验证状态更改。快照同步比逐块同步快得多。启动节点时通过`--syncmode snap` 来开启。

快照同步首先下载一部分区块头部。一旦验证了区块头部，就会下载这些块的`body`和收据(`receipt`)。同时，Geth 也同步开始状态同步(`state-sync`)。在状态同步中，Geth 首先下载每个块的状态树的叶子，没有中间节点(`intermediate nodes`)以及范围证明(`range proof`?什么是范围证明)。然后在本地重新生成状态树(`state trie`)。状态下载是快照同步中完成时间最长的部分，可以使用日志消息中的 ETA 值监控进度。但是，区块链也在同时进步，使部分再生状态数据失效。这意味着还需要有一个修复状态错误的“修复”阶段(`healing phase`)。无法监视状态修复的进度，因为在当前状态已经重新生成之前无法知道错误的程度。

Geth 在状态修复期间定期报告`Syncing, state heal in progress`,这会通知用户状态修复尚未完成。也可以使用`eth.syncing`确认这一点：如果此命令返回 false，则节点处于同步状态。如果它返回 false 以外的任何内容，则同步仍在进行中。

```html
# this log message indicates that state healing is still in progress INFO
[10-20|20:20:09.510] State heal in progress accounts=313,309@17.95MiB
slots=363,525@28.77MiB codes=7222@50.73MiB nodes=49,616,912@12.67GiB
pending=29805
```

```html
# this indicates that the node is in sync, any other response indicates that
syncing has not finished eth.syncing >> false
```

修复速度必须超过区块链的增长速度，否则节点将永远赶不上当前状态。 有一些硬件因素决定了状态修复的速度（磁盘读/写和互联网连接的速度）以及每个块中使用的总 gas（更多的 gas 意味着必须处理更多的状态变化）。

总而言之，快照同步按以下顺序进行：

- 下载并验证标头。
- 下载块体和收据。同时，下载原始状态数据并构建状态树。
- 修复状态试图解释新到达的数据。

注意：快照同步是默认行为，因此如果在启动时没有将 `--syncmode` 值传递给 Geth，Geth 将使用快照同步。 使用 snap 启动的节点一旦赶上链的头部，就会切换到逐块同步。

### 完全同步{#full_sync}

完全同步通过执行从创世块开始的每个块来生成当前状态。完全同步通过重新执行整个历史区块序列中的交易来独立地验证工作量证明和区块出处以及所有状态转换。只有最近的 128 个块状态存储在全节点中，较旧的块状态会定期修剪并表示为一系列检查点，可以根据请求从这些检查点重新生成任何先前的状态。 128 个区块大约是 25.6 分钟的历史，区块时间为 12 秒。要创建一个完全同步的节点，请在启动时传递`--syncmode full`。

在完全同步模式下，同步模块调用`BlockChain.InsertChain`向数据库中插入从别它节点获取到的区块数据。而在`BlockChain.InsertChain`中，会逐个计算和验证每个块的`state`和`receipts`等数据，如果一切正常就将同步而来的区块数据以及自己计算得到的 state、receipts 数据一起写入到数据库中。

## 延伸阅读

- [Geth v1.10.0](https://blog.ethereum.org/2021/03/03/geth-v1-10-0)
