---
title: "Verify Smart Contract"
description: "如何验证智能合约"
slug: verify-contract
date: 2023-03-01T11:09:14+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series: [以太坊开发工具链]
categories:
  - ethereum
tags:
  - contract
---

本文介绍以太坊如何验证智能合约。

<!--more-->

## 概述

智能合约被设计为 [“无信任 (`trustless`)”](https://www.ethereum.cn/Thinking/trust-model) 的，这意味着用户在与合约互动之前，不应该信任第三方（例如，开发人员和公司）。作为无信任的一个必要条件，用户和其他开发者必须能够验证智能合约的源码。源码验证 (`Source code verification`) 向用户和开发者保证：公布的合约代码（高级语言编写）与以太坊区块链上的合约地址运行的代码相同。

区分“源码验证 (source code verification)” 和“形式验证 ([formal verification](https://ethereum.org/en/developers/docs/smart-contracts/formal-verification/))” 很重要：

- 源码验证：验证给定的智能合约源码，通常用高级语言（如 Solidity）编写，编译后产生的字节码是否真的与合约地址执行的字节码一致。
- 形式验证：是验证智能合约的正确性，即合约的行为符合预期。

合约验证 (`contract verification`) 通常指的是源码验证 (`source code verification`)。

## 源码验证

在 [以太坊虚拟机（EVM）]({{< ref "../evm" >}}) 中部署智能合约之前，开发人员将合约的源码编译为字节码。由于 EVM 不能解释高级指令，将源码编译为字节码（即低级的机器指令）对于在 EVM 中执行合约逻辑是必要的。

验证智能合约很重要，因为宣传的合约代码可能与区块链上运行的代码不同。

### 无信任

无信任可以说是智能合约和 [去中心化应用 (DApp)](https://ethereum.org/en/developers/docs/dapps/) 的最大前提。智能合约是 "不可改变的"；合约只会执行在部署时代码中定义的业务逻辑。这意味着开发人员和企业在以太坊上部署后不能篡改合约的代码。

为了使智能合约是无信任化的，合约代码应该可以被独立验证。虽然每个智能合约的编译字节码在区块链上是公开的，但低级语言对于开发者和用户来说都很难理解。

项目通过公布其合约的源码来减少信任假设。但这导致了另一个问题：很难验证公布的源码是否与部署的合约字节码相符。在这种情况下，无信任的价值就会丧失，因为用户必须相信开发者在将合约部署到区块链上之前不会改变合约的业务逻辑（即通过改变字节码）。

源码验证工具保证了智能合约的源码文件与汇编代码匹配。其结果是一个无信任的生态系统，用户不会盲目地信任第三方，而是在向合约存入资金之前验证代码。

### 用户安全

对于智能合约，通常有大量的资金处于危险之中。这就需要更高的安全保障，并在使用智能合约的逻辑之前对其进行验证。问题是，无良的开发者可以通过在智能合约中插入恶意代码来欺骗用户。如果没有验证，恶意的智能合约可以有 [后门](https://www.trustnodes.com/2018/11/10/concerns-rise-over-backdoored-smart-contracts)，有争议的访问控制机制，可利用的漏洞，以及其他危害用户安全的东西，而这些都不会被察觉。

公布智能合约的源码文件，使那些感兴趣的人，如审计师，更容易评估合约的潜在攻击载体。随着多方独立验证智能合约，用户对其安全性有了更强的保障。

## 完全验证 (full verification)

源码中有些部分不会影响到编译后的字节码，如注释或变量名。这意味着两个具有不同变量名和不同注释的源码都能够验证同一个合约。因此，恶意行为者可以在源码中添加欺骗性的注释或给出误导性的变量名称，并通过与原始源码不同的源码来验证合约。

要避免这种情况，可以在字节码中添加额外的数据，作为源码准确性的加密保证，并作为编译信息的指纹。这些必要的信息可以在 Solidity 的 [合约元数据 (contract metadata)](https://docs.soliditylang.org/en/v0.8.15/metadata.html) 中找到，这个文件的哈希值被附加到合约的字节码中。可以在 [metadata playground](https://playground.sourcify.dev/) 上看到它的作用。

元数据文件包含关于合约的编译信息，包括源文件和它们的哈希值。这意味着，如果任何编译设置，甚至其中一个源文件中的一个字节发生变化，元数据文件也会发生变化。因此，元数据文件的哈希值也会改变，它被附加到字节码上。这意味着如果一个合约的字节码+附加的元数据哈希值与给定的源码和编译设置相匹配，我们可以确定这与原始编译中使用的源码完全相同。

这种利用元数据哈希值的验证类型被称为 “[完全验证 (full verification)](https://docs.sourcify.dev/docs/full-vs-partial-match/)”（也称为“完美验证”）。如果元数据哈希值不匹配或在验证中不被考虑，这将是一个“`部分匹配 (partial match)`”，这是目前验证合约的更常见的方式。有可能 [插入恶意代码](https://samczsun.com/hiding-in-plain-sight/)，而这些恶意代码在没有完全验证的情况下不会反映在已验证的源码中。大多数开发者不知道完全验证，也不保留他们编译的元数据文件，因此部分验证到目前为止一直是验证合约的事实方法。

## 如何验证以太坊智能合约

在以太坊上部署一个智能合约需要向一个特殊的地址（address(0)）发送带有已编译的字节码的交易。字节码加上合约实例的构造参数附加到交易中的 data 字段。编译具有确定性，这意味着如果使用相同的源文件和编译设置（如编译器版本、优化器），它总是产生相同的输出（即合约字节码）。

![source-code-verification](https://ethereum.org/static/56bd7425cd677f3a0416fcb8a1c45118/5b795/source-code-verification.png)

因此，验证一个智能合约基本上包括以下步骤。

1. 设置编译器的源文件和编译设置。
2. 编译器输出合约的字节码。
3. 在给定的地址获取已部署合约的字节码
4. 比较部署的字节码和重新编译的字节码。如果代码匹配，合约就会被验证为具有给定的源码和编译设置。
5. 此外，如果字节码末尾的元数据哈希值匹配，就会是完全匹配。

请注意，这是对验证的简单化描述，有很多例外情况不能用这个方法，比如说有 [不可变的变量](https://docs.sourcify.dev/docs/immutables/)。

## 合约验证工具

传统的验证合约的过程可能很复杂。这就是为什么有工具来验证部署在 Ethereum 上的智能合约的源码。这些工具将源码验证的大部分工作进行了自动化。

### Etherscan

Etherscan 除了作为区块浏览器，也为智能合约开发者和用户提供了 [源码验证服务](https://etherscan.io/verifyContract)。

Etherscan 允许你从原始数据（源码、库地址、编译器设置、合约地址等）重新编译合约字节码。如果重新编译的字节码与链上合约的字节码（和构造器参数）相关，那么该合约就被 [验证](https://info.etherscan.com/types-of-contract-verification/) 了。

一旦被验证，你的合约的源码就会收到一个“已验证 (Verified)”的标签，并公布在 Etherscan 上供其他人审计。它也会被添加到 [验证过的合约](https://etherscan.io/contractsVerified/) 中--一个拥有验证过的源码的智能合约库。

Etherscan 是最常用的验证合约的工具。然而，Etherscan 的合约验证有一个缺点：它不能比较链上字节码和重新编译的字节码的元数据哈希。因此，Etherscan 中的匹配是部分匹配。

[更多关于在 Etherscan 上验证合约的信息](https://medium.com/etherscan-blog/verifying-contracts-on-etherscan-f995ab772327)。

### Hardhat

详见 [如何在 Hardhat 中验证合约]({{< ref "../hardhat/index.md#verify" >}})

### Sourcify

[Sourcify](https://sourcify.dev/#/verifier) 是另一个验证合约的工具，它是开源的、去中心化的。它不是一个区块浏览器，只能验证 [基于 EVM 网络的合约](https://docs.sourcify.dev/docs/chains)。它作为一个公共基础设施，供其他工具在其上构建，并旨在利用元数据文件中发现的 ABI 和 [NatSpec 注释](https://docs.soliditylang.org/en/v0.8.15/natspec-format.html)，实现更人性化的合约互动。

与 Etherscan 不同，Sourcify 支持与元数据哈希的完全匹配。经过验证的合约在其 [公共存储库](https://docs.sourcify.dev/docs/repository/) 中提供 HTTP 和 IPFS 服务，[IPFS](https://ipfs.tech/) 是一个分散的、按内容地址的存储。这允许通过 IPFS 获取合约的元数据文件，因为附加的元数据哈希值是一个 IPFS 哈希值。

此外，人们还可以通过 IPFS 检索源码文件，因为这些文件的 IPFS 哈希值也可以在元数据中找到。通过 API 、用户界面或使用插件提供元数据文件和源文件就可以验证一份合约。Sourcify 监控工具也会监听新区块上的合约创建，如果合约的元数据和源文件发布在 IPFS 上，就会尝试验证这些合约。

[更多关于在 Sourcify 上验证合约的信息](https://blog.soliditylang.org/2020/06/25/sourcify-faq/)。

### Tenderly

[Tenderly](https://tenderly.co/) 使 Web3 开发者能够构建、测试、监控和操作智能合约。Tenderly 将调试工具与可观察性和基础设施构建块相结合，帮助开发人员加速智能合约的开发。为了完全启用 Tenderly 功能，开发人员需要 [使用几种方法](https://docs.tenderly.co/monitoring/contract-verification) 进行源码验证。

可以私下或公开地验证一个合约。如果私下验证，智能合约只对你（和你项目中的其他成员）可见。公开验证一个合约，就会让使用 Tenderly 平台的每个人都看到它。

可以使用 [仪表板](https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-a-smart-contract)、[Tenderly Hardhat](https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-contracts-using-the-tenderly-hardhat-plugin) 插件或 [CLI](https://docs.tenderly.co/monitoring/smart-contract-verification/verifying-contracts-using-cli) 来验证合约。

当通过仪表板验证合约时，需要导入源文件或由 Solidity 编译器生成的元数据文件、地址/网络和编译器设置。

使用 Tenderly Hardhat 插件，可以用更少的精力来控制验证过程，使你能够在自动（无代码）和手动（基于代码）验证之间选择。

## 延伸阅读

- [Verifying Smart Contracts](https://ethereum.org/en/developers/docs/smart-contracts/verifying/)
- [How To Verify a Smart Contract on Etherscan](https://blog.chain.link/how-to-verify-a-smart-contract-on-etherscan/)
- [Verifying Your Contracts](https://hardhat.org/hardhat-runner/docs/guides/verifying)
