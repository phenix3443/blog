---
title: "optimism specification: execution engine"
description: optimism 源码分析：执行引擎规范
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

本章概述了 L2（optimism） 在执行引擎方面相对于 L1 (ethereum）的修改、配置和使用。文中的引擎如果没有特殊说明都是指执行引擎。

## Deposited transaction processing

引擎接口使用 [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) 抽象出交易类型。

为了支持 rollup 功能，引擎实现了一种新的 deposit [交易类型](https://eips.ethereum.org/EIPS/eip-2718#transactions)，参阅 [deposit]({{< ref "../deposits" >}})。

这种类型的交易可以铸造 L2 ETH，运行 EVM，并在执行状态下将 L1 信息引入到相关的合约中。

### Deposited transaction boundaries

交易不能盲目信任，信任是通过认证建立的。 与其他交易类型不同，deposit 不通过签名进行验证：rollup 节点在引擎外部对其进行验证。

为了安全地处理 deposited transactions ，必须首先对 deposit 进行验证：

+ 通过受信任的引擎 API 直接获取（todo: how?）。
+ 部分同步到受信任的块哈希（通过先前的引擎 API 指令授信(todo: how?)）

绝不能消费交易池中 deposited transactions。deposits-only rollup 中可禁用交易池。

## Engine API

注意：[Engine API](https://github.com/ethereum/execution-apis/blob/769c53c94c4e487337ad0edea9ee0dce49c79bfa/src/engine/specification.md) 处于 alpha 阶段（v1.0.0-alpha.5）。可能会有细微的调整。

### engine_forkchoiceUpdatedV1

更新引擎认为是规范链的 L2 块（`forkchoiceState` 参数），并可选择启动块生成（`payloadAttributes`参数）。

在 rollup 中，forkchoice 更新的类型转换为：

+ `headBlockHash`: 规范链头部的块哈希。 在用户 JSON-RPC 中标记为 `"unsafe"`。 节点可以提前在带外应用 L2 块，然后在 L1 数据冲突时重新组织。
+ `safeBlockHash`: 规范链的块哈希，源自 L1 数据，不太可能重组（todo：为什么不太可能重组？L1 重组不可能么？）。
+ `finalizedBlockHash`: 不可逆区块哈希，匹配争议周期下边界（todo:什么是下边界，这里需要添加文献引用）。

为了支持 rollup 功能，`engine_forkchoiceUpdatedV1` 引入了一个向后兼容的更改：扩展的 `PayloadAttributesV1`。

### Extended PayloadAttributesV1

[PayloadAttributesV1](https://github.com/ethereum/execution-apis/blob/769c53c94c4e487337ad0edea9ee0dce49c79bfa/src/engine/specification.md#PayloadAttributesV1) 扩展为：

```html
PayloadAttributesV1: {
    timestamp: QUANTITY
    random: DATA (32 bytes)
    suggestedFeeRecipient: DATA (20 bytes)
    transactions: array of DATA
    noTxPool: bool
    gasLimit: QUANTITY or null
}
```

此处使用的类型表示法与[以太坊 JSON-RPC API 规范](https://github.com/ethereum/execution-apis)使用的 [HEX value encoding](https://eth.wiki/json-rpc/API#hex-value-encoding)一致，因为此结构需要通过 JSON-RPC 发送。`array` 指的是一个 JSON 数组。

`transactions`数组的每一项都是一个交易被编码后的字节列表：`TransactionType || TransactionPayload` 或 `LegacyTransaction`，如 [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) 中所定义。这相当于 [ExecutionPayloadV1](https://github.com/ethereum/execution-apis/blob/769c53c94c4e487337ad0edea9ee0dce49c79bfa/src/engine/specification.md#ExecutionPayloadV1) 中的`transactions`字段。

`transactions`字段是可选的：

+ 如果为空或缺失：引擎行为没有变化。定序器将（如果启用）通过使用交易池中的交易来构建区块。
+ 如果存在且非空：必须从这个确切的交易列表开始生成 payload。 [rollup driver]({{< ref "../rollup-node" >}}) 根据确定性的 L1 输入确定交易列表。

noTxPool 也是可选的，它扩展了交易含义：

+ 如果为 `false`，执行引擎可以在任何交易之后自由地将来自外部来源（例如 tx pool）的其他交易打包到有效负载中。这是 L1 节点实现的默认行为。
+ 如果为 `true`，执行引擎不得更改给定交易列表的任何内容。

如果存在`transactions`字段，引擎必须按顺序执行交易，如果处理交易时出错，则返回 `STATUS_INVALID`。如果所有交易都可以无误地执行，它必须返回 `STATUS_VALID`。注意：状态转换规则已被修改，因此 deposit 永远不会失败，所以如果 `engine_forkchoiceUpdatedV1` 返回 STATUS_INVALID，那是因为批处理交易无效。

`gasLimit` 是可选的，与 L1 兼容，但在用作 rollup 时需要。该字段会覆盖构建区块期间使用的 gaslimit。如果未指定为 rollup ，则返回 `STATUS_INVALID`。

### engine_newPayloadV1

没有改动 [engine_newPayloadV1](https://github.com/ethereum/execution-apis/blob/769c53c94c4e487337ad0edea9ee0dce49c79bfa/src/engine/specification.md#engine_newPayloadV1). 应用 L2 块到引擎状态.

### engine_getPayloadV1

没有改动 engine_getPayloadV1. 通过 ID 拿到 payload，ID 在使用 payloadAttributes 调用时由 engine_forkchoiceUpdatedV1 准备。

## Networking

执行引擎可以通过 rollup node 从 L1 获取所有数据，所以 P2P 网络是可选的。

但是，为了不让 L1 数据检索速度成为瓶颈，应该启用 P2P 网络功能，服务于：

+ 对等节点发现 ([Disc v5](https://github.com/ethereum/devp2p/blob/master/discv5/discv5.md))
+ [eth/66](https://github.com/ethereum/devp2p/blob/master/caps/eth.md)：
  + 交易池（由定序器节点消耗）。
  + 状态同步（Happy-path 进行快速无信任数据库复制）。
  + 历史区块头和主体检索。
  + 通过共识层（`rollup node`）获取的新块。

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
