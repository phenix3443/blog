---
title: "Danksharding"
description: 以太坊数据扩容：danksharding
slug: danksharding
date: 2023-03-31T10:33:31+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series: [以太坊扩容]
categories: [ethereum]
tags: [danksharding, eip-4844]
---

本文介绍 danksharding 相关知识。

<!--more-->

## 概述

[`Danksharding`](https://ethereum.org/zh/roadmap/danksharding/) 会使以太坊成为真正可扩展的区块链，但要达到这个目的需要进行若干协议升级。`Proto-Danksharding` 是这条道路上的一个中间步骤。两者都旨在使第二层的交易对用户来说尽可能便宜，并应将以太坊扩展到每秒>100,000 次交易。

## Proto-Danksharding

Proto-Danksharding，也被称为 [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)，可以让 [rollups](https://ethereum.org/zh/layer2/#rollups) 更便宜地向区块链添加数据。这个名字来自于提出这个想法的两位研究人员：Protolambda 和 Dankrad Feist。

当前，rollup 通过 `CALLDATA` 提交数据，这限制了其降低用户交易费用的能力。尽管 rollup 交易只需要临时数据，但要目前数据会被所有以太坊节点处理，并永远活在链上，这就使交易费昂贵的原因。Proto-Danksharding 引入了可以被发送并附加到区块上的 data blobs。这些 blob 中的数据是 EVM 无法访问的，并且在一个固定的时间段（1-3 个月）后会自动删除。这意味着 rollup 可以更便宜地发送数据，并以更便宜的交易形式将节省的资金转给最终用户。

### 为什么 blobs 能使 rollups 更便宜？

Rollups 是一种通过在链下批量处理交易，然后将结果发布到以太坊的方式来扩展以太坊。一个 rollups 本质上由两部分组成：数据和执行检查。数据是被 rollups 处理的全部交易序列，处理结果作为以太坊的状态变化被发布到链上。执行检查是由一些诚实的行为者，也就是验证者 (`prover`)，重新执行这些交易，以确保提议的状态变化是正确的。为了进行执行检查，交易数据必须有足够长的时间供任何人下载和检查。这意味着任何由 rollups sequencer 的不诚实行为都可以被验证者识别和质疑。然而，blobs 不需要永远可用。

### 为什么删除 blob 数据是可以的？

Rollups 在链上发布对其交易数据的承诺 (`commitment`)，同时也在 data blob 中提供实际数据。这意味着验证者可以检查承诺是否有效，或者挑战他们认为错误的数据。在节点层面，data blobs 被保存在共识客户端。共识客户端证明他们已经看到了这些数据，并且这些数据已经在网络上传播。如果数据被永远保存，这些客户端会膨胀，并导致运行节点的大量硬件需求。相反，数据每隔 1-3 个月就会自动从节点上剪除。共识客户端证明表明，证明人有足够的机会来验证数据。实际数据可以由 rollups 运营商、用户或其他人在链下存储。

### 如何验证 blob 数据？

Rollups 在 data blob 中发布他们执行的交易，还公布了对数据的“承诺 (`commitment`)”：通过将数据 [拟合](https://blog.csdn.net/qq_27586341/article/details/90170839) 一个多项式函数 (`KZG`) 来实现。之后，可以在不同的点上计算这个函数对应的数值。例如，如果我们定义一个极其简单的函数 `f(x)=2x-1`，那么我们可以在 `x=1、x=2、x=3` 的情况下计算这个函数，得到 `1、3、5` 的结果。一个验证者将从数据拟合出同样的函数，并在相同的点上进行计算。如果原始数据被改变，该函数将不完全相同，因此在每个点上计算的值也不完全相同。在现实中，承诺和证明更为复杂，因为它们被包裹在加密函数中。

### 什么是 KZG？

KZG 是 `Kate-Zaverucha-Goldberg` 的缩写--这是三个 [原始作者](https://link.springer.com/chapter/10.1007/978-3-642-17373-8_11) 的名字，他们的方案将一团数据简化为一个小的 [加密 "承诺 (commitment)"](https://dankradfeist.de/ethereum/2020/06/16/kate-polynomial-commitments.html)。rollups 提交的 data blobs 必须经过验证，以确保 rollups 没有发生错误行为。这涉及到验证者重新执行 blob 中的交易，以检查承诺是否有效。这在概念上与执行客户端在一层使用 Merkle 证明检查 Ethereum 交易有效性的方式相同。KZG 是一种替代性证明，它将多项式方程与数据拟合。承诺人在一些秘密数据点上计算该多项式。验证者将在数据拟合相同的多项式，并在相同的数值上计算，检查结果是否相同。这是一种验证数据的方式，与一些 rollups 和最终以太坊协议的其他部分所使用的零知识技术兼容。

更多信息参考 [多项式承诺]({{< ref "../kzg" >}})

### 什么是 KZG Ceremony？

[KZG Ceremony](https://ceremony.ethereum.org/) 是一种让整个以太坊社区的许多人一起生成一个秘密的随机数字串的方式，可以用来验证一些数据。这串数字不为人所知，不能被任何人重新创建，这一点非常重要。为了确保这一点，每个参加 Ceremony 的人都会从之前的参与者那里收到一个字符串。然后他们创建一些新的随机值（例如，通过让他们的浏览器测量他们的鼠标移动），并将其与之前的值混合在一起。然后，他们把这个值发送给下一个参与者，并从他们的本地机器上销毁它。只要 Ceremony 中的一个人诚实地做这件事，最终的值将是攻击者无法知道的。EIP-4844 的 KZG Ceremony 向公众开放，数以万计的人参与其中，增加自己的熵。为了使 Ceremony 受到破坏，必须所有参与者都是不诚实的。从参与者的角度来看，如果他们知道自己是诚实的，就没有必要相信其他人，因为他们知道他们保证了 Ceremony 的安全（他们单独满足了 [1-N](https://www.ethereum.cn/Thinking/trust-model) 个诚实参与者的要求）。

### KZG Ceremony 的随机数是用来做什么的？

当一个 rollups 在 blob 中发布数据时，他们提供了一个链上 "承诺"。这个承诺是在某些点上对数据进行多项式拟合计算的结果。这些点是由 KZG Ceremony 中生成的随机数定义的。然后，证明者 (Provers) 可以在相同的点上计算多项式，以验证数据--如果他们得出相同的值，那么数据就是正确的。

### 为什么 KZG 的随机数据必须秘密的？

如果有人知道用于承诺的随机位置，他们很容易产生一个新的多项式，在这些特定的点上进行拟合（即“碰撞”）。这意味着他们可以从 blob 中添加或删除数据，并仍然提供一个有效的证明。为了防止这种情况，承诺者并没有给证明者实际的秘密位置，而是用椭圆曲线将位置包裹在一个加密的 "黑盒子 "中。这些有效地扰乱了数值，使原始数值不能被反向工程，但通过一些巧妙的代数，证明者和验证者仍然可以在他们所代表的点上计算多项式。

无论是 Danksharding 还是 Proto-Danksharding 都没有遵循传统的 "分片 (sharding)" 模式（将区块链分成多个部分）。分片链 (Shared chains) 不再是路线图的一部分。相反，Danksharding 使用跨 blob 的分布式数据采样来扩展 Ethereum。这在实现上要简单得多。这种模式有时被称为 "数据分储 (data-sharding)"。

## Danksharding

Danksharding 是 rollup 扩容的全部实现，Proto-Danksharding 只是第一步。Danksharding 将在以太坊上带来大量的空间，供 rollups 存放其压缩的交易数据。这意味着以太坊将能够轻松地支持数百个单独的 rollups，并使每秒数百万次的交易成为现实。

其工作方式是将附加在区块上的 Blobs 从 Proto-Danksharding 的 1 个扩大到 Danksharding 完整的的 64 个。其余所需的变化都是对共识客户端操作方式的更新，以使它们能够处理新的大块。这些变化中有几个已经在路线图上，用于其他独立于“Danksharding”的目的。例如，Danksharding 要求“proposer-builder separation(PBS)”已经实现，该升级将构建块和提出块的任务在不同的验证器之间分开。同样，数据可用性抽样 ( data availability sampling ) 也是 Danksharding 所需要的，但它也是开发不储存太多历史数据的非常轻量级客户端，也就是"无状态客户端 (stateless clients)"，所需要的。

### proposer

### builder

Builders（数据生成者）是一种新角色，它会聚合所有以太坊 L1 交易以及来自 rollup 的原始数据。当然，可以有很多 Builders，但它仍然带来了一些审查风险。

### 为什么 Danksharding 要求 PBS?

要求提出者与构建者分离是为了防止个别验证者不得不为 32MB 的 blob 数据生成昂贵的承诺和证明。这将给 home 验证者带来太大的压力，并要求他们投资更强大的硬件，这将损害去中心化。相反，专门的区块构建者负责这种昂贵的计算工作。然后，他们将他们的区块提供给区块提议者来广播。区块提议者只是选择最有利可图的区块。任何人都可以廉价而快速地验证这些区块，这意味着任何正常的验证者都可以检查区块构建者的行为是否诚实。这使得大的 blobs 可以在不牺牲去中心化的情况下进行处理。行为不端的区块构建者可以简单地从网络中剔除--其他人会步入他们的位置，因为区块构建是一项有利可图的活动。

### 为什么需要 crList？

如果所有 Builders 都选择审查某些交易怎么办？使用 crList，区块提议者可以强制 Builders 包含交易。

### 为什么 Danksharding 需要数据可用性采样？

验证者需要进行数据可用性采样，以便快速有效地验证 blob 数据。使用数据可用性抽样，验证者可以非常确定 blob 数据是可用的，并正确提交。每个验证者都可以只随机抽查几个数据点并创建一个证明，这意味着没有验证者需要检查整个 blob。如果有任何数据缺失，将很快被识别出来，并拒绝该 blob。

### 目前的进展

完整的 “Danksharding” 还需要几年时间。然而，"Proto-Danksharding"应该会比较快地到来。在撰写本报告时（2023 年 2 月），KZG ceremony 仍在进行，迄今已吸引了超过 50,000 名贡献者。Proto-Danksharding 的 [EIP](https://eips.ethereum.org/EIPS/eip-4844) 已经成熟，规范已经达成一致，已经实现了看了护短原型，目前正在进行测试，为生产做好准备。下一步是在公共测试网上实施这些变化。可以使用 [EIP 4844 准备情况检查表](https://github.com/ethereum/pm/blob/master/Breakout-Room/4844-readiness-checklist.md#client-implementation-status) 来了解最新情况。

## 延伸阅读

- [情人节，V 神科普的“Danksharding”到底是什么？](https://www.8btc.com/article/6729076)
- [crList：PBS 的抗审查替代解决方案](https://www.ethereum.cn/Eth2/crlist)
- [Danksharding](https://ethereum.org/zh/roadmap/danksharding/)
- [一文了解以太坊的“扩容杀手锏”danksharding](https://www.defidaonews.com/article/6727438) 文章末尾介绍了一些 danksharding 可以实现许多令人着迷的可能性，可以深入了解，比如说跨 rollup 链进行原子操作的可能性。

## Next

- [多项式承诺]({{< ref "../kzg" >}})
- [proto-danksharding]({{< ref "../proto-danksharding" >}})
- [eip-4844]({{< ref "../eip-4844" >}})
