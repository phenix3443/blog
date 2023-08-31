---
title: Taiko Protocol
description: Taiko 合约解析
slug: taiko-protocol
date: 2023-08-25T15:31:15+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
series:
  - Taiko 源码解析
categories: [ethereum]
tags: [taiko, rollup]
images: []
---

本文解析 Taiko 代码，主要针对：

- [taiko-protocol](https://github.com/taikoxyz/taiko-mono/tree/main/packages/protocol)，当前版本`commit 85bef055c8778a473fff41318b06792c151efa52`。
- [taiko-client](https://github.com/taikoxyz/taiko-client) , 当前版本`commit:28ea4dbb658a7e708ffb7bc54a194a29d7013f18`
<!--more-->

## 概述

taiko 是一个基于以太坊的安全的、去中心化的 zkRollup 实现。

zkRollup 核心逻辑：

- 将所有重建 L2 状态的数据都放在了 L1 上，并通过零知识证明（zk） 来验证这些数据在 L2 的正确性。
- L2 可以通过 L1 的数据来重建自身状态。

### 核心逻辑

在 Taiko 中，L1 将 L2 的 txlist(transaction list) 抽象为 TaikoBlock 存储 TaikoL1 合约中，TaikoBlock 与以太坊的 Block 完全不同的概念，二者完全没有任何可比性，不可混淆。

proposed txlist 在 TaikoL1 对应一个 TaikoBlock，并且其 ID 是递增的，这是 TaikoL1 中规定的，并且所有的 TaikoBlock 生成后不可改变（除非 L1 reorg）。

TaikoBlock 有三种状态：

- proposed

  proposed txlist 对应一个 proposedBlock。当一个 proposedBlock 生成后， L2 的下一个 Block 也就确定了，这是因为：

  - TaikoBlock 是不变的，基于以太坊的特性，所有 taiko-client(proposer、driver、prover) 看到的 L1 的状态是一致的。
  - proposer 在 propose txlist 前，其连接的 L2 与 L1 必须同步（官方实现）：`L2.LatestBlock.TaikoBlockID == TaikoL1.LatestProposedBlockID`，这是为了避免 propose 无效的 txlist。但是如果有的 proposer 实现没这么做会有什么问题？假设 propose 错误的 txlist 到 L1，driver 在生成新的 L2 Block 前会对检查和过滤 txlist，如果所有 transactions 都非法，那么就在 L2 提交一个只有 anchorTx 的 Block。

- proved

  当 proposedBlock 被 prover 证明了其在 L2 的正确性后，就转变为 provedBlock。

  由于 TaikoBlock 是不可变的，所以 proposedBlock 的 prove 工作可以并行执行，这加快了 txlist 的验证速度。

- verified

  如果 provedBlock 的所有父块都已经 proved，就会转变为 verifiedBlock。

## 数据流

![数据流图](images/dataflow.drawio.svg)

### proposeBlock

propose txlist 到 TaikoL1，并触发 BlockProposedEvent。

### 有效性检查

proposedBlock 有 [两个部分](https://taiko.xyz/docs/concepts/proposing#intrinsic-validity-functions)：

- block metadata
- txlist（存储在一个 blob 中，BlockMetadata 存储该 blob 的哈希值）

我们将 proposedBlock 的有效性检查分为两部分：

- metadataCheck
- txListCheck

proposedBlock 必须通过这两项检查，才能将 txList 映射到 Taiko 上的 L2 区块。如果一个 proposedBlock 通过了 metadataCheck，但随后却未能通过 txlistCheck，那么将创建一个只有 anchorTx 的区块。

### createL2lBlock
  
监听到 blockProposedEvent 后，从 proposeBlock tx 的 calldata 解析出 txlist，然后通过 forkChoiceUpdate 更新 L2 上的区块。

检查 txlist 有效性：

- 如果 txlist 中的每笔交易都是有效的，则会跳过 nonce 无效或发送方以太币余额太少无法支付交易的交易，创建 txlist 的有序子集。该有序子集与锚 anchorTx 一起用于创建 taiko L2 Block。
- 如果 txlist 中的所有交易无效，则会在 L2 上创建一个只有 anchorTx 的 Block。

#### anchorTx

[anchorTx](https://taiko.xyz/docs/concepts/proposing#anchor-transaction) 必须是 Taiko 区块中的第一笔交易（这对于使区块具有确定性非常重要）。锚事务目前的使用方法如下：

### proveBlock
  
监听到 L2 上的 NewBlockEvent，然后获取相关数据做验证。
  
### verifyBlock

TaikoL1 内部自行触发 verifyBlock.

## 部署

## 地址管理

AddressManger 与 AddressResolver 搭配使用，实现了类似 ens 的作用，避免硬编码调用合约的地址。

AddressManger 在私有状态变量 [addresses](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/common/AddressManager.sol#L44) 中保存了链上合约到部署地址之间的映射：

```solidity
mapping(uint256 chainID=> mapping(bytes32 name => address)) private addresses;
```

![AddressManger](images/AddressManager.png)

AddressResolver 则会通过 [resolve](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/common/AddressResolver.sol#L91) 方法对外提供 name 到 address 的解析。同时，该合约通过 [EssentialContract](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/common/EssentialContract.sol#L18) 被其他合约继承。

![AddressResolver](images/AddressResolver.png)

## TaikoToken

L1 上部署的 [TaikoToken](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/L1/TaikoToken.sol#L35) 是一个 ERC20 代币合约，可以用于充值和提现，主要用于质押。

## HorseToken && BullToken

L1 上部署的两个 ERC20 代币，可用于 swap。

## TaikoL1

### Block

{{< gist phenix3443 96dd996bf97b53173ad142681f5c5551 >}}

> 注意：此处的 Block 不同于 layer-1/layer-2 的 ethereum block 。blockId 也不等同于 ethereum block number。每次成功 propose layer-2 交易都会产生一个新的 taiko block，并记录在 TaikoL1.state.block 中。

### State

Taiko Rollup 的核心逻辑位于 [TaikoL1](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/L1/TaikoL1.sol#L31) 中。

状态变量 [TaikoData.State](https://github.com/taikoxyz/taiko-mono/blob/1ff0b7a3be7871038714dcff7a40f0ddb26a1578/packages/protocol/contracts/L1/TaikoData.sol#L186-L219) [state](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/L1/TaikoL1.sol#L37) 保存合约运行信息：

{{< gist phenix3443 d6768c44f2949306866bd5d764fa946f >}}

- `blocks` 保存了 proposed/proved/verified [block]({{< ref "#block" >}})，可以将这个字段理解为数组实现的循环队列，这个队列的状态可能如下：队列头部是最近的 verified blocks，然后是可能存在 proved blocks，然后是可能存在 proposed blocks。

该变量在 [LibVerifying.init](https://github.com/taikoxyz/taiko-mono/blob/85bef055c8778a473fff41318b06792c151efa52/packages/protocol/contracts/L1/libs/LibVerifying.sol#L72-L93) 中初始化。

![TaikoL1](images/TaikoL1.svg)

从上图中可以看出：`TaikoL1.sol` 主要封装了对外接口，内部实现都是位于在对应的库合约（LibContract）中。

### Block

### 充值提现

- depositTaikoToken
- withdrawTaikoToken
- depositEtherToL2
- canDepositEthToL2

### Rollup

#### proposeBlock

{{< gist phenix3443 b9faaa2848c620f077c8ae88c2f2f4eb >}}

- 将 L2 txlist 封装为 block，放入 TaikoL1.state.blocks 中。

假设当前 propose 第一个 block：

#### proverBlock

{{< gist phenix3443 fb6ea630910c6244d397ce265d624b6e >}}

#### verifyBlock

### getVerifierName

### 查询链状态

- getBlock
- getBlockFee
- getForkChoice
- getStateVariables
- getConfig

### 跨链消息

- getCrossChainBlockHash
- getCrossChainSignalRoot

## SignalService

1. 是在 taikoL1 前面部署的？因为地址被作为参数传递给 taikoL1 部署脚本。
