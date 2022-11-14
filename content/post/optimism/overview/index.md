---
title: "optimism 介绍"
description:
slug: optimism-overview
date: 2022-11-07T20:33:30+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
tag:
    - optimism
    - ethereum
---

## 概述

[optimism](https://www.optimism.io/) 是一个以太坊 layer2 区块链。

+ [github](https://github.com/ethereum-optimism/optimism)
+ [社区文档](https://community.optimism.io/)

## rollup node[^1]

`rollup node`负责从 L1 链（L1 块及其关联的收据）派生 L2 链。可以在`validator`或`sequencer`模式下运行。

`sequencer`模式下，`rollup node`从用户那里接收 L2 `transaction`，用于创建 L2 块。然后通过批量提交将它们提交给数据可用性提供者(data availability provider)。然后，L2 链派生充当健全性检查和检测 L1 链重组的方法。

在`validator`模式下，`rollup node`执行上述派生过程，但也能够通过直接从`sequencer`获取块来“提前”运行 L1 链，在这种情况下，派生用于验证`sequencer`的行为。

## sequencer

`sequencer`要么是在`sequencer`模式下运行的`rollup node`，要么是此`rollup node`的操作者。

`sequencer`是一个特权参与者，它接收来自 L2 用户的 L2 交易，使用它们创建 L2 块，然后将其提交给数据可用性提供者（通过批处理器）。 它还将输出根提交到 L1。

## validator

`validator`是以`validator`模式运行`rollup node`的实体（个人或组织）。

在`validator`模式下运行的`rollup node`有时称为`replica`。

这样做会带来许多类似于运行以太坊节点的好处，例如能够在本地模拟 L2 交易，而没有速率限制。

它还允许`validator`通过重新导出输出根并将它们与`sequencer`提交的根进行比较来验证`sequencer`的工作。 在不匹配的情况下，验证器可以执行故障证明(`fault proof`)。
