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
tag:
    - ethereum
    - optimism
    - bedrock
---


## 引言[^1]

改文章还在写作中。

## Overview

> 请注意，以下内容假定单个定序器和批处理器（batcher）。将来，该设计将进行调整以容纳多个此类实体。

[L2 链推导](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-derivation)，从 L1 数据推导 L2 块，是 rollup 节点的主要职责之一，无论是在验证器模式还是在定序器模式下（推导作为对定序的健全性检查，并能够检测 L1 链重组).

L2 链源自 L1 链。具体而言，每个 L1 块都映射到包含多个 L2 块的 L2 [sequencing epoch](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#sequencing-epoch)。 epoch 编号被定义为等于相应的 L1 块编号。

为了在 epoch `E` 中导出 L2 块，我们需要以下输入：

+ epoch `E` 的 [L1 sequencing window](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#sequencing-window)：`[E, E + SWS)` 范围内的 L1 块，其中 SWS 是定序窗口大小（请注意，这意味着 epoch 是重叠的（todo：为什么是重叠的？））。我们特别需要：
  + 定序窗口中包含的 [batcher transactions](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#batcher-transaction)。这使我们能够重建包含交易的 [sequencer batches](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#sequencer-batch)以包含在 L2 块中（每个批次映射到单个 L2 块）。
    + 请注意，在 L1 区块 E 上不可能有包含与 epoch E 相关的批处理的批处理交易，因为该批处理必须包含 L1 区块 E 的哈希值。（todo：这里是什么意思？）
  + 在 L1 区块 E 中进行的 deposits （以 deposits 合约发出的事件的形式）。
  + 来自L1区块 E 的 L1 区块属性（[导出L1属性存入交易](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#l1-attributes-deposited-transaction）)。
+ L2 链在 epoch `E-1` 的最后一个 L2 区块之后的状态，或者——如果 epoch `E-1` 不存在——L2 创世状态。
  + 如果 `E <= L2CI`，则 epoch E 不存在，其中 L2CI 是 L2 链起始。

> TODO 指定定序窗口大小（目前的想法：大约几个小时，为批提交者提供最大的灵活性）

为了从头开始推导整个 L2 链，我们只需从 L2 创世状态开始，将 L2 链初始作为第一个 epoch，然后按顺序处理所有定序窗口。有关我们如何在实践中实现这一点的更多信息，请参阅[架构部分](https://github.com/ethereum-optimism/optimism/blob/develop/specs/derivation.md#architecture)。

每个 epoch 可能包含可变数量的 L2 块（每 `l2_block_time` 一个，在 Optimism 上为 2s），由定序器自行决定，但每个块都受到以下约束：

+ `min_l2_timestamp <= block.timestamp < max_l2_timestamp`，其中
  + 所有这些值都以秒为单位
  + `min_l2_timestamp = prev_l2_timestamp + l2_block_time`
    + prev_l2_timestamp 是前一个epoch的最后一个L2块的时间戳
    + l2_block_time 是 L2 块之间时间的可配置参数（在 Optimism 上，2s）
  + max_l2_timestamp = max(l1_timestamp + max_sequencer_drift, min_l2_timestamp + l2_block_time)
    + l1_timestamp 是与 L2 块的 epoch相关联的 L1 块的时间戳
    + max_sequencer_drift 是允许音序器领先于 L1 的最大程度

> TODO 指定最大音序器漂移（当前想法：大约 10 分钟，我们一直在测试网中使用 2-4 分钟）

总而言之，这些约束意味着每 l2_block_time 秒必须有一个 L2 块，并且一个 epoch的第一个 L2 块的时间戳绝不能落后于与该 epoch匹配的 L1 块的时间戳。

合并后，以太坊的出块时间固定为 12 秒（尽管可以跳过某些时隙）。因此，预计在大多数情况下，Optimism 上的每个 epoch将包含 `12/2 = 6` 个 L2 块。然而，定序器可以延长或缩短 epoch（受上述限制）。基本原理是在 L1 上出现跳过时隙或与 L1 的连接暂时丢失的情况下保持活性——这需要更长的时期。然后需要更短的 epoch来避免 L2 时间戳在 L1 之前漂移得越来越远。

### Eager Block Derivation

在实践中，通常不需要等待 L1 块的完整定序窗口以开始在一个 epoch中派生 L2 块。事实上，只要我们能够重建顺序批次，我们就可以开始推导相应的 L2 块。我们称之为急切的区块推导。

然而，在最坏的情况下，我们只能通过读取定序窗口的最后一个 L1 块来重建 epoch 中第一个 L2 块的批次。当该批次的某些数据包含在窗口的最后一个 L1 块中时，就会发生这种情况。在那种情况下，我们不仅不能在 poch 中导出第一个 L2 块，而且在此之前我们也无法在该 epoch中导出任何进一步的 L2 块，因为它们需要应用该 epoch的第一个 L2 块产生的状态。 （请注意，这仅适用于块派生。我们仍然可以派生更多批次，只是无法从中创建块。）

## 批量提交

### 定序和批次提交概述

定序器接受来自用户的 L2 交易。它负责构建这些块。对于每个这样的块，它还会创建一个相应的定序器批次。它还负责将每个批次提交给数据可用性提供程序（例如 Ethereum calldata），这是通过其批处理程序组件完成的。

L2 块和批次之间的区别很微妙但很重要：块包含一个 L2 状态根，而批次仅在给定的 L2 时间戳（相当于：L2 块号）提交交易。块还包括对前一个块的引用 (*)。

(*) 这在某些边缘情况下会发生 L1 重组并且批次将重新发布到 L1 链而不是前一批次，而 L2 块的前身不可能更改。

这意味着即使定序器错误地应用了状态转换，批处理中的交易仍将被视为规范 L2 链的一部分。批次仍需接受有效性检查（即它们必须正确编码），批次中的单个交易也是如此（例如签名必须有效）。正确的节点会丢弃无效的批次和有效批次中的无效单个交易。

如果定序器错误地应用状态转换并发布输出根，则此输出根将不正确。错误的输出根将受到故障证明的挑战，然后由现有定序器批次的正确输出根替换。

有关详细信息，请参阅批量提交规范。

TODO 重写批量提交规范

以下是一些应该包含在其中的内容：

可能有不同的并发数据提交到 L1
可能有不同的参与者提交数据，系统不能依赖单一的 EOA nonce 值。
批处理程序从 rollup 节点请求安全的 L2 安全头，然后向执行引擎查询块数据。
将来我们可能能够直接从执行引擎中获取安全头信息。现在不可能，但有一个上游 geth PR 打开。
指定批处理程序身份验证（参见下面的 TODO）

批量提交电汇格式
批量提交与 L2 链的推导密切相关，因为推导过程必须对已编码的批次进行解码，以进行批量提交。

批处理程序将批处理程序交易提交给数据可用性提供程序。这些交易包含一个或多个通道帧，它们是属于通道的数据块。

通道是压缩在一起的一系列音序器批次（对于顺序块）。将多个批次组合在一起的原因仅仅是为了获得更好的压缩率，从而降低数据可用性成本。

通道可能太大而无法容纳单个批处理程序交易，因此我们需要将其拆分为称为通道帧的块。单个批处理程序交易也可以携带多个帧（属于相同或不同的通道）。

这种设计在我们如何将批次聚合到通道中以及如何通过批处理程序交易拆分通道方面提供了最大的灵活性。它特别允许我们在批处理交易中最大化数据利用率：例如，它允许我们将一个窗口的最终（小）帧与下一个窗口的大帧打包在一起。它还允许批处理程序使用多个签名者（私钥）并行提交一个或多个通道 (1)。

(1) 这有助于缓解由于交易随机数导致同一签名者进行的多笔交易卡在等待包含先前交易的问题。

另请注意，我们使用流式压缩方案，当我们启动一个通道时，甚至在我们发送通道中的第一帧时，我们不需要知道通道最终将包含多少块。

下图说明了所有这些。解释如下。

批量推导链图

第一行代表 L1 块及其编号。 L1 块下的框表示块中包含的批处理交易。 L1 块下的波浪线代表 deposits （更具体地说， deposits 合约发出的事件）。

方框内的每个彩色块代表一个通道帧。所以 A 和 B 是通道，而 A0、A1、B0、B1、B2 是帧。请注意：

多个通道交错
帧不需要按顺序传输
单个批处理程序交易可以携带来自多个通道的帧
在下一行中，圆形框表示从通道中提取的单个定序批次。四个蓝色/紫色/粉色来自通道 A，而另一个来自通道 B。这些批次在这里按照从批次解码的顺序表示（在这种情况下，B 首先解码）。

## 总结

[^1]: [L2 Chain Derivation Specification](https://github.com/ethereum-optimism/optimism/blob/develop/specs/derivation.md)