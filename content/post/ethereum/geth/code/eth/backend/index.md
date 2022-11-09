---
title: "ethereum full node service"
description:
slug: eth-full-node-service
date: 2022-11-09T16:35:37+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

## 概述

[Ethereum](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/backend.go#L66) 实现了 Ethereum 完全节点服务（full node service）。

```go
type Ethereum struct {
    config *ethconfig.Config

    // Handlers
    txPool             *txpool.TxPool
    blockchain         *core.BlockChain
    handler            *handler
    ethDialCandidates  enode.Iterator
    snapDialCandidates enode.Iterator
    merger             *consensus.Merger

    // DB interfaces
    chainDb ethdb.Database // Block chain database

    eventMux       *event.TypeMux
    engine         consensus.Engine
    accountManager *accounts.Manager

    bloomRequests     chan chan *bloombits.Retrieval // Channel receiving bloom data retrieval requests
    bloomIndexer      *core.ChainIndexer             // Bloom indexer operating during block imports
    closeBloomHandler chan struct{}

    APIBackend *EthAPIBackend

    miner     *miner.Miner
    gasPrice  *big.Int
    etherbase common.Address

    networkID     uint64
    netRPCService *ethapi.NetAPI

    p2pServer *p2p.Server

    lock sync.RWMutex // Protects the variadic fields (e.g. gas price and etherbase)

    shutdownTracker *shutdowncheck.ShutdownTracker // Tracks if and when the node has shutdown ungracefully
}
```

## 实例化

```go

// New creates a new Ethereum object (including the
// initialisation of the common Ethereum object)
func New(stack *node.Node, config *ethconfig.Config) (*Ethereum, error) {
    ...
    engine := ethconfig.CreateConsensusEngine(stack, &ethashConfig, cliqueConfig, config.Miner.Notify, config.Miner.Noverify, chainDb)

    eth := &Ethereum{
        ...
    }
    eth.blockchain, err = core.NewBlockChain(chainDb, cacheConfig, config.Genesis, &overrides, eth.engine, vmConfig,
eth.shouldPreserve, &config.TxLookupLimit)
    ...
    eth.txPool = txpool.NewTxPool(config.TxPool, eth.blockchain.Config(), eth.blockchain)
    ...
    if eth.handler, err = newHandler(&handlerConfig{
        ...
        }); err!=nil {
        return nil, err
    }
    ...
    eth.miner = miner.New(eth, &config.Miner, eth.blockchain.Config(), eth.EventMux(), eth.engine, eth.isLocalBlock)
    eth.miner.SetExtra(makeExtraData(config.Miner.ExtraData))

    eth.APIBackend = &EthAPIBackend{stack.Config().ExtRPCEnabled(), stack.Config().AllowUnprotectedTxs, eth, nil}
    ...
    // Start the RPC service
    eth.netRPCService = ethapi.NewNetAPI(eth.p2pServer, config.NetworkId)

    // Register the backend on the node
    stack.RegisterAPIs(eth.APIs())
    stack.RegisterProtocols(eth.Protocols())
    stack.RegisterLifecycle(eth)

    return eth, nil
}
```

## 启动

它是作为一个 service(`lifecycle`) 注册在 node 上面的，所以现在看下 service 启动做了些什么事情：

```go
func (s *Ethereum) Start() error {
    eth.StartENRUpdater(s.blockchain, s.p2pServer.LocalNode())

    // Start the bloom bits servicing goroutines
    s.startBloomHandlers(params.BloomBitsBlocks)

    // Regularly update shutdown marker
    s.shutdownTracker.Start()

    // Figure out a max peers count based on the server limits
    maxPeers := s.p2pServer.MaxPeers
    if s.config.LightServ > 0 {
        if s.config.LightPeers >= s.p2pServer.MaxPeers {
            return fmt.Errorf("invalid peer config: light peer count (%d) >= total peer count (%d)", s.config.LightPeers, s.p2pServer.MaxPeers)
        }
        maxPeers -= s.config.LightPeers
    }
    // Start the networking layer and the light server if requested
    s.handler.Start(maxPeers)
    return nil
}
```

启动内部 goroutine ：

+ 启动更新 [eth ENR](https://eips.ethereum.org/EIPS/eip-778) 循环。
+ 启动管理 ethereum 链协议的[handler](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/handler.go#L129) 。

## eth ENR

## handler

```go
// newHandler returns a handler for all Ethereum chain management protocol.
func newHandler(config *handlerConfig) (*handler, error) {
    // Create the protocol manager with the base fields
    if config.EventMux == nil {
        config.EventMux = new(event.TypeMux) // Nicety initialization for tests
    }
    h := &handler{
    }
    // Construct the downloader (long sync)
    h.downloader = downloader.New(h.checkpointNumber, config.Database, h.eventMux, h.chain, nil, h.removePeer, success)
    h.blockFetcher = fetcher.NewBlockFetcher(false, nil, h.chain.GetBlockByHash, validator, h.BroadcastBlock, heighter,
nil, inserter, h.removePeer)
    h.txFetcher = fetcher.NewTxFetcher(h.txpool.Has, h.txpool.AddRemotes, fetchTx)
    h.chainSync = newChainSyncer(h)
    return h, nil
}
```

定义了一下组件：

+ downloader
+ blockFetcher
+ txFetcher
+ chainSync

```go
func (h *handler) Start(maxPeers int) {
    h.maxPeers = maxPeers

    // broadcast transactions
    h.wg.Add(1)
    h.txsCh = make(chan core.NewTxsEvent, txChanSize)
    h.txsSub = h.txpool.SubscribeNewTxsEvent(h.txsCh)
    go h.txBroadcastLoop()

    // broadcast mined blocks
    h.wg.Add(1)
    h.minedBlockSub = h.eventMux.Subscribe(core.NewMinedBlockEvent{})
    go h.minedBroadcastLoop()

    // start sync handlers
    h.wg.Add(1)
    go h.chainSync.loop()
}
```

### 广播交易

### 广播挖到的块

### 链同步

```go

// loop runs in its own goroutine and launches the sync when necessary.
func (cs *chainSyncer) loop() {
    defer cs.handler.wg.Done()

    cs.handler.blockFetcher.Start()
    cs.handler.txFetcher.Start()
    defer cs.handler.blockFetcher.Stop()
    defer cs.handler.txFetcher.Stop()
    defer cs.handler.downloader.Terminate()

    // The force timer lowers the peer count threshold down to one when it fires.
    // This ensures we'll always start sync even if there aren't enough peers.
    cs.force = time.NewTimer(forceSyncCycle)
    defer cs.force.Stop()

    for {
        if op := cs.nextSyncOp(); op != nil {
            cs.startSync(op)
        }
        select {
        case <-cs.peerEventCh:
            // Peer information changed, recheck.
        case err := <-cs.doneCh:
        case <-cs.force.C:

        case <-cs.handler.quitSync:
        }
    }
}
```

这里看下是否开启同步的判断，以及如何开始同步

#### 同步判断

```go
func (cs *chainSyncer) nextSyncOp() *chainSyncOp {
    ...
    // If a beacon client once took over control, disable the entire legacy sync
    // path from here on end. Note, there is a slight "race" between reaching TTD
    // and the beacon client taking over. The downloader will enforce that nothing
    // above the first TTD will be delivered to the chain for import.
    //
    // An alternative would be to check the local chain for exceeding the TTD and
    // avoid triggering a sync in that case, but that could also miss sibling or
    // other family TTD block being accepted.
    if cs.handler.chain.Config().TerminalTotalDifficultyPassed || cs.handler.merger.TDDReached() {
        return nil
    }
    ...
}
```

从代码可以看出，merge 后，链同步不走这里了。

