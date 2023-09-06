---
title: "EIP-1559"
description:
slug: eip-1559
date: 2023-03-24T13:14:25+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
series: [eip 翻译]
categories: [ethereum]
tags:
  - eip
  - transaction
---

## 概述

最显著的变化包括：

- 用 “每单位 gas 的最高优先费用（max priority fee per gas）” 和 “每单位 gas 的最高费用（max fee per gas）” 来代替 gas price。
- 链 ID 是单独编码的，不再包含在签名 v 值内。这实际上是使用更简单的实现来代替 EIP 155。
- 签名 v 值变成了一个简单的校验位（“签名 Y 校验位”），不是 0 就是 1，具体取决于使用椭圆曲线上的哪个点。

EIP 1559 还提供了一种基于 EIP 2930 指定访问列表的方法。这样可以减少事务的 gas 成本。

由于 EIP 1559 极大地改变了 gas 费的运作方式，它并不能直接兼容传统事务。为了保证向后兼容性，EIP 1559 提出了一种将传统事务升级成兼容 EIP 1559 事务的方法，即，使用 “每单位 gas 的最高优先费用” 和 “每单位 gas 的最高费用” 来代替 “gas 价格”

## 参考
