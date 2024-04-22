---
title: Permission 模块
description:
slug: greenfield-permission
date: 2024-04-22T11:36:53+08:00
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

Greenfield Storage 通过权限模块管理权限控制。

所有数据资源（如 object、bucket、payment 账户和 group）都需要授权才能访问。这些授权规定了每个账户可以执行的操作。

一些权限示例：

+ Put, List, Get, Delete, Copy, and Execute data objects;
+ Create, Delete, and List buckets
+ Create, Delete, ListMembers, Leave groups
+ Create, Associate payment accounts
+ Grant, Revoke the above permissions

这些权限既链接到数据资源，也链接到有权访问这些资源的账户或 group。group 是共享相同权限的账户集合，定义公开存储在 Greenfield 区块链上，目前是纯文本。但是，计划在未来实施利用零知识证明技术的隐私模式。

值得注意的是，无论是通过智能合约还是 EOA，都可以直接从 BSC 执行权限操作，这进一步增强了其便利性。

总体而言，权限模块的接口语义与 S3 类似。

## 概念

### 术语

+ Resources: bucket、object 和 group 是 Greenfield 网络中需要授权的主要资源。这些资源通过 policy 中的 greenfield 资源名称 （GRN） 进行标识。
+ Actions: Greenfield 中的每个资源都有一组可以对其执行的操作。若要指定允许或拒绝哪些操作，必须提供操作枚举值。
+ Principals（主体）:  可以在 policy 中标识被授予访问特定资源和操作权限的账户或 group。
+ Statements: 概述了权限的具体详细信息的 Policy，包括 Effect、ActionList 和 Resources。
+ Effect: 设置用户请求特定操作时的结果，可以配置为允许或拒绝。

### Resource

Greenfield 操纵的主要实体是资源。bucket、object 和 group 都被视为资源，每个资源都有自己的一组子资源。

bucket 子资源由以下部分组成：

+ BucketInfo：允许修改的 bucket 中的特定字段，如 IsPublic 、 ReadQuota 、 payment 账户等；
+ Policy: 存储 bucket 的权限信息；
+ object：存储在 bucket 中的 object；
+ object 所有权：新上传的 object 所有权都会自动转移到 bucket 拥有者，不管是谁上传的。

object 子资源由以下部分组成：

+ ObjectInfo：允许修改 object 中的某些字段，例如 IsPublic 等；
+ Policy：存储 object 的访问权限信息。

group 子资源由以下部分组成：

+ GroupInfo：允许修改的 group 内的特定字段，例如成员、用户元等；
+ Policy：存储 group 的访问权限信息；
+ GroupMember：Greenfield 中的任何账户都可以加入一个 group，但一个 group 不能成为另一个 group 的成员；可以设置组成员资格的过期时间，如果成员过期，权限将被撤销。

### Ownership

资源所有者是指创建资源的账户。默认情况下，只有资源所有者有权访问其资源。

+ 资源创建者拥有资源。
+ 每个资源只有一个所有者，一旦创建资源，所有权就无法转移。
+ 有一些功能允许一个账户 (approver)“批准”另一个账户创建和上传要由 approver 拥有的 object，只要它在限制范围内。
+ 所有者或所有者的付款账户为资源付费。

### Definitions

+ 所有权权限：默认情况下，所有者拥有资源的所有权限。
+ 公共或私有权限：默认情况下，资源是私有的，只有所有者才能访问资源。如果资源是公共的，则任何人都可以访问它。
+ 共享权限：这些权限由权限模块管理。它通常管理谁有权访问哪些资源。

共享权限有两种类型：单账号权限和 group 权限，它们以不同的格式存储在区块链状态中。

### Revoke

用户可以根据需要分配一个或多个权限。但是，当资源被删除时，即使用户没有启动删除，也应删除其关联的权限 - 这可以通过清理机制进行管理。如果有太多账户有权删除 object，则单个事务所需的处理时间可能会变得过长。

### 示例

假设 Greenfield 有两个账户，Bob（0x1110） 和 Alice（0x1111）。一个基本的示例方案是：

