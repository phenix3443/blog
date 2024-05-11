---
title: Greenfield Virtual Group
description:  Virtual Group
slug: virtual-Group
date: 2024-05-10T14:09:04+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: [cosmos]
tags: [greenfield]
images: []
---

## 概述

GF 建议采用 Virtual Groups 作为解决方案，以消除 Buckets/Objects 与 SP 之间的相互依赖关系。这种方法可以有效减少在 SP 退出和 Bucket 迁移过程中修改链上存储 BucketInfo 和 ObjectInfo 时需要传输的大量交易。

Virtual Group 由一个 Primary SP 和多个 Secondary SPs 组成。每个 Object 都与特定的 Virtual Group 相关联，Virtual Group 限制了负责存储 Object 副本数据的 Secondary SP 的范围。每个 Virtual Group 中 SP 的数量由冗余策略决定。例如，如果冗余策略指定了一个完整副本和一个 4+2 擦除编码（EC）副本，则每个 Virtual Group 应由一个 Primary SP 和六个 Secondary SPs 组成。

### 术语

+ Global Virtual Group (GVG)：GVG 由一个 Primary SP 和多个 Secondary SP 组成。
+ Local Virtual Group（LVG）：每个 Bucket 都维护一个从 Local Group ID 到 Global Group ID 的映射。
+ Virtual Group Family（VGF）：每个 Primary SP 可创建多个 Virtual Group Family，每个 Family 包含多个 Global Virtual Group。每个 Family 只能存储数量有限的 Bucket。

### 关系

Local Virtual Group 关联它们对应的 Bucket，每个 Object 都需要存储 Local Virtual Group 的 ID 信息。每个 Local Virtual Group 必须对应一个且只能对应一个 Global Virtual Group。

![relationship](https://docs.bnbchain.org/greenfield-docs/assets/images/12-Greenfield-VirtualGroup-c13cd82770cd4a47ffe2220ec7121683.png)

为了避免 Primary SP 的所有数据在短时间内转移到一个 SP，引入了 "Family"的概念。

![Group Family](https://docs.bnbchain.org/greenfield-docs/assets/images/13-Greenfield-VirtualGroupFamily-d195312db08ea552c5874f2edd25ec90.png)

Family 可以包含同一 SP 创建的多个 GVG。一个 Bucket 只能由同一个 Family 中的 GVG 服务，Bucket 内不允许有跨 Family 的 GVG。一旦 Family 的总存储容量超过 64TB（TBD），Family 内的 GVG 就不能再为新的 Bucket 提供服务，SP 必须创建一个新的 Family。通过引入 Family，Primary SP 可以在不破坏一个 Bucket、一个 Primary SP 规则的情况下退出 Family。

![Family-relationship](image/relationship.png)

关于如何存储数据，参见 [Data Storage](https://docs.bnbchain.org/greenfield-docs/docs/guide/core-concept/data-storage/#primary-sp)

### 存储质押

根据存储空间大小引入了新的质押规则。可以使用公式 `storage_staking_price * stored_size` 计算所需的最低质押代币。如果需要，SP 可以为即将到来的存储预预先质押代币。

所有质押代币都将由 Virtual Group 模块账户管理。只有在删除或交换时，SP 才能取回这些质押代币。如果 SP 强制退出，这些代币将被没收，用于奖励接管这些 GVG 的 SP。

## 关键工作流程

### 创建和销毁

GVG 可由任何 SP 自主创建，无需 Secondary SP 批准。不过，为了控制验证器 Group 的扩散，创建 GVG 需要支付相对较高的费用，并需要为存储进行质押。

Group 内的 Secondary SP 数量可作为该 Group 内存储的所有 Object 的冗余度指标。该系统可以建立不同冗余度的 Virtual Group，因此具有极大的灵活性。

创建 GVG 时，如果未指定 GVG Family，交易将自动在链上创建一个 Family，并将其与新创建的 GVG 关联。

相反，LVG 会在创建 Object 时自动生成，但其在 Bucket 内的数量应限制在特定范围内。

当 GVG 中存储的大小为零时，该 GVG 中的任何 SP 都可以删除该 GVG，并将质押代币归还给该 GVG 的所有者。无法主动删除 GVG Family。如果删除了该 Family 中的所有 GVG，该 Family 也将自动删除。

也不需要手动删除 LVG，因为在删除相关 Bucket 时，它们总是会被自动删除。

### 退出

以下是存储提供程序 (SP) 退出流程的关键步骤：

1. SP1 通过向区块链提交 `StorageProviderExit` 交易启动退出流程。
2. 随后，SP1 或其后继 SP 必须反复调用 SwapOut，将自己从所有 GVG 中删除。
3. 对于 Primary SP 来说，交换过程发生在 Family 层面，以确保不会与 GVG 内的其他 SP 发生冲突。
4. 对于 Secondary SP，交换发生在 GVG 层面，还必须避免与 Primary SP 冲突。
5. 一旦 SP1 成功完成从所有 GVG 的交换过程，它就可以提交 `CompleteStorageProviderExit` 交易，以取回抵押的代币。

这种有序的退出流程可确保责任和资源的平稳过渡，同时维护网络的完整性以及与退出 SP 相关的已托管代币。

### Bucket 迁移

![migration](https://docs.bnbchain.org/greenfield-docs/assets/images/14-Greenfield-Bucket-Migration-bb0d1def2411f12eae31bc91cfc57463.png)

以下是 Bucket 迁移的主要工作流程：

1. 用户提交带有新 Primary SP 签名的 Bucket 迁移交易。
2. 新 SP 开始从旧 Primary SP 或 Secondary SP 接收完整数据。
3. 新 SP 根据其新的 GVG 在 Secondary SP 之间分配数据。
4. 新的 SP 会在链上提交一个 Bucket seal 交易，同时提交来自新的 Secondary SP 的所有汇总签名。
5. 链上模块将
   1. 解除旧的 LVG 和 GVG 映射绑定，并建立新的映射关系。
   2. 在 LVG、GVF 和 SP 之间结算付款流。
6. 在迁移期间，用户不能将文件上传到此存储 Bucket。
7. 在迁移期间，旧 SP 仍应为查询请求提供服务。

## 参考

+ [virtual-Group](https://docs.bnbchain.org/greenfield-docs/docs/guide/greenfield-blockchain/modules/virtual-Group/)
