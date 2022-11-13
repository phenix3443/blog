---
title: "geth blockchain 实现"
slug: geth-blockchain
description: Geth 源码解析：blockchain
date: 2022-10-31T19:29:44+08:00
slug: blockchain-insert
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
    - geth
    - ethereum
---

## 概述[^1]

## blockchain

## sync-modes

Geth客户端共有三种同步模式`snap`,`full`和`light`，默认是`snap`（前身为`fast`），可以通过命令行参数`--syncmode value` 进行指定。更多参见 [get sync modes]({{< ref "/post/ethereum/geth/syncmode" >}})。

+ snap：同步所有的区块头、区块体和状态数据，但不对区块中的交易进行重放以生成状态数据，只会在后期对区块中的数据（包括交易）进行校验。
+ full：同步所有的区块头，区块体，并重放区块中的交易以生成状态数据。所有区块和区块中的交易都会被逐一验证。
+ light：同步所有区块头，不同步区块体和状态数据，仅在需要时从网络上其他节点处获取。不会主动进行校验（仅在读取时进行哈希校验）。

## block

## prune block

以太坊运行以来，随着时间的推移，以太坊的客户端需要存储的数据越来越多，多到了难以接受的地步。以太坊的团队通过对区块数据进行修剪的方式来解决这个问题。准确的说，修剪的其实是`state`数据，因为导致以太坊数据增长如此之快的最终原因不是区块数量的增长，而是state数据的增长。

对于那些不需要的 state 数据，我们可以不进行存储。万一哪天需要用到了，由于保存了完整的区块信息，我们是可以费点时间重新计算得到这些数据的。

