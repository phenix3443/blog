---
title: "skeleton"
description:
date: 2022-09-23T16:15:09+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

`eth/downloader/skeleton.go`

`skeleton`表示合并后同步的`header`链，其中不再通过 PoW 以正向方式验证块，而是通过信标链指定和扩展`header`，并在原始以太坊块同步协议上回填(backfill)。

由于`skeleton`是从头向后生长到创世的，它被作为一个单独的实体处理，而不是与块的逻辑顺序转换混合。一旦`skeleton`连接到现有的、经过验证的链，`header`将被移动到主下载器中以进行填充和执行。

与原始的以太坊区块同步是去信任的（并使用主节点来最小化攻击面）相反，合并后的区块同步从一个可信的`header`开始。因此，不再需要主对等体，并且可以完全同时请求`header`（尽管如果它们没有正确链接，某些批次可能会被丢弃）。

尽管`skeleton`是同步周期的一部分，但它不会重新创建，而是在下载器的整个生命周期内保持活动状态。这允许它与同步周期同时扩展，因为扩展来自 API 层面，而不是内部（与传统的以太坊同步）。

由于`skeleton`跟踪整个`header`链，直到被前向块填充消耗，存储每块需要 0.5KB。在当前的主网大小下，这只能通过磁盘后端实现。由于`skeleton`与节点的`header`链是分开的，所以在同步完成之前临时存储`header`是浪费磁盘 IO，但这是我们现在为了保持简单而付出的代价。
