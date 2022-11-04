---
title: "geth insertChain"
description:
slug: geth-insert-chain
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

这里有几个 vscode 使用小技巧:

+ [collapse selected code](https://stackoverflow.com/questions/30067767/how-do-i-collapse-sections-of-code-in-visual-studio-code-for-windows)
+ [how to copy and paste folded code as it is in vscode](https://stackoverflow.com/questions/69420897/on-vsc-can-i-copy-paste-folded-codes-and-keep-them-folded)

下面[BlockChain.insertChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1487) 代码中折叠一部分，只展示重点流程方便分析：

```go
// insertChain 是 InsertChain 的内部实现，它假设：
// 1) 链是连续的，并且 2) 链互斥锁被持有。

// 此方法被拆分，以便在不释放锁的情况下导入需要重新注入历史块的批次，这样做可能会导致异常行为。
// 如果正在导入侧链，并且导入了历史状态，但在实际侧链完成之前添加了新的规范链 head，则可以再次修剪历史状态。
func (bc *BlockChain) insertChain(chain types.Blocks, verifySeals, setHead bool) (int, error) {
    // If the chain is terminating, don't even bother starting up.
    ...
    // Fire a single chain head event if we've progressed the chain
    defer func() {
        if lastCanon != nil && bc.CurrentBlock().Hash() == lastCanon.Hash() {
            bc.chainHeadFeed.Send(ChainHeadEvent{lastCanon})
        }
    }()
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
        ...
    }
    switch {
    // First block is pruned
    case errors.Is(err, consensus.ErrPrunedAncestor):
        ...
    // First block is future, shove it (and all children) to the future queue (unknown ancestor)
    case errors.Is(err, consensus.ErrFutureBlock) || (errors.Is(err, consensus.ErrUnknownAncestor) && bc.futureBlocks.Contains(it.first().ParentHash())):
        ...
    // Some other error(except ErrKnownBlock) occurred, abort.
    // ErrKnownBlock is allowed here since some known blocks
    // still need re-execution to generate snapshots that are missing
    case err != nil && !errors.Is(err, ErrKnownBlock):
        ...
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

开始最重要的是调用`engine.VerifyHeaders`对所有区块的头部进行验证（其中`bc.engine`是共识接口）。注意这个方法的实现是异步的，它会返回一个 channel 用来获取验证的结果，也即变量`results`。这里的代码使用`newInsertIterator`和`results`创建一个迭代器，后面使用这个迭代器来获取每一个验证结果。

### 跳过不需要生成快照的已知块

删除待插入块（参数`chain`）左侧所有不需要构建快照(`snapshots`)的已知块。

todo:等待完善

### 处理首个插入块验证信息

`switch/case`处理被插入的**首个区块**的验证结果，以决定后续其他区块的插入：

+ case1: 第一个区块是`修剪区块(prunedBlock)`。

  [之前的文章]({{< ref "../overview" >}})介绍过所谓被“修剪区块”，就是指区块虽然存在，但它的`state`对象却不存在。这里分为两种情况：

  + `setHead==true`: 将整个`chain`作为侧链插入并处理可能发生的重组。因为根据修剪的规则，主链上的最新的区块（triesInMemory）是不可能不存在`state`对象的，但`chain[0]`的父块不存在`state`对象，说明它的父块不可能是主链上的最新的块，那么整个的`chain`参数所代表的这组区块肯定是在其它分支链上了。
  + `setHead==false`: 只有合并后会走到这个流程，如果父块是被修剪，就尝试恢复。

  ```go
    // First block is pruned
    case errors.Is(err, consensus.ErrPrunedAncestor):
        if setHead {
            // First block is pruned, insert as sidechain and reorg only if TD grows enough
            log.Debug("Pruned ancestor, inserting as sidechain", "number", block.Number(), "hash", block.Hash())
            return bc.insertSideChain(block, it)
        } else {
            // We're post-merge and the parent is pruned, try to recover the parent state
            log.Debug("Pruned ancestor", "number", block.Number(), "hash", block.Hash())
            _, err := bc.recoverAncestors(block)
            return it.index, err
        }
  ```

+ case2: 第一个区块是`futureBlock`。

  [之前的文章]({{< ref "../overview" >}})介绍过`futureBlock`。这里的判断逻辑是，要么`chain[0]`的验证结果是`ErrFutureBlock`，要么是`找不到父区块（ErrUnknownAncestor`但父区块存在于`futureBlocks`中。相应的处理逻辑是将第一个区块及后续找不到父区块的区块全当成`futureBlock`，调用`addFutureBlock`。然后就直接返回了。

  ```go
  // First block is future, shove it (and all children) to the future queue (unknown ancestor)
    case errors.Is(err, consensus.ErrFutureBlock) || (errors.Is(err, consensus.ErrUnknownAncestor) && bc.futureBlocks.Contains(it.first().ParentHash())):
        for block != nil && (it.index == 0 || errors.Is(err, consensus.ErrUnknownAncestor)) {
            log.Debug("Future block, postponing import", "number", block.Number(), "hash", block.Hash())
            if err := bc.addFutureBlock(block); err != nil {
                return it.index, err
            }
            block, err = it.next()
        }
        stats.queued += it.processed()
        stats.ignored += it.remaining()

        // If there are any still remaining, mark as ignored
        return it.index, err
  ```

+ case3: 除了已知块之外的其它未知错误，直接返回。（todo：补充已知块）

  ```go
    // Some other error(except ErrKnownBlock) occurred, abort.
    // ErrKnownBlock is allowed here since some known blocks
    // still need re-execution to generate snapshots that are missing
    case err != nil && !errors.Is(err, ErrKnownBlock):
        bc.futureBlocks.Remove(block.Hash())
        stats.ignored += len(it.chain)
        bc.reportBlock(block, nil, err)
        return it.index, err
  ```

### 循环处理待插入块

```go
for ; block != nil && err == nil || errors.Is(err, ErrKnownBlock); block, err = it.next() {
    // If the chain is terminating, stop processing blocks
    ...
    parent := it.previous()
    if parent == nil {
        parent = bc.GetHeader(block.ParentHash(), block.NumberU64()-1)
    }
    statedb, err := state.New(parent.Root, bc.stateCache, bc.snaps)
    if err != nil {
        return it.index, err
    }
    ....
    // Process block using the parent state as reference point
    substart := time.Now()
    receipts, logs, usedGas, err := bc.processor.Process(block, statedb, bc.vmConfig)
    if err != nil {
        bc.reportBlock(block, receipts, err)
        atomic.StoreUint32(&followupInterrupt, 1)
        return it.index, err
    }
    ....
    if err := bc.validator.ValidateState(block, statedb, receipts, usedGas); err != nil {
        bc.reportBlock(block, receipts, err)
        atomic.StoreUint32(&followupInterrupt, 1)
        return it.index, err
    }
    ...
    var status WriteStatus
    if !setHead {
        // Don't set the head, only insert the block
        err = bc.writeBlockWithState(block, receipts, statedb)
    } else {
        status, err = bc.writeBlockAndSetHead(block, receipts, logs, statedb, false)
    }
    ...
    switch status {
    case CanonStatTy:
        log.Debug("Inserted new block", "number", block.Number(), "hash", block.Hash(),
            "uncles", len(block.Uncles()), "txs", len(block.Transactions()), "gas", block.GasUsed(),
            "elapsed", common.PrettyDuration(time.Since(start)),
            "root", block.Root())
        lastCanon = block
        // Only count canonical blocks for GC processing time
        bc.gcproc += proctime
    case SideStatTy:
        log.Debug("Inserted forked block", "number", block.Number(), "hash", block.Hash(),
            "diff", block.Difficulty(), "elapsed", common.PrettyDuration(time.Since(start)),
            "txs", len(block.Transactions()), "gas", block.GasUsed(), "uncles", len(block.Uncles()),
            "root", block.Root())
    default:
        // This in theory is impossible, but lets be nice to our future selves and leave
        // a log, instead of trying to track down blocks imports that don't emit logs.
        log.Warn("Inserted block with unknown status", "number", block.Number(), "hash", block.Hash()
            "diff", block.Difficulty(), "elapsed", common.PrettyDuration(time.Since(start)),
            "txs", len(block.Transactions()), "gas", block.GasUsed(), "uncles", len(block.Uncles()),
            "root", block.Root())
    }
    }
```

这一段代码就是一个for循环，不断处理所有验证通过的区块。代码虽然较多，但逻辑还是比较简单的，就是调用`processor.Process`生成区块对应的`state对象`和收据（`receipt`），并对state对象进行验证（ValidateState）。如果全都正常，则调用writeBlockWithState将区块、state对象和收据全部写入数据库中。

writeBlockWithState在将区块写入数据库后，可能会调用reorg对主链与侧链进行调整。随后代码跟据返回值status变量可以判断此区块是被写入主链了（CanonStatTy）还是写入侧链了（SideStatTy）并打印相应日志。

// 如果写入主链，则生成一个ChainEvent事件；如果写入侧链则生成一个ChainSideEvent事件。

### 阶段三

下面我们看看insertChain中最后一段代码：

```go
    // Any blocks remaining here? The only ones we care about are the future ones
    if block != nil && errors.Is(err, consensus.ErrFutureBlock) {
        if err := bc.addFutureBlock(block); err != nil {
            return it.index, err
        }
        block, err = it.next()

        for ; block != nil && errors.Is(err, consensus.ErrUnknownAncestor); block, err = it.next() {
            if err := bc.addFutureBlock(block); err != nil {
                return it.index, err
            }
            stats.queued++
        }
    }
```

这段代码判断如果chain中还有未处理的区块，则看看是否是futureBlock，如果是则将它们加入到FutureBlocks字段中。

### defer 触发事件

[`defer 函数`](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1501)检查主链最新的区块（`lastCanon`）是否发生了变化，如果是则生成一个ChainHeadEvent事件。

```go
    // Fire a single chain head event if we've progressed the chain
    defer func() {
        if lastCanon != nil && bc.CurrentBlock().Hash() == lastCanon.Hash() {
            bc.chainHeadFeed.Send(ChainHeadEvent{lastCanon})
        }
    }()
```


## SideChain

## HeaderChain

[HeaderChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/headerchain.go#L59)

## ForkChoice

[ForkChoice](https://github.com/ethereum/go-ethereum/blob/6d711f0c001ccb536c5ead8bd5d07828819e7d61/core/forkchoice.go#L48-L57) 是分叉选择器，eth1 中基于链总难度最高进行分叉，eth2 中使用外部分叉。 这个 ForkChoice 的主要目标不仅是在 eth1/2 合并阶段提供分叉选择，而且还保持与所有其他工作量证明网络的兼容性。
