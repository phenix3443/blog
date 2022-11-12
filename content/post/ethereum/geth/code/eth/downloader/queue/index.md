---
title: "queue"
description:
slug: geth-downloader-queue
date: 2022-11-12T18:57:42+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
---

## 引言

[queue](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/queue.go#L111) 对象是`downloader`模块的一个辅助对象，它的主要目的，是记录所需下载区块的各种信息，以及将分开下载的各区块信息（`header`，`body`，`receipt`等）组成完整的区块。`queue` 对象与 `Downloader` 对象紧密关联，共同完成了区块下载的逻辑。它也是完全理解 `downloader` 模块、尤其是 `Downloader.fetchParts` 的关键。因此我们专门用一篇文章来详细分析一下 `queue` 对象。

`queue` 对象是 `downloader` 模块的一个内部对象，只有 Downloader 对象使用了它。下面我们会先从整体上了解一下 queue 提供的功能，然后详细分析一下 queue 的内部实现。

## 有哪些功能

根据 queue 对象的使用方式，我将它的功能分为三类，因此下面我们按大的类型分别看一下 queue 对象的所有功能。

在下载正式发起之前，以及数据真正下载之前，Downloader 对象会调用 queue 的一些方法，对其进行初始化，或将需要下载的数据信息告诉 queue。我们先来看一下这类功能：

+ Prepare

  queue.Prepare 方法用来在下载开始之前，告诉 queue 对象将要下载的一系列区块的起始高度和下载模式（fast 或 full 模式）。

+ ScheduleSkeleton

  queue.ScheduleSkeleton 用来在填充 skeleton 之前，使用 skeketon 的信息对 queue 对象进行初始化。


在数据的下载过程中，Downloader 对象会使用 queue 提供的一些信息来决定和判断数据的下载状态等信息。下面就是 queue 提供的这类功能：

+ pending

  pending 功能用来告诉调用者还有多少条数据需要下载。提供此功能的方法有：queue.PendingHeaders、queue.PendingBlocks、queue.PendingReceipts

+ inflight

  inflight 功能用来告诉调用者当前是否有数据正在被下载。提供此功能的方法有：queue.InFlightHeaders、queue.InFlightBlocks、queue.InFlightReceipts

+ shouldThrottle

  shouldThrottle 功能用来告诉调用者是否该限制（或称为暂停）一下某类数据的下载，其目的是为了防止下载过程中本地内存占用过大。在 Downloader.fetchParts中向某节点发起获取数据请求之前，会进行这种判断。提供此功能的方法有：queue.ShouldThrottleBlocks、queue.ShouldThrottleReceipts

+ reserve

  reserve 功能通过构造一个 fetchRequest 结构并返回，向调用者提供指定数量的待下载的数据的信息（queue 内部会将这些数据标记为「正在下载」）。调用者使用返回的 fetchRequest 数据向远程节点发起新的获取数据的请求。提供此功能的方法有：queue.ReserveHeaders、queue.ReserveBodies、queue.ReserveReceipts

+ cancel

  cancel 功能与 reserve 相反，用来撤消对 fetchRequest 结构中的数据的下载（queue 内部会将这些数据重新从「正在下载」的状态更改为「等待下载」）。提供此功能的方法有：queue.CancelHeaders、queue.CancelBodies、queue.CancelReceipts

+ expire

  通过在参数中指定一个时间段，expire 用来告诉调用者下载时间已经超过指定时间的节点 id 和超时的数据条数。提供此功能的方法有：queue.ExpireHeaders、queue.ExpireBodies、queue.ExpireReceipts

+ deliver

  当有数据下载成功时，调用者会使用 deliver 功能用来通知 queue 对象。提供此功能的方法有：queue.DeliverHeaders、queue.DeliverBodies、queue.DeliverReceipts

在数据下载完成后，Downloader 对象会调用 queue 中的一些方法，获取下载并组装好的区块数据。这类功能有下面几个：

+ RetrieveHeaders

  在填充 skeleton 完成后，queue.RetrieveHeaders 用来获取整个 skeleton 中的所有 header。

+ Results

  queue.Results 用来获取当前的 header、body 和 receipt（只在 fast 模式下） 都已下载成功的区块（并将这些区块从 queue 内部移除）

上面的分类按从前到后的顺序，也基本是区块同步的流程和顺序。可以看出来，queue 是一个真正的工具类，它的方法的调用方式和顺序完全依赖于下载流程。清楚了 queue 各方法的调用时机，那么它的详细实现也就很好理解了。

## 实现分析

在了解了 queue 提供了功能以后，我们现在来看一下它内部的详细实现。注意在下面的分析中，我们是顺着区块同步过程中， queue 对象的各功能被调用的先后逻辑来进行的。

在下载开始时，queue.Prepare 首先被调用，用来设置下载模式和起始区块的高度。它的实现非常简单，为了完整性，只是在这里简单提一下。

### schedule

在 [Downloader.processHeaders]({{< ref "../downloader/#processHeaders" >}}) 根据下载成功的的 header 发起对应的 body 或 receipt 的下载，在这个过程中会调用 queue.Schedule 为下载 body 和 receipt 作准备。我们现在来看一下 `queue.Schedule` 的实现：

```go
// Schedule adds a set of headers for the download queue for scheduling, returning
// the new headers encountered.
func (q *queue) Schedule(headers []*types.Header, hashes []common.Hash, from uint64) []*types.Header {
    q.lock.Lock()
    defer q.lock.Unlock()

    // Insert all the headers prioritised by the contained block number
    inserts := make([]*types.Header, 0, len(headers))
    for i, header := range headers {
        ...
        if _, ok := q.blockTaskPool[hash]; ok {
            log.Warn("Header already scheduled for block fetch", "number", header.Number, "hash", hash)
        } else {
            q.blockTaskPool[hash] = header
            q.blockTaskQueue.Push(header, -int64(header.Number.Uint64()))
        }
        // Queue for receipt retrieval
        if q.mode == SnapSync && !header.EmptyReceipts() {
            if _, ok := q.receiptTaskPool[hash]; ok {
                log.Warn("Header already scheduled for receipt fetch", "number", header.Number, "hash", hash)
            } else {
                q.receiptTaskPool[hash] = header
                q.receiptTaskQueue.Push(header, -int64(header.Number.Uint64()))
            }
        }
        inserts = append(inserts, header)
        q.headerHead = hash
        from++
```

参数 headers 中的区块头的哈希和高度被写到了 body 和 receipt 队列中，等待调度。其中 queue.blockTaskQueue 和 queue.receiptTaskQueue 都是一个优先级队列，它们与 queue.headerTaskQueue 是类似的，都存放着将要下载的数据信息。queue.BlockTaskPool 和 queue.receiptTaskPool 仅仅是为了记录数据已经被 queue 对象处理了，除此之外并没有什么用处。

### reserve body & receipt

在 queue 中准备好了 body 和 receipt 相关的数据队列，`Downloader.processHeaders` 就会[通知](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L1467) `Downloader.fetchBodies` 和 `Downloader.fetchReceipts` 可以对各自的数据进行下载了。这俩方法都调用了`Downloader.concurrentFetch`，主要使用 reserve 和 deliver 函数。所不同的是参数的实现方式不一样罢了。查看一下代码就可以知道，对于 body 和 receipt 数据来说，reserve 参数最终调用的都是 `queue.reserveHeaders`；而 deliver 最终调用的都是 `queue.deliver`。所以我们接下来看一下这两个方法的实现。

`queue.reserveHeaders` 是被 `queue.ReserveBodies` 和 `queue.ReserveReceipts` 共同调用的，只不过使用的参数不同，即用到的「task queue」和「task pool」等数据不同，其它逻辑都是一样的。因此我们通过分析 queue.reserveHeaders 来看一下 queue 对象是如何实现 body 和 receipt 的 reserve 功能的。

todo: 待补充。

# request

```go
// request is responsible for converting a generic fetch request into a body
// one and sending it to the remote peer for fulfillment.
func (q *bodyQueue) request(peer *peerConnection, req *fetchRequest, resCh chan *eth.Response) (*eth.Request, error) {
    peer.log.Trace("Requesting new batch of bodies", "count", len(req.Headers), "from", req.Headers[0].Number)
    if q.bodyFetchHook != nil {
        q.bodyFetchHook(req.Headers)
    }

    hashes := make([]common.Hash, 0, len(req.Headers))
    for _, header := range req.Headers {
        hashes = append(hashes, header.Hash())
    }
    return peer.peer.RequestBodies(hashes, resCh)


// RequestReceipts fetches a batch of transaction receipts from a remote node.
func (p *Peer) RequestReceipts(hashes []common.Hash, sink chan *Response) (*Request, error) {
    p.Log().Debug("Fetching batch of receipts", "count", len(hashes))
    id := rand.Uint64()

    req := &Request{
        id:   id,
        sink: sink,
        code: GetReceiptsMsg,
        want: ReceiptsMsg,
        data: &GetReceiptsPacket66{
            RequestId:         id,
            GetReceiptsPacket: hashes,
        },
    }
    if err := p.dispatchRequest(req); err != nil {
        return nil, err
    }
    return req, nil
}

}

```
### deliver body & receipt



[^1]:https://yangzhe.me/2019/05/10/ethereum-downloader.queue/#schedule