+ Bob 上传了 avatar.jpg 的图片到名为“profile”的 bucket 中；
+ Bob 将 avatar.jpg 的 GetObject 的操作权限授予 Alice（是通过 storage module 实现的，参见 [代码](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/x/storage/keeper/msg_server.go#L373))，它会在权限模块的 state 中存储 key `key Prefix( ObjectPermission) | ResourceID( profile_avatar.jpg) | Address(Alice)` ，参见 [代码](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/x/permission/keeper/keeper.go#L144)。
+ 当 Alice 想要读取 avatar.jpg 时，SP 应该检查 Greenfield 区块链是否 `key Prefix( ObjectPermission) | ResourceID(profile_avatar.jpg) | Address(Alice)` 存在于权限状态树中，以及操作列表是否包含 GetObject。参看 [代码](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/x/storage/keeper/permission.go#L134), 这里包含大部分的检查逻辑。

让我们继续讨论更复杂的场景：

+ Bob 创建了名为“profile”的 bucket；
+ Bob 将该 bucket 的 PutObject 操作权限授予 Alice，将 key `0x10 | ResourceID(profile) | Address(Alice)` 将放入权限状态树中；
+ 当 Alice 想要将 avatar.jpg 上传到该 bucket 中时，它会创建一个 PutObject 交易并将在链上执行，（实际代码中，链上执行的是 createObject 操作。）；
+ Greenfield 区块链需要确认 Alice 是否拥有操作权限，因此它会检查权限状态树中是否存在 key `0x10 | ResourceID(profile) | Address(Alice)` ，如果存在，则获取权限信息。 [代码](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/x/storage/keeper/keeper.go#L621)；
+ 如果权限信息显示 Alice 具有 profile bucket 的 PutObject 操作权限，则她可以执行 PutObject 操作（这个操作是直接和 sp 服务进行交互的）。

另一个包含 group 的更复杂的方案：

+ Bob 创建了名为“Games”的 group（tx.storage.createGroup 命令 ），并创建了一个名为“profile”的 bucket。
+ Bob 将 Alice 添加到 Games group（tx.storage.updateGroupMember 命令），该 group 将被放入权限状态树中 `key 0x12 | ResourceID(Games) | Address(Alice)`
+ Bob 将 avatar.jpg 放入 bucket 配置文件中，并将 CopyObject 操作权限授予 Games group。
+ 当 Alice 想要复制  avatar.jpg（tx.storage.copy_object） . 首先，Greenfield 区块链通过 `key 0x11 | ResourceID(avatar.jpg) | Address(Alice)` ; 如果未命中，Greenfield 将遍历 object avatar.jpg 关联的所有 group，并通过检查（例如是否存在 `key 0x21 | ResourceID(group, e.g. Games)` ）来检查 Alice 是否是其中一个 group 的成员，然后遍历 permissionInfo 映射，并确定 Alice 是否在有权通过键 `0x12| ResourceID(Games) | Address(Alice)` 执行 CopyObject 操作的 group 中。

## State

权限模块保留以下主要 object 的状态：

+ Policy ：资源的所有者账户将其指定权限授予另一个账户；
+ PolicyGroup ：资源的所有者账户向 group 将其指定权限授予一个 group。

这些主要 object 应主要由 ID 自动递增序列 来存储和访问。为了与 S3 object 存储兼容，每个主 object 都会维护一个附加索引。

+ BucketPolicyForAccount: `0x11 | BigEndian(BucketID) | AccAddress -> BigEndian(PolicyID)`
+ ObjectPolicyForAccount: `0x12 | BigEndian(ObjectID) | AccAddress -> BigEndian(PolicyID)`
+ GroupPolicyForAccount: `0x13 | BigEndian(GroupID) | AccAddress -> BigEndian(PolicyID)`
+ BucketPolicyForGroup: `0x21 | BigEndian(BucketID) -> ProtoBuf(PolicyGroup)`
+ ObjectPolicyForGroup: `0x22 | BigEndian(ObjectID) -> ProtoBuf(PolicyGroup)`
+ PolicyByID: `0x31 | BigEndian(PolicyID) -> ProtoBuf(Policy)`

参见 [代码](https://github.com/bnb-chain/greenfield/blob/964001cc3a018b0cb71bd7b8fd0486528a59d8f8/x/permission/keeper/keeper.go#L157)

## 总结

权限模块的的所有逻辑都是通过 keeper 对外暴露的，这些接口大多被 storage 模块使用。

命令行只对外暴露了模块参数的获取接口。
