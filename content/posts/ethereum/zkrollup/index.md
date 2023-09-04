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
## 延伸阅读

进一步理解 zkEVM:

1. transaction 在 EVM 执行过程中会转化为一系列的 opcode。
2. opcode 执行过程中会产生 memory/storage/stack 的变化，也就是 trace，这些 trace 可以作为 transaction 执行的见证（wittiness）。
3. zkEVM 将 wittiness 转化为算数电路（circuit），通过约束（constraints）证明 opcode 执行的正确性，并生成 wittiness 与 publicInputs 存在某种相关性的证明（zkProof）。
4. 将 zkProof 和 publicInput 丢给 verifier 进行验证：用户提交的 transaction 确实已经被执行了，并且和用户期望的 publicInput 相符。

疑问：

1. 我看了一些资料了解到，从程序设计的角度看， zkEVM 中分两个部分：frontend（高级语言->算数电路）和 backend（密码学证明系统，生成证明，验证正确性），
2. scroll frontend 和 backend 使用的 Halo2-KZG，我们也是使用的相同的技术么？
3. 我理解 taiko zk 这边主要的工作是在 frontend 这边？backend 这边其实是没有开发工作的？
4. 如果是将 opcode 转化为算数电路，这个应该是一个非常具有通用性的工作，不受 taiko 业务细节（合约细节）影响？
5. 目前我们 zk 这边的难点是什么？
6. 群里东哥说的 zeth 是什么？

12. 如何从 0 到 1 构建 zkEVM [文字版](https://learnblockchain.cn/article/5674)
