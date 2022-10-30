---
title: "Blockchain"
description:
date: 2022-08-24T19:29:44+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
tags:
    - geth
    - ethereum
---

## 概述

[BlockChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L167) 代表给定具有创世块的数据库的规范链(canonical chain)。区块链管理链导入、恢复、链重组。

将块导入区块链是根据两阶段验证器(validator)定义的规则集进行的。 Processor 对 block 以及其中的交易进行处理。世界状态(state) 的验证在 Validator 的第二部分完成。 失败会中止导入。

BlockChain 还有有助于返回数据库中的**任何**链以及代表规范链的块。 重要的是要注意 GetBlock 可以返回任何块，这些块甚至不需要包含在规范链中，而 GetBlockByNumber 始终代表规范链。

BlockChain.currentBlock：当前区块，blockchain中并不是储存链所有的block，而是通过currentBlock向前回溯直到genesisBlock，这样就构成了区块链。

## 初始化

[eth.New](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/backend.go#L204) 处创建了 blockchain.

[eth.NewBlockChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L226) 创建一个新的 blockChian .

SetHead 将本地链倒回到一个新的头。 根据节点是快速同步还是完全同步以及处于何种状态，该方法将尝试从磁盘中删除最少的数据，同时保持链的一致性。

## ForkChoice

[ForkChoice](https://github.com/ethereum/go-ethereum/blob/6d711f0c001ccb536c5ead8bd5d07828819e7d61/core/forkchoice.go#L48-L57) 是分叉选择器，eth1 中基于链总难度最高进行分叉，eth2 中使用外部分叉。 这个 ForkChoice 的主要目标不仅是在 eth1/2 合并阶段提供分叉选择，而且还保持与所有其他工作量证明网络的兼容性。

[^1]: http://yangzhe.me/2019/03/24/ethereum-blockchain/

