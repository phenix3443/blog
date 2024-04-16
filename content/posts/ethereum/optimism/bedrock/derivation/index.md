---
title: "optimism specification: derivation"
description: optimism 源码分析：derivation 规范
slug: op-derivation
date: 2022-11-21T18:01:25+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
  - optimism
tags:
  - bedrock
---

## 引言 [^1]

该文章还在写作中，关于如何派生这一块还有很多东西需要了解，可以先直接看下原文。

## Overview

> 请注意，以下内容假定单个定序器和批处理器（batcher）。将来，该设计将进行调整以容纳多个此类实体。

[L2 链推导 (chain derivation)](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-derivation)，即从 L1 数据推导 L2 块，是 rollup 节点的主要职责之一，无论是在验证器模式还是在定序器模式下（推导作为对定序的健全性检查，并能够检测 L1 链重组）.

L2 链源自 L1 链。具体而言，每个 L1 块都映射到包含多个 L2 块的 [L2 sequencing epoch](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#sequencing-epoch)。 epoch 编号被定义为等于相应的 L1 块编号。

为了在 epoch `E` 中导出 L2 块，我们需要以下输入：

- epoch `E` 的 [L1 sequencing window](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#sequencing-window)：即 `[E, E + SWS)` 范围内的 L1 块，其中`SWS`是定序窗口大小（请注意，这意味着 epoch 是重叠的（todo：为什么是重叠的？从范围来看是紧密连接的））。特别需要：
  - 定序窗口中包含的 [batcher transactions](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#batcher-transaction)。这使我们能够重建 [sequencer batches](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#sequencer-batch)，它包含了将要将要放入 L2 块中的交易（每个 batch 对应一个 L2 块）。
    - 请注意，在 L1 区块 E 上不可能有包含与 epoch E 相关的 batch 的 batcher transaction ，因为该 batch 必须包含 L1 区块 E 的哈希值。
  - 在 L1 区块 E 中进行的 deposits （以 deposits 合约发出的事件的形式）。
  - 来自 L1 区块 E 的 L1 区块属性（[用于产生 L1 attributes deposited transaction](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#l1-attributes-deposited-transaction）)。
- L2 链在 epoch `E-1` 的最后一个 L2 区块之后的状态，如果 epoch `E-1` 不存在需要 L2 创世状态。
  - 如果 `E <= L2CI`，则 epoch E 不存在，其中 L2CI 是 [L2 chain inception](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-inception)。

> TODO 指定定序窗口大小（目前的想法：大约几个小时，为批提交者提供最大的灵活性）

为了从头开始推导整个 L2 链，我们只需从 [L2 genesis state](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#l2-genesis-block) 开始，将 [L2 chain inception](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-inception) 作为第一个 epoch，然后按顺序处理所有定序窗口。有关我们如何在实践中实现这一点的更多信息，请参阅 [Architecture section]({{< ref "#architecture" >}})。

每个 epoch 可能包含数量不定的的 L2 块（每 `l2_block_time` 一个，在 Optimism 上为 2s），由定序器自行决定，但每个块都受到以下约束：

- `min_l2_timestamp <= block.timestamp < max_l2_timestamp`，其中
  - 所有这些值都以秒为单位
  - `min_l2_timestamp = prev_l2_timestamp + l2_block_time`
    - `prev_l2_timestamp` 是前一个 epoch 的最后一个 L2 块的时间戳
    - `l2_block_time` 是 L2 块之间时间的可配置参数（在 Optimism 上，2s）
  - `max_l2_timestamp = max(l1_timestamp + max_sequencer_drift, min_l2_timestamp + l2_block_time)`
    - `l1_timestamp` 是与 L2 块的 epoch 相关联的 L1 块的时间戳
    - `max_sequencer_drift` 是允许定序器领先于 L1 的最大程度

> TODO 指定最大定序器偏移（当前想法：大约 10 分钟，我们一直在测试网中使用 2-4 分钟）

总而言之，这些约束意味着每`l2_block_time`秒必须有一个 L2 块，并且一个 epoch 的第一个 L2 块的时间戳绝不能落后于与该 epoch 匹配的 L1 块的时间戳。

合并后，以太坊的出块时间固定为 12 秒（尽管可以跳过某些时隙）。因此，预计在大多数情况下，Optimism 上的每个 epoch 将包含 `12/2 = 6` 个 L2 块。然而，定序器可以延长或缩短 epoch（受上述限制）。基本原理是在 L1 上出现跳过时隙或与 L1 的连接暂时丢失的情况下保持活性——这需要更长的时期。然后需要更短的 epoch 来避免 L2 时间戳在 L1 之前偏移得越来越远。

### Eager Block Derivation

在实践中，通常不需要等待 L1 块的完整定序窗口以开始在一个 epoch 中派生 L2 块。事实上，只要我们能够重建顺序 batch，我们就可以开始推导相应的 L2 块。我们称之为 **eager block derivation**。

然而，在最坏的情况下，我们只能通过读取定序窗口的最后一个 L1 块来重建 epoch 中第一个 L2 块的 batch。当该 batch 的某些数据包含在窗口的最后一个 L1 块中时，就会发生这种情况。在那种情况下，我们不仅不能在 epoch 中导出第一个 L2 块，而且在此之前我们也无法在该 epoch 中导出任何更新的 L2 块，因为它们需要应用该 epoch 的第一个 L2 块产生的状态。（请注意，这仅适用于块派生。我们仍然可以派生更多 batch，只是无法从中创建块。）

## Batch Submission

### Sequencing & Batch Submission Overview

定序器接受来自用户的 L2 交易。它通过这些交易来构建块。对于每个这样的块，它还会创建一个相应的定序器 batch。它还负责将每个 batch 提交给数据可用性提供程序（例如 Ethereum calldata），这是通过其 batcher 组件完成的。

L2 块和 batch 之间的区别很微妙但很重要：块包含一个 L2 state root，而 batch 仅在给定的 L2 时间戳（相当于：L2 块号）提交交易。块还包括对前一个块的引用 (\*)。

(\*) 这在某些边缘情况下会发生 L1 重组并且 batch 将重新发布到 L1 链而不是前一 batch，而 L2 块的前继不可能更改。

这意味着即使定序器错误地应用了状态转换，批处理中的交易仍将被视为规范 L2 链的一部分。batch 仍需接受有效性检查（如果它们必须正确编码），batch 中的单个交易也是如此（例如签名必须有效）。正确的节点会丢弃无效的 batch 和有效 batch 中的无效单个交易。

如果定序器错误地应用状态转换并发布 output root ，则此 output root 将不正确。错误的 output root 将受到故障证明的挑战，然后由现有定序器 batch 的正确 output root 替换。

有关详细信息，请参阅批量 [Batch Submission specification]({{< ref "posts/ethereum/optimism/bedrock/sequencer-batch-submitter" >}})。

#### Batch Submission Wire Format {#batch-submission-wire-format}

批量提交与 L2 链的推导密切相关，因为推导过程必须对已编码的 batch 进行解码，以进行批量提交。

batcher 将 batcher transactions 提交给数据可用性提供程序。这些交易包含一个或多个 channel frames，它们是属于 channel 的数据块。

channel 是压缩在一起的一系列定序器 batch（对于顺序块）。将多个 batch 组合在一起的原因仅仅是为了获得更好的压缩率，从而降低数据可用性成本。

channels 可能太大而无法容纳单个 batcher transactions，因此我们需要将其拆分为称为 channel frames 的块。单个 batcher transactions 也可以携带多个 frames （属于相同或不同的 channel）。

这种设计在我们如何将 batch 聚合到 channel 中以及如何通过 batcher transactions 拆分 channel 方面提供了最大的灵活性。它特别允许我们在批处理交易中最大化数据利用率：例如，它允许我们将一个窗口的最终（小） frames 与下一个窗口的大 frames 打包在一起。它还允许 batcher 使用多个签名者（私钥）并行提交一个或多个 channel (1)。

(1) 这有助于缓解由于交易随机数导致同一签名者进行的多笔交易卡在等待包含先前交易的问题。

另请注意，我们使用流式压缩方案，当我们启动一个 channel 时，甚至在我们发送 channel 中的第一 frames 时，我们不需要知道 channel 最终将包含多少块。

下图说明了所有这些。解释如下。

todo: 待补充

## Architecture {#architecture}

以上描述了 L2 链推导的一般过程，并具体说明了 batcher transactions 中的 batches 是如何编码的。

但是，仍有许多细节需要说明。这些主要与用于推导的汇总节点架构相关联。 因此，我们将此架构作为说明这些细节的一种方式。

仅从 L1 读取（因此不直接与排序器交互）的验证器不需要以下面介绍的方式实现。 然而，它确实需要派生相同的块（即它需要在语义上是等价的）。 我们确实相信下面介绍的架构有很多优点。

### L2 Chain Derivation Pipeline

我们的架构将推导过程分解为由以下 stage 组成的 pipeline ：

1. L1 Traversal
2. L1 Retrieval
3. Channel Bank
4. Batch Decoding (called ChannelInReader in the code)
5. Batch Buffering (Called BatchQueue in the code)
6. Payload Attributes Derivation (called AttributesQueue in the code)
7. Engine Queue

数据流从 pipeline 的起点（外部）流向终点（内部）。 每个 stage 都能够将数据推送到下一 stage 。

但是，数据以相反的顺序处理。意思是如果最后一个 stage 有数据要处理，就优先处理（todo: 这是什么意思？）。 每个 step 采取 “steps” 进行处理。我们尝试在外部 stage 采取任何 step 前在最后（最内部）stage 采取尽可能多的 steps（todo：什么意思？）。

这确保我们在提取更多数据之前使用已有的数据，并最大限度地减少数据遍历派生 pipeline 的延迟。

每个 stage 都可以根据需要保持自己的内部状态。 特别是，每个 stage 都维护一个最新的 L1 块 reference（数字 + 散列），以便所有源自先前块的数据都已被完全处理，并且来自该块的数据正在或已经被处理。

让我们简要描述 pipeline 的每个 stage 。

#### L1 Traversal

在 L1 Traversal stage，我们简单地读取下一个 L1 块的头部。在正常操作中，这些将是新创建的 L1 块，但我们也可以在同步时或者 L1 重组的情况下读取旧块。

在遍历 L1 块时，L1 Retrieval stage 使用的系统配置副本会更新，这样批量发送者身份验证始终准确到该 stage 读取的确切 L1 块。

#### L1 Retrieval

在 L1 检索 stage ，我们从 outer stage （L1 Traversal）读取获得的块，并为其提取数据。特别是，我们提取了一个字节字符串，该字节字符串对应于属于该块的所有批处理交易中的数据串联。该字节流对 channel frames 流进行编码（有关更多信息，请参阅 []({{< ref "#batch-submission-wire-format" >}})）。

这些 frames 被解析，然后按 channel 分组到我们称为 channel bank 的结构中。当向 channel 添加 frames 时，个别 frames 可能无效，但 channel 在 channel 超时之前没有有效性的概念。这允许添加选项以在将来从 channel 中进行部分读取。

一些 frames 被忽略：

- frames 编号与 channel 中现有 frames 相同的 frames（重复）。使用第一个看到的 frames。
- 试图关闭已关闭 channel 的框架。这将是 `frame.is_last == 1` 的第二 frames，即使第二 frames 的 frames 编号与关闭 channel 的第一 frames 不同。

如果将 `is_last == 1` 的 frames 添加到 channel ，则从 channel 中删除所有具有更高 frames 号的 frames 。

channel 也以 FIFO 顺序记录在称为 channel 队列的结构中。第一次看到属于该 channel 的 frames 时，该 channel 被添加到 channel 队列中。该结构用于下一 stage 。

#### Channel Bank

#### Batch Decoding

#### Batch Buffering

#### Payload Attributes Derivation

#### Engine Queue

#### Resetting the Pipeline

## Deriving Payload Attributes

### Deriving the Transaction List

### Building Individual Payload Attributes

## Communication with the Execution Engine

todo: 其他文章等待补充

## 总结

[^1]: [L2 Chain Derivation Specification](https://github.com/ethereum-optimism/optimism/blob/develop/specs/derivation.md)
