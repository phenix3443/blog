---
title: "skeleton"
slug: geth-downloader-skeleton
description: Geth 源码解析：downloader/skeleton
date: 2022-11-06T22:40:40+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - geth
  - 源码分析
tags:
  - downloader
---

## 概述

合并后（post-merge），local chain 依赖共识层调用 engine-API（ConsensusAPI.ForkchoiceUpdatedV1）进行同步。 该 api 调用 [downloader](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/catalyst/api.go#L199) 从 p2p 网络同步信息。

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

// BeaconSync is the post-merge version of the chain synchronization, where the
// chain is not downloaded from genesis onward, rather from trusted head announces
// backwards.
//
// Internally backfilling and state sync is done the same way, but the header
// retrieval and scheduling is replaced.
func (d *Downloader) BeaconSync(mode SyncMode, head *types.Header) error {
    return d.beaconSync(mode, head, true)
}

// Internally backfilling and state sync is done the same way, but the header
// retrieval and scheduling is replaced.
func (d *Downloader) beaconSync(mode SyncMode, head *types.Header, force bool) error {
    d.skeleton.filler.(*beaconBackfiller).setMode(mode)

    // Signal the skeleton sync to switch to a new head, however it wants
    if err := d.skeleton.Sync(head, force); err != nil {
        return err
    }
    return nil

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

可看到，链同步是通过`skeleton.Sync`[写入](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L329)`headUpdate`事件来触发。

这篇文章就介绍一下 skeleton 相关概念，以及同步的具体过程。

### skeleton

[skeleton](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L191)表示合并后同步的`header chain`，它不再通过 PoW 以正向方式验证块，而是通过信标链（`beacon chain`）指定和扩展`head`，并在原始以太坊块同步协议上进行回填(`backfill`)。所以合并后的链同步氛围两个阶段：

1. `skeleton` 同步 head。
2. 一旦`skeleton`上的 head 可以连接到现有的、经过验证的链，就可以在主下载器（`downloader`）中以进行填充和执行。

### subchain

[subchain](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/skeleton.go#L93)是由数据库支持的、连续的、分段的`header chain`，但可能未链接到规范链或侧链。skeleton-syncer 可能会在每次重新启动时生成一个新的子链，直到子链增长到足以与先前的子链连接。

subchain 使用完全相同的数据库命名空间，并且彼此不脱节。 因此，将一个扩展为与另一个重叠需要首先减少第二个。 这种组合缓冲区模型用于避免在两个子链连接在一起时必须在磁盘上移动数据。

### backfiller

## 实例化

在实例化`downloader`时候[定义](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L230)了`skeleton`对象，它在 downloader 的整个生命周期内保持活动状态。

```go

// New creates a new downloader to fetch hashes and blocks from remote peers.
func New(checkpoint uint64, stateDb ethdb.Database, mux *event.TypeMux, chain BlockChain, lightchain LightChain,
dropPeer peerDropFn, success func()) *Downloader {
    ...
    dl := &Downloader{
        ...
    }
    dl.skeleton = newSkeleton(stateDb, dl.peers, dropPeer, newBeaconBackfiller(dl, success))
    ...
    return dl
}
```

同时 skeleton 也给自己实例化了一个 `backfiller`.

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

`skeleton` 使用独立的 goroutine 执行`startup`。这是一个后台循环函数，它通过等待事件进而启动或关闭同步器。

```go
func (s *skeleton) startup() {
    // Close a notification channel so anyone sending us events will know if the
    // sync loop was torn down for good.
    defer close(s.terminated)

    // Wait for startup or teardown. This wait might loop a few times if a beacon
    // client requests sync head extensions, but not forced reorgs (i.e. they are
    // giving us new payloads without setting a starting head initially).
    for {
        // event loop
        select {
        case errc := <-s.terminate:
            ...
        // 处理 skeleton.Sync 中产生的 headEvents。
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

            // subchain sync loop: 依次同步 subchain 中的每个 head，
            for {
                // 直到 subchain 被local chain linked 或者 merged，或者 sync be terminated.
                // If the sync cycle terminated or was terminated, propagate up when
                // higher layers request termination. There's no fancy explicit error
                // signalling as the sync loop should never terminate (TM).

                // 根据 err 判断 subchain 当前处理状态，是否有新的 head 需要同步。
                // newHead 就是 subchain 中下次需要同步的 head。
                newhead, err := s.sync(head)
                switch {
                case err == errSyncLinked:
                    // Sync cycle linked up to the genesis block. Tear down the loop
                    // and restart it so, it can properly notify the backfiller. Don't
                    // account a new head.
                    head = nil

                case err == errSyncMerged:
                    // Subchains were merged, we just need to reinit the internal
                    // start to continue on the tail of the merged chain. Don't
                    // announce a new head,
                    head = nil

                case err == errSyncReorged:
                    // The subchain being synced got modified at the head in a
                    // way that requires resyncing it. Restart sync with the new
                    // head to force a cleanup.
                    head = newhead

                case err == errTerminated:
                    // Sync was requested to be terminated from within, stop and
                    // return (no need to pass a message, was already done internally)
                    return

                default:
                    // Sync either successfully terminated or failed with an unhandled
                    // error. Abort and wait until Geth requests a termination.
                    errc := <-s.terminate
                    errc <- err
                    return
                }
            }
        }
    }
```

注意看函数中新加的中文注释。 下面我们

## head 同步

下面看 `skeleton.sync`如何同步的。假设同步场景是 `remoteHead = localHead + 2`：

```go
// If we're continuing a previous merge interrupt, just access the existing
// old state without initing from disk.
if head == nil {
    head = rawdb.ReadSkeletonHeader(s.db, s.progress.Subchains[0].Head)
} else {
    // Otherwise, initialize the sync, trimming and previous leftovers until
    // we're consistent with the newly requested chain head
    s.initSync(head)
}
```

### 初始化同步信息

```go
// initSync attempts to get the skeleton sync into a consistent state wrt any
// past state on disk and the newly requested head to sync to. If the new head
// is nil, the method will return and continue from the previous head.
func (s *skeleton) initSync(head *types.Header) {
    // Extract the head number, we'll need it all over
    number := head.Number.Uint64()

    // Retrieve the previously saved sync progress
    if status := rawdb.ReadSkeletonSyncStatus(s.db); len(status) > 0 {
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

`initSync`中主要的事情就是将 head 作为 `skeleton.process.Subchains[0]`(后面统一称为 `lastchain`)，处理逻辑是：

- 如果之前有未完成同步的`subchains`，并且 head 可以和原有的 `Subchains[0]` 进行合并，就进行合并。
- 否则将 head 作为新的 subchains[0]。

后面的流程都是针对`lastchain`进行同步和回填。

```go
    // Create the scratch space to fill with concurrently downloaded headers
    s.scratchSpace = make([]*types.Header, scratchHeaders)
    defer func() { s.scratchSpace = nil }() // don't hold on to references after sync

    s.scratchOwners = make([]string, scratchHeaders/requestHeaders)
    defer func() { s.scratchOwners = nil }() // don't hold on to references after sync

    s.scratchHead = s.progress.Subchains[0].Tail - 1 // tail must not be 0!
```

- 初始化用于保存同步 head 的内存空间，每次同步可以保存 131072 个 head（`scratchHeaders`)。
- head 同步自不同的 peer，每个 peer 可以同步 512 个 head（`requestHeaders`）。`scratchOwners` 记录了每批 head 对应的 peerID 。
- `scratchHead` 是 lastchain 末尾 head 可以连接的 parent head number。

### lastchain 可 link

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

如果`lastchain` 可以与`local chain`连接起来，就让 Downloader 执行`backfill`，注意这是一个异步过程。

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

`beaconBackFiller.resume` 逻辑很简单：

- 修改`filler`本身的状态参数。
- 使用单独的 goroutine [启动](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L108) `downloader.synchronise`同步`lastchain`对应的`state`和链上数据。`downloader.synchronise`函数分析参见[downloader 分析]({{< ref "../downloader" >}})）。

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

可以看到，每次 `resume` 都是在同步第一条 subchain `skeleton.progress.Subchains[0]`。

```go
    for {
        ..
        select {
            ...
        case event := <-s.headEvents:
            // New head was announced, try to integrate it. If successful, nothing
            // needs to be done as the head simply extended the last range. For now
            // we don't seamlessly integrate reorgs to keep things simple. If the
            // network starts doing many mini reorgs, it might be worthwhile handling
            // a limited depth without an error.
            if reorged := s.processNewHead(event.header, event.force); reorged {
                // If a reorg is needed, and we're forcing the new head, signal
                // the syncer to tear down and start over. Otherwise, drop the
                // non-force reorg.
                if event.force {
                    event.errc <- nil // forced head reorg accepted
                    return event.header, errSyncReorged
                }
                event.errc <- errReorgDenied
                continue
            }
            event.errc <- nil // head extension accepted

            // New head was integrated into the skeleton chain. If the backfiller
            // is still running, it will pick it up. If it already terminated,
            // a new cycle needs to be spun up.
            if linked {
                s.filler.resume()
            }
        ...
        }
    }
```

在等待 Downloader 对 lastchain 进行回填过程中，当前 skeleton 继续等待其他 event 发生，如果有 newHeader 到来，就将其整合到 lastchain 中， 返回 new header 以及 errSyncReorged 到上一层，循环中开启下一次同步。

### lastchain 不可 link

```go
    for {
        // Something happened, try to assign new tasks to any idle peers
        if !linked {
            s.assignTasks(responses, requestFails, cancel)
        }
        // Wait for something to happen
        select {
            ...
        case res := <-responses:
            // Process the batch of headers. If though processing we managed to
            // link the current subchain to a previously downloaded one, abort the
            // sync and restart with the merged subchains.
            //
            // If we managed to link to the existing local chain or genesis block,
            // abort sync altogether.
            linked, merged := s.processResponse(res)
            if linked {
                log.Debug("Beacon sync linked to local chain")
                return nil, errSyncLinked
            }
            if merged {
                log.Debug("Beacon sync merged subchains")
                return nil, errSyncMerged
            }
            // We still have work to do, loop and repeat
        }
    }
```

如果 lastchain 不能和 localchain link 在一起，就需要调用 assignTasks 建立任务下载二者之前缺少的 head，下载成功后由 processResponse 处理，返回 errSyncLinked 或者 errSyncMerged 错误，在上层循环中开启下次同步。
