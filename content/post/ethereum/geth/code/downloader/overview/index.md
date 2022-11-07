---
title: "downloader"
description:
date: 2022-11-06T22:40:41+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

## 概述

## 创建

在以太坊链管理协议（ ethereum chain management protocol）Handler 的创建 [newHandler](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/handler.go#L195) 中进行初始化。


## syncWithPeer

现在仔细分析一下[syncWithPeer](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/downloader/downloader.go#L448)，此过程中我们忽略部分错误处理和统计代码。

日志打印是传统同步还是信标链同步。该函数代码有多处需要根据 beaconMode 进行处理的情况。

```go
    if !beaconMode {
        log.Debug("Synchronising with the network", "peer", p.id, "eth", p.version, "head", hash, "td", td, "mode",
mode)
    } else {
        log.Debug("Backfilling with the network", "mode", mode)
    }
```

找到最新的区块头：

```go
    // Look up the sync boundaries: the common ancestor and the target block
    var latest, pivot *types.Header
    if !beaconMode {
        // In legacy mode, use the master peer to retrieve the headers from
        latest, pivot, err = d.fetchHead(p)
        if err != nil {
            return err
        }
    } else {
        // In beacon mode, user the skeleton chain to retrieve the headers from
        latest, _, err = d.skeleton.Bounds()
        if err != nil {
            return err
        }
        if latest.Number.Uint64() > uint64(fsMinFullBlocks) {
        }
    }
    // If no pivot block was returned, the head is below the min full block
    height := latest.Number.Uint64()
```

找到公共祖先：

```go
    var origin uint64
    if !beaconMode {
        // In legacy mode, reach out to the network and find the ancestor
        origin, err = d.findAncestor(p, latest)
        if err != nil {
            return err
        }
    } else {
        // In beacon mode, use the skeleton chain for the ancestor lookup
        origin, err = d.findBeaconAncestor()
        if err != nil {
            return err
        }
    }
```

从公共祖祖先的子块开始下载后续区块的的 header、body、receipt 等信息。

```go
    // Initiate the sync using a concurrent header and content retrieval algorithm
    d.queue.Prepare(origin+1, mode)
    if d.syncInitHook != nil {
        d.syncInitHook(origin, height)
    }
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