以太坊提供的方式是对trie树的节点进行修剪。在trie的实现中，会对存在于内存中的节点进行“引用计数”，即每个节点都有一个记录自己被引用次数的数字，当引用数量变为0时，节点内存就会被释放，也就不会被写入到数据库中去了。trie模块提供了`trie.Database.Reference`和`trie.Database.Dereference`方法，可以引用和解引用某一个节点（关于对trie节点的引用，可以参考[这篇文章](https://yangzhe.me/2019/01/12/ethereum-trie-part-1/)和[这篇文章](https://yangzhe.me/2019/01/18/ethereum-trie-part-2/）)。

trie节点的这种“引用计数”式的设计应该是很好理解的，[这篇文章](https://blog.ethereum.org/2015/06/26/state-tree-pruning/)也对其进行了详细的说明。在本篇文章里，我们重点关注blockchain模块是如何使用这一功能对state进行修剪的。

对state进行修剪是在插入区块时进行的，具体是在BlockChain.writeBlockWithState中，更详细的讨论参见[^1]。

## 区块的组织

我们先整体地看一下在以太坊中区块是如何组织成链的。然后再深入细节，去讨论一些具体的问题。

在以太坊中，区块可能会组织成下面这个样子：

![blockchain](blockchain.png)

这个图体现了以太坊区块链的大多数特性。大多数区块组成了一个链条，每个区块指向了自己的父多块，直到`创世区块（Genesis）`。但也很容易注意到，这个链条从头到尾并不是只有一条，而是有不少“毛刺”似的或长或短的分支链。这些分支链条被称为`侧链(sidechain)`，而主要的那个链条则是`主链(也称为规范链：canonical chain)`，而这种出现分支链的情况就叫做`分叉(fork)`。

每个区块都会有一个`高度`，它是这个区块在链条上的位置的计数。比如创世块的高度是0，因为它是第一个区块。第二个区块的高度是1，以此类推。如果我们仔细观察图中的区块高度，会发现主链上最后一个区块的高度并不是最大。这说明以太坊中并**不以区块高度来判断**是主链还是侧链。后面我们会再详细说一下这个问题。

不管是主链还是侧链上，都有一些侧链上的区块又被“包含”回来的情况，也就是说有些区块不仅会指向父块，还可能指向自己的叔叔辈的区块。这是以太坊中比较有特色的特点，叫做`叔块`，名字也是非常形象。

还有一些区块不在链上，这些区块被称为`future block`。以太坊有时候会收到一些时间戳较父块大得太多的区块，因此会作为`future block`暂存这些区块。待到时机成熟时再尝试将其加入到链中。

另外关于修剪的内容没能在这个图上体现出来。以太坊的`state`存储了所有以太坊的账户信息，`state`底层使用`trie`对象存储。由于`trie`的机制和以太坊日益增长的数据，存储全部state数据需要非常大的磁盘空间。因此以太坊的区块增加了“修剪”`state`的功能：即那些比较旧的区块的`state`是不存储的，只存储比较新的区块的`state`。我们后面还会详细分析这块功能。

这就是以太坊中区块的组织形式。可以看到，以太坊中的区块链不仅仅是简单的一个链条，它还加上了一些其它的功能和特性。

## 源码简介

以太坊中关于区块链结构的代码位于三个目录下：

+`core/`（仅包含目录下的go文件）：包含了几乎所有重要功能，是以太坊区块链的核心代码：
  +`blockchain.go`中实现的`BlockChain`结构及方法是核心实现，代表具有给定创世块的数据库的规范链。BlockChain 管理链导入(import)、恢复(recover)、链重组(reorg)。
  +`headerchain.go`中实现的`HeaderChain`实现了对区块头的管理。
+`core/rawdb`目录实现了从数据库中读写所有区块结构的方法。
+`light/`：实现了`light`同步模式下区块链的组织和维护。

从这些代码中可以看出区块链在代码中是如何组织的。

### Block

现在看下一个完整的区块[Block](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/types/block.go#L170)包含了哪些数据：

```go

```

### BlockChain

[BlockChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L167)

将块导入区块链是根据两阶段验证器(validator)定义的规则集进行的。 Processor 对 block 以及其中的交易进行处理。世界状态(state) 的验证在 Validator 的第二部分完成。 失败会中止导入。

BlockChain 还有有助于返回数据库中的`任何`链以及代表规范链的块。 重要的是要注意 GetBlock 可以返回任何块，这些块甚至不需要包含在规范链中，而 GetBlockByNumber 始终代表规范链。

BlockChain.currentBlock：当前区块，blockchain中并不是储存链所有的block，而是通过currentBlock向前回溯直到genesisBlock，这样就构成了区块链。

#### 初始化

[eth.New](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/backend.go#L204) 处创建了 blockchain.

[eth.NewBlockChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L226) 创建一个新的 blockChian .

SetHead 将本地链倒回到一个新的头。 根据节点是快速同步还是完全同步以及处于何种状态，该方法将尝试从磁盘中删除最少的数据，同时保持链的一致性。

#### 插入和验证

在以太坊的区块链代码中，插入区块的方法是`BlockChain.InsertChain`，但主要的代码是由`BlockChain.insertChain`完成的。

[BlockChain.InsertChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1448) 方法的代码比较简单短，我们直接完整的拷贝到这里：

```go
// InsertChain attempts to insert the given batch of blocks in to the canonical
// chain or, otherwise, create a fork. If an error is returned it will return
// the index number of the failing block as well an error describing what went
// wrong. After insertion is done, all accumulated events will be fired.
func (bc *BlockChain) InsertChain(chain types.Blocks) (int, error) {
  // Sanity check that we have something meaningful to import
  if len(chain) == 0 {
    return 0, nil
  }
  bc.blockProcFeed.Send(true)
  defer bc.blockProcFeed.Send(false)

  // Do a sanity check that the provided chain is actually ordered and linked.
  for i := 1; i < len(chain); i++ {
    block, prev := chain[i], chain[i-1]
    if block.NumberU64() != prev.NumberU64()+1 || block.ParentHash() != prev.Hash() {
      log.Error("Non contiguous block insert",
        "number", block.Number(),
        "hash", block.Hash(),
        "parent", block.ParentHash(),
        "prevnumber", prev.Number(),
        "prevhash", prev.Hash(),
      )
      return 0, fmt.Errorf("non contiguous insert: item %d is #%d [%x..], item %d is #%d [%x..] (parent [%x..])", i-1, prev.NumberU64(),
        prev.Hash().Bytes()[:4], i, block.NumberU64(), block.Hash().Bytes()[:4], block.ParentHash().Bytes()[:4])
    }
  }
  // Pre-checks passed, start the full block imports
  if !bc.chainmu.TryLock() {
    return 0, errChainStopped
  }
  defer bc.chainmu.Unlock()
  return bc.insertChain(chain, true, true)
}
```

参数`chain`其实表明：所有待导入（import）的区块本身构成了一条长度较短的区块链（chain）。所以这里首先进行了两个简单的检查：

1. 检查`chain`的长度是否为0.
2. 检查`chain`中的各区块的高度是否是从小到大按顺序依次排列的。

检查完成后，就调用`BlockChain.insertChain`进行实际的插入工作。

`BlockChain.insertChain`由于逻辑比较多且稍复杂，单独写[文章]({{< ref "../blockchain_insert" >}})分阶段来分析具体的代码。

[^1]: http://yangzhe.me/2019/03/24/ethereum-blockchain/
