---
title: Greenfield Cometbft
description:
slug: greenfield-cometbft
date: 2024-04-25T10:32:53+08:00
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

## 概述

[greenfield-cometBFT](https://github.com/bnb-chain/greenfield-cometbft/) 合并了 [cometBFT 官方](https://github.com/cometbft/cometbft) 的 v0.37.2  分支，当前 mechain 使用的也是 v0.37.2 版本。mechain-cosmos-sdk 使用的是 v0.37.1 版本。

根据 greenfield-cometBFT 官方文档 [描述](https://github.com/bnb-chain/greenfield-cometbft?tab=readme-ov-file#key-features)：
> We implement several key features based on the CometBFT fork:

> + Vote Pool. Vote pool is used to collect votes from different validators for off-chain consensus. Currently, it is mainly used for cross chain and data availability challenge in Greenfield blockchain.
> + RANDAO. RANDAO is introduced for on-chain randomness. Overall, the idea is very similar to the RANDAO in Ethereum beacon chain, you can refer to [here](https://github.com/bnb-chain/greenfield-cometbft?tab=readme-ov-file) for more information. It has some limitations, please use it with caution.

+ vote pool 定义在 [votepool](https://github.com/bnb-chain/greenfield-cometbft/blob/904c57ecf3ffce5b50cd360922b1aad7efc3ddb0/proto/tendermint/voteppool/types.proto#L7) 对应的代码实现是在 [votepool](https://github.com/bnb-chain/greenfield-cometbft/blob/904c57ecf3ffce5b50cd360922b1aad7efc3ddb0/votepool/vote.go#L20)，在 node 启动的时候通过 [node](https://github.com/bnb-chain/greenfield-cometbft/blob/904c57ecf3ffce5b50cd360922b1aad7efc3ddb0/node/node.go#L896) 注册为 reactor。
+ RANDAO 分别定义在 proto/tendermint/state/types.proto 与 proto/tendermint/types/types.proto 中。RANDAO 是一个用于生成随机数的机制，是“可验证的随机函数”（Verifiable Random Function, VRF）的一个变体，旨在为区块链提供去中心化和安全的随机性源。greenfield 在 state 和 header 中添加了该字段，在 [validateBlock](https://github.com/bnb-chain/greenfield-cometbft/blob/904c57ecf3ffce5b50cd360922b1aad7efc3ddb0/state/validation.go#L115) 时对 randao 进行检查。
