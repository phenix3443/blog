---
title: "skeleton"
description: downloader/skeleton 源码分析
date: 2022-11-06T22:40:40+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
---


## skeleton

[skeleton](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L191)表示合并后同步的`header`链，其中不再通过 PoW 以正向方式验证块，而是通过信标链（`beacon chain`）指定和扩展`head`，并在原始以太坊块同步协议上回填(`backfill`)。

由于`skeleton`是从头向后生长到创世的，它被作为一个单独的实体处理，而不是与块的逻辑顺序转换混合。一旦`skeleton`连接到现有的、经过验证的链，`header`将被移动到主下载器（`downloader`）中以进行填充和执行。

原始的以太坊区块同步是去信任的（并使用主节点来最小化攻击面），与之相反，合并后的区块同步从一个可信的`header`开始。因此，不再需要主对等体（peers），并且可以完全同时请求`header`（尽管如果它们没有正确链接，某些批次可能会被丢弃）。

尽管`skeleton`是同步周期的一部分，但它不会重新创建，而是在下载器的整个生命周期内保持活动状态。这允许它与同步周期同时扩展，因为扩展来自 API 层面，而不是内部（与传统的以太坊同步相比）。

由于`skeleton`跟踪整个`header`链，直到被前向块填充（`backfill`）消耗，存储每块需要 0.5KB。在当前的主网大小下，这只能通过磁盘后端实现。由于`skeleton`与节点的`header`链是分开的，所以在同步完成之前临时存储`header`是浪费磁盘 IO，但这是我们现在为了保持简单而付出的代价。

## 子链（subchain）

[subchain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L93)是由数据库支持的、连续的、分段的区块头链，但可能未链接到规范链或侧链。skeleton-syncer可能会在每次重新启动时生成一个新的子链，直到子链增长到足以与先前的子链连接。

子链使用完全相同的数据库命名空间，并且彼此不脱节。 因此，将一个扩展为与另一个重叠需要首先减少第二个。 这种组合缓冲区模型用于避免在两个子链连接在一起时必须在磁盘上移动数据。


## 启动

在`downloader.New`函数中[声明](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L230)了`skeleton`对象。

```go

// New creates a new downloader to fetch hashes and blocks from remote peers.
func New(checkpoint uint64, stateDb ethdb.Database, mux *event.TypeMux, chain BlockChain, lightchain LightChain,
dropPeer peerDropFn, success func()) *Downloader {
    if lightchain == nil {
        lightchain = chain
    }
    dl := &Downloader{
    }
    dl.skeleton = newSkeleton(stateDb, dl.peers, dropPeer, newBeaconBackfiller(dl, success))

    go dl.stateFetcher()
    return dl
}
```

需要注意： `skeleton` 声明就启动了一个循环：`startup`。

```go
func newSkeleton(db ethdb.Database, peers *peerSet, drop peerDropFn, filler backfiller) *skeleton {
    sk := &skeleton{
        db:         db,
        filler:     filler,
        peers:      peers,
        drop:       drop,
        requests:   make(map[uint64]*headerRequest),
        headEvents: make(chan *headUpdate),
        terminate:  make(chan chan error),
        terminated: make(chan struct{}),
    }
    go sk.startup()
    return sk
}
```

`skeleton.startup` 是一个后台循环函数，它通过等待事件进而启动或关闭同步器。

```go
func (s *skeleton) startup() {
    // Close a notification channel so anyone sending us events will know if the
    // sync loop was torn down for good.
    defer close(s.terminated)

    // Wait for startup or teardown. This wait might loop a few times if a beacon
    // client requests sync head extensions, but not forced reorgs (i.e. they are
    // giving us new payloads without setting a starting head initially).
    for {
        select {
        case errc := <-s.terminate:
            ...
        case event := <-s.headEvents:
            // New head announced, start syncing to it, looping every time a current
            // cycle is terminated due to a chain event (head reorg, old chain merge).
            if !event.force {
                event.errc <- errors.New("forced head needed for startup")
                continue
            }
            event.errc <- nil // forced head accepted for startup
            head := event.header
            s.started = time.Now()

            for {
                // 注意：这里通过 for 循环不断重试？
                // If the sync cycle terminated or was terminated, propagate up when
                // higher layers request termination. There's no fancy explicit error
                // signalling as the sync loop should never terminate (TM).
                newhead, err := s.sync(head)
                switch {
                    // err 错误处理
                    ...
                }
            }
        }
    }
```

同步由新区块头事件`headEvent`触发，这里[调用](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L269)`skeleton.sync` 进行同步。

## 同步

假设新的区块头是本地最新区块的下一个，看一下是`skeleton.sync`如何同步的：

### 设置同步 head

```go
// If we're continuing a previous merge interrupt, just access the existing
// old state without initing from disk.
if head == nil {
    head = rawdb.ReadSkeletonHeader(s.db, s.progress.Subchains[0].Head)
} else {
    // Otherwise, initialize the sync, trimming and previous leftovers until
    // we're consistent with the newly requested chain head
    s.initSync(head)
```

这里根据是否指定待同步的`head`分情况处理：

+ 没指定，从以往的同步过程恢复。
+ 有指定，就进行同步初始化。

