---
title: "Proto-Danksharding"
description:
slug: proto-danksharding
date: 2023-04-01T00:36:01+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
  - scale
tags:
---

## 数据可用性引起的 L2 费用瓶颈

### 现状[^1]

![ethereum roadmap](img/roadmap.jpeg)

当前以太坊 L2 大多以 Rollup 为基本的技术路线，Vitalik 更是将以太坊的更新用[“a rollup-centric roadmap”](https://twitter.com/VitalikButerin/status/1311921668005060608)描述（注意上图中的 the surge 阶段），可见 Rollup 基本已经一统 L2 江湖。

而 Rollup 运行的基本原理，是`将一捆交易在以太坊主链外执行，执行完后将执行结果和交易数据本身经过压缩后发回到 L1 上，以便其他人去验证交易结果的正确性`。显然，如果其他人没有办法读取数据，那就无法完成验证。因此让其他人能够获取交易原始数据这一点至关重要，它也被称为[数据可用性(Data Availability)]({{< ref "../ethereum/data-availability" >}})。

![l2-use-calldata](img/l2-calldata.png)

而受限于以太坊当前的架构，L2 向 L1 的传输的数据，是储存在交易的 Calldata 里面的。然而，Calldata 在最初以太坊设计的时候只是一个智能合约函数调用的参数，是所有节点必须同步下载的数据。如果 Calldata 膨胀，将造成以太坊网络节点的高负载，因此 Calldata 的费用是比较昂贵的。这也是造成当前 L2 费用的主要因素。

### 改进思路

其实我们可以观察到，L2 的交易压缩数据的上传，只是为了让它能够被其他人所下载验证，并不需要被 L1 所执行。而 Calldata 费用之所以高，是因为它作为一个函数调用的参数，是默认可能被 L1 执行的，因此`需要全网的节点进行同步`。

那怎么改进呢？

我们可以把 L2 传过来的数据单独设计一个数据类型，把它和 L1 的 Calldata 分开。这种数据类型只需要满足能在`一定时间内`被有需要的其他人所访问下载即可，`无需做全网的同步`。实际上，这点也被众多以太坊技术社区的成员所想到了。

EIP-4844 的改进，其实就是围绕着这个脉络进行的。

## EIP-4844 的核心：带 Blob 的交易

如果用一句话来概括 [EIP-4844]({{< ref "../eip-4844">}}) 究竟做了什么，那就是：引入了`“携带 blob 的交易(Blob-carrying Transaction)”`这一`新的交易类型`。Blob 就是上文提到的，为 L2 的数据传输所专门设计的数据类型。

因此，将有关 blob 的细节理解清楚，就可以说基本搞明白了 EIP-4844 。

### Blob 本体

Blob 是一个用于放置 `L2 压缩数据`的“大数据块”，`存在共识层的节点(beacon node)中`。之前放在 calldata 中 L2 的数据(交易，证明等)，现在就放到 Blob 里面。相比于 Calldata，Blob 的数据大小可以非常大。

Blob 是由共识层的节点进行存储的，而不是像 Calldata 那样在会直接上主链，这也带来了 Blob 的两个核心特点：

- 不能像 Calldata 那样被 EVM 所读取，这也意味着未来的分片工作只需要对信标节点(beacon node)进行修改.
- 有生命周期。每 2 周后会修剪一次 blob。可用时间长到足以让 L2 的所有角色都能检索到它，短到足以让磁盘使用可控。这使得 Blobs 的价格比 CALLDATA 便宜，因为 CALLDATA 永远保存在历史中。[^2]

更细节一点的来说[^4]：

- Blob 本身，是一个由 4096 个元素所构成的向量(Vector)，每个元素 32 个字节，每个 blob 约为`4096 * 32 bytes=128kB`。单块 blob 上限可以从低开始，并在多次网络升级中增长。

  这个向量每个维度都可以看做是一个不高于 4096 阶的有限域多项式的各个系数，这个结构设计，是为了方便 [KZG 多项式承诺]({{< ref "../kzg" >}})的生成。

- 每个 transaction 最多挂 2 个 blob。
- 每个 block 理想状态包含 8 个 blob，约为 1MB(`128kB*8=1MB`)，最多包含 16 个 blob，约为 2MB。

### 与 Blob 相关的架构设计：Sidecar[^3]

在理解 Blob 架构之前，先需要说明一个概念：Execution Payload（执行负载）。在以太坊合并之后，分出了 Consensus Layer 和 Execution Layer，它们分别负责两个主要功能：前者负责 PoS 共识，后者执行 EVM。而 Execution Payload 可以简单认为是 EL 层里面普通的 L1 交易。

![el-chain](img/el-chain.png)

Blob 和现在以太坊架构的融合，可以类比为摩托车本体和摩托车挎斗（Sidecar）之间的关系，就像这样：（左边的就是摩托车的 Sidecar）

![sidecar](img/sidecar.png)

Sidecar（摩托车挎斗）是一个[官方比喻](https://eips.ethereum.org/EIPS/eip-4844#beacon-chain-validation)。它的含义，其实就是 Blob 的运转虽然依赖于主链，但某种程度上也平行于主链、具备相当的独立性。

如下图所示，接下来就让我们来过一遍 Blob 相关的执行流程，以更好的理解这一比喻：

![sidecar-flow](img/sidecar-flow.png)

首先，L2 Sequencer 确定交易，将交易的结果和相关证明（黄色部分）和数据包（Blob，蓝色部分）传到 L1 的交易池中。

L1 的节点（Beacon Proposer）看到了交易，它会在新的区块提议（Beacon Block）里面执行相关交易并进行广播；但在广播的时候，它会把 Blob 分离出来留在共识层 CL 中(blobs sidecar)，并不会把它放到执行层的新区块里面。

其它 L1 节点（Beacon Peer）会收到了新的区块提议和交易结果。如果它们有需要成为 L2 验证者，它们可以去 Blobs Sidecar 下载相关的数据。

下图是从另一个角度对 Blob 生命周期的阐述，我们可以清晰地看到 blob 数据不会上 L1 主链，只会存在共识层节点之中，并且它有着不一样的生命周期。

![blob-life](img/blob-life.jpeg)

因此，这也不难理解为什么 Blob 无法被 EVM，也就是 L1 的智能合约所直接读取：能被读取的都是被传到执行层的东西，既然 Blob 仅仅留在共识层，那么肯定就没有这个功能了。而事实上，这种分离，也正是 Rollup 费用能因此降低的原因。

### Blob 的存储：新的 Fee Market

前文提到，Blob 数据将存在共识层节点之中，并且具备生命周期。但显然这种服务也不是免费的，因此它将会带来一个独立于 L1 Gas 费的新费用市场，这也是 Vitalik 所倡导的 Multi-dimensional Fee Market。这个 Fee Market 的相关细节还在迭代完善之中，详见 [Github 的相关讨论与更新](https://github.com/ethereum/EIPs/pull/5707)。

另外，如果节点层面只能短期存储这些数据，那么如何实现长期的储存呢？对此，Vitalik 表示解决方案其实很多。因为这里的安全假设要求不高，是[“1 of N 信任模型”](https://www.ethereum.cn/Thinking/trust-model)，只需有人能够完成真实数据的存储即可。在大的存储硬件只需要 20 美元每 TB 的当下，每年 2.5 TB 的数据存储对于有心人而言只是小问题。另外，其它各种去中心化存储解决方案也会是一种选择，不过 Vitalik 在这里并没有提到具体的项目。

### Blob 的证明[^5]

## EIP-4844 的影响

在架构层面，EIP-4844 引入了新的交易类型 Blob-carrying Transaction，这是以太坊第一次为 L2 单独构建数据层，也是之后 [Full Danksharding]({{< ref "../danksharding" >}}) 实现的第一步。

在经济模型层面，EIP-4844 将为 blob 引入新的 Fee Market，这也会是以太坊迈向 Multi-dimensional Market 的第一步。

在用户体验层面，用户最直观的感知就是 L2 费用的大幅降低，这个底层的重要改进，将为 L2 以及其应用层的爆发提供重要基础。

## EIP-4844 后的展望：Fully Danksharding

EIP-4844 只是“Proto-Danksharding”，意为 Danksharding 的原型。[完整版 Danksharding]({{< ref "../danksharding">}}) 中，每个节点都可以直接通过数据可用性采样（Data Availability Sampling），实现对 L2 数据正确性的实时验证。这将会进一步提高 L2 的安全性和性能。

## 参考

[^1]: [一文读懂 EIP-4844：如何降低 Layer2 费用 100 倍？](https://www.8btc.com/article/6794798)
[^2]: [eip4844](https://www.eip4844.com)
[^3]: [OP in Paris: OP Lab's Protolambda walks us through EIP-4844](https://www.youtube.com/watch?v=KQ_kIlxg3QA)
[^4]: [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)
[^5]: [如何在证明中使用 KZG 承诺](https://www.ethereum.cn/Technology/kzg-commitments-in-proofs)
