---
title: "EIP-2718"
description: 类型化交易格式
date: 2023-03-24T11:16:31+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
series: [eip 翻译]
categories: [ethereum]
tags: [eip]
tags:
  - eip
  - transaction
---

## 概述 [^1]

在柏林升级之前，以太坊的交易 (Transaction) 都采用同一种格式。每个以太坊交易都有 6 个字段：nonce、gasprice、gaslimit、to address、value、data、v、r 和 s。这些字段需要经过 RLP 编码，如下所示：

`RLP([nonce, gasPrice, gasLimit, to, value, data, v, r, s])`

当时以太坊主要有 4 种不同的交易类型：

- 带有收款方地址 (to)、数据字段 (data) 的常规交易。
- 不带有收款方地址的合约部署交易，其数据字段填写的是合约代码。
- 签名 v 值不含链 ID 的交易（[EIP-155](https://eips.ethereum.org/EIPS/eip-155) 实行之前）。
- 签名 v 值含有链 ID 的交易。

由于这些交易类型都采用相同的格式，不同的以太坊客户端、库和其它工具必须分析交易的所有字段来判断其所属类型。这是人们在提议新的交易类型（如元交易、多签交易等）时不得不面对的重大难题。

[EIP-155](https://eips.ethereum.org/EIPS/eip-155) 就是一个很好的例子。它通过在交易中引入链 ID 来实现重放攻击保护。由于在交易参数中增加新的字段会破坏向后兼容性，链 ID 被编码进了交易签名的恢复参数（v）。

[EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) 定义了类型化交易封装 (Typed Transaction Envelope) 格式：`TransactionType || TransactionPayload` 为交易格式，`TransactionType || ReceiptPayload` 为收据格式。

- `TransactionType`：交易类型字段，0 至 0x7f 范围内的某个值，最多可代表 128 种交易类型。

- `*Payload`： 是一个不透明的字节数组，代表交易/收据内容，其解释取决于 TransactionType 并在未来的 EIP 中定义。

将上述字段起来，即可得到一个类型化交易。之所以选择简单的字节相连方式，是因为读取字节数组的第一个字节非常简单，无需使用任何库或工具。也就是说，不需要使用 RLP 或 SSZ 解析器来判断交易类型。

实行 EIP-2718 后，我们可以在不影响向后兼容性的情况下定义新的交易类型。

## TransactionType

选择`0x7f`作为上限是为了保证向后兼容传统交易。经过 RLP 编码的交易的第一个字节始终大于或等于 0xc0，因此类型化交易永远不会与传统交易产生冲突，而且类型化交易和传统交易之间可以通过第一个字节来区分：以`[0, 0x7f]`范围内的一个值开始，那么它就是一个新的交易类型，如果它以`[0xc0, 0xfe]`范围内的一个值开始，那么它就是一个传统交易类型。`0xff` 对于一个 RLP 编码的交易来说是不现实的，所以它被保留下来，作为一个扩展的哨位值，供将来使用。

定义新的交易类型只需要确保交易类型之间没有编号冲突即可。

## Payload

`TransactionPayload/ReceiptPayload` 可以是任意一段经过编码的字节序列，只要采用符合新的交易类型（如 RLP、SSZ 等）定义的编码器即可。

## 参考

[^1]: [](https://blog.mycrypto.com/new-transaction-types-on-ethereum/)
