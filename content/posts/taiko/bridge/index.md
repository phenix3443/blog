---
title: Taiko Bridge
description:
slug: taiko-bridge
date: 2023-09-01T10:13:41+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series:
  - Taiko 源码解析
categories: [ethereum]
tags: [taiko, rollup]
images: []
---

本文介绍 taiko bridge.

<!--more-->

## merkle proof

Merkle Tree 是一种数据存储结构，可以用一个哈希值（称为 Merkle root）对大量数据进行指纹识别。通过这种结构，人们可以验证这个大型数据结构中是否存在某些值，而无需访问整个 Merkle Tree。为此，验证者需要：

- Merkle root，这是 Merkle Tree 的单个 "指纹 "哈希值
- value，这是我们要检查是否在 Merkle root 中的值
- sibling hashes 列表，这些哈希值能让验证者重新计算 Merkle Tree 根。

在 TaikoL1/TaikoL2 合约上调用 `getCrossChainBlockHash(0)` 可以获取目标链上存储的最新已知 Merkle root。通过在 "SourceChain"上使用标准 RPC 调用 eth_getProof，可以获得要验证的值/消息以及最新已知 Merkle root 的 sibling hashes。然后，您只需将它们发送给 "目的链 "上的列表中存储的最新已知块哈希值进行验证。

验证器将利用值（Merkle Tree 中的叶子）和 sibling hashes 重新计算 Merkle root。如果计算出的 Merkle root 与目标链的区块哈希值列表（源链的区块哈希值）中存储的区块哈希值相匹配，那么我们就证明了信息是在源链上发送的，前提是目标链上存储的源链区块哈希值是正确的。

## SignalService

Taiko 的 SignalService 是一种在 L1 和 L2 上都可用的智能合约，可供任何应用程序开发者使用。它使用 merkle proofs 来提供安全的跨链消息传递服务。主要的函数：

- `sendSignal`: 可以存储 signal。
- `isSignalSend` 检查 signal 是否从某个地址发出。
- `isSignalReceived` 证明想另外一条链上的 signalService 发送了 signal。

Taiko 协议中两个重要的合约：TaikoL1、TaikoL2 都会跟踪另一条链上的 signal root：

- TaikoL1 在 proveBlock 时候保存了 L2 的 signalRoot。
- TaikoL1 在 anchor 时候保存了 L1 的 signalRoot.

两个合约都实现了 `getCrossChainSignalRoot` 来通过对方链上的 BlockID 进行查询对应的的 signalRoot。

用户或 dapp 可以调用 [eth_getProof](https://eips.ethereum.org/EIPS/eip-1186)，生成 merkle 证明。需要向 eth_getProof 提供以下信息：

- signal（您要证明的数据存在于链上某个区块的存储根中）
- SignalService 地址（存储所提供 signal 的合约地址）
- signal 是在哪个区块上发送的（可选--如果不提供，将默认为最新的区块号）

此外，eth_getProof 还将生成一个 merkle 证明（它将提供必要的 sibling hashes 和区块高度，与 signal 一起重建所断言 signal 存在的区块的 merkle storage root）。

这意味着，假设 TaikoL1 和 TaikoL2 维护的哈希值是正确的，我们就可以可靠地发送跨链信息。

让我们来看一个例子：

1. 首先，我们可以在某个源链上发送一条消息，并将其存储在 SignalService 中。
2. 接着，我们调用 eth_getProof，它会给出一个证明，证明我们确实在源链上发送了一条消息。
3. 最后，我们在目标链的 SignalService 上调用 isSignalReceived，它本质上只是验证 merkle 证明。isSignalReceived 会查找你声称已在源链（你最初发送信息的地方）上存储信息的块哈希值，并利用 merkle 证明中的 sibling hash 重建 merkle 根，从而验证 signal 是否包含在该 merkle 根中--这意味着它已被发送。

## Bridge

桥接器是一套智能合约和一个前端网络应用程序，允许您在 Sepolia 和 Taiko 之间发送 testnet ETH 和 ERC-20 代币。这座桥只是建立在太阁核心协议（特别是信号服务）之上的一种可能的实现方式，任何人都可以用它来建立桥。

首先，下面是我们使用信号服务实现桥接 dapp 的流程图：
