---
title: "downloader"
slug: geth-downloader
description: geth downloader 源码分析
date: 2022-11-06T22:40:41+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
---

## 概述

## 创建

在以太坊链管理协议（ ethereum chain management protocol）Handler 的创建 [newHandler](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/handler.go#L195) 中进行初始化。

## synchronise

```go
func (d *Downloader) synchronise(id string, hash common.Hash, td, ttd *big.Int, mode SyncMode, beaconMode bool,
beaconPing chan struct{}) error {
    ...
    // Retrieve the origin peer and initiate the downloading process
    var p *peerConnection
    if !beaconMode { // Beacon mode doesn't need a peer to sync from
        p = d.peers.Peer(id)
        if p == nil {
            return errUnknownPeer
        }
    }
    if beaconPing != nil {
        close(beaconPing)
    }
    return d.syncWithPeer(p, hash, td, ttd, beaconMode)
}
```

[synchronise](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L363) 逻辑很简单：找到可用的 peer 后调用 `syncWithPeer` 进行同步。

## syncWithPeer

[syncWithPeer](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L448)实现了具体的同步过程，此过程中我们忽略部分错误处理和统计代码。

### 传统同步 vs 信标连同步

```go
    if !beaconMode {
        log.Debug("Synchronising with the network", "peer", p.id, "eth", p.version, "head", hash, "td", td, "mode",
mode)
    } else {
        log.Debug("Backfilling with the network", "mode", mode)
    }
```

通过日志打印指示当前是传统同步还是信标链同步，由于以太坊已经合并，后续分析只关注信标连同步（`beaconMode==true`）。

### latestHead && pivotHead

```go
    // Look up the sync boundaries: the common ancestor and the target block
    var latest, pivot *types.Header
    ...
    // In beacon mode, user the skeleton chain to retrieve the headers from
    latest, _, err = d.skeleton.Bounds()
    if err != nil {
        return err
    }
    // 设置 latest, pivot，在 snap sync 中，block.number > pivot 的 block 也要使用 full sync。
    if latest.Number.Uint64() > uint64(fsMinFullBlocks) {
        ...
    }
    // If no pivot block was returned, the head is below the min full block
    // threshold (i.e. new chain). In that case we won't really snap sync
    // anyway, but still need a valid pivot block to avoid some code hitting
    // nil panics on access.
    // 如果没有找 pivot，则 local chain head 到 latest 都使用 full sync。
    if mode == SnapSync && pivot == nil {
        pivot = d.blockchain.CurrentBlock().Header()
    }
    height := latest.Number.Uint64()
```

通过`skeleton`找到需要同步到的最新的 head。

### find the common ancestor of lastChain and localchain

```go
var origin uint64
...
// In beacon mode, use the skeleton chain for the ancestor lookup
origin, err = d.findBeaconAncestor()
if err != nil {
    return err
}


```

找到`localchain`与待同步的`lastchain`的公共祖先，也就是要下一步同步的起始点。下面具体公共祖先的查找过程。

```go
// findBeaconAncestor tries to locate the common ancestor link of the local chain
// and the beacon chain just requested. In the general case when our node was in
// sync and on the correct chain, checking the top N links should already get us
// a match. In the rare scenario when we ended up on a long reorganisation (i.e.
// none of the head links match), we do a binary search to find the ancestor.
func (d *Downloader) findBeaconAncestor() (uint64, error) {
    // Figure out the current local head position
    // local chain head
    number := chainHead.Number.Uint64()

    // Retrieve the skeleton bounds and ensure they are linked to the local chain
    beaconHead, beaconTail, err := d.skeleton.Bounds()
    // Binary search to find the ancestor
    start, end := beaconTail.Number.Uint64()-1, number
    if number := beaconHead.Number.Uint64(); end > number {
        // 出现这种情况：
        //   subchain.tail(start)<--subchain.head
        // <-----------------------------------------localchain.head(end)
        //
        // This shouldn't really happen in a healthy network, but if the consensus
        // clients feeds us a shorter chain as the canonical, we should not attempt
        // to access non-existent skeleton items.
        log.Warn("Beacon head lower than local chain", "beacon", number, "local", end)
        end = number
        // 现在变成
        //  subchain.tail(start)<--subchain.head(end)
        // <-----------------------------------------localchain.head
    }

    // 二分法查找 subchain 与 localchain 公共祖先节点
    for start+1 < end {
        ...
    }
    return start, nil
}
```

### 下载数据

从公共祖先第一个后继开始下载后续区块的的 header、body、receipt 等信息。

```go
    ...
    var headerFetcher func() error
    if !beaconMode {
        // In legacy mode, headers are retrieved from the network
        headerFetcher = func() error { return d.fetchHeaders(p, origin+1, latest.Number.Uint64()) }
    } else {
        // In beacon mode, headers are served by the skeleton syncer
        headerFetcher = func() error { return d.fetchBeaconHeaders(origin + 1) }
    }
    fetchers := []func() error{
        headerFetcher, // Headers are always retrieved
        func() error { return d.fetchBodies(origin+1, beaconMode) },   // Bodies are retrieved during normal and snap sync
        func() error { return d.fetchReceipts(origin+1, beaconMode) }, // Receipts are retrieved during snap sync
        func() error { return d.processHeaders(origin+1, td, ttd, beaconMode) },
    }
    if mode == SnapSync {
        d.pivotLock.Lock()
        d.pivotHeader = pivot
        d.pivotLock.Unlock()

        fetchers = append(fetchers, func() error { return d.processSnapSyncContent() })
    } else if mode == FullSync {
        fetchers = append(fetchers, func() error { return d.processFullSyncContent(ttd, beaconMode) })
    }
    return d.spawnSync(fetchers)
```

#### fetchHeads && processHeaders

[downloader.fetchBeaconHeaders](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L282) 将 skeleton 中需要同步的 Head 拿出来交给 [processHeaders](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L1254) 进行处理，后者通过`downloader.queue`进行下载。

```go

// processHeaders takes batches of retrieved headers from an input channel and
// keeps processing and scheduling them into the header chain and downloader's
// queue until the stream ends or a failure occurs.
func (d *Downloader) processHeaders(origin uint64, td, ttd *big.Int, beaconMode bool) error {
    // Keep a count of uncertain headers to roll back
    for {
        select {
        case <-d.cancelCh:
            rollbackErr = errCanceled
            return errCanceled

        case task := <-d.headerProcCh:
            for len(headers) > 0 {
                // Unless we're doing light chains, schedule the headers for associated content retrieval
                if mode == FullSync || mode == SnapSync {
                    inserts := d.queue.Schedule(chunkHeaders, chunkHashes, origin)
                }
                headers = headers[limit:]
                hashes = hashes[limit:]
                origin += uint64(limit)
            }

            // Signal the content downloaders of the availability of new tasks
            for _, ch := range []chan bool{d.queue.blockWakeCh, d.queue.receiptWakeCh} {
                select {
                case ch <- true:
                default:
                }
            }
        }
    }
}
```

fetchBodies &&  fetchReceipts 都通过 [concurrentFetch](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/fetchers_concurrent.go#L79) 来进行下载。
