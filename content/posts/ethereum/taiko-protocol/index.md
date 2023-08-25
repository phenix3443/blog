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

本文解析 [Taiko 合约](https://github.com/taikoxyz/taiko-mono)，当前版本`commit 279d4e96bf378eb651b91976d7729b0675ea1368`。

<!--more-->

## 概述

## [ProverPool](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L18)

### 数据结构

```solidity
/// @dev These values are used to compute the prover's rank (along with the
/// protocol feePerGas).
struct Prover {
    uint64 stakedAmount; // 质押时初始化为质押金额
    uint32 rewardPerGas; // 质押时初始化由质押者初始化，可以理解为其接受的 gasFee
    uint32 currentCapacity; // 质押时被初始化为 staker.maxCapacity。
}

/// @dev Make sure we only use one slot.
struct Staker {
    uint64 exitRequestedAt;
    uint64 exitAmount; // prover 退出时候可 withdraw 的 token
    uint32 maxCapacity;
    uint32 proverId; // 0 to indicate the staker is not a top prover
}

uint256 public constant MAX_NUM_PROVERS = 32;

// Reserve more slots than necessary
Prover[1024] public provers; // 保存完成质押的 prover
// Save the weights only when: stake / unstaked / slashed
mapping(address staker => Staker) public stakers; // 保存质押者的信息
```

### [stake](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L182)

如果想要质押，质押数额必须大于 provers 中的 [最低质押值](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L328-L336) ，这里用简单的代码实现了一个单调栈的更新，挺巧妙的。

如果第一个质押者质押了非常多的 token：

- 提高了 prover 门槛，可能很难有足够的 prover？
- 如果只有少数的几个 prover，也可能会导致中心化？

### [assignProver](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L92)

TaikoL1 从完成质押的 Provers 中集合 [权重](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L264) 和 [一定的随机性](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L106) [选择](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L442) prover 来证明 L1 块有效性。

### [releaseProver](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L121)

prover 在完整证明后会被释放（release）。

### [slashProver](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L136)

如果选中的 prover 没有及时完成证明，会通过燃烧其质押的 token 来对其惩罚。
