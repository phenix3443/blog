---
title: "Eth Protocol"
slug: eth/protocol-eth
description:
date: 2022-11-08T15:52:39+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - geth
---

## 概述

eth 是 RLPx 传输协议，可促进 peer 之间的以太坊区块链信息交换。当前的协议版本是 `eth/67`。 这里分析 geth 中对于 [eth 协议说明](https://github.com/ethereum/devp2p/blob/master/caps/eth.md) 的实现。

## 注册 eth 协议为 p2p 子协议

```go
// New creates a new Ethereum object (including the
// initialisation of the common Ethereum object)
func New(stack *node.Node, config *ethconfig.Config) (*Ethereum, error) {
    ...
    // Ensure configuration values are compatible and sane
    eth := &Ethereum{
    }
    ...
    // Register the backend on the node
    stack.RegisterAPIs(eth.APIs())
    stack.RegisterProtocols(eth.Protocols())
    stack.RegisterLifecycle(eth)
    ...
    return eth, nil
}
```

在`eth.New`中 [注册](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/backend.go#L265) eth 相关 p2p 子协议。

```go
// Protocols returns all the currently configured
// network protocols to start.
func (s *Ethereum) Protocols() []p2p.Protocol {
    protos := eth.MakeProtocols((*ethHandler)(s.handler), s.networkID, s.ethDialCandidates)
    if s.config.SnapshotCache > 0 {
        protos = append(protos, snap.MakeProtocols((*snapHandler)(s.handler), s.snapDialCandidates)...)
    }
    return protos
}
```

`MakeProtocols` 将 eth 协议转换为 p2p 子协议。

```go
// MakeProtocols constructs the P2P protocol definitions for `eth`.
func MakeProtocols(backend Backend, network uint64, dnsdisc enode.Iterator) []p2p.Protocol {
    protocols := make([]p2p.Protocol, len(ProtocolVersions))
    for i, version := range ProtocolVersions {
        version := version // Closure

        protocols[i] = p2p.Protocol{
            Name:    ProtocolName,
            Version: version,
            Length:  protocolLengths[version],
            // 注意：启动协议的时候执行这里的 Run 函数。
            Run: func(p *p2p.Peer, rw p2p.MsgReadWriter) error {
                peer := NewPeer(version, p, rw, backend.TxPool())
                defer peer.Close()

                return backend.RunPeer(peer, func(peer *Peer) error {
                    return Handle(backend, peer)
                })
            },
            NodeInfo: func() interface{} {
                return nodeInfo(backend.Chain(), network)
            },
            PeerInfo: func(id enode.ID) interface{} {
                return backend.PeerInfo(id)
            },
            Attributes:     []enr.Entry{currentENREntry(backend.Chain())},
            DialCandidates: dnsdisc,
        }
    }
    return protocols
}
```

- [ProtocolVersions](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/protocols/eth/protocol.go#L43) 指示当前 geth 支持两个版本的 eth 协议：

```go
// ProtocolVersions are the supported versions of the `eth` protocol (first
// is primary).
var ProtocolVersions = []uint{ETH67, ETH66}
```

## 启动 eth 协议 peer

```go
    Run: func(p *p2p.Peer, rw p2p.MsgReadWriter) error {
        peer := NewPeer(version, p, rw, backend.TxPool())
        defer peer.Close()
        return backend.RunPeer(peer, func(peer *Peer) error {
            return Handle(backend, peer)
        })
    },
```

当 p2p 模块发现一个新的节点并完成链接时，会调用 [`p2p.Protocol.Run`](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/eth/protocols/eth/handler.go#L106) 函数。该函数在启动协议时通过一个单独的 goroutine[执行](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/p2p/peer.go#L415)。这个函数首先本地实例化一个 peer，然后启动运行它。

`Backend.RunPeer`实际调用的是`s.handler.RunPeer`，这是因为调用`MakeProtocols`时第一个参数进行了类型转换：`(*ethHandler)(s.handler)`。

### 生成 peer 实例

```go
func NewPeer(version uint, p *p2p.Peer, rw p2p.MsgReadWriter, txpool TxPool) *Peer {
    peer := &Peer{
        ...
    }
    // Start up all the broadcasters
    go peer.broadcastBlocks()
    go peer.broadcastTransactions()
    go peer.announceTransactions()
    go peer.dispatcher()

    return peer
}
```

peer 实例使用单独的 goroutine 来执行：

- 广播区块。
- 广播交易。
- 声明交易。（是否有更好翻译）
- 分发上层的请求。

### peer 间握手

```go
// runEthPeer registers an eth peer into the joint eth/snap peerset, adds it to
// various subsystems and starts handling messages.
func (h *handler) runEthPeer(peer *eth.Peer, handler eth.Handler) error {
    ...
    if err := peer.Handshake(h.networkID, td, hash, genesis.Hash(), forkID, h.forkFilter); err != nil {
        peer.Log().Debug("Ethereum handshake failed", "err", err)
        return err
    }
    ...
    // Handle incoming messages until the connection is torn down
    return handler(peer)
```

`backend.RunPeer`实际执行的是`handler.runEthPeer`，这也是前面`MakeProtocols`中类型转换的原因。

```go
// Handshake executes the eth protocol handshake, negotiating version number,
// network IDs, difficulties, head and genesis blocks.
func (p *Peer) Handshake(network uint64, td *big.Int, head common.Hash, genesis common.Hash, forkID forkid.ID,
forkFilter forkid.Filter) error {
    ...
    // Send out own handshake in a new thread
    var status StatusPacket // safe to read after two values have been received from errc

    go func() {
        errc <- p2p.Send(p.rw, StatusMsg, &StatusPacket{
            ProtocolVersion: uint32(p.version),
            NetworkID:       network,
            TD:              td,
            Head:            head,
            Genesis:         genesis,
            ForkID:          forkID,
        })
    }()
    go func() {
        errc <- p.readStatus(network, &status, genesis, forkFilter)
    }()
    ...
    p.td, p.head = status.TD, status.Head
    ...
    return nil
}
```

与其他 peer 建立连接后，必须发送`Status`消息，其中包括总难度 (TD) 和它们“最佳”已知块的哈希。

同时本地 peer 也会收到其他 peer 发来的 TD 以及最新区块的 head Hash, 具有最差 TD 的客户端继续使用 `GetBlockHeaders` 消息下载 block header 。它验证接收到的 header 中的工作量证明值，并使用 `GetBlockBodies` 消息获取块体。使用以太坊虚拟机执行收到的区块，重新创建 state tree 和收据。后面链同步时候继续讲。

此处具体与哪些 peer 建立连接，以及连接的建立过程是 p2p 底层协议处理，这里不做进一步分析。

### 循环处理消息

```go
// Handle is invoked whenever an `eth` connection is made that successfully passes
// the protocol handshake. This method will keep processing messages until the
// connection is torn down.
func Handle(backend Backend, peer *Peer) error {
    for {
        if err := handleMessage(backend, peer); err != nil {
            peer.Log().Debug("Message handling failed in `eth`", "err", err)
            return err
        }
    }
}
```

在收到 peer 的`Status`消息后，以太坊会话处于活动状态，这里无限循环使用 [handleMessage](https://tk.github.com/taikochain/taiko-geth/blob/ad914f6fd42e95ad578827f755f9e399bdc12448/eth/protocols/eth/handler.go#L201) 负责处理后续的 peer 间消息。

```go
// handleMessage is invoked whenever an inbound message is received from a remote
// peer. The remote connection is torn down upon returning any error.
func handleMessage(backend Backend, peer *Peer) error {
    // Read the next message from the remote peer, and ensure it's fully consumed
    msg, err := peer.rw.ReadMsg()
    if err != nil {
        return err
    }
    if msg.Size > maxMessageSize {
        return fmt.Errorf("%w: %v > %v", errMsgTooLarge, msg.Size, maxMessageSize)
    }
    defer msg.Discard()

    var handlers = eth66
    if peer.Version() >= ETH67 {
        handlers = eth67
    }

    // Track the amount of time it takes to serve the request and run the handler
    if metrics.Enabled {
    }
    if handler := handlers[msg.Code]; handler != nil {
        return handler(backend, msg, peer)
    }
    return fmt.Errorf("%w: %v", errInvalidMsgCode, msg.Code)
}

```

客户端实现应该强制限制协议消息的大小。底层 RLPx 传输将单个消息的大小限制为 16.7 MiB。 eth 协议的实际限制较低，通常为 10 MiB（`maxMessageSize`）。如果接收到的消息大于限制，则应断开 peer 的连接。

```go
// maxMessageSize is the maximum cap on the size of a protocol message.
const maxMessageSize = 10 * 1024 * 1024
```

除了接收消息的硬限制，客户端还应该对他们发送的请求和响应施加“软”限制。建议的软限制因消息类型而异。限制请求和响应可确保并发活动，例如块同步和交易交换在同一个 peer 连接上顺利进行。

消息根据 peer 的不同版本选择不同的 handler 进行对应处理。[eth66](https://tk.github.com/taikochain/taiko-geth/blob/ad914f6fd42e95ad578827f755f9e399bdc12448/eth/protocols/eth/handler.go#L167)、[eth67](https://tk.github.com/taikochain/taiko-geth/blob/ad914f6fd42e95ad578827f755f9e399bdc12448/eth/protocols/eth/handler.go#L184) 定义了消息类型以及对应的处理函数：

```go
var eth66 = map[uint64]msgHandler{
    NewBlockHashesMsg:             handleNewBlockhashes,
    NewBlockMsg:                   handleNewBlock,
    ...
}

var eth67 = map[uint64]msgHandler{
    NewBlockHashesMsg:             handleNewBlockhashes,
    NewBlockMsg:                   handleNewBlock,
    TransactionsMsg:               handleTransactions,
    ...
}
```

## 常见消息

在一个会话中，可以执行三个高级任务：链同步、块传播和交易交换。这些任务使用不相交的协议消息集，客户端通常将它们作为所有 peer 连接上的并发活动来执行。

### 链同步

eth 协议的节点应了解从创世块到当前最新块的所有块的完整链。该链是通过从其他 peer 下载获得的。

### 状态同步（又名“快速同步”）

协议版本 eth/63 到 eth/66 也允许同步 state tree。从协议版本 eth/67 开始，以太坊 state tree 不能再使用 eth 协议检索，而是由辅助协议 [snap](https://github.com/ethereum/devp2p/blob/master/caps/snap.md) 提供 state 下载。

状态同步通常通过下载 block header 链来进行，验证它们的有效性。在链同步部分中请求块体，但不执行交易，仅验证其“数据有效性”。客户端在链头附近选择一个块（`pivot block`）并下载该块的 state。

### 块传播

新挖出的区块必须转发到所有节点。这是通过块传播发生的，这是一个两步过程。当收到来自 Peer 的`NewBlock`公告消息时，客户端首先验证该块的基本头有效性，检查工作量证明值是否有效。然后，它使用`NewBlock`消息将块发送给一小部分已连接的 peer （通常是 peer 总数的平方根）。

在 header 有效性检查之后，客户端通过执行包含在块中的所有交易，将块导入其本地链，计算块的`post state`。区块的状态根哈希必须与计算的后状态根相匹配。一旦块被完全处理并被认为是有效的，客户端就会向它之前没有通知的所有 peer 发送一条关于该块的 NewBlockHashes 消息。如果这些 peer 未能通过`NewBlock`从其他任何人那里接收到完整块，它们可能会在稍后请求完整块。

节点永远不应将块公告转发回先前宣布相同块的 peer 。这通常是通过记住最近转发到每个 peer 或从每个 peer 转发的大量块哈希来实现的。

如果块不是客户端当前最新块的直接后继，则接收块公告也可能触发链同步。

### 交易广播

所有节点必须交换待处理的交易，以便将它们转发给矿工，矿工将选择它们以包含在区块链中。客户端跟踪“交易池”中的待处理交易集。该池受特定于客户的限制，可以包含许多（即数千个）交易。

当建立新的 peer 连接时，需要同步双方的交易池。最初，两端应发送包含本地池中所有交易哈希的`NewPooledTransactionHashes`消息以启动交换。

收到 `NewPooledTransactionHashes` 通知后，客户端过滤接收到的集合，收集它自己的本地池中还没有的交易哈希。然后它可以使用`GetPooledTransactions`消息请求交易。

当客户端池中出现新交易时，它应该使用`Transactions`和`NewPooledTransactionHashes`消息将它们传播到网络。`Transactions` 消息转发完整的交易对象，通常发送给一小部分随机连接的 peer 。所有其他 peer 都会收到交易哈希的通知，还可以请求完整的交易对象（如果不知道的话）。将完整的交易分发给一小部分 peer 通常可以确保所有节点都接收到交易并且不需要请求它。

节点永远不应该将交易发送回它可以确定已经知道它的 peer （因为它以前被发送过，或者因为它最初是从这个 peer 通知的）。这通常是通过记住一组最近由 peer 转发的交易哈希来实现的。
