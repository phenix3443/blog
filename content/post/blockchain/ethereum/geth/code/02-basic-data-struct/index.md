---
title: "以太坊设计与实现-基础数据结构"
description: 
date: 2022-05-09T22:31:34+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: true
categories:
    - 区块链
tags:
    - 源码分析
    - 以太坊
---


## MPT

### Merkle Tree

### Trie Tree

### Patricia Tree

MPT（Merkle Patricia Tree），默克尔压缩前缀树，是以太坊用来将 Key-Value 进行紧凑编码的一种数据组织形式。基于该数据组织形式，MPT 上任何存储数据的细微变化都会导致 MPT 的根节点发生变更，因此可以校验数据的一致性。

在 MPT 中，存在如下三类节点。

叶子节点：用于数据存储的节点。其 Key 值是一个对应插入数据的特殊16进制编码（需要剔除掉从根节点到当前叶子节点的前缀部分内容），Value 值对应插入数据的 RLP 编码。
扩展节点：扩展节点用来处理具有共同前缀的数据，通过扩展节点可以扩展出一个多分叉的分支节点。其 Key 值存储的是共同的前缀部分的16进制，Value 值存储的是扩展出的分支节点的 hash 值（sha3（RLP（分支节点数据 List）））。
分支节点：由于 MPT 存储的 Key 是16进制的编码数据，那么在不具备共同前缀时就通过分支节点进行分叉。分支节点的 key 是一个16个数据的数组，数组的下标对应16进制的0-F，用来扩展不同的数据。

## RLP 编码

RLP（Recursive Length Prefix）编码是以太坊中数据序列化的一个主要编码方式，可以将任意的嵌套二进制数据进行序列化。
