---
title: Geth Subscription
description: 以太坊订阅通知机制
slug: ch60-07-geth-subscription
date: 2023-09-18T10:58:48+08:00
lastmod: 2023-09-18T10:58:48+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series:
  - 以太坊情景分析
categories: [ethereum]
tags: [geth]
images: []
---

本文介绍以太坊的订阅机制以及代码实现。

## JSON API

API 调用参见官方说明 [Real-time events](https://geth.ethereum.org/docs/interacting-with-geth/rpc/pubsub)

需要注意的是：

- 通知仅针对当前事件发送，而不是过去的事件。对于不能错过任何通知的用例，订阅可能不是最佳选项。
- 订阅需要全双工连接。Geth 提供 WebSocket 和 IPC（默认启用）形式的此类连接。
- 订阅与连接绑定在一起。如果连接关闭，所有在该连接上创建的订阅都将被删除。
- 通知存储在内部缓冲区中，并从该缓冲区发送到客户端。如果客户端无法跟上，并且缓冲通知的数量达到限制（目前为 10,000），则连接将关闭。请记住，订阅某些事件可能会导致大量通知，例如，在节点开始同步时监听所有日志/区块。

## 源码

源码目录下文件说明：

- `subscription.go`
- `feed.go`

### Subscription

订阅某种程度上可以看成是生产者 (producer) 和消费者 (consumer) 之间的通信，我们从这个角度看代码更容易理解。

首先看 [`NewSubscription`](https://github.com/ethereum/go-ethereum/blob/89ccc680da96429df7206e583e818ad3b0fe7466/event/subscription.go#L49) 函数：

- 唯一参数是生产者函数 (`producer` )
- 返回值是 [`Subscription`](https://github.com/ethereum/go-ethereum/blob/89ccc680da96429df7206e583e818ad3b0fe7466/event/subscription.go#L41) 类型，该值用于管理订阅，可以看成是生产者和消费者之间的通信桥梁：消费者通过该返回值告诉生产者取消订阅，生产者通过该值告诉消费者生产过程中发生了什么错误，这就是`Subscription`类型两个接口的功能。

从上面的分析可以知道应该如何编写生产者和消费者函数：

- 生产者必须要处理取消订阅事件，通过参数 `chan<-struct{}` 进行得到通知。
- 消费者必须要处理生产者出现的错误（由`Subscription.Err()`返回）。

还有个问题：消费者怎么获取生产者产生的数据？这个代码注释中有说明：

> The carrier of the events is typically a channel, but isn't part of the interface.

实际开发中，producer 通常是一个闭包函数，传递数据的 channel 在上下文中定义。

以 [单测代码](https://github.com/ethereum/go-ethereum/blob/89ccc680da96429df7206e583e818ad3b0fe7466/event/subscription_test.go#L30) 为例：

- channel c 用于 producer 和 consumer 传递数据。
- producer 中通过 [channel quit](https://github.com/ethereum/go-ethereum/blob/89ccc680da96429df7206e583e818ad3b0fe7466/event/subscription_test.go#L38) 处理 unsubscribe 事件。
- 消费者需要处理 producer 返回的 [err](https://github.com/ethereum/go-ethereum/blob/89ccc680da96429df7206e583e818ad3b0fe7466/event/subscription_test.go#L58)。

还可以通过 http.go 中的 [SubscribeNetwork](https://github.com/ethereum/go-ethereum/blob/89ccc680da96429df7206e583e818ad3b0fe7466/p2p/simulations/http.go#L123) 函数学习如何编写 producer 函数，这里需要注意两次对 `<-stop` 的处理。

好了，现在我们知道应该如何编写 producer 和 consumer 函数了。

`Resubscribe` 用于处理订阅失败的情况，可以看做是对 NewSubscription 的进一步封装。同时从核心函数`subscribe()` 的处理流程以及测试代码中也可以学习到 context 使用和预防协程泄露的处理。

### feed
