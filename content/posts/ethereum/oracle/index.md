---
title: "Ethereum Oracles"
description: 以太坊预言机
slug: ethereum-oracle
date: 2023-03-07T11:14:15+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - oracle
---

本文介绍以太坊预言机。

<!--more-->

## 概述

[Oracle](https://ethereum.org/en/developers/docs/oracles/) 作为“桥梁”将区块链上的智能合约与链下的数据提供者连接起来。通过 Oracle，不仅可以“拉取 (`pull`)”链下数据并在以太坊上广播，还可以从区块链上“推送 (`push`)”信息到外部系统。

Oracle 可以从不同角度进行分类：

- 基于数据来源：一个或多个来源
- 信任模型：中心化或分布式
- 系统架构：
  - 即时读取 (immediate-read)
  - 发布-订阅 (publish-subscribe)
  - 请求-响应 (request-response)
- 数据流向：
  - 输入型 (input oracles)：是否否检索外部数据供链上合约使用
  - 输出型 (output oracles)：从区块链上发送信息给链下应用
  - 计算型 (computational oracles)：在链下执行计算任务

## 为什么需要 Oracle

以太坊是一个确定性系统，也就是说在初始状态和输入确定的情况下总是产生相同的结果，中间不会有随机变化。

为了实现确定性的执行，区块链要求节点在所有问题上达成共识，而且只使用存储在区块链本身的数据。

如果区块链接收来自外部的信息，就不可能实现确定性，这就使得节点无法就区块链状态达成共识。比如一个智能合约根据从外部 API 获得当前 `ETH/USD` 汇率执行交易。这个数字可能会经常变化（更别说 API 可能会被废弃或被黑），这意味着执行相同合约代码的节点会得出不同的结果。

对于像以太坊这样的公共区块链来说，全世界有成千上万的节点在处理交易，确定性是至关重要的。不同的节点如果不能就计算结果达成共识，以太坊作为一个去中心化计算平台的价值也就不复存在。

Oracles 通过从链下来源获取信息并将其存储在区块链上供智能合约使用来解决这个问题。由于存储在链上的信息是不可改变的，并且是公开的，所以以太坊节点可以安全地使用 Oracle 导入的链下数据来计算状态变化而不破坏共识。

为了做到这一点，Oracle 通常是由一个运行在链上的智能合约和一些链下的组件组成的。链上合约接收来自其他智能合约的数据请求，并将其传递给链下组件（称为`Oracle Node`）。`Oracle Node`可以查询数据源并发送交易，将请求的数据存储在链上的 Oracle 智能合约中。

从本质上讲，Oracle 弥合了区块链和外部环境之间的信息差距，创造了“混合智能合约 (`hybrid smart contracts`)”。混合智能合约基于链上合约代码和链下基础设施的组合而运作。之前描述的去中心化的预测市场价格的合约就是混合智能合约的一个很好的例子。

## Oracle 面临问题

通过将链下信息其存储在交易 (`transaction`) 的数据有效载荷 (`payload`) 中，就可以让智能合约访问链下数据。但这带来了新的问题：

- 如何验证 payload 的信息是从正确的来源提取的，或者没有被篡改过？
- 如何确保这些数据始终可用并定期更新？

所谓的`Oracle Problem`展示了使用 Oracle 向智能合约时出现的问题：

- 必须确保来自 Oracle 的数据是正确的，否则智能合约的执行将产生错误的结果；
- 无信任 (`trustlessness`) 同样重要：如果必须信任 Oracle 操作者可靠地提供准确的信息，也就使智能合约失去了其最具决定性的品质。

不同的 Oracle 在解决上述问题的方法上有所不同，我们将在后面探讨这些方法。虽然没有一个 Oracle 是完美的，但可以通过它们如何处理以下挑战来判断其优劣：

- 正确性。Oracle 不应该导致智能合约基于无效的链下数据而触发状态变化。为此，Oracle 必须保证数据的真实性和完整性：
  - 真实性意味着数据是从正确的来源得到的
  - 完整性意味着数据在被发送到链上之前保持完整（即它没有被改变）。
- 可用性。Oracle 不应该延迟或阻止智能合约执行行动和触发状态变化。这种要求来自 Oracle 的数据可以不受干扰地按要求提供。
- 激励。Oracle 应该激励链下数据提供者向智能合约提交正确的信息，根据所提供的信息的质量进行奖惩。

## Oracle 如何工作

### Users

`Users` 是需要区块链下部信息来完成特定行动的智能合约，将其称之为“客户合约”，基本工作流程始于其向 Oracle Contract 请求以下信息：

- 链下节点可以咨询哪些来源的请求信息？
- Oracle Contract 如何处理来自数据源的信息并提取有用的数据点？
- 有多少个链下节点可以参与检索数据？
- 应该如何管理 oracle 报告中的差异？
- 如何过滤提交的数据和将报告汇总为一个单一的数值？

### Oracle Contract

Oracle Contract 是 Oracle 服务的链上组件：它监听来自其他合约的数据请求，将数据查询转发给`Oracle Node`，并将返回的数据经过处理广播给客户合约。

Oracle Contract 对外提供一些供客户合约请求时调用的功能。在收到一个新的查询后，智能合约将发出一个包含数据请求细节的 [日志事件 (log event)](https://ethereum.org/en/developers/docs/smart-contracts/anatomy/#events-and-logs)。这将通知订阅（通常使用类似 `JSON-RPC eth_subscribe` 命令）了日志的链下节点，由这些节点检索日志事件中定义的数据。

Pedro Costa 上 [Oracle Contract](https://medium.com/@pedrodc/implementing-a-blockchain-oracle-on-ethereum-cedc7e26b49e) 是一个简单的 Oracle 服务，可以根据其他智能合约的请求查询链下 API，并将请求的信息存储在区块链上。

### Oracle Node

`Oracle Node`是 Oracle 服务的链下组件：它从外部来源（如第三方服务器上托管的 API）提取信息，并将其放在链上供智能合约消费。Oracle Node 监听来自链上 Oracle Contract 的事件，并着手完成日志中描述的任务。

`Oracle Node`的一个常见任务是向 API 服务发送 `HTTP GET` 请求，解析响应以提取相关数据，转换为区块链可读的输出，并通过将其纳入到 Oracle Contract 的交易中在链上发送。`Oracle Node`也可能被要求使用“真实性证明 (authenticity proofs)”来证明所提交信息的有效性和完整性，这一点将在后面探讨。

计算型 Oracle 也依靠链下节点来执行密集的计算任务，考虑到 Gas 成本和区块大小的限制，这些任务在链上执行是不现实的。

## 设计模式

Oracle 有不同的类型，包括即时读取、发布-订阅和请求-响应，其中后两种在以太坊智能合约中最受欢迎。下面是对这两种类型的 Oracle 服务的简要描述。

### 发布-订阅

基于发布-订阅机制的 Oracle 服务暴露了一个其他合约可以定期读取信息“数据源”。这种情况下的数据预计会经常变化，所以客户合约必须监听 Oracle 存储中数据的更新。一个向用户提供最新 `ETH/USD` 价格信息的 oracle 就是个很好的例子。

### 请求-响应

请求-响应设置允许客户合约请求除“发布-订阅”所提供的数据之外的任意数据。“请求-响应”适用于：

- 数据集太大，无法存储在智能合约的存储中
- 用户在任何时间点都只需要一小部分的数据

发起数据查询的用户必须支付从链下源检索信息的费用。客户合约也必须提供资金来支付 Oracle Contract 通过请求中指定的回调函数返回响应所产生的 Gas 成本。

## 中心化 Oracle

中心化 Oracle 由一个实体控制，负责汇总链下信息并根据要求更新 Oracle Contract 的数据。中心化 Oracle 高效是因为它们依赖于单一的数据来源。在专有数据集由所有者直接发布、并有广泛接受的签名的情况下，它们甚至可能更好。然而，使用中心化的 Oracle 也有各种问题。

### 低正确性保证

使用中心化 Oracle，没有办法确认所提供的信息是否正确。Oracle 提供者可能是 "有信誉的"，但这并不排除有人叛变或黑客篡改系统的可能性。如果 Oracle 出问题，智能合约将基于坏的数据执行。

### 可用性差

中心化 Oracle 并不能保证总是将链下数据提供给其他智能合约。如果供应商决定关闭服务，或者黑客劫持了 Oracle 的链下组件，智能合约就有可能受到拒绝服务（DoS）的攻击。

### 激励兼容性差

中心化的 Oracle 往往不存在对数据提供者发送准确/未篡改信息的激励措施，或设计得很差。为 Oracle 的服务付费可能会鼓励诚实的行为，但这可能是不够的。随着智能合约控制了巨大的价值，操纵 Oracle 数据的回报比以往任何时候都大。

## 去中心化的 Oracle

去中心化的 Oracle 旨在通过消除单点故障来克服中心化 Oracle 的限制。一个去中心化的 Oracle 服务由点对点网络中的多个参与者组成，他们在将链下数据发送给智能合约之前对其形成共识。

一个去中心化的 Oracle（理想情况下）应该是无特权的，无信任的，并且不受中心化团体的管理；实际上，预言机之间的去中心化是在一个范围内的。在现实中，有一些半去中心化的 Oracle 网络，任何人都可以参与，但有一个 "所有者"，根据历史表现来批准和删除节点。完全去中心化的 Oracle 网络也存在：这些网络通常作为独立的区块链运行，并有明确的共识机制来协调节点和惩罚不当行为。

使用去中心化的 Oracle 网络有以下好处：

### 保证高正确性

去中心化的 Oracle 试图使用不同的方法来实现数据的正确性。这包括证明返回信息的真实性和完整性，以及要求多个实体集体同意链下数据的有效性。

#### 真实性证明

真实性证明是加密机制，能够独立验证从外部来源检索的信息。这些证明可以验证信息来源，并检测可能的数据改动。

真实性证明的例子包括：

- 传输层安全（TLS）证明。Oracle Node 经常使用基于传输层安全（TLS）协议的安全 HTTP 连接从外部来源检索数据。一些分散的 Oracle 使用真实性证明来验证 TLS 会话（即确认节点和特定服务器之间的信息交换），并确认会话的内容没有被改变。
- 受信任的执行环境（TEE）证明。可信执行环境（TEE）是一个沙盒式的计算环境，与主机系统的操作流程隔离。TEE 确保在计算环境中存储/使用的任何应用程序代码或数据都能保持完整性、保密性和不可更改性。用户还可以生成一个证明，以证明一个应用实例是在可信执行环境中运行的。

某些类别的去中心化 Oracle 要求 Oracle Node 操作提供 TEE 证明。这向用户证实了节点操作正在可信的执行环境中运行一个 Oracle Client 实例。TEE 防止外部进程改变或读取应用程序的代码和数据，因此证明了 Oracle Node 保持了信息的完整和机密。

### 基于共识的信息验证

中心化 Oracle 机构在向智能合约提供数据时依赖于单一来源，这就带来了发布不准确信息的可能性。去中心化的 Oracle 通过依靠多个 Oracle Node 查询链下信息来解决这个问题。通过比较多个来源的数据，去中心化的 Oracle 减少了向链上合约传递无效信息的风险。

去中心化的 Oracle 必须处理从多个链下来源检索的信息的差异，确保传递给 Oracle Contract 的数据反映了 Oracle Node 的集体意见，为此使用了以下机制。

#### 对数据的准确性进行投票/质押

一些去中心化的 Oracle 网络要求参与者使用网络的原生代币对数据查询的答案的准确性进行投票或质押。然后，一个汇总协议将投票和质押汇总，并将多数人支持的答案作为有效答案。

那些答案偏离多数人答案的节点会受到惩罚，他们的代币会被分配给提供更多正确答案的其他人。迫使节点在提供数据之前提供保证金，奖励诚实的响应，因为他们被认为是理性的经济行为者，意图实现收益最大化。

质押/投票还可以保护去中心化信标免受 "Sybil 攻击"，即恶意行为者创建多个身份来玩弄共识系统。然而，质押不能防止“freeloading”（Oracle Node 从其他人那里复制信息）和“lazy validation”（Oracle Node 跟随大多数人而不自己验证信息）。

#### Schelling point mechanisms

[`Schelling point`](<https://en.wikipedia.org/wiki/Focal_point_(game_theory)>) 是一个博弈论的概念，它假设多个实体在没有任何交流的情况下总是默认为一个共同的解决方案。Schelling point 机制经常被用于去中心化的 Oracle 网络中，以使各节点对数据请求的答案达成共识。

一个早期的例子是 [SchellingCoin](https://blog.ethereum.org/2014/03/28/schellingcoin-a-minimal-trust-universal-data-feed/)，这是一个提议的数据源，参与者提交对“scalar”问题（答案由量级描述的问题，例如，"ETH 的价格是多少？"）的回应，同时也提交押金。得分在 25-75 [分位数](https://en.wikipedia.org/wiki/Percentile) 之间的用户会得到奖励，而那些数值基本偏离中位数的用户会受到惩罚。

虽然 SchellingCoin 今天并不存在，但一些去中心化的 Oracle（特别是 [Maker Protocol 的 Oracle](https://docs.makerdao.com/smart-contract-modules/oracle-modules)) 使用 schelling point 机制来提高 Oracle 数据的准确性。每个 Maker Oracle 由一个链下的提交质押资产的市场价格的 P2P 网络节点（"relayers" and "feeds"）以及一个链上计算所有提供价值的中值的“Medianizer”合约组成。一旦指定的截止日期结束，这个中值将成为相关资产的新参考价格。

其他使用 Schelling point 机制的 Oracle 的例子包括 [Chainlink Off-Chain Reporting](https://docs.chain.link/docs/off-chain-reporting/) 和 Witnet。在这两个系统中，点对点网络中的 Oracle Node 的响应被汇总成总值，如平均值或中位数。节点根据其响应与总值的一致或偏离程度而受到奖惩。

Schelling point 机制是有吸引力的，因为它们最大限度地减少了链上的操作（只需要发送一笔交易），同时保证去中心化。

#### 可用性

去中心化的 oracle 服务确保了智能合约的链下数据的高可用性。这是通过去中心化链下信息源和负责在链上传输信息的节点（合约节点）来实现的。

Oracle Contract 可以依赖多个节点（这些节点也依赖多个数据源）来执行其他合约的查询，这提高了容错性。

基于质押的 Oracle 也有可能删掉那些未能快速响应数据请求的节点。这大大激励了 Oracle Node 投资于容错的基础设施，并及时提供数据。

#### 良好的激励兼容性

去中心化的 Oracle 实现了各种激励设计，以防止`Oracle Node`之间的 [拜占庭错误](https://en.wikipedia.org/wiki/Byzantine_fault)。具体来说，他们实现了可归属性和问责制。

- 去中心化的`Oracle Node`通常被要求对其提供的数据进行签名，以回应数据请求。这些信息有助于评估`Oracle Node`的历史表现，这样，用户在提出数据请求时就可以过滤掉不可靠的`Oracle Node`。一个例子是 Chainlink 的 [Oracle 信誉](https://oracle.reputation.link/) 或 Witnet 的 [算法信誉系统](https://docs.witnet.io/intro/about/architecture#algorithmic-reputation-system)。

- 去中心化的 Oracle 可能要求节点对他们提交的数据的真实性进行质押。如果数据被证实，这个质押可以和诚实服务的奖励一起被退回；如果数据被证伪，它会受到惩罚。

## 应用场景

以下是以太坊中 Oracle 的常见使用场景：

### 检索金融数据

去中心化的金融（DeFi）应用允许点对点的贷款、借款和资产交易。这通常需要获取不同的金融相关信息，包括汇率数据（用于计算加密货币的法币价值或比较两种代币的价格）和资本市场数据（用于计算代币化资产的价值，如黄金或美元）。

例如，如果你计划建立一个 DeFi 借贷协议，需要查询作为质押品存入的资产（如 ETH）的当前市场价格。

DeFi 中流行的“Price Oracle”包括 Chainlink Price Feeds、Compound Protocol 的 [Open Price Feed](https://compound.finance/docs/prices)、Uniswap 的 [Time-Weighted Average Prices(TWAPs)]({{< ref "../uniswap/v2/core-concepts/oracles">}}) 和 [Maker Oracles](https://docs.makerdao.com/smart-contract-modules/oracle-module)。在将这些 Price Oracle 集成到项目之前，最好了解这些 Oracle 所带来的注意事项。本文详细分析了计划使用上述任何一种价格神器时需要考虑的问题。

下面是一个例子，说明你如何在智能合约中使用 Chainlink 价格源检索最新的 ETH 价格。

```solidity
pragma solidity ^0.6.7;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract PriceConsumerV3 {

    AggregatorV3Interface internal priceFeed;

    /**
     * Network: Kovan
     * Aggregator: ETH/USD
     * Address: 0x9326BFA02ADD2366b30bacB125260Af641031331
     */
    constructor() public {
        priceFeed = AggregatorV3Interface(0x9326BFA02ADD2366b30bacB125260Af641031331);
    }

    /**
     * Returns the latest price
     */
    function getLatestPrice() public view returns (int) {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
}

```

### 生成可验证的随机性

某些区块链应用，如基于区块链的游戏或彩票计划，需要高水平的不可预测性和随机性才能有效工作。然而，区块链的确定性执行消除了任何随机性的来源。

通常的做法是使用伪随机加密函数，如 blockhash，但这很容易 [被其他行为者操纵](https://ethereum.stackexchange.com/questions/3140/risk-of-using-blockhash-other-miners-preventing-attack#:~:text=So%20while%20the%20miners%20can,to%20one%20of%20the%20players.)，即解决工作证明算法的矿工。另外，以太坊转向 [PoS](https://ethereum.org/en/upgrades/merge/) 意味着开发者不能再依靠区块链来实现链上随机性（不过 Beacon Chain 的 RANDAO 机制提供了另一种随机性来源）。

在链下生成随机值并将其发送到链上是可能的，但这样做对用户提出了很高的信任要求。他们必须相信这个值确实是通过不可预测的机制产生的，并且在传输过程中没有被改变。

专为链下计算而设计的 Oracle 解决了这个问题，它在链下安全地生成随机结果，并在链上公布，同时提供加密证明，证明该过程的不可预测性。一个例子是 [Chainlink VRF（可验证的随机函数）](https://docs.chain.link/docs/chainlink-vrf/)，它是一个可证明的公平和防篡改的随机数生成器（RNG），对于建立可靠的智能合约的应用来说，它依赖于不可预测的结果。

### 获取事件的结果

Oracle 服务使创建响应现实世界事件的智能合约成为可能，它允许合约通过链下组件连接到外部 API，并从这些数据源消耗信息。例如，前面提到的预测 DApp 可以请求 Oracle 从可信的链下来源（如美联社）返回选举结果。

### 合约自动化

在大多数情况下，合约的大部分功能是公开的，可以被 EOA 和其他合约调用。

但合约中也有一些私人功能，其他人无法访问；这些功能通常对 DApp 的整体功能至关重要。潜在的例子包括定期为用户铸造新的 NFT 的 `mintERC721Token()`函数，在预测市场中授予报酬的函数，或在 DEX 中解锁已锁定的代币的函数。

开发人员将需要每隔一段时间触发此类函数，以保持应用程序的顺利运行，这就是为什么智能合约的自动执行具有吸引力。

一些去中心化的 Oracle 网络提供自动化服务，允许链下`Oracle Node`根据用户定义的参数来触发智能合约功能。通常情况下，这需要在 Oracle 服务中“注册”目标合约，提供资金来支付 Oracle 操作，并指定触发合约的条件或时间。

一个例子是 Chainlink 的 [Keeper 网络](https://chain.link/keepers)，它为智能合约提供了选择，以信任最小化和去中心化的方式外包定期维护任务。阅读 [官方 Keeper 文档](https://docs.chain.link/docs/chainlink-keepers/introduction/)，了解使你的合约与 Keeper 兼容和使用 Upkeep 服务的信息。

## 可用的 Oracle

有多种 Oracle 应用程序，可以将其集成到 Ethereum DApp 中。

- [Chainlink](https://chain.link/)- Chainlink 是一个去中心化的 Oracle 网络，提供防篡改的输入、输出和计算，支持任何区块链上的高级智能合约。
- [Witnet](https://witnet.io/) - Witnet 是一个无权限、去中心化和抗审查的 Oracle，帮助智能合约对现实世界的事件作出反应，并提供强大的加密经济保障。
- [UMA Oracle](https://uma.xyz/) - UMA 的 optimistic Oracle 允许智能合约快速和接收任何种类的数据，用于不同的应用，包括保险、金融衍生品和预测市场。
- [Tellor](https://tellor.io/) - Tellor 是一个透明的、无权限的 Oracle 协议，可以让你的智能合约在需要的时候轻松获得任何数据。
- [Band Protocol](https://bandprotocol.com/) - Band Protocol 是一个跨链数据 Oracle 平台，它将现实世界的数据和 API 聚合并连接到智能合约。
- [Provable](https://provable.xyz/) - Provable 将区块链 DApp 与任何外部网络 API 连接起来，并利用 TLSNotary 证明、可信执行环境（TEE）和安全加密原语来保证数据的真实性。
- [Paralink](https://paralink.network/) - Paralink 为在以太坊和其他流行的区块链上运行的智能合约提供一个开源和去中心化的 Oracle 平台。
- [Dos.Network](https://dos.network/) - DOS Network 是一个去中心化的 Oracle 服务网络，以现实世界的数据和计算能力提升区块链的可用性。
- [Pyth 网络](https://pyth.network/) - Pyth 网络是一个第一方金融 Oracle 网络，旨在在一个防篡改、去中心化和可自我维持的环境中发布链上的连续真实世界数据。
