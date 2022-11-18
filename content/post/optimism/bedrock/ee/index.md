---
title: "optimism execution engine"
description: optimism 源码分析：执行引擎
slug: op-ee
date: 2022-11-18T18:01:35+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tag:
    - ethereum
    - optimism
    - bedrock
---

## 引言[^1]

## Deposited transaction processing

### Deposited transaction boundaries

## Engine API

### engine_forkchoiceUpdatedV1

### Extended PayloadAttributesV1

### engine_newPayloadV1

No modifications to engine_newPayloadV1. Applies a L2 block to the engine state.

### engine_getPayloadV1

No modifications to engine_getPayloadV1. Retrieves a payload by ID, prepared by engine_forkchoiceUpdatedV1 when called with payloadAttributes.

## Networking

执行引擎可以通过 rollup node 从 L1 获取所有数据，所以 P2P 网络是可选的。

但是，为了不让 L1 数据检索速度成为瓶颈，应该启用 P2P 网络功能，服务于：

+ 对等节点发现 ([`Disc v5`](https://github.com/ethereum/devp2p/blob/master/discv5/discv5.md))
+ [`eth/66`](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)：
  + 交易池（由定序器节点消耗）。
  + 状态同步（Happy-path 进行快速无信任数据库复制）。
  + 历史区块头和主体检索。
  + 通过共识层获取的新块（`rollup node`）。

无需修改 L1 网络功能，除了配置：

+ `networkID`：将 L2 网络与 L1 和测试网区分开来。 等于 `rollup` 网络的 chainID。
+ 激活合并分叉：启用引擎 API 并禁用块传播，因为没有共识层就无法验证块头。
+ `Bootnode` 列表：DiscV5 是一个共享网络，通过 [bootstrap](https://github.com/ethereum/devp2p/blob/master/discv5/discv5-rationale.md) 先连接 L2 节点更快。

## 同步 {#sync}

执行引擎可通过不同的方式操作同步：

+ Happy-path：rollup 节点将 L1 确定的所需链头通知引擎，通过引擎 P2P 完成。
+ Worst-case：rollup 节点检测到停止的引擎，完全从 L1 数据完成同步，不需要对等节点。

happy-path 更适合让新节点快速上线，因为引擎实现可以通过 snap-sync 等方法更快地同步状态。

### Happy-path 同步 {#happy-path-sync}

1. rollup 节点无条件地通知引擎 L2 链头（常规节点操作的一部分）：
   + 使用从 L1 推导的最新 L2 块调用 `engine_newPayloadV1`。
   + 使用当前`unsafe/safe/finalized`的 L2 块哈希调用`engine_forkchoiceUpdatedV1`。
2. 引擎反向请求对等 peer 的区块头，直到父哈希与本地链匹配。
3. 两种情况说明引擎赶上：
   a) 某种形式的状态同步被激活，同步到到 finalized 或 head 块哈希。
   b) 某种形式的块同步将块体和进程拉向头块哈希。

基于 P2P 的精确同步超出了 L2 规范的范围：引擎内的操作与 L1 完全相同（尽管使用支持 deposit 的 EVM）。

### Worst-case 同步 {#worst-case-sync}

1. 由于其他原因，引擎停止同步，也没有对等 peers。
2. rollup 节点维护来自引擎的最新头（轮询 `eth_getBlockByNumber` 和/或维护头订阅）
3. 如果引擎需要同步但未通过 P2P (`eth_syncing`) 同步，则`rollup node`激活同步。
4. rollup 节点插入从 L1 推导的块，可能会处理 L1 重组，正如如 [rollup 节点规范]({{< ref "../rollup-node" >}})（`engine_forkchoiceUpdatedV1`，`engine_newPayloadV1`）中所述。

## 总结

[^1]: [execution engine spec](https://github.com/ethereum-optimism/optimism/blob/develop/specs/exec-engine.md)
