---
title: "Bridge"
description: 以太坊 bridge
slug: bridge
date: 2023-03-23T01:49:11+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
tags:
  - data
---

## 概述[^1]

随着 L1 区块链和 L2 扩展解决方案的激增，以及越来越多的去中心化应用程序进行跨链，跨链通信和资产转移的需求已成为网络基础设施的重要组成部分。

区块链本身彼此孤立，也就是说无法跨链进行交易和通信，这限制了生态系统内的重大活动和创新。通过 bridge， 代币、消息、任意数据，甚至智能合约调用都可以跨链进行。

## 好处

简单地说，bridge 通过允许区块链网络在它们之间交换数据和移动资产来解锁众多使用场景。

区块链有独特的优势、劣势和构建应用的方法（如速度、吞吐量、成本性等）。bridge 通过使区块链能够利用彼此的创新来帮助整个加密货币生态系统的发展。

对于开发者来说，bridge 可以实现以下功能：

- 跨链转移任何数据、信息和资产。
- 为协议解锁新的功能和使用场景。例如，最初部署在 Ethereum Mainnet 上的产量养殖协议可以在所有 EVM 兼容的链上提供流动资金池。
- 有机会利用不同区块链的优势。例如，开发人员可以通过在 rollup 上部署他们的 dapp，从不同的 L2 解决方案提供的较低费用中受益，侧链和用户可以在它们之间建立 bridge。
- 来自不同区块链生态系统的开发者之间可以合作建立新产品。
- 吸引来自不同生态系统的用户和社区到他们的 dapps。

## 如何运作

虽然有许多类型的 bridge 设计，但有三种资产跨链转移的方式非常突出：

- 锁定和造币(lock and mint)：在源链上锁定资产，在目的链上造币。
- 烧毁和造币(burn and mint)：在源链上烧毁资产，在目的链上铸造资产。
- 原子交换(atomic swap)：用源链上的资产与另一方交换目的链上的资产。

## 类型

bridge 通常可以分为以下几类：

