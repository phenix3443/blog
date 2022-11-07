---
title: "Sync"
description:
date: 2022-11-07T17:27:25+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---


## 同步[^1]

执行引擎可以以不同的方式操作同步：

+ Happy-path：rollup 节点将 L1 确定的所需链头通知引擎，通过引擎 P2P 完成。
+ Worst-case：rollup 节点检测到停止的引擎，完全从 L1 数据完成同步，不需要对等节点。

happy-path 更适合让新节点快速上线，因为引擎实现可以通过 snap-sync 等方法更快地同步状态。

快乐路径同步
rollup 节点无条件地通知引擎 L2 链头（常规节点操作的一部分）：
使用从 L1 派生的最新 L2 块调用 engine_newPayloadV1。
engine_forkchoiceUpdatedV1 使用当前不安全/安全/最终的 L2 块哈希调用。
引擎反向请求对等方的标头，直到父哈希与本地链匹配
引擎赶上：a) 一种形式的状态同步被激活到最终或头块哈希 b) 一种形式的块同步将块体和进程拉向头块哈希
基于 P2P 的精确同步超出了 L2 规范的范围：引擎内的操作与 L1 完全相同（尽管使用支持存款的 EVM）。

最坏情况同步
由于其他原因，引擎不同步、未对等和/或停止。
汇总节点维护来自引擎的最新头（轮询 eth_getBlockByNumber 和/或维护头订阅）
如果引擎不同步但未通过 P2P (eth_syncing) 同步，则汇总节点激活同步
如汇总节点规范（engine_forkchoiceUpdatedV1，engine_newPayloadV1）中所述，汇总节点插入从 L1 派生的块，可能会适应 L1 重组

[^1]: https://github.com/ethereum-optimism/optimism/blob/4abae6184aae5957aeef2a0798da32c04645d745/specs/exec-engine.md#sync