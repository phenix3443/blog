---
title: "optimism rollup node"
description: optimism 源码分析：rollup 节点
date: 2022-11-18T22:31:24+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
  - optimism
tags:
---

## Rollup node

rollup node 有点类似于 consensus layer client，它始终向执行引擎提供 L2 state root，因为这是需要来自 L1 的可信的 root。它还可以提供来自 L1 的所有交易进行同步，但该机制比 snap sync 慢。

它还可以通过对等网络进行通信，以下载尚未提交给 L1 的块。参见 [这篇文章]({{< ref "posts/ethereum/optimism/code/op-node/driver" >}})

有关 rollup node 的更多信息可以参阅 [Rollup Node Specification](https://github.com/ethereum-optimism/optimism/blob/develop/specs/rollup-node.md)。

[optimism](https://github.com/ethereum-optimism/optimism) 中有部分代码属于 Bedrock，具体可以参看 [仓库目录说明](https://github.com/ethereum-optimism/optimism#directory-structure)。
