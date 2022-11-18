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
    - ethereum
    - optimism
    - bedrock
---

## 引言

代码基于 optimism 最新的 [bedrock]({{< ref "../../overview" >}}) 版本。

```go

```

[Driver](https://github.com/ethereum-optimism/optimism/blob/66d56a47a233451d3db1fefb764dd4212300c66f/op-node/rollup/driver/state.go#L23) 几个

## 主要逻辑

[Driver.eventLoop](https://github.com/ethereum-optimism/optimism/blob/66d56a47a233451d3db1fefb764dd4212300c66f/op-node/rollup/driver/state.go#L185) 是一个事件循环，用于同步 L1 层事件以及内部定时器来产生 L2 block。

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
            s.metrics.SetDerivationIdle(false)
            s.idleDerivation = false
            s.log.Debug("Derivation process step", "onto_origin", s.derivation.Origin(), "attempts", stepAttempts)
            err := s.derivation.Step(context.Background())
            stepAttempts += 1 // count as attempt by default. We reset to 0 if we are making healthy progress.
            if err == io.EOF {
                s.log.Debug("Derivation process went idle", "progress", s.derivation.Origin())
                s.idleDerivation = true
                stepAttempts = 0
                s.metrics.SetDerivationIdle(true)
                continue
            } else if err != nil && errors.Is(err, derive.ErrReset) {
                // If the pipeline corrupts, e.g. due to a reorg, simply reset it
                s.log.Warn("Derivation pipeline is reset", "err", err)
                s.derivation.Reset()
                s.metrics.RecordPipelineReset()
                continue
            } else if err != nil && errors.Is(err, derive.ErrTemporary) {
                s.log.Warn("Derivation process temporary error", "attempts", stepAttempts, "err", err)
                reqStep()
                continue
            } else if err != nil && errors.Is(err, derive.ErrCritical) {
                s.log.Error("Derivation process critical error", "err", err)
                return
            } else if err != nil && errors.Is(err, derive.NotEnoughData) {
                stepAttempts = 0 // don't do a backoff for this error
                reqStep()
                continue
            } else if err != nil {
                s.log.Error("Derivation process error", "attempts", stepAttempts, "err", err)
                reqStep()
                continue
            } else {
                stepAttempts = 0
                reqStep() // continue with the next step if we can
            }
            ...
        }
    }
}
```

loop 启动后就会执行一次 reqStep，如果：

+ op-geth 开启 p2p 同步情况下， s.derivation.Step 将触发 L2 状态进行 p2p 同步到最新的 state(happy-path sync[^1])。
+ op-geth 开启 p2p 同步情况下，应该怎么处理？（todo）

## 创建新块

```go
// createNewL2Block builds a L2 block on top of the L2 Head (unsafe). Used by Sequencer nodes to
// construct new L2 blocks. Verifier nodes will use handleEpoch instead.
func (s *Driver) createNewL2Block(ctx context.Context) error {
    l2Head := s.derivation.UnsafeL2Head()
    // Actually create the new block.
    newUnsafeL2Head, payload, err := s.sequencer.CreateNewBlock(ctx, l2Head, l2Safe.ID(), l2Finalized.ID(), l1Origin)

    // Update our L2 head block based on the new unsafe block we just generated.
    s.derivation.SetUnsafeHead(newUnsafeL2Head)

    s.log.Info("Sequenced new l2 block", "l2_unsafe", newUnsafeL2Head, "l1_origin", newUnsafeL2Head.L1Origin, "txs", len
(payload.Transactions), "time", newUnsafeL2Head.Time)
    s.metrics.CountSequencedTxs(len(payload.Transactions))

    if s.network != nil {
        if err := s.network.PublishL2Payload(ctx, payload); err != nil {
            s.log.Warn("failed to publish newly created block", "id", payload.ID(), "err", err)
            s.metrics.RecordPublishingError()
            // publishing of unsafe data via p2p is optional. Errors are not severe enough to change/halt sequencing
but should be logged and metered.
        }
    }

    return nil
}
```

## 收到广播的 payload

```go
func (s *Driver) OnUnsafeL2Payload(ctx context.Context, payload *eth.ExecutionPayload) error {
    select {
    case <-ctx.Done():
        return ctx.Err()
    case s.unsafeL2Payloads <- payload:
        return nil
    }
}
```

op-node 通过 [OnUnsafeL2Payload](https://github.com/ethereum-optimism/optimism/blob/66d56a47a233451d3db1fefb764dd4212300c66f/op-node/rollup/driver/state.go#L121) 处理广播的 unsafePayload，最终交给 [EngineQueue.Step](https://github.com/ethereum-optimism/optimism/blob/66d56a47a233451d3db1fefb764dd4212300c66f/op-node/rollup/derive/engine_queue.go#L207) 插入到到 L2 上。

```go
func (eq *EngineQueue) Step(ctx context.Context) error {
    ...
    if eq.unsafePayloads.Len() > 0 {
        return eq.tryNextUnsafePayload(ctx)
    }
    ...
}
```

## 总结

[^1]: [exec-engine-sync](https://github.com/ethereum-optimism/optimism/blob/bedrock/specs/exec-engine.md#sync)