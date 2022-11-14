---
title: "optimism-driver"
description: optimism 源码解析： op-node/driver
slug: op-node-driver
date: 2022-11-15T00:38:49+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tag:
    - optimism
    - ethereum
---

## 引言

代码基于 optimism 最新的 [bedrock]({{< ref "../../../bedrock" >}}) 版本。

```go
type Driver struct {
    s *state
}
```

## 主要逻辑

[state.loop](https://github.com/ethereum-optimism/optimism/blob/1e0bb3c0b8d9ca834b13feff9bb6dfce92073af1/op-node/rollup/driver/state.go#L346) 是一个事件循环，用于同步 L1 层事件以及内部定时器来产生 L2 block。

### step

```go
func (s *state) loop() {
    ...
    // stepReqCh is used to request that the driver attempts to step forward by one L1 block.
    stepReqCh := make(chan struct{}, 1)
    ...
    // reqStep requests that a driver step be taken. Won't deadlock if the channel is full.
    // TODO: Rename step request
    reqStep := func() {
        select {
        case stepReqCh <- struct{}{}:
        // Don't deadlock if the channel is already full
        default:
        }
    }

    // We call reqStep right away to finish syncing to the tip of the chain if we're behind.
    // reqStep will also be triggered when the L1 head moves forward or if there was a reorg on the
    // L1 chain that we need to handle.
    reqStep()

    for {
        select {
        ...
        case <-stepReqCh:
            s.snapshot("Step Request")
            ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
            reorg, err := s.handleEpoch(ctx)
            cancel()
            if err != nil {
                s.log.Error("Error in handling epoch", "err", err)
            }

            if reorg {
                s.log.Warn("Got reorg")

                // If we're in sequencer mode and experiencing a reorg, we should request a new
                // block ASAP. Not strictly necessary but means we'll recover from the reorg much
                // faster than if we waited for the next tick.
                if s.sequencer {
                    reqL2BlockCreation()
                }
            }

            // The block number of the L1 origin for the L2 safe head is at least SeqWindowSize
            // behind the L1 head. We can therefore attempt to shift the safe head forward by at
            // least one L1 block. If the node is holding on to unsafe blocks, this may trigger a
            // reorg on L2 in the case that safe (published) data conflicts with local unsafe
            // block data.
            // 如果 L2 safeHeader 对应的 L1Header 落后于当前 L1Header seqWindowsSize，就需要不断赶上。
            if s.l1Head.Number-s.l2SafeHead.L1Origin.Number >= s.Config.SeqWindowSize {
                s.log.Trace("Requesting next step", "l1Head", s.l1Head, "l2Head", s.l2Head, "l1Origin", s.l2SafeHead.
L1Origin)
                reqStep()
            }

        case <-s.done:
            ...
        }
    }
}
```

如果在 L2 落后了，立即调用 reqStep 来完成同步到链的尖端。 当 L1 头向前移动时，或者如果需要处理 L1 链上的重组，也会触发 reqStep。

loop 启动后就会执行一次 reqStep，在 L2 node 没有进行 p2p 同步 state 的情况下，会不断同步并处理 L1 上的块，缩小 L2SafeHeader.L1Origin 与 L1.LatestHeader 之间的差距。

对 L1 块的同步与处理位于 [handleEpoch](https://github.com/ethereum-optimism/optimism/blob/1e0bb3c0b8d9ca834b13feff9bb6dfce92073af1/op-node/rollup/driver/state.go#L278) 中：

```go
func (s *state) handleEpoch(ctx context.Context) (bool, error) {
    s.log.Trace("Handling epoch", "l2Head", s.l2Head, "l2SafeHead", s.l2SafeHead)
    // Extend cached window if we do not have enough saved blocks
    // attempt to buffer up to 2x the size of a sequence window of L1 blocks, to speed up later handleEpoch calls
    if len(s.l1WindowBuf) < int(s.Config.SeqWindowSize) {
        nexts, err := s.l1.L1Range(ctx, s.l1WindowBufEnd(), 2*s.Config.SeqWindowSize)
        if err != nil {
            ...
        }
        s.l1WindowBuf = append(s.l1WindowBuf, nexts...)
    }
    ...
    newL2Head, newL2SafeHead, reorg, err := s.output.insertEpoch(ctx, s.l2Head, s.l2SafeHead, s.l2Finalized, window)
    cancel()
    ...

    // State update
    s.l2Head = newL2Head
    s.l2SafeHead = newL2SafeHead
    s.l1WindowBuf = s.l1WindowBuf[1:]
    s.log.Info("Inserted a new epoch", "l2Head", s.l2Head, "l2SafeHead", s.l2SafeHead, "reorg", reorg)
    // TODO: l2Finalized
    return reorg, nil
```

### l2BlockCreationTickerCh

### l2BlockCreationReqC

### s.unsafeL2Payloads:

### l1Heads:

## 创建新块

```go
// createNewL2Block builds a L2 block on top of the L2 Head (unsafe). Used by Sequencer nodes to
// construct new L2 blocks. Verifier nodes will use handleEpoch instead.
func (s *state) createNewL2Block(ctx context.Context) error {
    // Figure out which L1 origin block we're going to be building on top of.
    l1Origin, err := s.findL1Origin(ctx)
    ...
    // 通过 engine-api 在 L2 上创建新块。
    newUnsafeL2Head, payload, err := s.output.createNewBlock(ctx, s.l2Head, s.l2SafeHead.ID(), s.l2Finalized, l1Origin)
    if err != nil {
        s.log.Error("Could not extend chain as sequencer", "err", err, "l2UnsafeHead", s.l2Head, "l1Origin", l1Origin)
        return err
    }
    ...
    // Update our L2 head block based on the new unsafe block we just generated.
    s.l2Head = newUnsafeL2Head
    s.log.Info("Sequenced new l2 block", "l2Head", s.l2Head, "l1Origin", s.l2Head.L1Origin, "txs", len(payload.
Transactions), "time", s.l2Head.Time)

    if s.network != nil {
        // 如果开启 p2p 网络，将此 payload 进行广播。
        if err := s.network.PublishL2Payload(ctx, payload); err != nil {
            s.log.Warn("failed to publish newly created block", "id", payload.ID(), "err", err)
            return err
        }
    }

    return nil
```

## 收到广播的 payload

```go
func (s *state) handleUnsafeL2Payload(ctx context.Context, payload *l2.ExecutionPayload) error {
    if s.l2SafeHead.Number > uint64(payload.BlockNumber) {
        s.log.Info("ignoring unsafe L2 execution payload, already have safe payload", "id", payload.ID())
        return nil
    }

    // Note that the payload may cause reorgs. The l2SafeHead may get out of sync because of this.
    // The engine should never reorg past the finalized block hash however.
    // The engine may attempt syncing via p2p if there is a larger gap in the L2 chain.
    // 这里 engine（L2 node） 可能会通过 p2p 网络同步 L2 上缺失的块。
    l2Ref, err := l2.PayloadToBlockRef(payload, &s.Config.Genesis)
    if err != nil {
        return fmt.Errorf("failed to derive L2 block ref from payload: %v", err)
    }

    if err := s.output.processBlock(ctx, s.l2Head, s.l2SafeHead.ID(), s.l2Finalized, payload); err != nil {
        return fmt.Errorf("failed to process unsafe L2 payload: %v", err)
    }

    // We successfully processed the block, so update the safe head, while leaving the safe head etc. the same.
    s.l2Head = l2Ref

    return nil
}
```

[handleUnsafeL2Payload](https://github.com/ethereum-optimism/optimism/blob/1e0bb3c0b8d9ca834b13feff9bb6dfce92073af1/op-node/rollup/driver/state.go#L320) 调用 [processBlock](https://github.com/ethereum-optimism/optimism/blob/1e0bb3c0b8d9ca834b13feff9bb6dfce92073af1/op-node/rollup/driver/step.go#L57) 来更新 L2 上的 block。

## 总结
