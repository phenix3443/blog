---
title: "geth 区块同步源码解析"
description:
slug: geth-block-sync
date: 2022-08-24T20:24:11+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
tags:
    - geth
    - ethereum
---

## 引言

区块链本质上是分布式的，因此同步区块数据是必不可少的一个功能模块。在这篇文章以及接下来的几篇文章里，我们就来看一下以太坊中关于区块同步的代码。由于区块同步的代码比较多，逻辑也比较复杂，因此本篇文章里我们只是先看看关于协议的内容和数据收发的主要流程，后面的文章将会单独分析其它内容。

所有的公链项目在底层都使用了p2p技术来支持节点间的互联和通信。但本篇文章不会涉及到p2p的内容，一方面是因为p2p技术包含的内容很多，再多写几篇文章也不能分析完，更无法在当前文章里讲清楚；另一方面也是因为p2p属于自成体系的成熟技术了，也有成熟的库可以使用。

## 源码目录

以太坊中关于区块同步和交换的代码位于eth目录下和les目录下。其中eth实现了所有的相关逻辑，而les只是light同步模式下的实现。这可以从 [`cmd/utils/flags.go`中的`RegisterEthService`](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/cmd/utils/flags.go#L2004) 函数中看出来：

```go
func RegisterEthService(stack *node.Node, cfg *ethconfig.Config) (ethapi.Backend, *eth.Ethereum) {
    if cfg.SyncMode == downloader.LightSync {
        backend, err := les.New(stack, cfg)
        if err != nil {
            Fatalf("Failed to register the Ethereum service: %v", err)
        }
        stack.RegisterAPIs(tracers.APIs(backend.ApiBackend))
        if err := lescatalyst.Register(stack, backend); err != nil {
            Fatalf("Failed to register the Engine API service: %v", err)
        }
        return backend.ApiBackend, nil
    }
    backend, err := eth.New(stack, cfg)
    if err != nil {
        Fatalf("Failed to register the Ethereum service: %v", err)
    }
    if cfg.LightServ > 0 {
        _, err := les.NewLesServer(stack, backend, cfg)
        if err != nil {
            Fatalf("Failed to create the LES server: %v", err)
        }
    }
    if err := ethcatalyst.Register(stack, backend); err != nil {
        Fatalf("Failed to register the Engine API service: %v", err)
    }
    stack.RegisterAPIs(tracers.APIs(backend.APIBackend))
    return backend.APIBackend, backend
}
```

当配置文件中的 `SyncMode` 字段为 `downloader.LightSync` 时，会使用 les 目录下的代码；否则使用eth目录下的代码。由于eth目录下的代码实现了全部的逻辑和功能，因此我们主要关注eth目录下的代码。

在 eth 目录下，和区块同步相关的主要的源代码文件有 `handler.go`、`peer.go`、`sync.go`，以及 `downloader` 目录和 `fetcher` 目录。其中前三个源码文件定义了区块同步协议及整体工作框架，也是本篇文章要重点分析的内容；而后两个目录是我们之后的文章要分析的内容。

NewPeer：

- broadcastBlocks 是一个写入循环，它将块和块公告（block announcements）多路复用到远程对等方。 目标是拥有一个不锁定节点内部并同时限制排队数据的异步写入器。
## 运行框架

[^1]: 参考文章：[https://yangzhe.me/2019/04/14/ethereum-protocol/](https://yangzhe.me/2019/04/14/ethereum-protocol/)