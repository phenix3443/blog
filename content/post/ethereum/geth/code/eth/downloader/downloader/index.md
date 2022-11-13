---
title: "downloader"
slug: geth-downloader
description: Geth 源码解析：downloader
date: 2022-11-11T22:40:41+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tag:
    - geth
    - ethereum
---

## 概述

该模块的主要功能就是从别的节点同步区块。

downloader 模块的代码位于 `eth/downloader` 目录下。其主要的功能代码分别在：

+ downloader.go 实现了区块同步的主要功能和逻辑。
+ peer.go 实际上是对 eth/peer.go 中的对象的封装，增加了节点是否空闲(idle) 的统计。
+ queue.go 实现了 queue 对象（关于 queue 对象的介绍请参看这篇文章），可以理解为这是一个对区块的组装队列。
+ statesync.go 是用来同步 state 对象的。

### 同步模式

参考之前的[文章]({{< ref "/post/ethereum/geth/syncmode" >}})

## 实例化

[eth.handler]({{< ref "../../backend/#newHandler" >}}) 对象的初始化过程定义了 Downloader 实例。

## 同步

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

[synchronise](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/Downloader.go#L363) 找到可用的 peer 后调用 `syncWithPeer` 进行同步。

[syncWithPeer](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/Downloader.go#L448)实现了 full sync 与 snap sync，二者逻辑差别不大，重点关注通过信标链进行的 full sync。下面分段看下这个函数。

### 查找最新 head

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

### 查找公共祖先

```go
var origin uint64
...
// In beacon mode, use the skeleton chain for the ancestor lookup
origin, err = d.findBeaconAncestor()
if err != nil {
    return err
}
```

找到`localchain`与待同步的`lastchain`的公共祖先，也就是同步的起始点。下面具体公共祖先的查找过程。

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

使用 5 个 goroutine 开始下载从公共祖先第一个后继区块的 header、body、receipt，并插入本地数据。

#### fetchHeaders && fetchBeaconHeaders

beaconMode 下，[Downloader.fetchBeaconHeaders](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/beaconsync.go#L282) 将 lastchain 需要同步的 Head 拿出来生成`task`放入`Downloader.headerProcCh`，代码很简单不做分析。

#### processHeaders {#processHeaders}

```go
// processHeaders takes batches of retrieved headers from an input channel and
// keeps processing and scheduling them into the header chain and downloader's
// queue until the stream ends or a failure occurs.
func (d *Downloader) processHeaders(origin uint64, td, ttd *big.Int, beaconMode bool) error {
    ...
    for {
        select {
        case <-d.cancelCh:
            rollbackErr = errCanceled
            return errCanceled

        case task := <-d.headerProcCh:
            ...
            // Otherwise split the chunk of headers into batches and process them
            headers, hashes := task.headers, task.hashes
            ...
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

[processHeaders](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/Downloader.go#L1254) 消费`Downloader.headerProcCh`，使用 [queue.Schedule]({{< ref "../queue#Schedule" >}}) 初始化下载任务，并激活`d.queue.blockWakeCh`, `d.queue.receiptWakeCh`准备下载 body 和 receipt。

#### fetchBodies &&  fetchReceipts {#concurrentFetch}

```go
// concurrentFetch iteratively downloads scheduled block parts, taking available
// peers, reserving a chunk of fetch requests for each and waiting for delivery
// or timeouts.
func (d *Downloader) concurrentFetch(queue typedQueue, beaconMode bool) error {
    // Create a delivery channel to accept responses from all peers
    responses := make(chan *eth.Response)
    ...
    for {
        ...
        // If there's nothing more to fetch, wait or terminate
        if queue.pending() == 0 {
            ...
        } else {
            // Send a download request to all idle peers, until throttled
            var (
                idles []*peerConnection
                caps  []int
            )
            ...

            for _, peer := range idles {
                ...
                // 从 queue 中取出一部分 request 分配给当前空闲 peer 进行请求。
                request, progress, throttle := queue.reserve(peer, queue.capacity(peer, d.peers.rates.TargetRoundTrip()))
                ...
                // Fetch the chunk and make sure any errors return the hashes to the queue
                req, err := queue.request(peer, request, responses)
                ...
            }
        }
        // Wait for something to happen
        select {
            ...
        case res := <-responses:
            if peer := d.peers.Peer(res.Req.Peer); peer != nil {
                // Deliver the received chunk of data and check chain validity
                accepted, err := queue.deliver(peer, res)
                ...
            }

        case cont := <-queue.waker():
            ...
        }
    }
}
```

body 和 receipt 都通过 [typedQueue](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/fetchers_concurrent.go#L39) 接口实现了下载流程的统一，该接口定义了将特定类型（[headerQueue](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/fetchers_concurrent_headers.go#L29)，[bodyQueue](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/fetchers_concurrent_bodies.go#L29)，[receiptQueue](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/fetchers_concurrent_receipts.go#L29s)）的下载器/队列调度程序转换为与类型无关的通用并发获取器算法（[concurrentFetch](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/fetchers_concurrent.go#L79) ）调用所需的适配器。该算法中关键的是三个函数 `typedQueue.reserve`、`typedQueue.request`、`typedQueue.deliver`，这三个函数的具体实现又调用了 queue 对象中不同类型对应的[方法]({{< ref "../queue/#reserve" >}})。

#### processSnapSyncContent && processFullSyncContent {#processSyncContent}

```go

// processFullSyncContent takes fetch results from the queue and imports them into the chain.
func (d *Downloader) processFullSyncContent(ttd *big.Int, beaconMode bool) error {
    for {
        results := d.queue.Results(true)
        if err := d.importBlockResults(results); err != nil {
            return err
        }
    }
}

func (d *Downloader) importBlockResults(results []*fetchResult) error {
    // Check for any early termination requests
    // Retrieve a batch of results to import
    first, last := results[0].Header, results[len(results)-1].Header
    log.Debug("Inserting downloaded chain", "items", len(results),
    blocks := make([]*types.Block, len(results))
    for i, result := range results {
        blocks[i] = types.NewBlockWithHeader(result.Header).WithBody(result.Transactions, result.Uncles)
    }
    // Downloaded blocks are always regarded as trusted after the
    // transition. Because the downloaded chain is guided by the
    // consensus-layer.
    if index, err := d.blockchain.InsertChain(blocks); err != nil {
    }
    return nil
}
```

processSnapSyncContent 和 processFullSyncContent 做的事情也很简单，将 `queue.Results` 返回的下载结果组成 block，使用 [blockchain.InsertChain]({{< ref "../../../core/blockchain_insert" >}}) 更新 local chain。

这里需要注意的是 queue.Results 的第一个参数 true 表明是阻塞调用，process 阻塞直到结果返回。

## 总结

这篇文章介绍了 Downloader 对象更新到指定 header 的整体流程， 配合 [skeleton]({{< ref "../skeleton" >}}) 与 [queue]({{< ref "../queue" >}}) 两篇文章，基本上已经将以太坊(post-merge)通过信标连同步的流程说清楚了：

1. skeleton 设置要同步的 head 片段，也称为 `lastchain`
2. downloader 更具同步模式（snap or full）执行主要下载逻辑，从不同 peer 节点下载 lastchain 中所有的 block 、receipt 等信息。
3. queue 作为 downloader 下载过程中的辅助对象，协助 Downloader 将下载任务按照一定的策略分配到不同的 peer，又将 peer 返回的数据组合成最终的 res，供 Downloader 后续在 local chain 使用。

整个流程中，使用 channel、goroutine、sync.Cond 实现了流程的异步处理。

系列文章很多地方参考了[fatcat22 以太坊源码解析](http://yangzhe.me/2019/05/09/ethereum-downloader) 系列，感谢 fatcat22 对知识的分享。
