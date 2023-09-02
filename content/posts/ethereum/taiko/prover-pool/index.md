---
title: ProverPool
description:
slug: prover-pool
date: 2023-08-29T16:31:42+08:00
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

本文介绍 TaikoL1 中的 ProverPool 。

<!--more-->

## 概述

[ProverPool](https://github.com/taikoxyz/taiko-mono/blob/06ac4f015ca252e60bc6863a3154e9c22668893b/packages/protocol/contracts/L1/ProverPool.sol#L18) 保存了已经完成质押的 Prover，[TaikoL1]({{< ref "#TaikoL1" >}}) 会从中选择 prover 来验证 propose 到 L1 的 L2 Block。

> todo: 本文需要等待代码更新。

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
    uint64 exitAmount; // 退出质押时候可提现的 token
    uint32 maxCapacity;
    uint32 proverId; // 0 to indicate the staker is not a top prover
    // 上面这行的意思是：因为 uint32 的默认值是 0，所以 provers 中的存储是从 ID=1 开始的。
}

uint256 public constant MAX_NUM_PROVERS = 32;

// Reserve more slots than necessary
Prover[1024] public provers; // 保存完成质押的 prover
// Save the weights only when: stake / unstaked / slashed
mapping(address staker => Staker) public stakers; // 保存质押者的信息
```

### stake

如果想要质押，质押数额必须大于 provers 中的 [最低质押值](https://github.com/taikoxyz/taiko-mono/blob/dfd23ca7de7cba179841603bd92ebc81b45949fb/packages/protocol/contracts/L1/ProverPool.sol#L328-L336) ，这里用简单的代码实现了一个单调栈的更新，挺巧妙的。

如果第一个质押者质押了大量的 token，提高了新的 prover 进入的门槛，可能会出现以下问题：

- 最终可能很难有足够的 prover？
- 如果只有少数的几个 prover，也可能会导致中心化？

### assignProver

TaikoL1 从完成质押的 Provers 中结合 [权重](https://github.com/taikoxyz/taiko-mono/blob/06ac4f015ca252e60bc6863a3154e9c22668893b/packages/protocol/contracts/L1/ProverPool.sol#L264) 和 [一定的随机性](https://github.com/taikoxyz/taiko-mono/blob/06ac4f015ca252e60bc6863a3154e9c22668893b/packages/protocol/contracts/L1/ProverPool.sol#L106) [选择](https://github.com/taikoxyz/taiko-mono/blob/06ac4f015ca252e60bc6863a3154e9c22668893b/packages/protocol/contracts/L1/ProverPool.sol#L442) prover 来证明 L1 块有效性。

### releaseProver

prover 在完整证明后会被 [释放 capacity](https://github.com/taikoxyz/taiko-mono/blob/06ac4f015ca252e60bc6863a3154e9c22668893b/packages/protocol/contracts/L1/ProverPool.sol#L127)，以提高下次 assignProver 时的权重。

### slashProver

如果选中的 prover 没有及时完成证明，会通过 [燃烧其 exitAmount 或者质押的 token](https://github.com/taikoxyz/taiko-mono/blob/06ac4f015ca252e60bc6863a3154e9c22668893b/packages/protocol/contracts/L1/ProverPool.sol#L160-L172) 来对其惩罚。
