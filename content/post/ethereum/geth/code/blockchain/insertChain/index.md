---
title: "Blockchain-insertChain"
description:
date: 2022-11-03T10:49:21+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

详细看一下区块是如何被加入到链中的。

## CanonicalChain

下面 [BlockChain.insertChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1487) 代码中折叠一部分，方面我们分析：

这里有个小技巧: [how to copy and paste folded code as it is in vscode](https://stackoverflow.com/questions/69420897/on-vsc-can-i-copy-paste-folded-codes-and-keep-them-folded)

```go

// insertChain 是 InsertChain 的内部实现，它假设：
// 1) 链是连续的，并且 2) 链互斥锁被持有。

// 此方法被拆分，以便在不释放锁的情况下导入需要重新注入历史块的批次，这样做可能会导致异常行为。
// 如果正在导入侧链，并且导入了历史状态，但在实际侧链完成之前添加了新的规范链 head，则可以再次修剪历史状态。
func (bc *BlockChain) insertChain(chain types.Blocks, verifySeals, setHead bool) (int, error) {
    // If the chain is terminating, don't even bother starting up.
    ...
    // Start the parallel header verifier
    headers := make([]*types.Header, len(chain))
    seals := make([]bool, len(chain))
    for i, block := range chain {
        headers[i] = block.Header()
        seals[i] = verifySeals
    }
    abort, results := bc.engine.VerifyHeaders(bc, headers, seals)
    defer close(abort)
    // Peek the error for the first block to decide the directing import logic
    it := newInsertIterator(chain, results, bc.validator)
    block, err := it.next()
    // Left-trim all the known blocks that don't need to build snapshot
    if bc.skipBlock(err, it) {
        // Falls through to the block import
        。。。
    }
    switch {
    // First block is pruned
    case errors.Is(err, consensus.ErrPrunedAncestor):
    // First block is future, shove it (and all children) to the future queue (unknown ancestor)
    case errors.Is(err, consensus.ErrFutureBlock) || (errors.Is(err, consensus.ErrUnknownAncestor) && bc.futureBlocks.
Contains(it.first().ParentHash())):
    // Some other error(except ErrKnownBlock) occurred, abort.
    // ErrKnownBlock is allowed here since some known blocks
    // still need re-execution to generate snapshots that are missing
    case err != nil && !errors.Is(err, ErrKnownBlock):
    }
    // No validation errors for the first block (or chain prefix skipped)
    var activeState *state.StateDB
    defer func() {
        // The chain importer is starting and stopping trie prefetchers. If a bad
        // block or other error is hit however, an early return may not properly
        // terminate the background threads. This defer ensures that we clean up
        // and dangling prefetcher, without defering each and holding on live refs.
        if activeState != nil {
            activeState.StopPrefetcher()
        }
    }()
    for ; block != nil && err == nil || errors.Is(err, ErrKnownBlock); block, err = it.next() {
    }
    // Any blocks remaining here? The only ones we care about are the future ones
    if block != nil && errors.Is(err, consensus.ErrFutureBlock) {
    }
    stats.ignored += it.remaining()
    return it.index, err
}
```

### 校验所有区块头部

一开始最重要的是调用`engine.VerifyHeaders`对所有区块的头部进行验证（其中`bc.engine`是共识接口）（L32）。注意这个方法的实现是异步的，它会返回一个 channel 用来获取验证的结果，也即变量`results`。这里的代码使用`newInsertIterator`和`results`创建一个迭代器，后面使用这个迭代器来获取每一个验证结果。

### 修剪所有区块

修剪插入链接（参数`chain`）左侧所有不需要构建快照的已知块。

### 处理第一个插入块

继续看下`switch/case`处理被插入的**第一个区块**的验证结果。我们分情况进行说明：

+ case1: 第一个区块是被“修剪”的区块。

  前面我们讲过，所谓被“修剪的区块”，就是指区块虽然存在，但它的`state`对象却不存在。这里分为两种情况：
  +`setHead==true`: 将整个`chain`作为侧链插入并处理可能发生的重组。因为根据修剪的规则，主链上的最新的区块（triesInMemory）是不可能不存在`state`对象的，但`chain[0]`的父块不存在`state`对象，说明它的父块不可能是主链上的最新的块，那么整个的`chain`参数所代表的这组区块肯定是在其它分支链上了。
  +`setHead==false`:
+ case2: 第一个区块是`futureBlock`

 `futureBlock`的概念前面我们也讲过。这里的判断逻辑是，要么`chain[0]`的验证结果是`ErrFutureBlock`，要么是`找不到父区块（ErrUnknownAncestor`但父区块存在于`futureBlocks`中。相应的处理逻辑是将第一个区块及后续找不到父区块的区块全当成`futureBlock`，调用`addFutureBlock`。然后就直接返回了。
+ case3: 第一个区块已经完整存在于数据库中。

  注意这里说的完整存在不仅是指区块数据，也包括state对象的数据。既然区块已经完整存在了，那么就没必须再处理一遍了。因此这里的处理方式就是忽略所有已以完整存在的区块。

+ case4: 其它未知错误

插入完成后会返回一些通知事件，因此调用`BlockChain.PostChainEvents`发送这些通知事件。

## SideChain

## HeaderChain

[HeaderChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/headerchain.go#L59)

## ForkChoice

[ForkChoice](https://github.com/ethereum/go-ethereum/blob/6d711f0c001ccb536c5ead8bd5d07828819e7d61/core/forkchoice.go#L48-L57) 是分叉选择器，eth1 中基于链总难度最高进行分叉，eth2 中使用外部分叉。 这个 ForkChoice 的主要目标不仅是在 eth1/2 合并阶段提供分叉选择，而且还保持与所有其他工作量证明网络的兼容性。
