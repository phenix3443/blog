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

### 处理首个区块错误信息

`switch/case`处理被插入的**首个区块**的验证结果，以决定后续其他区块的插入：

+ case1: 首块是`修剪区块(prunedBlock)`。

  [之前的文章]({{< ref "../overview" >}})介绍过所谓被“修剪区块”，就是指区块虽然存在，但它的`state`对象却不存在。这里分为两种情况：

  + `setHead==true`: 将整个`chain`作为侧链插入并处理可能发生的重组。因为根据修剪的规则，主链上的最新的区块（triesInMemory）是不可能不存在`state`对象的，但`chain[0]`的父块不存在`state`对象，说明它的父块不可能是主链上的最新的块，那么整个的`chain`参数所代表的这组区块肯定是在其它分支链上了。
  + `setHead==false`: 只有合并后会走到这个流程（可以通过查看该函数调用进行确定），如果父块是被修剪，就尝试恢复。

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

+ case2: 首块是`futureBlock`。

  在以太坊中还有一类区块被称为`FutureBlocks`，这些区块被存储在`BlockChain.futureBlocks`字段中。根据错误码 `consensus.ErrFutureBlock` 来查看下如何定义 `futureBlock`，由于验证的代码位于共识模块中，因此这个错误在[ethash](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/consensus/ethash/consensus.go#L276)和[clique](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/consensus/clique/clique.go#L254)中返回的：

  ```go
    // Verify the header's timestamp
    if !uncle {
        if header.Time > uint64(unixNow+allowedFutureBlockTimeSeconds) {
            return consensus.ErrFutureBlock
        }
    }
  ```

  从这段代码我们也可以看出，在`ethash`中如果不包含`uncle`，那么区块的时间戳大于当前时间`allowedFutureBlockTime`(15秒)会被认为是futureBlock；而clique中只要区块的时间戳比当前时间大，就认为是`futureBlock`。

  需要稍微提一下的是，在[BlockChain.addFutureBlock](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1434)中也有一个条件判断：

  ```go
    max := uint64(time.Now().Unix() + maxTimeFutureBlocks)
    if block.Time() > max {
        return fmt.Errorf("future block timestamp %v > allowed %v", block.Time(), max)
    }
  ```

  如果区块的时间戳大于当前时间`maxTimeFutureBlocks`(30秒)就会被直接丢弃，而不会加入到`BlockChain.futureBlocks`中。

  到此我们对成为一个`futureBlock`的条件作一个总结。首先明确一个前提是进行条件判断的时候是在插入一组区块（chain）的时候。满足以下任意一条，都会被调用`BlockChain.addFutureBlock`方法：

  + 某区块被共识代码判断为`ErrFutureBlock`（`ethash`中区块时间戳大于当前时间15秒, `clique`区块时间戳中大于当前时间）。
  + 同一组区块（参数chain）中，前面有一个区块被判断为`futureBlock`，随后的所有找不到父区块的区块都会被判断为`futureBlock`。

  在创建BlockChain时会创建一个线程[BlockChain.updateFutureBlocks](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L409)，此线程每隔5秒钟调用[BlockChain.procFutureBlocks](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L2251)，尝试将`BlockChain.futureBlocks`中的区块加入到数据库中。

  insertChain 这里的判断逻辑是：

  + 要么`chain[0]`的验证结果是`ErrFutureBlock`（因为 chain[0] 可能没有 parent）。
  + 要么是`找不到父区块（ErrUnknownAncestor`但父区块存在于`futureBlocks`中。

  相应的处理逻辑是将第一个区块及后续找不到父区块的区块全当成`futureBlock`，调用`addFutureBlock`。然后就直接返回了。

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

+ case3: 除了已知块之外的其它未知错误，直接返回。之前跳过是不需要生成快照的已知块，当前首块可能已知但需要重新执行来生成快照。

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

这一段代码就是一个for循环，不断处理所有验证通过的区块。代码虽然较多，但逻辑还是比较简单的，就是调用`processor.Process`生成区块对应的`state`对象和收据（`receipt`），并对`state`对象进行验证（`ValidateState`）。
如果全都正常，则调用`writeBlockWithState`将区块、`state`对象和收据全部写入数据库中。

随后代码根据 `setHead` 参数将块写入数据库，并根据返回值`status变量可以判断此区块是被写入主链了（CanonStatTy）还是写入侧链了（SideStatTy）并打印相应日志。

#### writeBlockWithState

#### writeBlockAndSetHead

`writeBlockAndSetHead` 在调用 `writeBlockWithState`在将区块写入数据库后，可能会调用`reorg`对主链与侧链进行调整。随后代码跟据 status变量可以判断此区块是被写入主链了（CanonStatTy）还是写入侧链了（SideStatTy）。如果写入主链，则生成一个ChainEvent事件；如果写入侧链则生成一个ChainSideEvent事件。

### 处理遗留的 future block

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

### defer 函数

#### 产生插入事件

[defer 函数](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1501)检查主链最新的区块（`lastCanon`）是否发生了变化，如果是则生成一个ChainHeadEvent事件。

```go
    // Fire a single chain head event if we've progressed the chain
    defer func() {
        if lastCanon != nil && bc.CurrentBlock().Hash() == lastCanon.Hash() {
            bc.chainHeadFeed.Send(ChainHeadEvent{lastCanon})
        }
    }()
```

#### 停止预抓取

```go
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
```

## SideChain

看完了`insertChain`，我们再来看看侧链是如何插入的，即[insertSidechain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/blockchain.go#L1827)。

### 写入修剪块的子块

```go
    // The first sidechain block error is already verified to be ErrPrunedAncestor.
    // Since we don't import them here, we expect ErrUnknownAncestor for the remaining
    // ones. Any other errors means that the block is invalid, and should not be written
    // to disk.
    err := consensus.ErrPrunedAncestor
    for ; block != nil && errors.Is(err, consensus.ErrPrunedAncestor); block, err = it.next() {
        // Check the canonical state root for that number
        if number := block.NumberU64(); current.NumberU64() >= number {
            ...
        }
        if externTd == nil {
            externTd = bc.GetTd(block.ParentHash(), block.NumberU64()-1)
        }
        externTd = new(big.Int).Add(externTd, block.Difficulty())

        if !bc.HasBlock(block.Hash(), block.NumberU64()) {
            start := time.Now()
            if err := bc.writeBlockWithoutState(block, externTd); err != nil {
                return it.index, err
            }
            log.Debug("Injected sidechain block", "number", block.Number(), "hash", block.Hash(),
                "diff", block.Difficulty(), "elapsed", common.PrettyDuration(time.Since(start)),
                "txs", len(block.Transactions()), "gas", block.GasUsed(), "uncles", len(block.Uncles()),
                "root", block.Root())
        }
        lastBlock = block
    }
```

`insertSidechain` 开始的代码使用一个for循环将所有父区块被修剪过的区块（ErrPrunedAncestor）写入数据库中，写入的方法是`WriteBlockWithoutState`，即只写入区块数据，没有state数据。

这里需要注意的是有一个`shadow-state attack`检查。其判断逻辑是侧链上某区块的`state`哈希与主链上同样高度的区块的`state`哈希相同，这会导致侧链上的区块也可以拥有完整的state对象。但这仅仅可能是一个问题，因为有些情况下这确实是会发生的，比如一直没有交易发生，state对象的哈希一直没变过。

```go
if canonical != nil && canonical.Root() == block.Root() {
    // This is most likely a shadow-state attack. When a fork is imported into the
    // database, and it eventually reaches a block height which is not pruned, we
    // just found that the state already exist! This means that the sidechain block
    // refers to a state which already exists in our canon chain.
    //
    // If left unchecked, we would now proceed importing the blocks, without actually
    // having verified the state of the previous blocks.
    log.Warn("Sidechain ghost-state attack detected", "number", block.NumberU64(), "sideroot", block.Root(), "canonroot", canonical.Root())
    // If someone legitimately side-mines blocks, they would still be imported as usual. However,
    // we cannot risk writing unverified blocks to disk when they obviously target the pruning
    // mechanism.
    return it.index, errors.New("sidechain ghost-state attack")
}
```

### 调整规范链

```go
    // 1. 检查是规范链是否需要调整
    // At this point, we've written all sidechain blocks to database. Loop ended
    // either on some other error or all were processed. If there was some other
    // error, we can ignore the rest of those blocks.
    //
    // If the externTd was larger than our local TD, we now need to reimport the previous
    // blocks to regenerate the required state
    reorg, err := bc.forker.ReorgNeeded(current.Header(), lastBlock.Header())
    if err != nil {
        return it.index, err
    }
    if !reorg {
        localTd := bc.GetTd(current.Hash(), current.NumberU64())
        log.Info("Sidechain written to disk", "start", it.first().NumberU64(), "end", it.previous().Number, "sidetd", externTd, "localtd", localTd)
        return it.index, err
    }
    // Gather all the sidechain hashes (full blocks may be memory heavy)
    var (
        hashes  []common.Hash
        numbers []uint64
    )
    parent := it.previous()
    // 2. 需要调整，搜集所有侧链没有 state 对象的 block
    for parent != nil && !bc.HasState(parent.Root) {
        hashes = append(hashes, parent.Hash())
        numbers = append(numbers, parent.Number.Uint64())

        parent = bc.GetHeader(parent.ParentHash, parent.Number.Uint64()-1)
    }
    if parent == nil {
        return it.index, errors.New("missing parent")
    }
    // 3. 重新调用insertChain以调整分支成为主链
    // Import all the pruned blocks to make the state available
    var (
        blocks []*types.Block
        memory uint64
    )
    for i := len(hashes) - 1; i >= 0; i-- {
        // Append the next block to our batch
        block := bc.GetBlock(hashes[i], numbers[i])

        blocks = append(blocks, block)
        memory += block.Size()

        // If memory use grew too large, import and continue. Sadly we need to discard
        // all raised events and logs from notifications since we're too heavy on the
        // memory here.
        if len(blocks) >= 2048 || memory > 64*1024*1024 {
            log.Info("Importing heavy sidechain segment", "blocks", len(blocks), "start", blocks[0].NumberU64(), "end", block.NumberU64())
            if _, err := bc.insertChain(blocks, false, true); err != nil {
                return 0, err
            }
            blocks, memory = blocks[:0], 0

            // If the chain is terminating, stop processing blocks
            if bc.insertStopped() {
                log.Debug("Abort during blocks processing")
                return 0, nil
            }
        }
    }
    if len(blocks) > 0 {
        log.Info("Importing sidechain segment", "start", blocks[0].NumberU64(), "end", blocks[len(blocks)-1].NumberU64())
        return bc.insertChain(blocks, false, true)
    }
```

这部分的逻辑也比较简单，上面的中文注释将代码分成了三部分。第一部分检查当前侧链是否有可能成为主链。如果是的话，第二部分从最新区块开始，收集所有没有state对象的区块。第三部分重新调用`insertChain`以调整分支成为规范链。

## HeaderChain

todo: [HeaderChain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/core/headerchain.go#L59) 等待补充。