```go
// initSync attempts to get the skeleton sync into a consistent state wrt any
// past state on disk and the newly requested head to sync to. If the new head
// is nil, the method will return and continue from the previous head.
func (s *skeleton) initSync(head *types.Header) {
    // Extract the head number, we'll need it all over
    number := head.Number.Uint64()

    // Retrieve the previously saved sync progress
    if status := rawdb.ReadSkeletonSyncStatus(s.db); len(status) > 0 {
        // 这里忽略已有的 skeleton 同步状态
        ...
    }
    // Either we've failed to decode the previous state, or there was none. Start
    // a fresh sync with a single subchain represented by the currently sent
    // chain head.
    s.progress = &skeletonProgress{
        Subchains: []*subchain{
            {
                Head: number,
                Tail: number,
                Next: head.ParentHash,
            },
        },
    }
    batch := s.db.NewBatch()

    rawdb.WriteSkeletonHeader(batch, head)
    s.saveSyncStatus(batch)

    if err := batch.Write(); err != nil {
        log.Crit("Failed to write initial skeleton sync status", "err", err)
    }
    log.Debug("Created initial skeleton subchain", "head", number, "tail", number)
}
```

这里假设是`skeleton`之前没有其他子链的同步，只关注`initSync`中处理首次同步的逻辑：将`skeleton`同步状态写入数据库。

### 可链接，恢复回填

此轮都是在同步是在同步`s.progress.Subchains[0]`子链,如果该子链可以和数据库中的其他块链接，就开始执行回填：

```go
// If the sync is already done, resume the backfiller. When the loop stops,
// terminate the backfiller too.
linked := len(s.progress.Subchains) == 1 &&
    rawdb.HasHeader(s.db, s.progress.Subchains[0].Next, s.scratchHead) &&
    rawdb.HasBody(s.db, s.progress.Subchains[0].Next, s.scratchHead) &&
    rawdb.HasReceipts(s.db, s.progress.Subchains[0].Next, s.scratchHead)
if linked {
    s.filler.resume()
}
```

`beaconBackFiller.resume`为回填`state`和链数据[启动](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L108) `downloader`线程（`downloader.synchronise`），需要注意这里是异步的。

```go
// resume starts the downloader threads for backfilling state and chain data.
func (b *beaconBackfiller) resume() {
    ...
    // Start the backfilling on its own thread since the downloader does not have
    // its own lifecycle runloop.
    go func() {
        // Set the backfiller to non-filling when download completes
        defer func() {
            ...
        }()
        // If the downloader fails, report an error as in beacon chain mode there
        // should be no errors as long as the chain we're syncing to is valid.
        if err := b.downloader.synchronise("", common.Hash{}, nil, nil, mode, true, b.started); err != nil {
            log.Error("Beacon backfilling failed", "err", err)
            return
        }
        // Synchronization succeeded. Since this happens async, notify the outer
        // context to disable snap syncing and enable transaction propagation.
        if b.success != nil {
            b.success()
        }
    }()
}
```

`downloader.synchronise`[调用](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L439)`downloader.syncWithPeer` 进行同步（该函数更多分析参见[downloader分析]({{< ref "../overview" >}})）。

`downloader.syncWithPeer`中通过`skeleton.Bounds`[了解](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L480)此轮同步的边界。

```go
func (s *skeleton) Bounds() (head *types.Header, tail *types.Header, err error) {
    // Read the current sync progress from disk and figure out the current head.
    // Although there's a lot of error handling here, these are mostly as sanity
    // checks to avoid crashing if a programming error happens. These should not
    // happen in live code.
    status := rawdb.ReadSkeletonSyncStatus(s.db)
    if len(status) == 0 {
        return nil, nil, errors.New("beacon sync not yet started")
    }
    progress := new(skeletonProgress)
    if err := json.Unmarshal(status, progress); err != nil {
        return nil, nil, err
    }
    head = rawdb.ReadSkeletonHeader(s.db, progress.Subchains[0].Head)
    tail = rawdb.ReadSkeletonHeader(s.db, progress.Subchains[0].Tail)

    return head, tail, nil
}
```

可以看到，每次 `resume` 都是在同步第一条子链`skeleton.progress.Subchains[0]`。

### 不可链接，创建任务

todo: 等待补充。

## beacon 同步

前面说到`skeleton.sync`是消费`skeleton.headEvents`中的，那么又是谁来产生事件的呢？

通过阅读代码可以看到只有`skeleton.Sync`[写入](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L329)`headUpdate`事件。

```go
func (s *skeleton) Sync(head *types.Header, force bool) error {
    log.Trace("New skeleton head announced", "number", head.Number, "hash", head.Hash(), "force", force)
    errc := make(chan error)

    select {
    case s.headEvents <- &headUpdate{header: head, force: force, errc: errc}:
        return <-errc
    case <-s.terminated:
        return errTerminated
    }
}
```

这个函数是最终被共识引擎`ConsensusAPI.ForkchoiceUpdatedV1`[调用](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/catalyst/api.go#L199) `downloader.BeaconSync`所[调用](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L183)`。

```go
func (api *ConsensusAPI) ForkchoiceUpdatedV1(update beacon.ForkchoiceStateV1, payloadAttributes *beacon.
PayloadAttributesV1) (beacon.ForkChoiceResponse, error) {
    api.forkchoiceLock.Lock()
    ...
    block := api.eth.BlockChain().GetBlockByHash(update.HeadBlockHash)
    if block == nil {
        // If this block was previously invalidated, keep rejecting it here too
        if err := api.eth.Downloader().BeaconSync(api.eth.SyncMode(), header); err != nil {
            return beacon.STATUS_SYNCING, err
        }
        return beacon.STATUS_SYNCING, nil
    }
```

