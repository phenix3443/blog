---
title: "Uniswap Protocol V2"
description: uniswap v2 协议 概述
slug: uniswap-v2-overview
date: 2023-03-09T17:04:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
  - uniswap
tags:
---

## 概述

[Uniswap V2 白皮书中文版](https://zhuanlan.zhihu.com/p/255190320)

![how-uniswap-works](https://docs.uniswap.org/assets/images/anatomy-d22fb7ab46013a1195f086ee672468c7.jpg)

Uniswap 是以太坊区块链上的一个自动化的流动性协议，它避免了对可信中介的需求，优先考虑了去中心化、抗审查和安全性。

每个 Uniswap 智能合约代币对(也就是 `pair`)管理着由两个 [ERC-20](https://eips.ethereum.org/EIPS/eip-20)基础代币(`Token0` 和 `Token1`) 组成的流动池。

任何人都可以通过在流动池中存入两种等值代币来换取流动性代币(`LPT`)，从而成为流动池子的流动性提供者(`LP`)。这些流动性代币用于跟踪用户按比例获得的份额，并可以在任何时候赎回基础代币。

![increase-liquidity](https://docs.uniswap.org/assets/images/lp-c0b1b03ef921f1325971fa8ab6e9a4f1.jpg)

货币对(Pairs)作为自动做市商，随时准备接受一个代币换另一个代币，只要 "恒定产品 "公式得到保留。这个公式，最简单的表达为 `x * y = k`，说明交易不能改变一对储备余额(`x` 和 `y`)的乘积(`k`)。因为 `k` 在交易的参考框架下保持不变，所以它通常被称为不变量。这个公式有一个理想的特性，即较大的交易(相对于储备)的执行率比较小的交易要差得多。

在实践中，Uniswap 对交易收取 0.3% 的费用，并将其加入储备金。因此，每笔交易实际上都会增加 k。这对 LP 来说是一种报酬，当他们燃烧他们的池子里的代币来提取他们在总储备中的部分时就会实现。在未来，这个费用可能会减少到 0.25%，剩下的 0.05% 作为协议范围内的费用扣留。

![change-price](https://docs.uniswap.org/assets/images/trade-b19a05be2c43a62708ab498766dc6d13.jpg)

由于两个配对资产的相对价格只能通过交易来改变，Uniswap 价格和外部价格之间的分歧创造了套利机会。这种机制保证了 Uniswap 的价格总是朝着市场清算价格的方向发展。

## 参与者

![participants](https://docs.uniswap.org/assets/images/participants-a3e150f3c98a0b402c2063de3e160f2e.jpg)

Uniswap 生态系统主要由三类用户组成：流动性提供者(liquidity providers)、交易者(traders)和开发者(developers)。流动性提供者受到激励，将 ERC-20 代币贡献给共同的流动池。交易者可以将这些代币相互交换，收取 0.30%的固定费用(该费用归流动性提供者所有)。开发者可以直接与 Uniswap 智能合约集成，以推动与代币、交易界面、零售体验等的新的和令人兴奋的互动。

总的来说，这些类别之间的互动创造了一个积极的反馈循环，通过定义一种共同的语言，使代币可以被汇集、交易和使用，从而推动数字经济。

### 流动性提供者

流动性提供者，或称 LPs，并不是一个同质化的群体。

- 被动的 LPs 是希望被动投资其资产以积累交易费用的代币持有人。
- 专业的 LPs 专注于做市商作为其主要战略。他们通常开发定制的工具和方法来跟踪他们在不同 DeFi 项目中的流动性头寸。
- 代币项目有时会选择成为 LP，为其代币创造一个流动性市场。这允许代币更容易被买卖，并通过 Uniswap 解锁与其他 DeFi 项目的互操作性。
- 最后，一些 DeFi 先锋正在探索复杂的流动性供应互动，如激励性的流动性、流动性作为抵押品以及其他实验性策略。Uniswap 是项目实验这类想法的完美协议。

### 交易者

在协议的生态系统中，有几类交易者。

- 投机者使用各种社区构建的工具和产品，利用从 Uniswap 协议中提取的流动性交换代币。
- 套利机器人通过比较不同平台的价格来寻求利润，以找到一个优势。(虽然它可能看起来是榨取，但这些机器人实际上有助于在更广泛的以太坊市场上平衡价格，并保持公平)。
- DAPP 用户在 Uniswap 上购买代币，用于以太坊上的其他应用。
- 通过实现交换功能在协议上执行交易的智能合约(从 DEX 聚合器等产品到自定义 Solidity 脚本)。

在所有情况下，在协议上进行的交易均需支付相同的固定费用。这对都对提高价格的准确性和激励流动性很重要。

### 开发者/项目

在更广泛的以太坊生态系统中，Uniswap 的使用方式太多，难以计数，但一些例子包括：

- Uniswap 的开源性和可访问性意味着可以建立无数的 UX 体验和前端程序，以访问 Uniswap 功能。可以在大多数主要的 DeFi 仪表板项目中找到 Uniswap 功能。还有许多由社区建立的针对 Uniswap 的工具。
- 钱包通常将交换和流动性提供功能作为其产品的核心产品。
- DEX(去中心化交易所)聚合器从许多流动性协议中抽取流动性，通过拆分交易为交易者提供最佳价格。Uniswap 是这些项目最大的单一去中心化流动性来源。
- 智能合约开发者利用现有的功能来发明新的 DeFi 工具和其他各种实验性想法。像 [Unisocks](https://unisocks.exchange/) 或 [Zora](https://ourzora.com/) 这样的项目，还有很多很多。

### Uniswap 团队和社区

Uniswap 团队与更广泛的 Uniswap 社区一起推动协议和生态系统的发展。

## 合约

Uniswap V2 是一个二进制智能合约系统。[Core Contracts](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/smart-contracts#core)为与 Uniswap 互动的所有各方提供基本的安全保障。[Periphery Contracts](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/smart-contracts#periphery) 用于同一个或多个`Core contracts`互动，但本身不是 `Core contracts` 的一部分。

### Core Contracts

[Source Code](https://github.com/Uniswap/uniswap-v2-core)

`Core Contracts`由一个单例 [Factory](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/smart-contracts#factory) 和许多 [Pairs](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/smart-contracts#pairs) 组成，`Factory` 负责创建和索引 `Pairs`。这些合约是相当小的，甚至是粗略的。这样做的简单理由是，功能较小的合约更容易推理，更不容易出错，而且功能上更优雅。也许这种设计最大的好处是，系统的许多理想属性可以直接在代码中断言，几乎没有出错的空间。然而，一个缺点是，`Core Contracts` 在某种程度上对用户并不友好。事实上，大多数情况下，不建议直接与这些合约进行交互。相反，应该使用 `Periphery Contracts`。

#### Factory Contract

[参考文档](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/factory)

`Factory` 持有支持 `Pair` 的通用字节码。它的主要工作是为每个独特的代币对创建唯一的智能合约。它还包含开启协议充值的逻辑。

#### Pair Contract

[参考文档](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/pair)

[参考文档(ERC-20)](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/pair-erc-20)

`Pairs` 有两个主要目的：作为自动做市商和跟踪池中的代币余额。它们也暴露了数据，可用于建立去中心化的 `Price oracle`。

### Periphery Contracts

[Source Code](https://github.com/Uniswap/uniswap-v2-periphery)

`Periphery` 是一个智能合约的集合，旨在支持特定领域与`Core`互动。由于 Uniswap 的免许可性质，下面描述的合约没有特殊的许可条件，实际上，可能它们只是类似外围合约的一小部分。然而，它们展示了如何安全有效地与 Uniswap V2 进行交互。

#### Library

[参考文档](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/library)

该库提供了多种方便的功能来获取数据和定价。

#### Router

[参考文档](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/router-02)

使用 `Library`的 `Router` 完全支持一个提供交易和流动性管理功能的前端的所有基本要求。值得注意的是，它原生支持多对交易(如 x 到 y 到 z)，将 ETH 视为一等公民，并提供元交易以去除流动性。

### 设计决策

以下部分描述了 Uniswap V2 中一些值得注意的设计决策。除非你有兴趣深入了解 V2 是如何工作的，或编写智能合约集成，否则可以跳过这些内容。

#### 发送代币

通常情况下，当智能合约需要代币来执行某些功能时，要求交易者首先在代币合约上进行批准，然后调用一个函数，再调用代币合约的 transferFrom。就像是你用微信发红包，直接关联到银行卡的话，就需要你先授权微信可以从你的银行账户里划款一样，用户要先给银行一个指令，告诉银行可以给微信授权一个额度，然后微信才能去用户在银行的账户中划款。[^2]

![approve](https://pic3.zhimg.com/80/v2-363e576ca1442088aec892bd133d8956_1440w.webp)

这不是 V2 Paris 接受代币的方式。

为了降低成本，减少链上交易次数，可以通过链下签名授权的方式来实现第 1 步的授权，首先 owner 在链下进行对某个 DApp 授权操作的签名，一起发给 DApp 的智能合约，在 DApp 智能合约中发起的 ERC-20 的执行交易中，先验证授权签名(permit)，然后再调用提取函数(withdraw)进行 owner 账户下的 token 提取，这样整个交易流程就只有一个链上交易，只需要消耗 1 次 gas。

![permit-withdraw](https://pic4.zhimg.com/80/v2-23753c63303d71dd2a53ef02e7e7f60f_1440w.webp)

详细信息请参见[白皮书](https://docs.uniswap.org/whitepaper.pdf)，但要注意的是，在调用任何需要代币的方法之前，必须将代币转移到 Pairs 中(这一规则的一个例外是 [Flash Swaps](https://docs.uniswap.org/contracts/v2/concepts/core-concepts/flash-swaps))。

#### WETH

与 V1 池不同，V2 对不直接支持 ETH，所以 ETH⇄ERC-20 对必须用 WETH 模拟。这一选择背后的动机是为了删除 `Core` 中的 ETH 特定代码，从而使代码库更加精简。然而，通过简单地在外围包装/解包 ETH，终端用户可以完全不知道这个实现细节。

Router 完全支持通过 ETH 与任何 WETH Pair 进行交互。

#### 最小流动性

为了改善四舍五入的错误，并增加流动性提供理论上的最小 tick 大小，pairs 燃烧第一个 [MINIMUM_LIQUIDITY](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/pair#minimum_liquidity) 流动性代币。对于绝大多数的交易对来说，这将代表一个微不足道的价值。燃烧是在第一次提供流动性时自动发生的，此后，[总供应量](https://docs.uniswap.org/contracts/v2/reference/smart-contracts/pair-erc-20#totalsupply)将永远受到限制。

## 术语[^1]

### 自动做市商(Automated market maker)

自动做市商是以太坊上的智能合约，持有链上流动性储备。用户可以按照自动做市公式设定的价格与这些储备进行交易。

### 恒积公式(Constant product formula)

Uniswap 使用的自动做市算法。参见 [x\*y=k](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/glossary#x--y--k)。

### ERC20

ERC20 代币是以太坊上的可替代代币。 Uniswap 支持所有标准的 ERC20 实现。

### Factory

为任何 ERC20/ERC20 交易对部署独特智能合约的智能合约。

### Pair

从 Uniswap V2 Factory 部署的智能合约，支持在两个 ERC20 代币之间进行交易。

### Pool

汇集当前 Pair 所有流动性提供者提供的流动性。

### Liquidity provider / LP

流动性提供者是将等值的两个 ERC20 代币存入 Pair 流动性 pool 中的人。流动性提供者承担价格风险并获得费用补偿。

### Mid Price

用户在给定时刻可以买卖代币的价格。在 Uniswap 中，这是两个 ERC20 代币储备的比率。

### Price impact

交易的 mid price 和执行价格之间的差异。

### 滑点(Slippage)[^4]

滑点一般指预设成交价位与真实成交价位的偏差，一旦发生交易，池中资产的数量发生变化，资产实际的交易执行价就会发生变化，产生滑点。交易额越大，滑点越大，交易者的损失越大。
滑点有两种公式。本文介绍第二种，反映交易者成交后的损失

1. (成交平均价格 - 初始价格)/ 初始价格 => Uniswap v3
2. (成交后价格 - 初始价格)/ 初始价格 => Uniswap v1/v2

### Core

Uniswap 存在所必需的智能合约。升级到新版本的核心将需要流动性迁移。

#### Periphery

有用但不是 Uniswap 存在所必需的外部智能合约。新的外围合约总是可以在不转移流动性的情况下部署。

### 闪电交换(Flash swap)

在付款之前使用所购买代币的交易。

### 恒积公式(`x * y = k`)[^3] [^4]

每个代币交易对都要通过工厂合约(Factory Contract)建立自己的流动池。建立流动池时，需在其中存入初始资金，以提供流动性。

流动池中代币对的汇率是基于供需量计算得出的，即所谓的恒积公式(constant product formula)。配合恒定乘积公式，一个流动池中的一种代币的价格，根据池中的供给量和交易者的需求量得出。因此，价格会在根据该公式画出的一条曲线上变动：

![决定Uniswap V2上汇率的恒定积公式](img/xyz.png)

汇率是基于一个简单的公式 `x * y = k` (其中 x 和 y 分别代表交易池中两种代币的可用数量)自动计算的。对应的曲线代表所有可能的汇率。每个交易对都有自己的曲线，用来调节当前汇率。

如果 代币 B 的需求量很大，以至于流动性干涸，其价格将成倍增长，导致 k 点向曲线向右侧下移(如上图所示)(即更多的 A 只能换来更少的 B)。如果 代币 B 的供应量很大，需求比代币 A 少得多，k 点就会向曲线左侧上移(即更少的 A 就可换来更多的 B)。要注意的是，这种供需平衡仅限于代币 A 与代币 B 的流动性池。如果是代币 B 与代币 C 的流动性池，会形成自己的供需平衡，汇率也会不同。

受到这些机制的影响，Uniswap(以及其它使用恒定乘积公式的去中心化交易所)依赖套利交易来让流动性池中的代币价格与市场价格保持一致。从本质上来说，这些协议依然需要通过外部交易系统来调控流动性池中代币的价格。每个代币对的汇率将根据市场价格不断波动，为交易者带来巨大的套利机会。

### Invariant

恒积公式中的 `k`值。基于恒积公式，在一个币对的流动性池中，每次交易后，两个币种数量的乘积不会改变，保持为常数 `K`(在实际交易中，因为存在手续费和整型精度问题的影响，交易后的 K 值会变大，但不会变小)

## 参考

[^1]: [uniswap glossary](https://docs.uniswap.org/contracts/v2/concepts/protocol-overview/glossary)

[^2]: [Uniswap 深度科普](https://zhuanlan.zhihu.com/p/380749685)

[^3]: [一文读懂 Uniswap V2 改进与创新](https://www.bitpush.news/articles/946109)

[^4]: [DeFi:Uniswap v2 协议原理解析](https://juejin.cn/post/7178857641421045820)
