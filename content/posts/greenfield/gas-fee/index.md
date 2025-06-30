---
title: Gas Fee
description:
slug: gas-fee
date: 2024-04-23T17:43:34+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: [cosmos]
tags: [greenfield]
images: []
---

本文档描述了 Greenfield 如何向不同的交易类型收取费用以及 BNB Greenfield 的代币经济学。

## 概述

在 Cosmos SDK 中， gas 指定单位来跟踪执行期间的资源消耗。

在 Greenfield 等应用专用区块链上，存储的计算成本不再是决定交易费用的主要因素，而是 Greenfield 的激励机制。例如，创建和删除存储对象使用等量的 I/O 和计算资源，但 Greenfield 鼓励用户删除未使用的存储对象以优化存储空间，从而降低交易费用。

不同于 Cosmos SDK 中的 gas meter，Greenfield Blockchain 重新设计了 [gashub 模块](https://github.com/bnb-chain/greenfield-cosmos-sdk/blob/b5c75cfd81109a236b8b1e1fae3c5574d2d3d172/x/gashub/module.go#L16)，以根据交易的类型和内容来计算 gas 消耗量，而不仅仅是存储和计算资源的消耗量。

与以太坊等网络不同，greenfield 交易没有 gas 价格字段。相反，它们由 fee 和 gas-wanted 组成。在交易预执行过程中，通过费用/需要的 gas 来推断 gas 价格，交易根据 gas 价格进行排队，此外，gas 价格不应低于 Greenfield 的最低 gas 价格：5gwei。

## GasHub

greenfield 在 app 启动过程中注册了 [gashub](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/app/app.go#L543) 模块。

通过浏览 [代码](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/app/ante/ante.go#L51) 我们可以看到，gashub.keeper 被用在 anteHandler 中，在 checkTx 的时候使用。

所有交易类型都需要将其 gas 计算逻辑注册到 gashub。目前支持 [四种类型](https://github.com/bnb-chain/greenfield-cosmos-sdk/blob/b5c75cfd81109a236b8b1e1fae3c5574d2d3d172/proto/cosmos/gashub/v1beta1/gashub.proto#L21) 的计算逻辑：

## Block Gas Meter

ctx.BlockGasMeter() 用作 gas meter，旨在监控和限制每个 block 的 gas 消耗量。

然而，某些类型的交易可能会在 greenfield 产生高昂的成本，导致大量的 gas 消耗。因此，Greenfield 不会对区块施加任何 gas 使用限制。相反，Greenfield 设置了区块大小限制，防止区块大小超过 1MB，并降低区块过大的风险。

## Fee Table

请注意，gas 费用可以通过治理进行更新，并且可能不会立即反映在 [官方文档](https://greenfield-chain.bnbchain.org/cosmos/gashub/v1beta1/msg_gas_params) 中，也可以在 [mainnet_config 的 gashub 模块中看到初始配置](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/asset/configs/mainnet_config/genesis.json#L1460) 中看到。
