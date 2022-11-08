---
title: "optimism block sync"
description: sync in optimism
date: 2022-11-07T17:27:25+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

## 网络[^1]

执行引擎可以通过 rollup node 从 L1 获取所有数据，所以 P2P 网络是可选的。

但是，为了不让 L1 数据检索速度成为瓶颈，应该启用 P2P 网络功能，服务于：

+ 对等节点发现 ([Disc v5](https://github.com/ethereum/devp2p/blob/master/discv5/discv5.md))
+ [eth/66](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)：
  + 交易池（由 `sequencer` 节点消耗）。
  + 状态同步（Happy-path 进行快速无信任数据库复制）。
  + 历史区块头和主体检索。
  + 通过共识层获取的新块（`rollup node`）。

无需修改 L1 网络功能，除了配置：

+ networkID ：将 L2 网络与 L1 和测试网区分开来。 等于 rollup 网络的 chainID。
+ 激活合并分叉：启用引擎 API 并禁用块的传播，因为没有共识层就无法验证块头。
+ `Bootnode` 列表：DiscV5 是一个共享网络，通过先连接 L2 节点，bootstrap 更快。

## 同步[^1]

执行引擎可以以不同的方式操作同步：

+ Happy-path：rollup 节点将 L1 确定的所需链头通知引擎，通过引擎 P2P 完成。
+ Worst-case：rollup 节点检测到停止的引擎，完全从 L1 数据完成同步，不需要对等节点。

happy-path 更适合让新节点快速上线，因为引擎实现可以通过 snap-sync 等方法更快地同步状态。

### Happy-path 同步

1. rollup 节点无条件地通知引擎 L2 链头（常规节点操作的一部分）：
   + 使用从 L1 派生的最新 L2 块调用 engine_newPayloadV1。
   + engine_forkchoiceUpdatedV1 使用当前不安全/安全/最终的 L2 块哈希调用。
2. 引擎反向请求对等 peer 的区块头，直到父哈希与本地链匹配。
3. 引擎赶上：a) 一种形式的状态同步被激活到最终或头块哈希 b) 一种形式的块同步将块体和进程拉向头块哈希。

基于 P2P 的精确同步超出了 L2 规范的范围：引擎内的操作与 L1 完全相同（尽管使用支持存款的 EVM）。

### Worst-case 同步

1. 由于其他原因，引擎停止、不同步，没有对等 peers。
2. rollup 节点维护来自引擎的最新头（轮询 eth_getBlockByNumber 和/或维护头订阅）
3. 如果引擎不同步但未通过 P2P (eth_syncing) 同步，则`rollup node`激活同步
4. rollup 节点插入从 L1 派生的块，可能会适应 L1 重组，正如如 [rollup 节点规范](https://github.com/ethereum-optimism/optimism/blob/4abae6184aae5957aeef2a0798da32c04645d745/specs/rollup-node.md)（engine_forkchoiceUpdatedV1，engine_newPayloadV1）中所述。

[^1]: https://github.com/ethereum-optimism/optimism/blob/4abae6184aae5957aeef2a0798da32c04645d745/specs/exec-engine.md#sync

## 问题

1. 充值提现交易要怎么处理？是像 op 一样新增一种交易类型么？
2.