- 原生 bridge。这类 bridge 通常是为了在特定的区块链上引导流动性，使用户更容易将资金转移到生态系统中。例如，[Arbitrum bridge](https://bridge.arbitrum.io/) 的建立是为了方便用户从以太坊主网 bridge 到 Arbitrum。类似的还有 Polygon PoS bridge，[Optimism Gateway](https://app.optimism.io/bridge)等。
- 基于验证器或 oracle 的 bridge。这类 bridge 依靠外部验证器组或 oracle 来验证跨链传输。比如：Multichain 和 Across。
- 通用信息传递 bridge。这类 bridge 可以跨链传输资产，以及信息和任意数据。比如 Nomad 和 LayerZero。
- 流动性网络。这类 bridge 主要侧重于通过原子交换将资产从一个链转移到另一个链。一般来说，它们不支持跨链信息传递。例如 Connext 和 Hop。

## 权衡因素

对于 bridge，没有完美的解决方案。相反，只有权衡才能达到目的。开发人员和用户可以根据以下因素来评估 bridge：

- 安全性。 谁来验证系统？由外部验证者保证的 bridge 通常不如由区块链验证者保证的本地或原生的 bridge 安全。
- 方便性。 完成一笔交易需要多长时间，用户需要签署多少笔交易？对于开发者来说，整合一个 bridge 需要多长时间，这个过程有多复杂？
- 连接性。 一个 bridge 可以连接哪些不同的目标链（如 rollup、侧链、其他一层区块链等），以及整合一个新的区块链有多难？
- 传递更复杂数据的能力。bridge 能否实现消息和更复杂的任意数据的跨链传输，还是只支持跨链资产传输？
- 成本效益。通过 bridge 跨链转移资产的成本是多少？通常情况下，bridge 会根据 Gas 成本和特定路线的流动性收取固定或可变费用。在确保 bridge 资金的安全性前提下，来评估 bridge 的成本效益也很关键。

在一个较高的水平上，bridge 可以分为受信任和无信任的。

- 受信任的。受信任的 bridge 是经过外部验证的。它们使用一组外部验证器（具有多重签名的联盟，多方计算系统，oracle 网络）来跨链发送数据。因此，它们可以提供巨大的连接性，并实现跨链的完全通用的消息传递。它们也倾向于在速度和成本效益方面表现良好。这是以安全为代价的，因为用户必须依赖 bridge 的安全性。
- 无信任。这些 bridge 依赖它们所连接的区块链及其验证者来传输消息和代币。它们是“无信任”的，因为它们不增加新的信任假设（除了区块链）。因此，无信 bridge 被认为比可信 bridge 更安全。

为了根据其他因素评估无信任 bridge，我们必须将其分解为一般化的消息传递 bridge 和流动性网络。

- 通用信息传递 bridge。 这些 bridge 在安全性和跨链传输更复杂数据的能力方面表现出色。通常情况下，它们在成本效益方面也很好。然而，这些优势对于轻型客户 bridge （例如：IBC）来说通常是以连接性为代价的，对于使用欺诈证明的乐观型 bridge （例如：Nomad）来说则是以速度为代价的。
- 流动性网络。这些 bridge 使用原子互换来转移资产，并且是本地验证系统（即，它们使用底层区块链的验证器来验证交易）。因此，它们在安全性和速度方面都很出色。此外，它们被认为性价比高，并提供良好的连接。然而，主要的权衡是它们无法传递更复杂的数据--因为它们不支持跨链消息传递。

## 风险

bridge 占了 DeFi 最大黑客的[前三名](https://rekt.news/leaderboard/)，而且仍处于发展的早期阶段。使用任何 bridge 都有以下风险：

- 智能合约风险。虽然许多 bridge 已经成功通过审计，但只要智能合约有一个缺陷，资产就会暴露在黑客面前（例如：[Solana 的虫洞 bridge](https://rekt.news/wormhole-rekt/)）。
- 系统性金融风险。许多 bridge 使用包装的资产在新的链上铸造原始资产。这使生态系统面临系统性风险，因为我们已经看到包装好的代币被利用。
- 交易对手的风险。一些 bridge 利用可信的设计，要求用户依赖验证者不会串通起来窃取用户资金的假设。用户需要信任这些第三方行为者，这使他们暴露在诸如 rug pull、审查和其他恶意活动的风险中。
- 未解决的问题。鉴于 bridge 处于发展的初级阶段，有许多未解决的问题与 bridge 在不同的市场条件下的表现有关，如网络拥堵的时候和在不可预见的事件中，如网络级攻击或状态回滚。这种不确定性带来了一定的风险，其程度尚不清楚。

## DAPP 集成

这里有一些实际的应用，开发者可以考虑关于 bridge 和让如何让 dapp 跨链：

### 集成 bridge

对于开发者来说，有很多方法可以增加对 bridge 的支持：

- 建立自己的 bridge。建立一个安全可靠的 bridge 并不容易，如果采取信任最小化的路线更是如此。此外，它需要多年的经验，与可扩展性和互操作性研究有关的技术专长。此外，它还需要一个实践团队来维护 bridge，并吸引足够的流动资金来使其可行。

- 向用户展示多种 bridge 选择。许多 [dapp](https://ethereum.org/en/developers/docs/dapps/) 要求用户拥有他们的原生代币来进行互动。为了使用户能够访问他们的代币，他们在网站上提供不同的 bridge 选项。然而，这种方法是一个快速解决问题的方法，因为它使用户离开了 dapp 界面，仍然需要他们与其他 dapp 和 bridge 互动。这是一种繁琐的使用体验，犯错的范围也会增加。

- 集成一个 bridge。这种解决方案不需要 dapp 把用户送到外部 bridge 和 DEX 接口。它允许 dapp 改善用户的使用体验。然而，这种方法也有其局限性：
  - 评估和维护 bridge 是很难的，而且很耗时。
  - 选择一个 bridge 会产生一个单点故障和依赖性。
  - dapp 受限于 bridge 的能力。
  - 仅有 bridge 可能是不够的。dapp 可能需要 DEX 来提供更多的功能，如跨链交换。
- 集成多个 bridge。这种解决方案解决了与整合单一 bridge 相关的许多问题。然而，它也有局限性，因为整合多个 bridge 需要消耗资源，并为开发者带来技术和通信开销--这是加密货币中最稀缺的资源。
- 集成 bridge 聚合器。 dapp 的另一个选择是集成一个 bridge 聚合解决方案，让他们可以访问多个 bridge。bridge 聚合器继承了所有 bridge 的优势，因此不受任何单一 bridge 能力的限制。值得注意的是，bridge 聚合器通常会维护 bridge 集成，这使 dapp 不用再为 bridge 集成的技术和操作方面的问题而烦恼。

话虽如此，bridge 聚合器也有其局限性。例如，虽然他们可以提供更多的 bridge 选项，但除了聚合器平台上提供的 bridge 外，市场上通常还有更多的 bridge 可供选择。此外，就像 bridge 一样，bridge 聚合者也面临着智能合约和技术风险（更多的智能合约=更多的风险）。

如果一个应用程序走的是整合 bridge 或聚合器的路线，那么根据整合的深度，有不同的选择。例如，如果它只是一个前端整合，以改善用户的入职体验，一个 dapp 会整合小工具。然而，如果整合是为了探索更深层次的跨链策略，如赌注、 yield farming 等，dapp 会整合 SDK 或 API。

### 在多条链上部署一个 dapp

要在多个链上部署一个 dapp，开发人员可以使用 [Alchemy](https://www.alchemy.com/)、[Hardhat](https://hardhat.org/)、[Truffle](https://trufflesuite.com/)、[Moralis](https://moralis.io/) 等开发平台。通常情况下，这些平台都有可组合的插件，可以使 dapp 实现跨链。例如，开发者可以使用 [hardhat-deploy 插件](https://github.com/wighawag/hardhat-deploy)提供的确定性部署代理。

实例：

- [如何构建跨链 dapps](https://moralis.io/how-to-build-cross-chain-dapps/)
- [建立一个跨链的 NFT 市场](https://youtu.be/WZWCzsB1xUE)
- [Moralis: 构建跨链的 NFT dapps](https://www.youtube.com/watch?v=ehv70kE1QYo)

### 监控跨链的合约活动

为了监测跨链的合约活动，开发者可以使用 subgraphs 和 Tenderly 等开发者平台来实时观察智能合约。这类平台也有一些工具，为跨链活动提供更多的数据监测功能，如检查合同发出的事件等。

- [The Graph](https://thegraph.com/en/)
- [Tenderly](https://tenderly.co/)

## 参考

[^1]: [bridge](https://ethereum.org/en/developers/docs/bridges/)
