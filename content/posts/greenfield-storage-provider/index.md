---
title: Greenfield Storage Provider 源码分析
description:
slug: greenfield-storage-provider
date: 2024-04-16T11:24:14+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: true
series: [greenfield 源码分析]
categories: [blockchain]
tags: [cosmos]
images: []
---

## 概述

存储提供商（SP）是存储服务的基础设施提供商。它们与 Greenfield 验证者协同工作，提供完整的存储服务。验证者以共识方式存储元数据和经济账本，而 SP 使用 Greenfield 链作为账本和单一事实来源来存储 object 的实际数据。SP 为用户和 dApp 提供一系列便捷的服务来管理 Greenfield 上的数据。

## 如何工作

SP 需要首先通过在 Greenfield 区块链上存款作为他们的 `Service Stake` 来注册自己。然后，验证者将执行治理程序来投票选举 SP。当加入和离开网络时，SP 必须遵循特定操作以确保用户的数据冗余，否则他们将面临 `Service Stake` 罚款。

SP 提供可公开访问的 [API](https://docs.bnbchain.org/greenfield-docs/docs/api/storage-provider-rest/)，允许用户上传、下载和管理数据。这些 API 的设计与 Amazon S3 API 类似，使现有开发人员可以更轻松地为其编写代码。 SP 负责响应用户写入（上传）和读取（下载）数据的请求，并管理用户权限和身份验证。

每个 SP 都维护自己的本地全节点，从而与 Greenfield 网络建立强大的连接。这使得 SP 能够直接监控状态变化，正确索引数据，及时发送交易请求并准确管理本地数据。

## 架构

![Storage Provider Architecture](https://docs.bnbchain.org/greenfield-docs/assets/images/05-SP-Arch-662dced8b9630842297e3ae663d2da7e.jpg)

从代码层面来看，SP 不仅仅是一个实现层，它被扩展成了一个名为 [`GfSp` 的框架](https://github.com/bnb-chain/greenfield-storage-provider/blob/master/core/README.md)，允许用户根据自己的需求实现自己的逻辑。如果用户想要实现一些特定的功能，可以重写抽象接口中声明的这些方法。如果用户不需要实现自定义需求， `GfSp` 将使用默认实现。

### core

代码仓库中的 core 目录下定义类该框架的九个重要的抽象层：

+ [lifecycle](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/lifecycle): 它提供了两个抽象接口来管理服务： Service 和 Lifecycle 来控制和管理 SP 中的服务。
+ [module](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/module)：提供多个抽象接口与 GfSp 中的不同模块进行交互。因此，用户可以实现相应的方法来满足自己的需求。
+ [consensus](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/consensus): 它提供了如何查询 Greenfield 区块链上数据的抽象接口。
+ [piecestore](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/piecestore)：用于与底层存储系统交互。
+ [spdb](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/spdb)：提供了如何存储 SP 的后台任务和元数据的抽象接口。
+ [bsdb](): 提供了如何查询 SP 中元数据的抽象接口。
+ [rcmgr](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/rcmgr)：提供了管理 SP 中 cpu 和内存资源的抽象接口。
+ [task](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/task)：提供与 SP 后台服务交互的最小 uint 的抽象接口。
+ [taskqueue](https://github.com/bnb-chain/greenfield-storage-provider/tree/master/core/taskqueue)：提供任务调度和执行的抽象接口。

### base

base 目录下的 GfSpBaseApp 实现了 GfSp 框架，它是程序的入口。GfSpBaseApp 启动 Grpc 服务器并指定使用 Grpc 进行模块之间的通信，因为 SP 是一组微服务，不同的模块可以任意组合部署在不同的进程中。

GfSpBaseApp 只实现特定的进程，这些进程是 GfSp 框架的标准部分，不需要的部分通过模块化定制。

非标准进程可以通过调用 ServerForRegister 将 Grpc 服务注册到 GfSpBaseApp，参见元数据示例。

GfSpBaseApp 还实现了所有核心基础结构接口。GfSpBaseApp 将调用实现 Core Special Modular 的默认 Modular，以完成 SP 请求审批、上传对象负载数据、下载对象等工作流。

## modules

模块是 SP 的一个独立的逻辑组件，模块之间具有由 GfSp 框架处理的必要交互。模块的实现可以根据需要进行定制。例如，虽然 GfSp 框架要求在上传之前批准（approve）object，但 SP 可以自定义是否同意批准。

### Front Modules

Front Modules 负责处理用户请求。Gater 生成相应的任务并将其发送到 Front Modules。Front modules 验证请求的正确性，并在处理请求后执行其他任务。为此，Front modules 为每种任务类型提供了三个接口： PreHandleXXXTask 和 HandleXXXTask PostHandleXXXTask 。Front Modules 由 Approver 、 Downloader 和 Uploader 组成。

### Background Modules

Background Modules 负责处理 SP 的内部任务，这些任务是在内部生成的，因此可以保证信息的正确性。因此，这些任务只有一个接口 HandleXXXTask 。Background Modules 由 Authenticator 、 TaskExecutor 、 Manager 、 P2P Receiver 和 Signer 组成。

### 核心模块

SP 包含十五个核心模块：

+ Gater：作为 SP 的网关，提供 HTTP 服务，遵循 S3 协议。它根据用户请求生成相应的任务并将其转发给 SP 内的其他模块。由于 Gater 不允许定制，因此 GfSp 框架的 [modular.go](https://github.com/bnb-chain/greenfield-storage-provider/blob/d5224fe5171eda2f8bf9a913a0ddd0b4f607f177/core/module/modular.go#L24) 文件中没有定义任何接口。
+ Authenticator：负责验证身份验证。
+ Approver：负责处理 approve 请求，具体为 `MigrateBucketApproval` 等。
+ Uploader：它处理来自用户帐户的 `PutObject` 请求，并将有效负载数据存储到主 SP 的片 piece 存储中。
+ Downloader: 它负责处理来自用户帐户的 `GetObject` 请求和来自 Greenfield 系统中其他组件的 `GetChallengeInfo` 请求。
+ Executor：负责处理后台任务。该模块可以向 `Manager` 模块请求任务，执行它们并将结果或状态报告回 `Manager` 。
+ Manager：负责管理 SP 的任务调度以及其他管理功能，如 Bucket 迁移、sp 退出流程等。
+ P2P：负责处理 SP 之间控制信息的交互。
+ Receiver: 它从主 SP 接收数据，计算有效负载数据的完整性哈希，对其进行签名，然后将其返回到主 SP 以在 Greenfield 区块链上进行 seal。
+ Signer: 负责 Greenfield 区块链运营商上 SP 数据的签名，并持有所有 SP 的私钥。由于 SP 帐户的序列号，它必须是单例。
+ Metadata: 用于为 SP 中的元信息提供高效的查询接口。该模块实现了低延迟和高性能 SP 要求。
+ BlockSyncer: 记录 Greenfield 区块链中的区块信息。
+ PieceStore：它与底层存储供应商交互，例如。 AWS S3、MinIO、OSS 等
+ SPDB：存储了所有后台作业的上下文以及 SP 的元数据。
+ BSDB：它存储来自 Greenfield 区块链的所有事件数据，并将其提供给 SP 的 Metadata 服务。

此外，GfSp 框架还支持根据需要扩展自定义模块。一旦在 GfSp 框架中注册并执行模块化接口，这些自定义模块将被初始化和调度。

## Task

Task 是一个抽象接口，用于描述 SP 后台服务的最小单元如何交互。

### Task Type

任务主要有三种类型：ApprovalTask、ObjectTask 和 GCTask。

#### ApprovalTask

ApprovalTask 用于记录用户创建 Bucket 和 Object 的 approve 信息。在提供 bucket 和 object 之前，需要获得主 SP 批准。如果 SP 批准该消息，它将对 approve 消息进行签名。greenfield 将验证 approve 消息的签名，以确定 SP 是否接受 bucket 和 object。当主 sp 将片段复制到辅助 SP 时，approve 消息将广播到其他 SP。如果他们批准了该消息，则主 SP 将选择其中一些辅助 sp 来复制这些片段。在收到 pieces 之前，选定的 SP 将验证 approve 消息的签名。

ApprovalTask 的时效性使用块高度，如果达到过期高度，则 approve 无效。

ApprovalTask 包括：

+ ApprovalCreateBucketTask 用于记录 ask create bucket approve 信息。用户帐户将创建 MsgCreateBucket，SP 应根据 MsgCreateBucket 决定是否批准请求。如果是这样，sp 将 SetExpiredHeight 并签署 MsgCreateBucket。
+ ApprovalCreateObjectTask 用于记录请求创建 object 的 approve 信息。用户帐户将创建 MsgCreateObject，SP 应根据 MsgCreateObject 决定是否批准请求。如果批准，sp 将 SetExpiredHeight 并对 MsgCreateObject 进行签名。
+ ApprovalReplicatePieceTask 用于请求 replicate 片段记录到其他 SP（作为 object 的辅助 SP）。它由主 SP 在复制片段阶段启动。在主 SP 将其发送到其他 SP 之前，主 SP 将对任务进行签名，其他 SP 将验证它是由合法 SP 发送的。如果其他 SP 批准了批准，则它们将 SetExpiredHeight 并签署 ApprovalReplicatePieceTask。

#### ObjectTask

ObjectTask 与 object 相关联，并记录有关其不同阶段的信息。考虑到 greenfield 上存储参数的变化，每个 object 的存储参数应该在创建时确定，不要在任务流中查询，效率低下且容易出错。这包括：

+ UploadObjectTask, 将 object 有效负载数据上传到主 SP。
+ ReplicatePieceTask, 将 object 片段复制到辅助 SP。
+ ReceivePieceTask 辅助 SP 使用此信息来确认 object 是否已成功在 greenfield 进行 sea ，从而确保返回辅助 SP。
+ SealObjectTask 在 greenfield 上 seal object。
+ DownloadObjectTask 允许用户下载部分或全部 object 有效负载数据。
+ ChallengePieceTask 为验证者提供质询件信息，如果他们怀疑用户的有效负载数据未正确存储，则可以使用这些信息来质询 SP。

#### GCTask

GCTask 是一个抽象接口，用于记录有关垃圾回收的信息。这包括：

+ GCObjectTask，它通过删除已在 greenfield 上删除的有效负载数据来收集单件存储空间。
+ GCZombiePieceTask，它通过删除由件数据元不在 greenfield 链上的任何异常导致的僵尸件数据来收集件存储空间
+ GCMetaTask，它通过删除过期数据来收集 SP 元存储空间。

### Task Priority

每种类型的任务都有一个优先级，优先级范围为 [0,255]，优先级越高，执行的紧迫性越高，通过优先级调度执行的概率就越大。

任务优先级分为三个级别：

+ TLowPriorityLevel 默认优先级范围为 `[0， 85）`
+ TMediumPriorityLevel 默认优先级范围为 `[85， 170）`
+ THighPriorityLevel 默认优先级范围为 `[170， 256]`。
  
从 ResourceManager 分配任务执行资源时，资源是根据任务优先级分配的，而不是根据任务优先级分配的，因为任务优先级高达 256 级，任务优先级使资源管理更容易。

```sh
Example:
    the resource limit configuration of task execution node :
        [TasksHighPriority: 30, TasksMediumPriority: 20, TasksLowPriority: 2]
    the executor of the task can run 30 high level tasks at the same time that the
        task priority between [170, 255]
    the executor of the task can run 20 medium level tasks at the same time that the
        task priority between [85, 170)
    the executor of the task can run 2 medium level tasks at the same time that the
        task priority < 85
```

#### Task Init

每个任务在使用前都需要调用其 `InitXXXTask` 方法。此方法需要传入每种类型任务的必要参数。这些参数在大多数情况下不会更改，并且是必需的，例如任务优先级、超时、最大重试次数和资源估算的必要信息。

在任务执行期间对初始化参数的任何更改都可能导致不可预知的后果。例如，影响资源估算的参数变化可能会导致 OOM 等。

## Task Queue

任务是 SP 后台服务交互的最小单元的接口。任务调度和执行直接关系到任务到达的顺序，因此任务队列是 SP 内部所有模块使用的比较重要的基础接口。

### Concept

#### Task Queue With Limit

任务执行需要消耗一定的资源。不同的任务类型在内存、带宽和 CPU 消耗方面存在较大差异。执行任务的节点的可用资源参差不齐。因此，在调度任务时需要考虑资源。就是 Task Queue With Limit 要考虑资源。

#### Task Queue Strategy

常规队列无法完全满足任务的要求。例如，队列内任务的停用策略，当常规队列已满时，无法再推送，但是，重试后失败的任务可能需要停用。对于不同类型的任务退役和取货等，策略是不同的，是一个 Task Queue Strategy 支持自定义策略的界面。

#### Task Queue Types

##### TQueue

TQueue 是任务队列的接口。任务队列主要用于维护任务的运行情况。任务队列除了支持常规的 FIFO 操作外，还为任务提供了一些自定义操作。例如，Has、PopByKey。

##### TQueueWithLimit

TQueueWithLimit 是考虑资源的接口任务队列。只有资源少于所需资源的任务才能弹出。

##### TQueueOnStrategy

TQueueOnStrategy 是 TQueue 和 TQueueStrategy 的组合，它是任务队列的接口，队列支持自定义策略来过滤弹出和停用任务的任务。

##### TQueueOnStrategyWithLimit

TQueueOnStrategyWithLimit 是 TQueueWithLimit 和 TQueueStrategy 的组合，是任务队列的接口，将资源考虑在内，队列支持自定义策略过滤任务以弹出和停用任务。

## 工作流程

本节将结合 SP 当前和现有的所有工作流程，帮助了解 SP 的工作原理以及内部状态如何流动。

### Get Approval

[GetApproval](https://docs.bnbchain.org/greenfield-docs/docs/api/storage-provider-rest/get_approval/) API 包括操作： `MigrateBucket` 。如果请求成功，可以发送 MigrateBucket 批准请求。该动作用于确定 SP 是否愿意服务该请求。 SP 可能会拒绝信誉不好或特定 object 或桶的用户。 SP 通过签署操作消息并响应用户来批准请求。默认情况下，SP 将服务该请求，但它也可以拒绝。每个 SP 都可以定制自己的策略来接受或拒绝请求。

![流程图](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/07-get_approval.jpg)

+ 网关接收来自请求发起者的 GetApproval 请求。
+ 网关验证请求的签名，确保请求未被篡改。
+ Gateway 调用 Authenticator 进行授权检查，确保对应的账户存在。
+ Gateway 调用 Approver 填充 MigrateBucket 消息超时字段并将请求分派给 Signer 服务。
+ 获取签名者的签名，填写消息的批准签名字段，然后返回给请求发起者。

如果用户在短时间内发送多个 MigrateBucket 批准请求，SP 将提供相同的结果，因为设置了过期的区块链高度以防止重复请求，例如 DDoS 攻击。

用户更新现有 object 不需要请求批准，可以直接将 MsgUpdateObjectContent 发送到 Greenfield Chain。

### Create Bucket

![Create Bucket](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/07-create_bucket_object.png)

Create Bucket 操作通过 Go SDK 发起请求。然后，它查询 greenfield 链接口以获得最佳的全局虚拟组家族 ID。该 ID 用于请求在 greenfield 链上创建 bucket。

服务提供商定期刷新和监视全局虚拟组系列内的所有 SP，以检查全局虚拟组 (GVG) 内是否有可用存储空间。如果没有可用空间，他们会请求 greenfield 链创建一个新的 GVG。此更新是为 Create Bucket 操作提供可用的 VGF 以供选择。

### Create Object

创建 Bucket 后，用户通过 Go SDK 发送创建 object 请求，选择对应的 Bucket 名称。然后该 object 作为交易发送到 Greenfield。等待 object 达到 OBJECT_STATUS_CREATED 状态后，object 创建成功。

### Upload Object

在 Greenfield 链上成功创建 object 后，可以将 object 上传到 SP。如需更新现有 object，可以在 Greenfield 链上确认 MsgUpdateObjectContent 交易后直接上传。

该 API 涉及两个步骤：首先，用户手动上传 object 到 PrimarySP；其次，成功上传到 PrimarySP 后，object 会自动复制到 SecondarySP，以保证数据的可靠性。

上传到 PrimarySP 流程图如下所示：

![upload object](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/08-put_object.jpg)

#### Gateway

+ 网关接收来自客户端的 PutObject 请求。
+ 网关验证请求的签名，确保请求未被篡改。
+ Gateway 调用 Authenticator 进行授权检查，确保对应的账号对资源有权限。
+ 将请求分派到 Uploader 模块。

#### Uploader

+ uploader 接受流格式的 object 数据，并根据 Greenfield 链中共识确定的 MaxSegmentSize 进行分段。然后将分段数据存储在 PieceStore 中。
+ Uploader 创建一个初始状态为 INIT_UNSPECIFIED 的 TaskContext 。开始上传片段后，TaskContext 的状态将转换为 UPLOAD_OBJECT_DOING 。上传所有片段后，TaskContext 的状态将更改为 UPLOAD_OBJECT_DONE 。如果上传过程中出现任何异常情况，TaskContext 的状态将变为 UPLOAD_OBJECT_ERROR 。
+ 上传所有段后，将段数据校验和和根校验和插入 SPDB。
+ Uploader 为 Manager 创建上传 object 任务，并向客户端返回成功消息，表明上传 object 请求成功。

#### TaskExecutor

复制到 SecondarySP 流程图如下所示

![SecondarySP](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/09-replicate_object.jpg)

+ 执行器从管理器中获取 ReplicatePieceTask，这有助于选择合适的虚拟组。
+ 对象数据异步复制到虚拟组辅助 SP。
+ TaskExecutor 并行地从 PieceStore 中检索段，并使用 Erasure Coding(EC) 计算这些段的数据冗余方案，生成相应的 EC 段。然后，EC 片段被组织成六个复制数据组，每个组包含基于冗余策略的多个 EC 片段。
+ 然后将复制数据组以流方式并行发送到选定的辅助 SP。
+ 一旦辅助 SP 的复制完成，TaskContext 的辅助 SP 信息就会更新。仅当所有辅助 SP 完成复制后，TaskContext 的状态才会从 REPLICATE_OBJECT_DOING 更改为 REPLICATE_OBJECT_DONE 。

#### Receiver 接收器​

+ receiver 检查 SecondarySP 批准是否是自签名的并且是否已超时。如果其中一个条件为真，系统将向 TaskExecutor 返回 SIGNATURE_ERROR 。
+ Receiver 工作在辅助 SP 中，接收属于同一复制数据组的 EC 分片，并将 EC 分片上传到辅助 SP PieceStore。
+ 计算 EC 片的完整性校验和，用 SP 的批准私钥对完整性校验和进行签名，然后将其返回给 TaskExecutor。

#### TaskExecutor

+ 接收二级 SP Receiver 的响应，并对签名进行未签名，与二级 SP 的批准公钥进行比较。
+ 将 MsgSealObject 发送给签名者以签署 seal object 交易，并使用辅助 SP 的完整性哈希和签名广播到 Greenfield 链。 TaskContext 的状态从 REPLICATE_OBJECT_DONE 变为 SIGN_OBJECT_DOING 。如果签名者成功广播 SealObjectTX，则立即将 SEAL_OBJECT_TX_DOING 状态更改为 SIGN_OBJECT_DONE 状态。
+ 监控 Greenfield 链上 seal object 交易的执行结果，判断 seal 是否成功。如果是，则 TaskContext 状态更改为 SEAL_OBJECT_DONE 状态。
  
### Download Object

用户可以从 PrimarySP 下载 object。流程图如下所示：

![download object](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/10-get_object.jpg)

#### Gateway

+ 接收来自客户端的 GetObject 请求。
+ 验证请求的签名，确保请求未被篡改。
+ 检查授权，确保对应的账号对资源有权限。
+ 检查 object 状态和支付帐户状态，以确保 object 已上传到主 SP，并且支付帐户处于活动状态。
+ 将请求分派给下载程序。

#### Downloader

+ 接收来自网关服务的 GetObject 请求。
+ 检查读取流量是否超过限额。
+ 如果超过配额，下载程序将拒绝提供服务并向网关返回配额不足的错误。
+ 如果配额足够，Downloader 会将读取记录插入 SP Traffic-db 中。
+ Downloader 将 GetObject 请求拆分为 GetPiece 请求（支持范围读取）以检索相应的片段负载数据。然后，Downloader 将 object 有效负载数据流回网关。

### QueryMeta

用户可能想要从 SP 查询有关 bucket、object、bucket 读取配额或 bucket 读取记录的一些元数据。 SP 提供了查询元数据的相关 API。流程图如下所示：
![query Meta](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/11-query_meta.jpg)

#### Gateway  网关​

+ 接收来自客户端的 QueryMeta 请求。
+ 验证请求的签名，确保请求未被篡改。
+ 检查授权，确保对应的账号对资源有权限。
+ 将请求分派到元数据。

#### Metadata

+ 元数据接收来自网关的 QueryMeta 请求。
+ 元数据从 SP DB 或 BS DB 查询 bucket 或 object。

### Get Challenge Piece Info

确保数据完整性和可用性始终是任何去中心化存储网络的首要任务。为了实现更好的高可用性（HA），Greenfield 使用数据挑战而不是存储证明。系统不断向 greenfield 链上的随机片段发出数据挑战，存储挑战片段的 SP 使用挑战工作流程进行响应。每个 SP 将 object 负载数据分割成段，将段数据存储在 PieceStore 中，并将段校验和存储在 SPDB 中。

![challenge](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/12-challenge.jpg)

#### Gateway

+ 接收来自客户端的挑战请求。
+ 验证请求的签名，确保请求未被篡改。
+ 检查授权，确保对应的账号对资源有权限。
+ 将请求分派给下载程序。

#### Downloader

+ Downloader 收到来自网关的挑战请求。
+ 将所有段数据校验和和质询段数据有效负载返回给网关。
+ 从 SPDB 检索所有段数据校验和。
+ 从 PieceStore 获取挑战段数据。

### GC Object

GC 用于删除 Greenfield 链上元数据已经被删除的 object，减少每个 SP 的成本和 Greenfield 链上的数据大小。该函数在 Manager daemon 模式下自动执行。

流程图如下所示：

![gc](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/13-gc_object.jpg)

+ Manager 将 GCObjectTask 分派给 TaskExecutor。
+ TaskExecutor 向 Metadata 发送请求，按顺序查询已删除的 object。
+ TaskExecutor 删除存储在 PieceStore 中的有效负载数据。

### GC ZombiePiece

GC ZombiePiece 是一个抽象接口，用于记录收集碎片存储空间的信息，通过删除由于任何异常而导致的僵尸碎片数据，碎片数据元不在链上但碎片已经存储在碎片存储中，或者碎片不应该存储在链上。存储在正确的 SP 节点上。该函数在 Manager daemon 模式下自动执行。

流程图如下所示：
![GC ZombiePiece](https://docs.bnbchain.org/greenfield-docs/assets/images/13-gc-zombie-5ab0ac9dad6e3c70c4344cb76ad42154.png)

+ Manager 将 GCZombiePieceTask 分派给 TaskExecutor。
+ TaskExecutor 向 SPDB 发送请求以按顺序查询完整性元。
+ TaskExecutor 根据 IntegrityMeta 表判断一个 Pie 是否是 ZombiePiece。扫描 GCZombiePieceTask（StartObjectId、EndObjectId）中指定的当前 object ID 范围内的所有 IntegrityMeta。
+ TaskExecutor 根据 PieceHash 表判断一个 Piece 是否是 ZombiePiece。扫描 GCZombiePieceTask（StartObjectId，EndObjectId）中指定的当前 object ID 范围内的所有 PieceHash。
+ TaskExecutor 删除存储在 PieceStore 中的有效负载数据。

### GC Meta

GCMetaTask 是一个抽象接口，用于记录通过删除过期数据收集 SP 元存储空间的信息。该函数在 Manager daemon 模式下自动执行。

流程图如下所示：

![gc-meta-flow](https://docs.bnbchain.org/greenfield-docs/assets/images/13-gc-meta-e5d241e75b2985a6cee491b9f841c332.png)

+ Manager 将 GCMetaTask 分派给 TaskExecutor，由 gcMetaTicker 触发。
+ TaskExecutor 使用 SpDBImpl::DeleteAllBucketTrafficExpired 向 SPDB 发送请求，以删除过期的 BucketTrafficTable 中的条目。
+ TaskExecutor 使用 SpDBImpl::DeleteAllReadRecordExpired 向 SPDB 发送请求，以删除过期 ReadRecord 表的条目。

### GC stale version object

GC StaleVersion 用于在执行 object 更新时，GC GC 中片段存储中的 object 数据和 DB 中的元数据的陈旧版本。流程图如下所示：

![gc-stale-object-flow](https://docs.bnbchain.org/greenfield-docs/assets/images/gc-stale-object-08f1ef9346b425168369f5594fd8aed3.png)

+ Manager 将 GCStaleVersionObjectTask 分派给 TaskExecutor。
+ TaskExecutor 验证 object 数据和元是否过时，并在片段存储和数据库中进行清理。

### Migrate Bucket

桶用户在感觉 SP 服务质量较差时，可以自由选择主 SP，并使用迁移桶来迁移 SP 服务。

流程图如下所示：
![migrate bucket](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/14-bucket_migrate.jpg)

+ bucket 用户应向新的主 SP 请求迁移 bucket，并获得新的主 SP 的批准。
+ bucket 用户在新的主 SP 批准后提交 MigrationBucket 事务。
+ 目标 SP 从链上订阅事件，并产生迁移执行计划。
+ dest sp 执行器 fetch migrate gvg 任务来执行，并定期报告进度。
+ 如果所有 gvg 任务在执行计划中完成，则 dest sp 发送完整的 tx。

### SP Exit SP

Greenfield 允许 SP 参与，也允许 SP 按照自己的意愿退出。

The flow chart is shown below:
流程图如下所示：
![sp exit](https://raw.githubusercontent.com/bnb-chain/greenfield-docs/main/static/asset/14-sp_exit.jpg)

+ src sp 通过向区块链发送 StorageProviderExit 交易自行申请退出。
+ src sp 从链上订阅事件，并产生退出执行计划。
+ src sp 调度交换出信息 dest sp。
+ dest sp 通过交换单元生成 gvg 迁移任务。
+ dest sp 执行器 fetch migrate gvg 任务来执行，并定期报告进度。
+ 如果所有 gvg 任务在交换出中完成，则目标 sp 发送完整的交换出 tx。
+ 如果所有交换完成，则 src sp 发送完整的 sp exit tx。
