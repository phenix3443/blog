---
title: ZK-Rollup
description: 以太坊中的 ZK-Rollup
slug: zk-rollup
date: 2023-08-29T16:45:23+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: []
categories: [ethereum]
tags: [ZK-Rollup]
images: []
---

本文翻译自 [Ground Up Guide: zkEVM, EVM Compatibility & Rollups](https://immutableblog.medium.com/ground-up-guide-zkevm-evm-compatibility-rollups-787b6e88108e)

<!--more-->

## 概述

ZK-Rollup 一直被认为是以太坊扩容的终极解决方案。然而，尽管它们在以太坊扩容路线图中非常重要，关于几个关键点仍然存在广泛的不确定性：

1. 什么是 zk-rollup？
2. 针对特定应用和通用目的的 rollups 有什么不同？
3. 什么是 zk-EVM rollup？术语如 EVM-equivalent（EVM 等效）和 EVM-compatible（EVM 兼容）到底意味着什么，并且它们如何应用于 rollups？
4. zk-rollup 生态系统的当前状态是什么，这对我的项目意味着什么？

如果你是一名开发者，希望了解以太坊扩容的下一阶段，这篇文章（希望）会有所帮助。

## ZK-Rollup

ZK-Rollup 的出现是由一个简单的观察推动的：像 STARKs 或 SNARKs 这样的证明系统允许用次线性的处理来验证线性数量的声明（例如，1000 个声明→10 个验证检查，10,000 个声明→11 个验证检查）。我们可以利用这一特性按如下方式创建大规模可扩展的区块链交易处理：

1. 用户在 L1 上锁定他们的资产到一个 zk-rollup 智能合约中。
2. 用户提交与这些资产相关的交易给一个 L2 顺序器，该顺序器将它们整理成有序的批次，并为每个批次生成一个有效性证明（例如，STARK/SNARK）和聚合的状态更新。
3. 这个状态更新和证明被提交到并由我们的 L1 zk-rollup 智能合约进行验证，并用于更新我们的 L1 状态。
4. 用户可以使用这个 L1 状态（受不同的数据可用性机制的限制）来检索他们的资产，从而允许全自持 (self-custody) 和“以太坊安全”。

![Simplified ZK-Rollup Architecture](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*S1tu91ScfXzXcfeW_UCyUA.png)

证明的 gas 费用与被证明的交易数量是次线性关系，与直接使用 L1 相比，这允许更大规模的扩展。要更详细地了解这个过程，我建议阅读 [Vitalik 的 Rollups 不完全指南](https://www.ethereum.cn/an-incomplete-guide-to-rollups) 或 [Delphi 新发布的 Rollups 完全指南](https://members.delphidigital.io/reports/the-complete-guide-to-rollups/)。

## 针对特定应用的 Rollups（Application-Specific Rollups）

到目前为止，所有生产级别的 zk-rollups 都是我们所说的“针对特定应用的 rollups”。在一个针对特定应用的 rollup 中，rollup 支持由 rollup 运营者定义的固定数量的“状态转换”（例如，交易）。这对于高度优化常见用例（例如）非常有用：

- [Loopring](https://loopring.org/#/) —— 支付与兑换
- [Immutable](https://immutable.com/) —— NFT 铸造与交易，游戏
- [dydx](https://dydx.exchange/) —— 永续合约交易

针对特定应用的 rollups 非常擅长扩展特定的、已经很好理解的问题。如果您作为一个项目的需求可以由一个针对特定应用的 rollup 满足，您很可能会获得更好的性能、更好的用户体验和更好的定价，因为它们缺乏泛化是一个巨大的优势。例如，在 Immutable 中，我们能够通过用 NFT 交易的费用来补贴免费的 NFT 铸造和转移，从而 [消除 gas fee](https://immutableblog.medium.com/ground-up-guide-zkevm-evm-compatibility-rollups-787b6e88108e#:~:text=are%20able%20to-,eliminate%20gas%20fees,-by%20subsidising%20free)——这种权衡只有在 rollup 的状态转换具有可预测性时才可能。

然而，许多项目希望能够创建自己的自定义逻辑和智能合约，独立于 rollup 运营商，这在一个针对特定应用的 rollup 中是不可能的。另外，许多 DeFi 项目需要“可组合性”（composability），或与其他项目原子级地交互的能力（例如，许多 DeFi 项目使用 Uniswap 作为价格预言机）。只有当您的 rollup 不仅支持自定义代码，而且支持可以由任何用户部署的本地智能合约时，可组合性才是可能的。要实现这一点，我们需要修改我们的 zk-rollup 的架构，以泛化我们的每一个组件。

这种增加的灵活性有几个权衡：性能明显下降、rollup 参数的可定制性减少和更高的 gas fees。然而，最大的权衡是到目前为止简单地没有通用目的的 zk-rollups 的实现，当然也没有任何能够承受生产量的实现。但这正在开始改变：

- [StarkNet](https://starkware.co/starknet/) 目前已经在主网上线（尽管是在有限的 Alpha 版本中）。
- 3 个独立的项目（[zkSync](https://twitter.com/zksync/status/1549757888641437696)、[Polygon Hermez/zkEVM](https://twitter.com/0xPolygon/status/1549716947847479302) 和 [Scroll](https://twitter.com/Scroll_ZKP/status/1549268276152500225)）都在 2022 年的 ETH CC 上宣布，他们将是第一个达到主网的“zkEVM”。

这些最后的公告值得深入探讨，因为这些团队不仅宣布了通用目的的 rollups，他们宣布了“zkEVM”。接下来是关于“EVM 兼容性”、“EVM 等效性”、“真正的 zkEVM”以及哪种方法更优越的大量 Twitter 争论。对于应用开发者来说，这些对话通常是噪音——因此这篇博客的目的是解析这些术语、设计决策和哲学，并解释它们对开发者的实际影响。

让我们从一开始就明确：EVM 是什么？

## 理解 EVM（Ethereum Virtual Machine）

以太坊虚拟机是执行以太坊交易的运行环境，最初在 [以太坊黄皮书](https://ethereum.github.io/yellowpaper/paper.pdf) 中定义，后来通过一系列 [以太坊改进提案](https://eips.ethereum.org/)（EIPs）进行了修改。它由以下组成：

- 一个用于执行程序的标准“机器”，每个交易有易失性的“内存”，持久性的“存储”可供交易写入，以及一个操作“栈”。
- 大约 140 个有价格的“操作码”（opcodes），在这台机器中执行状态转换。

![Diagram from https://takenobu-hs.github.io/downloads/ethereum_evm_illustrated.pdf](https://miro.medium.com/v2/resize:fit:1400/0*zt200beVomwMWxD0)

我们的虚拟机的一些示例操作码（opcodes）：

- 栈操作 —— PUSH1（向栈中添加内容）
- 算术操作 —— ADD（加法）、SUBTRACT（减法）
- 状态操作 —— SSTORE（存储数据）、SLOAD（加载数据）
- 交易操作 —— CALLDATA、BLOCKNUMBER（返回有关当前执行交易的信息）

一个 EVM 程序只是这些操作码和参数的一系列。当这些程序被表示为一个连续的代码块时，我们称结果为“字节码”（通常表示为一个长十六进制字符串）。

通过将大量这样的操作码组合成一个执行序列，我们可以创建任意程序。以太坊使用自定义的虚拟机，而不是适应现有的 VM，因为它有独特的需求：

- 每个操作都必须有一个“成本”以防止滥用（因为所有节点都运行所有交易）。
- 每个操作必须是确定性的（因为所有节点必须在交易执行后同意状态）。
- 我们需要区块链特定的概念（例如，智能合约、交易）。
- 一些复杂的操作必须是原始的（例如，密码学）。
- 交易必须被沙盒化，不能有 I/O 或外部状态访问。

EVM 是第一个图灵完全的区块链虚拟机，于 2015 年发布。它有一些设计局限性，但其庞大的先发优势和随后的广泛采用使以太坊成为了一个巨大的差异化因素——它迄今为止是整个领域中最经战斗考验的智能合约基础设施。

由于以太坊的主导地位，许多后来的区块链直接采用了这个运行时环境。例如，Polygon 和 BNBChain 都是以太坊的直接分叉，因此使用 EVM 作为它们的运行时。值得注意的是，EVM 并非不可更改，而是经常在像 [EIP1559](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-1559.md) 这样的升级中被修改。当其他区块链需要时间进行更新，或者在多个地方与以太坊有所不同时，它们通常运行的是一个稍微过时的 EVM 版本，可能会难以跟上变化——这是一个可能 [让核心以太坊开发者感到沮喪的事实](https://twitter.com/peter_szilagyi/status/1550045859093499904)。

## 以太坊兼容性

然而，人们所说的“EVM 链”通常不仅仅是复制这个运行时环境。有几个主要的规范最初在以太坊上开始，并已成为事实上的全球标准：

- [Solidity](https://soliditylang.org/)（一种高级语言，编译成 EVM 字节码）
- [以太坊的 JSON-RPC 客户端 API](https://ethereum.github.io/execution-apis/api-documentation/)（与以太坊节点交互的规范）
- ERC20/ERC721（以太坊代币标准）
- [ethers.js](https://github.com/ethers-io/ethers.js/)（一个用于与以太坊接口的网络库）
- 以太坊的密码学（例如，作为哈希函数的 keccak256，基于 [secp256k1](https://en.bitcoin.it/wiki/Secp256k1) 的 ECDSA 签名）

从技术上讲，你的链可以有一个 EVM 运行时，而不支持上述某些或所有内容。然而，遵守这些标准会显著简化在你的新链上使用以太坊工具。一个很好的例子是 Polygon，除了使用上述所有工具外，还能运行一个分叉版本的 Etherscan（[Polygonscan](https://polygonscan.com/)），使用像 [Hardhat]({{< ref "../hardhat" >}}) 这样的以太坊开发工具，并被像 Metamask 这样的钱包支持作为一个不同的以太坊“网络”。像 [Nansen](https://www.nansen.ai/) 和 [Dune](https://dune.com/home) 这样的工具最初都是针对以太坊的，因此为新的 EVM 区块链添加支持非常简单。新钱包，新 NFT 市场——如果以太坊界面和你的链界面之间的唯一区别是链 ID，那么你很可能会是第一个也是最容易添加的。话虽如此，这些工具是为以太坊构建的——一旦你开始修改你的区块链（例如，更大的块，更快的块时间），你就有破坏它们的风险。没有所谓的完美兼容性。

然而，大量针对以太坊规范的工具和应用为新区块链仅仅复制以太坊标准创造了巨大的激励。任何不支持上述规范的区块链在开发者工具方面自动落后，并且随着 EVM 生态系统的增长，进一步增加落后风险。

我认为，“EVM 兼容”这个术语实际上并不足以描述这里所描述的网络效应——我们实际上描述的是“以太坊兼容性”，已经远远超出了智能合约执行环境，延伸到整个以太坊生态系统和工具集。

为了应对这一点，像 Solana 这样的非 EVM 区块链不得不创建完全平行的生态系统，这降低了它们的发展速度，并使吸引现有开发者变得更加困难。然而，不需要遵守这些标准确实给非 EVM 区块链提供了更多基础性变化的能力，从而更加激进地与以太坊区别开来。创建一个 EVM 区块链非常简单——但是为什么有人会选择使用你的而不是 [数百个其他“快速的 EVM 区块链”](https://chainlist.org/) 之一呢？如果你能越过需要构建成功的平行链和生态系统的难关，Solana 已经表明：a）你可以吸引出色的本地应用（例如，MagicEden、Phantom）和 b）如果商业激励足够，源于 EVM 的项目仍然会支持你（例如， [添加 Solana 支持的](https://decrypt.co/96334/opensea-solana-nfts-april)Opensea）。

![对比](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*ltfZ_1X5sTOCQGSzftCY8g.png)

## ZK-EVM

公共通用型 Rollup（批量打包和处理交易的解决方案）都有一个共同的目标：尽快吸引开发者和用户，以快速产生网络效应。这需要组合多个因素：创建性能最优的 Rollup 技术、拥有最佳的商务拓展团队，以及进行最早或最有效的市场营销。然而，出于上述原因，所有 Rollup 团队都非常关注以下几点：

- 将现有的以太坊合约（和开发者）迁移到他们的 Rollup。
- 能够得到现有 EVM 工具（例如库、钱包、市场等）的支持。

实现这两个目标的最简单方式是创建一个“zkEVM”：这是一个运行 EVM 作为其智能合约引擎的通用 Rollup，并且保持与上述描述的以太坊生态系统中常见接口的兼容性。

然而，这并不像我们创建一个全新的 L1 区块链时那样简单地去分叉 Geth（一种以太坊客户端）。我们的目标是运行 EVM 字节码，但 ZK-proof（零知识证明）需要将其证明的所有计算语句转换成一种非常特定的格式——“代数电路”，然后这个电路可以被编译成 STARK 或 SNARK。要快速理解“电路”，这里有一个 [例子](https://crypto.stackexchange.com/questions/87371/how-to-construct-a-circuit-in-zksnark)（使用一个更直观的 [布尔电路](https://en.wikipedia.org/wiki/Boolean_circuit) 作为 [算术电路](https://en.wikipedia.org/wiki/Arithmetic_circuit_complexity) 的一个特例）。在一个基于这个简单电路的 zkSNARK 系统中，我们的证明者希望能够说服验证者，他们知道输入（𝑥1 = 1, 𝑥2 = 1, 𝑥3= 0）可以产生一个输出为 true 的结果。这是一个非常简单的电路，有限数量的 [逻辑门](https://www.electronics-tutorials.ws/boolean/bool_7.html)——我相信你可以想象出，为了证明复杂的智能合约交互（特别是涉及加密的交互）需要多少个门来编码一个电路！

![circuit example](https://miro.medium.com/v2/resize:fit:880/format:webp/0*Q5oxllPkL-NUbJEo.png)

为了真正理解这个编译过程的每一个步骤，推荐 [Vitalik 的 从零到英雄- SNARKs 指南](https://www.jianshu.com/p/c81cb6c01d76) 以及 Eli Ben-Sasson [对不同证明系统的讨论](https://medium.com/starkware/the-cambrian-explosion-of-crypto-proofs-7ac080ac9aed) 会非常有启发。然而，就我们当前的目的而言，你不需要深入探究。关键的一点是，为了支持 EVM（以太坊虚拟机）的计算，我们需要将所有 EVM 程序转换成这些代数电路，以便以后能进行证明。

大致来说，有几种方法可以实现这一目标：

1. 直接证明 EVM 执行轨迹，通过将其转换成一个可验证的电路。
2. 创建一个定制的虚拟机，将 EVM 操作码映射到该虚拟机的操作码，然后在该定制环境中证明跟踪的正确性。
3. 创建一个定制的虚拟机，将 Solidity 代码转换成你的定制虚拟机的字节码（直接或通过一个定制的高级语言），然后在你的定制环境中进行证明。

### 选项 1：证明 EVM 执行轨迹

#### scroll

我们从最直观的方法开始：直接证明 EVM（以太坊虚拟机）的执行轨迹。这是 Scroll 团队（与以太坊基金会的隐私扩展小组合作）当前正在研究的一种方法。为了让这个工作成功，我们需要：

- 为某种加密累加器设计一个电路（这样我们可以准确地验证我们正在读取的存储，并加载正确的字节码）。
- 设计一个电路来将字节码与实际的执行轨迹连接起来。
- 为每个操作码设计一个电路（这样我们可以证明每个操作码的读取、写入和计算的准确性）。

直接在一个电路中实现每个 EVM 操作码是具有挑战性的，但由于这种方法完全模拟了 EVM，因此在可维护性和工具支持方面具有显著优势。下图显示了 Scroll 和以太坊之间唯一理论上的不同是实际的运行环境。值得注意的是，Scroll 目前尚未通过这种机制支持所有的 EVM 操作码，尽管他们打算随着时间的推移达到平衡。

![scroll](https://miro.medium.com/v2/resize:fit:712/0*Ikxp1M9K9WSlu9MS)

尽管是在 optimistic rollup 的背景下，Optimism 团队对这一主题有过非常精彩的 [讨论](https://medium.com/ethereum-optimism/introducing-evm-equivalence-5c2021deb306)。Optimism 最初为其 rollup 创建了一个自定义的 Optimistic Virtual Machine（OVM）。这个 OVM 是“与以太坊兼容的”，这意味着它可以运行经过修改的 Solidity 代码，但多个低级别的不匹配意味着以太坊的工具和复杂代码经常需要重新编写。因此，Optimism 转向了“与 EVM 等效”，直接使用精确的 EVM 规范，并正在开发 [第一个与 EVM 等效的反欺诈证明系统](https://github.com/geohot/cannon)。然而，optimistic rollup 不需要担心电路或证明者效率——适用于 Optimism 可能并不适用于我们的 rollup。

不幸的是，EVM 的核心架构并不适用于 zk-rollup。rollup 性能的一个核心衡量标准是将某个计算编码成一个电路所需的“约束”数量。在许多情况下，直接模拟 EVM 会带来巨大的开销。例如，EVM 使用 256 位整数，而 zk 证明更自然地适用于 [素数域](https://github.com/starkware-industries/stark101#finite-fields)。引入范围检查以应对不匹配的字段算术每个 EVM 步骤会增加约 100 个约束。以太坊的存储布局严重依赖于 keccak256，这在电路形式上比 STARK 友好的哈希函数（例如 [Poseidon](https://eprint.iacr.org/2019/458.pdf)，[Pedersen](https://iden3-docs.readthedocs.io/en/latest/iden3_repos/research/publications/zkproof-standards-workshop-2/pedersen-hash/pedersen.html)）大 1000 倍——但替换 keccak 将对现有的以太坊基础设施造成巨大的兼容性问题。

### 选项 2：自定义虚拟机+操作码支持

这一认识推动了团队采用上面提到的“与 EVM 兼容”的方法：创建一个性能优化的自定义虚拟机，然后直接将 EVM 字节码转换为您的虚拟机的字节码。

#### Polygon

专注于这种方法的一个团队是 Polygon Hermez（最近更名为 Polygon zkEVM）。Polygon 的方法是构建一个“[操作码级等效](https://www.youtube.com/watch?v=17d5DG6L2nw&t=621s)”的 zkEVM，这听起来最初与 Scroll 采取的方法相似。然而，与 Scroll 不同，Polygon 的替代运行时（即“zkExecutor”）运行 [定制的“zkASM”操作码](https://github.com/0xPolygonHermez/zkevm-rom/blob/main/main/opcodes.zkasm)，而不是 EVM 操作码，以优化 EVM 的解释（即减少与直接证明 EVM 相比的约束数量）。Hermez 团队将其描述为“基于操作码的方法”，因为核心挑战是在他们的自定义虚拟机中重新创建每个 EVM 操作码（您可以在 [这里](https://github.com/0xPolygonHermez/zkevm-rom) 查看代码），以便他们可以迅速地从 EVM 字节码转换为可验证的格式。

![polygon](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*FRKC4K6snpGCbaR4IAz9zA.png)

这些中间步骤增加了维护和潜在错误的风险，但这些步骤是实现高性能证明所必需的。最终，重要的是要明确，你的程序并没有在一个与 EVM 电路相对应的 zkEVM 中运行，而是在一个与 EVM 相似但又不同的“zkExecutor”运行时环境中运行。令人困惑的是，该团队既将其推广为“zkEVM”，也将其称为“EVM 等效” —— 然而，由于这个自定义的 zkASM 解释器，这个 rollup 实际上是根据上面 Optimism 的定义来说是“EVM 兼容”的。

![polygon & ethereum](https://miro.medium.com/v2/resize:fit:810/format:webp/1*Csk6S9YlUsNzGQbIifFM9w.png)

由于这个原因，该系统上运行的现有 L1 应用程序和工具可能会有一些不兼容性，尽管大多数 Solidity 代码可能可以原样运行。Polygon 已经宣布 [与现有的以太坊工具“100%兼容”](https://twitter.com/sandeepnailwal/status/1550176579489251328)，并承诺遵守 JSON-RPC，他们在 [文档](https://docs.hermez.io/#zknode-architecture) 中提到了这一点，并在 [这里](https://github.com/0xPolygonHermez/zkevm-node/blob/c501b3e8467dc663bf56ad0d984ce7a3f0c24ec3/jsonrpc/eth.go) 提供了一个实现。实际上，这一说法可能在自我鼓气，并且会依赖于以太坊本身变得更加适用于 SNARK。

Polygon 的方法比 Scroll 产生了更高性能的 rollup（至少在短期和中期内），但是也带来了：

- 大量的自定义代码，因为我们需要创建 zkASM
- 开发者可能需要修改他们的 L1 代码或工具框架的需求
- 随着时间的推移，可能会与以太坊产生更大的偏离

### 选项 3：自定义虚拟机+转译器

上述解决方案投入大量的开发时间在“使 EVM 适用于 zk-rollups”上，优先考虑的是兼容性而不是长期的性能和可扩展性。还有另一种选择：创建一个全新的、专门构建的虚拟机（VM），然后在其上添加对以太坊工具的额外支持层。

#### StarkNet

这就是 StarkWare 在 StarKNet 采取的的方法，它目前是最先进的通用目的 rollup。StarkNet 运行一个自定义的智能合约虚拟机（Cairo VM），有自己的低级语言（Cairo），两者都是专为智能合约 rollups 量身定制的。这意味着 StarkNet 没有开箱即用的以太坊兼容性——正如我们之前看到的，即使是操作码级别的 VM 级别兼容性也可能会对 rollup 性能产生潜在的制动作用。

![StarkNet vs ethereum](<https://miro.medium.com/v2/resize:fit:798/0*Z8FEq-FtZ2XlnPN>_)

然而，Nethermind 团队（与 StarkWare 合作）创建了 [Warp 转译器](https://nethermind.io/warp/)，该转译器能够将任意 Solidity 代码转换为 Cairo VM 字节码。Warp 的目标是使常见的 Solidity 合约可以移植到 StarkNet——实现许多以太坊开发者在谈到“EVM 兼容性”时的主要目标。然而，在实践中，有一些 Solidity 功能 Warp 不支持，包括低级调用（完整列表可以在 [这里](https://github.com/NethermindEth/warp) 找到）。

这种构建智能合约 rollup 的方法是维护“Solidity 兼容性”：你并不是在 EVM 内执行程序，也不是与任何其他以太坊接口保持兼容性，但 Solidity 开发者将能够编写可以在你的 rollup 上使用的代码。因此，你可以维护与以太坊相似的开发者体验，而无需妥协你的 rollup 的基础层——两全其美。

然而，这种方法还有几个额外的权衡。首先，构建自己的 VM 是具有挑战性的——以太坊团队已经有超过半个十年的时间来解决 EVM 的问题，并且仍然经常进行升级和修复。更自定义的 rollup 将允许更好的性能，但你将失去其他所有链和 rollup 对 EVM 所做集体改进的好处。

其次，通过转译器支持 Solidity 有可能导致组合性的损失——如果开发者既在 CAIRO 也在 Solidity 中编写合约，那么支持两者之间接口的工具很可能会变得脆弱。到目前为止，绝大多数 StarkNet 项目都直接使用了 CAIRO，它们可能不会很容易地与未来的 Solidity 项目组合在一起。最后，也可能是最重要的，StarkNet 团队目前并不打算与其他以太坊组件保持兼容性——他们正在推出自己的客户端 API、JavaScript 库和钱包系统，这将迫使以太坊兼容工具手动添加 StarkNet 支持。这极具挑战性，但并非不可能——正如上面所概述的，Solana 已经足够成功，以至于一些以太坊工具尊重了其自定义标准，但这将依赖于 StarkWare 团队吸引那些不介意重新构建的开发者的能力。

然而，如果他们能够成功做到这一点，StarkWare 团队将寻求复制 EVM 的先发优势，创建第一个为 zk-rollups 优化的智能合约 VM。

#### zkSync

采用这种策略的另一个团队是 [zkSync](https://zksync.io/)。zkSync 创建了他们自己的 VM（SyncVM），该 VM 基于寄存器，并定义了自己的代数中间表示（AIR）。然后，他们构建了一个 [专门的编译器](https://github.com/matter-labs/compiler-solidity)，将 Yul（一种可以编译为不同 EVM 版本的字节码的中间语言，可以认为是一个更低级的 Solidity）编译为 LLVM-IR，然后将其编译为他们自定义 VM 的指令。这与 StarkWare 采取的方法相似，但理论上提供了更多关于基础语言的灵活性（尽管目前仅支持 Solidity 0.8.x）。zkSync 团队最初创建了他们自己的类似 CAIRO 的语言（[Zinc](https://github.com/matter-labs/zinc)），但已经将大部分努力转向专注于 Solidity 编译器，以便为 L1 开发者提供更简单的迁移。总体而言，他们的策略是比 StarkNet 重用更多的以太坊工具集——我预计他们的客户端 API 等也会更“兼容以太坊”。

![zkEVM compiler](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*U56KlFn0aySbQ98NlyLV5A.png)

zkSync 通过使用这种自定义 VM 来实现非 EVM 兼容的功能，比如 [账户抽象化（Account Abstraction）](https://v2-docs.zksync.io/dev/zksync-v2/aa.html#introduction)，这一直是以太坊核心协议的 [长期目标](https://eips.ethereum.org/EIPS/eip-2938)。这是自定义 VM 所提供好处的一个很好的例子——你不必等待以太坊构建新功能！

![zksync vs etherem](https://miro.medium.com/v2/resize:fit:776/0*R1YxjzxmO3nJAuwd)

总结来说，你可以明显看到每个团队选择了不同的策略来解决与 zk-rollups 和 EVM 兼容性相关的挑战：

![compare](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*R7ZWNWqkX35Z-oEgR1WkTA.png)

## Vitalik 的 zkEVM 类型

Vitalik Buterin 在其 [关于 zkEVMs 的博客](https://vitalik.eth.limo/general/2022/08/04/zkevm.html) 中强调了目前 rollup 团队面临的根本性困境：EVM 并没有为“可验证”的程序而构建。实际上，正如我们通过上面的分析所展示的，你寻求与以太坊越兼容，你的“可验证格式”的程序就会越不高效。Vitalik 根据它们与现有 EVM 基础设施的兼容度，为通用目的的 rollups 确定了几个广泛的类别：

![vitalik zkevm type](https://miro.medium.com/v2/resize:fit:1400/0*yBXBhh6Fj-gzFhrZ)

对他的论点我想做的唯一扩展是注意到，即使在每个“类型”内部也存在相当大的可变性——我们在处理一个谱系，而不是完全分割的类别。从开发者体验的角度看，对应用层进行了一次小改动的类型 3 rollup 与类型 2 rollup 有更多的共同之处，而与对应用层进行了大量改动但技术上没有引入新 VM 并成为类型 4 的类型 3 rollup 相比。

## 智能合约 Rollups 的当前状态

考虑到理解上述内容所需的详细程度，我们围绕以太坊兼容性发明了一堆令人困惑的术语并不奇怪。事实上，没有一个 zk-rollup 能在所有情况下完美地复制 EVM 的行为——这都是一个程度的问题，每个团队做出的详细选择最终将在维护性和性能方面起到最大的作用，而不仅仅是兼容性。我认为以下定义是最清晰和最一致的：

![tb](https://miro.medium.com/v2/resize:fit:1400/format:webp/1*mItDUyyh6mTaq8iW2un0sw.png)

重要的是要明白，以上这些方法没有哪一个是固有地优越的——这是一种分类，而不是层级。它们都做出了不同的权衡：更容易构建、维护和升级，性能更高，更容易与现有工具兼容。最终，领先的 rollup 也将由更好的分发和营销决定，而不仅仅是纯粹的技术能力。尽管如此，做出正确的基础技术决策无疑有很大的优势。Scroll 对 EVM 规范的狂热承诺会使他们能轻易地应对任何 EVM 的升级吗？另一个团队更务实的方法会帮助他们更快地进入市场吗？StarkWare 的自定义 VM+转译器方法是否会证明是长期扩张的更稳固基础？还是另一个团队会从这个领域的第一批参与者无疑会犯的错误中吸取教训，并抢在他们之前达成目标？最终，以太坊发展当前时刻的美妙之处在于，我们有不同的团队用截然不同的方法推动着一个共同的目标。

但在我们过于激动之前，也应该对智能合约 rollup 的当前准备状况保持冷静。每个团队都有强烈的动机将自己宣传为“即将接管世界”——但最早也要到 2022 年底，以太坊上才会有“生产级别”的智能合约 rollups，而且许多这些团队直到 2023 年深入之后才会准备好。基于 StarkNet 的经验，我们应该预期从 rollup 进入测试网开始至少需要一年的迭代，然后这个 rollup 才准备好在主网上支持稳定的生产级别的交易量。

![timeline](https://miro.medium.com/v2/resize:fit:1272/format:webp/1*xdiOctbvDiwkrkTh2hU1pw.png)

由于这种不成熟的状态，应用特定的 rollup 仍然是那些需要在不妥协以太坊安全性的前提下扩展规模的开发者最强大的选择。实际上，即使在通用 rollup 可用并更广泛地集成之后，我预计应用特定 rollup 的性能、自定义能力和可靠性在某些用例（例如交易所、NFT 的铸造/交易）上在可预见的未来仍将优越。

## 其他 Rollup 因素

尽管这篇文章的主要关注点是以太坊生态系统的兼容性与性能，但还有其他一些因素会影响你是否应该在某个特定的通用 rollup 上构建。我将提出几个主要的额外标准：

- 费用：这些 rollup 会以原生代币、以太币或者两者的复杂组合收取费用吗？费用结构对用户和开发者体验有巨大影响，因为 rollup 经常需要拥有手续费代币以支付计算费用。
- 证明和排序：所有的 rollup 都需要一个负责交易排序和生成证明的实体。目前大多数应用特定的 rollup 是“单一排序者”，这提供了更高的吞吐量，但以牺牲韧性为代价。大多数通用 rollup 最初都是作为单一排序者 rollup 开始的，但它们通常计划随着时间的推移去中心化这个排序者。
- 自我保管：zk-rollup 的核心承诺是在保留以太坊安全性的同时解锁规模。然而，许多通用 rollup 目前没有明确的机制来在恶意或不可用的排序者事件中恢复用户资产。
- 数据可用性：如简介所述，自我保管的保证受到状态数据在故障情况下的可用性的制约。然而，完全的数据可用性为用户引入了额外的成本，从而导致了一系列的数据可用性模式。这在应用特定的 rollup 世界（例如 Validiums、Volitions）中已经被广泛使用，但每个通用 rollup 都需要单独添加这个功能。

![factor](https://miro.medium.com/v2/resize:fit:1320/format:webp/1*0_DLxq1nTTBbdnX4DRuHJg.png)

## 总结

智能合约 rollup 是以太坊扩展路线图中令人极为兴奋的一部分。这些 rollup 与现有的以太坊工具集之间的不同权衡是以太坊开发者生态系统多样性的惊人见证。

然而，当前关于 EVM 兼容性的讨论通常是失焦的。从开发者的角度看，所有这些 rollup 都将支持 Solidity 代码。真正的以太坊兼容性是一个更大的挑战，但这实际上是有重大权衡的，开发者在承诺使用一个 rollup 之前应该注意到这一点。目前，大多数 rollup 项目都在大量“预售” - 销售他们的 3 年多的愿景，而不是今天（甚至在 12 个月内）可能实现的功能，这可能会严重混淆视听。

为了透明化，我希望每个主要的 rollup 团队能对以下问题提供更清晰的答案：

L1 和 L2 之间的运行时的精确区别是什么？ L2 上将修改哪些操作码？ L1 和 L2 的其他 VM 特性（例如费用结构）会有不同吗？
你的自定义 VM 的正式规范在哪里，它的性能比其他选项更好/更差的地方在哪里？
这个 rollup 将对其他以太坊接口（例如客户端 API、库）进行多少次更改，从而破坏以太坊工具？
这个 rollup 什么时候会在测试网上线？ 在主网上？ 能够支持 1000+ 自定义合约 tps 的持续生产吞吐量？

您预计什么时候会支持用户资产的完全自我保管，以及这在通用 rollup 的上下文中会是什么样子？
一旦这些 rollup 在测试网上发布，回答这些问题应该会更容易。在此之前，我很想看到团队们继续发布有关他们的解冓方案将做出的确切权衡的更多技术细节，以及这将如何影响智能合约和工具开发人员。

随着合并即将来临，经过战斗考验的应用特定 rollup 在生产中，以及通用 rollup 在接下来的一年中将进入主网，以太坊的扩展未来就在眼前。

如果没有整个 rollup 社区的帮助，特别是所有给予预发行反馈的人，这篇文章永远不会完成 - 我非常感激！任何剩下的错误都是我的，由于这篇文章的很大一部分是从未发布的代码、旧的会议演示和未完成的文档中综合得出的，我预计会有很多。如果你认为应该进行更新或澄清，请随时给我发送 Twitter DM。

如果你想使用 rollup 技术的未来将世界上最大的游戏吸引到以太坊，Immutable 正在招聘！

Alex Connolly, Immutable 共同创始人 & CTO
