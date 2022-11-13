---
title: "queue"
description: Geth 源码解析：downloader/queue
slug: geth-downloader-queue
date: 2022-11-12T18:57:42+08:00
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

## 引言

[queue](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/queue.go#L111) 对象是 downloader 模块的一个辅助对象，它的主要目的，是记录所需下载区块的各种信息，以及将分开下载的各区块信息（header，body，receipt 等）组成完整的区块。

queue 对象与 Downloader 对象紧密关联，共同完成了区块下载的逻辑。它也是完全理解 downloader 模块、尤其是 `Downloader.concurrentFetch` 的关键。因此我们专门用一篇文章来详细分析一下 queue 对象。

## 有哪些功能

queue 对象是 downloader  模块的一个内部对象，只有 downloader 对象使用了它。下面我们会先从整体上了解一下 queue 提供的功能，然后详细分析一下 queue 的内部实现。

在下载正式发起之前，以及数据真正下载之前，Downloader 对象会调用 queue 的一些方法，对其进行初始化，或将需要下载的数据信息告诉 queue。我们先来看一下这类功能：

+ `queue.Prepare`用来在下载开始之前，告诉 queue 对象将要下载的一系列区块的起始高度和下载模式（fast 或 full 模式）。
+ `queue.ScheduleSkeleton`用来在填充 skeleton 之前，使用 skeleton 的信息对 queue 对象进行初始化。
+ `queue.Schedule`用来准备对一些 body 和 receipt 数据的下载。在 [Downloader.processHeaders]({{< ref "../downloader/#processHeaders" >}}) 中处理下载成功的 header 时，使用这些 header 调用 queue.Schedule 方法，以便 queue 对象可以开始对这些 header 对应的 body 和 receipt 开始下载调度。

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

上面的分类按从前到后的顺序，也基本是区块同步的流程和顺序。可以看出来，queue 是一个真正的工具类，它的方法的调用方式和顺序完全依赖于下载流程。清楚了 queue 各方法的调用时机，那么它的详细实现也就很好理解了。注意在下面的分析中，我们是顺着区块同步过程中， queue 对象的各功能被调用的先后逻辑来进行的。

## Schedule {#Schedule}

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
        // 一些检查校验
        ...
        // block 下载队列
        if _, ok := q.blockTaskPool[hash]; ok {
            log.Warn("Header already scheduled for block fetch", "number", header.Number, "hash", hash)
        } else {
            q.blockTaskPool[hash] = header
            q.blockTaskQueue.Push(header, -int64(header.Number.Uint64()))
        }
        // receipt 下载队列
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

参数 headers 中的区块头的哈希和高度被写到了 body 和 receipt 队列中，等待调度。其中`queue.blockTaskQueue`和`queue.receiptTaskQueue`都是一个优先级队列，它们与`queue.headerTaskQueue`是类似的，都存放着将要下载的数据信息。`queue.BlockTaskPool`和`queue.receiptTaskPool`仅仅是为了记录数据已经被 queue 对象处理了，除此之外并没有什么用处。

注意这里会对下载模式进行判断，因为在 snap 模式下要下载 receipt 数据，而其它模式下 `queue.receiptTaskQueue` 是空的。

在 queue 中准备好了 body 和 receipt 相关的数据队列，[Downloader.processHeaders]({{< ref "../downloader/#processHeaders" >}}) 就会通知`Downloader.fetchBodies` 和 `Downloader.fetchReceipts` 可以对各自的数据进行下载了。这俩方法都调用了[Downloader.concurrentFetch]({{< ref "../downloader/#concurrentFetch" >}})，查看一下代码就可以知道，对于 body 和 receipt 数据来说：

+ reserve 给每个空闲的 peer 分配下载任务，最终调用的都是`queue.reserveHeaders`。
+ request 空闲 peer 发起通过 p2p 协议查询。
+ deliver 处理收到的数据，最后调用的都是`queue.deliver`。

下面依次看下这几个函数。

## reserve body & receipt {#reserve}

[queue.reserveHeaders](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/queue.go#L487) 是被 `queue.ReserveBodies` 和 `queue.ReserveReceipts` 共同调用的，只不过使用的参数不同，即用到的`task queue`和`task pool`等数据不同，其它逻辑都是一样的。因此我们通过分析`queue.reserveHeaders` 来看一下 queue 对象是如何实现 body 和 receipt 的 reserve 功能的。

```go
// reserveHeaders reserves a set of data download operations for a given peer,
// skipping any previously failed ones. This method is a generic version used
// by the individual special reservation functions.
//
// Note, this method expects the queue lock to be already held for writing. The
// reason the lock is not obtained in here is because the parameters already need
// to access the queue, so they already need a lock anyway.
//
// Returns:
//
//	item     - the fetchRequest
//	progress - whether any progress was made
//	throttle - if the caller should throttle for a while
func (q *queue) reserveHeaders(p *peerConnection, count int, taskPool map[common.Hash]*types.Header, taskQueue *prque.Prque,
    pendPool map[string]*fetchRequest, kind uint) (*fetchRequest, bool, bool) {
    // Short circuit if the pool has been depleted, or if the peer's already
    // downloading something (sanity check not to corrupt state)
    if taskQueue.Empty() {
        return nil, false, true
    }
    // 如果节点已经在处理数据，直接返回
    if _, ok := pendPool[p.id]; ok {
        return nil, false, false
    }
    // Retrieve a batch of tasks, skipping previously failed ones
    send := make([]*types.Header, 0, count)
    skip := make([]*types.Header, 0)
```

方法的开始做了一些有效性检查。

```go
    progress := false
    throttled := false
    for proc := 0; len(send) < count && !taskQueue.Empty(); proc++ {
        // the task queue will pop items in order, so the highest prio block
        // is also the lowest block number.
        h, _ := taskQueue.Peek()
        header := h.(*types.Header)
        // we can ask the resultcache if this header is within the
        // "prioritized" segment of blocks. If it is not, we need to throttle

        stale, throttle, item, err := q.resultCache.AddFetch(header, q.mode == SnapSync)
        if stale {
            // Don't put back in the task queue, this item has already been
            // delivered upstream
            taskQueue.PopItem()
            progress = true
            delete(taskPool, header.Hash())
            proc = proc - 1
            log.Error("Fetch reservation already delivered", "number", header.Number.Uint64())
            continue
        }
        if throttle {
            // There are no resultslots available. Leave it in the task queue
            // However, if there are any left as 'skipped', we should not tell
            // the caller to throttle, since we still want some other
            // peer to fetch those for us
            throttled = len(skip) == 0
            break
        }
        if err != nil {
            // this most definitely should _not_ happen
            log.Warn("Failed to reserve headers", "err", err)
            // There are no resultslots available. Leave it in the task queue
            break
        }
        if item.Done(kind) {
            // 删除已经完成的任务
            // If it's a noop, we can skip this task
            delete(taskPool, header.Hash())
            taskQueue.PopItem()
            proc = proc - 1
            progress = true
            continue
        }
        // Remove it from the task queue
        taskQueue.PopItem()
        // Otherwise unless the peer is known not to have the data, add to the retrieve list
        //如果 peerConnection 对象已明确记录了它代表的节点没有这个数据，则将数据放到 skip 中。
        if p.Lacks(header.Hash()) {
            skip = append(skip, header)
        } else {
            send = append(send, header)
        }
    }
```

这一段代码是一个 for 循环，它根据 send 和 count 等变量的限制，从`taskQueue`中依次取出一个任务进行处理。注意对于 body 和 receipt 数据来说，它们的`taskQueue`中的数据依然是 header 对象，因为 body 和 receipt 是依赖于 header 进行下载的。

在 for 循环中主要有 2 个功能：

1. 将 header 放入 queue.resultCache 中。queue.resultCache 字段用来记录所有正在被处理的数据的处理结果，它的元素类型是 [fetchResult](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/queue.go#L63) 结构。这里注意它的 Pending 字段，它代表当前区块还有几类数据需要下载。这里需要下载的数据最多有两类：body 和 receipt，full 模式下只需要下载 body 数据，而 fast 模式要多下载一个 receipt 数据，因此这里的`item.Done`判断是否表 body 或者 receipt 下载成功了，若果下载成功了，就将 head 从 taskPool 和 taskQueue 中删除。
2. 处理远程节点缺少这个当前区块数据的情况。在 peerConnection 对象中记录着下载失败的区块的数据，因此这里如果发现这个节点曾经下载当前数据失败过，就不再让它下载了（放入 skip 队列中）。

这个 for 循环结束后，功能基本也就完成了，我们再看看剩下的代码：

```go
    // Merge all the skipped headers back
    for _, header := range skip {
        taskQueue.Push(header, -int64(header.Number.Uint64()))
    }
    if q.resultCache.HasCompletedItems() {
        // Wake Results, resultCache was modified
        q.active.Signal()
    }
    // Assemble and return the block download request
    if len(send) == 0 {
        return nil, progress, throttled
    }
    request := &fetchRequest{
        Peer:    p,
        Headers: send,
        Time:    time.Now(),
    }
    pendPool[p.id] = request
    return request, progress, throttled
}
```

最后的代码将跳过的数据（skip）再次加入到「task queue」中。如果 progress 变量为true，也就是说有区块数据下载成功了（其实是空数据），则设置 queue.active 进行通知（`queue.Results` 可能会在等待这个信号）。

接下来就是构造 fetchRequest 结构并返回了。注意这里的 request 变量与 queue.ReserveHeaders 中的不同，这里没有用到 From 字段（这个字段是下载 header 时才用的）。

可以看到在 queue 对象中对于 body 和 receipt 的 reserve 操作，就是从各自的`task queue`中选取一定数量的任务数据，写入 `queue.resultCache` 中并构造 fetchRequest 结构并返回。这个过程中会对空区块和曾经下载失败的区块进行特殊处理。

## request {#request}

request [eth protocol]({{< ref "/post/ethereum/protocol/eth" >}}) p2p 请求进行查询，这部分逻辑很简单。

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
```

## deliver body & receipt {#deliver}

[Downloader.concurrentFetch]({{< ref "../downloader/#concurrentFetch" >}})数据下载成功后，会调用 queue 对象的 deliver 方法进行传递，这包括 queue.DeliverBodies 和 queue.DeliverReceipts。这两个方法都以不同的参数调用了`queue.deliver`方法，

```go
func (q *queue) deliver(id string, taskPool map[common.Hash]*types.Header,
    taskQueue *prque.Prque, pendPool map[string]*fetchRequest,
    reqTimer metrics.Timer, resInMeter metrics.Meter, resDropMeter metrics.Meter,
    results int, validate func(index int, header *types.Header) error,
    reconstruct func(index int, result *fetchResult)) (int, error) {
    // Short circuit if the data was never requested
    // 一些有效性检查代码
    ...
    // If no data items were retrieved, mark them as unavailable for the origin peer
    if results == 0 {
        // 如果下载的数据数量为0，则把所有此节点此次下载的数据标记为`Lacking`（[queue.reserveHeaders]() 中的`isLacks`调用`MarkLacking`是配合使用的）
        for _, header := range request.Headers {
            request.Peer.MarkLacking(header.Hash())
        }
    }
    // Assemble each of the results with their headers and retrieved data parts
    var (
        accepted int //
        failure  error
        i        int // 记录以一个异常的数据
        hashes   []common.Hash
    )
    // 检查收到的数据，
    for _, header := range request.Headers {
        ...
        // Validate the fields
        if err := validate(i, header); err != nil {
            failure = err
            break
        }
        hashes = append(hashes, header.Hash())
        i++
    }
    // 循环处理收到的数据
    for _, header := range request.Headers[:i] {
        // 后去收到的数据
        if res, stale, err := q.resultCache.GetDeliverySlot(header.Number.Uint64()); err == nil && !stale {
            // 重新组装
            reconstruct(accepted, res)
        } else {
            ...
        }
        // Clean up a successful fetch
        delete(taskPool, hashes[accepted])
        accepted++
    }
    resDropMeter.Mark(int64(results - accepted))

    // Return all failed or missing fetches to the queue
    for _, header := range request.Headers[accepted:] {
        taskQueue.Push(header, -int64(header.Number.Uint64()))
    }
    // Wake up Results
    if accepted > 0 {
        q.active.Signal()
    }
    if failure == nil {
        return accepted, nil
    }
    // If none of the data was good, it's a stale delivery
    if accepted > 0 {
        return accepted, fmt.Errorf("partial failure: %v", failure)
    }
    return accepted, fmt.Errorf("%w: %v", failure, errStaleDelivery)
}
```

不管对于 body 还是 receipt，它都是先检查其哈希值是否正确，然后将其写入 fetchResult 结构中相应的字段中。 `validate` 和 `reconstruct` 分别在调用的时候由 DeliverBodies、DeliverReceipts 传递。reconstruct 的 result 参数的值正是 `queue.resultCache[index]`。

在第二个 for 循环之后，所有被验证通过且写入 queue.resultCache 中的数据，accepted 应该为处理过的 header 的计数。如果不是，对于未处理的 header（request.Headers[accepted:]）需要将其加入 `task queue` 重新下载。

如果有数据被验证通过且写入 queue.resultCache 中了（accepted > 0），那么就要发送 queue.active 消息了。前面提到过，`queue.Results`可能会等待这这个信号。

如果处理没有错误，返回，否则返回发生的错误。

## Results {#results}

目前为止，整个流程处在 header、body 等数据不断在同时下载的过程中。那么当一个区块的数据（header、body 和 receipt）都下载完成时，Downloader 对象就要获取这些区块并将其写入数据库了。queue.Results 就是用来返回所有目前已经下载完成的数据，它在 `Downloader.processFullSyncContent`和`Downloader.processFastSyncContent`中被[调用]({{< ref "../downloader/#processSyncContent" >}}) 。下面就看一下它的实现：

```go
func (q *queue) Results(block bool) []*fetchResult {
    // Abort early if there are no items and non-blocking requested
    // 如果函数调用时非阻塞的，但是数据又没下载完成，就直接返回
    if !block && !q.resultCache.HasCompletedItems() {
        return nil
    }
    closed := false
    for !closed && !q.resultCache.HasCompletedItems() {
        // In order to wait on 'active', we need to obtain the lock.
        ...
        q.lock.Lock()
        if q.resultCache.HasCompletedItems() || q.closed {
            // 数据下载完成，或者 queue 被关闭，退出循环
            ...
        }
        // 否则等待通知信号
        // No items available, and not closed
        q.active.Wait()
        closed = q.closed
        q.lock.Unlock()
    }
    ...
    // 所有的数据下载完成，唤醒其他 fetcher 来处理结果
    // With results removed from the cache, wake throttled fetchers
    for _, ch := range []chan bool{q.blockWakeCh, q.receiptWakeCh} {
        select {
        case ch <- true:
        default:
        }
    }
    ...
    return results
}
```

## 总结

上面对于 queue 对象的介绍基本上覆盖区块下载的主要流程。其实在区块同步的过程中，Downloader 对象还依赖于 queue 对象提供的一些其它的功能，比如 inflight、shouldThrottle、cancel、expire 等。这些功能的实现比较简单，基本都是对 queue 对象内部记录的数据的一些计算和判断，这了没有细说。这篇文章很大程度上是对 [fatcat22 的以太坊源码解析：downloader/queue](https://yangzhe.me/2019/05/10/ethereum-downloader.queue) 的二次加工和整理，非常感谢原作者对知识的分享。
