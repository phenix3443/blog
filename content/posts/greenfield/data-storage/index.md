---
title: Greenfield Data Storage
description:
slug: data-storage
date: 2024-05-11T11:58:12+08:00
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

Greenfield 上的一个 Object 存储在多个 SP 之间，例如 50MB：

![EC.png](https://docs.bnbchain.org/greenfield-docs/assets/images/10-SP-EC-a6d9a06707fe1498ae2406b1cf065e73.jpg)

在详细介绍之前，我们先介绍一些数据存储的概念。

## Segment

Segment 是 Object 的基本存储单元。一个 Object 的有效载荷由一个或多个 Segment 依次组成。Segment 的大小在 Greenfield 区块链上进行全局配置。默认 Segment 大小为 16MB。对于较大的 Object，有效载荷数据将被分成许多 Segment。如果 Object 小于 16MB，则只有一个同等大小的 Segment。

请注意，Object 的有效载荷数据将被分割成相同大小的分 Segment，但最后一个分 Segment 是实际大小。例如，如果一个 Object 的大小为 50MB，则只有最后一个分 Segment 的大小为 2MB，其他分 Segment 的大小均为 16MB。

## EC Chunk

引入 [纠删码（EC）](https://zhuanlan.zhihu.com/p/554262696) 是为了在 Greenfield 上获得高效的数据冗余。通过对 Segment 进行编码生成 EC chunk。EC 策略在 Greenfield 区块链上进行全局配置。默认的纠删码策略是 4+2，即一个区 Segment 有 4 个数据块（data chunk）和 2 个奇偶校验块 (parity chunk)。数据块大小为 Segment 的 1/4。由于一个典型的区 Segment 为 16M，因此 EC 的一个典型数据块为 4M。

## Piece

Piece 是 Greenfield 后端存储的基本存储单元。每个 Segment 或 EC chunk 可视为一个 data piece。每个 piece 的密钥根据 Greenfield 链上的策略生成。

## Primary SP

Greenfield 上的每个 Bucket 都与一个 SP 绑定，该 SP 称为 Primary SP。用户需要在创建数据 Bucket 时选择一个 SP 作为 Primary SP。对于存储在 Bucket 下的所有 Object，Primary SP 将存储一份完整的副本，即 Object 有效载荷数据的所有片 Segment。只有 Primary SP 才能满足用户的读取或下载请求。

## Secondary SP

Object 有效载荷数据的 EC chunk 存储在一些 SP 上，这些 SP 被称为 Secondary SP。每个 Secondary SP 存储有效载荷数据的一部分，用于提高数据可用性。Object 有效载荷可以从 EC chunk 中恢复。

## Redundancy Strategy

冗余策略定义了 Object 有效载荷在 SP 之间的存储方式，该策略在 Greenfield 区块链上进行全局配置。以下是当前的策略：

- 文件的数据流将根据 Segment 大小的粒度分割成不同的 Segment。如果数据的大小小于分 Segment 大小，则会根据数据本身的大小进行分割。默认分 Segment 大小为 16MB；
- Greenfield 使用 Reed-Solomon 算法 Reed-Solomon 算法作为 EC 策略，默认 data chunk 为 4，默认奇偶校验块为 2。
- Object 的所有 Segment 都存储在 Primary SP 上；
- 对数据 Segment 进行 EC 编码后，EC 编码模块将生成六个 EC chunk，并且将被存储到所选的六个 Secondary SP 中。

例如，在处理 32MB 文件时，Object 会被分成两 Segment。这两个片 Segment 存储在 Primary SP 中，每个片 Segment 使用纠删码生成六个 4MB 的 piece。这六个 piece 按数字顺序分别存储在六个 Secondary SP 中。

## Integrity Hash

完整性哈希值（integrity hashes）包括 Primary SP 的根哈希值和基于 EC 策略的每个 Secondary SP 的多个根哈希值。辅助哈希值的数量等于 data chunk 加奇偶校验块（目前为 6 个）。每个 data chunk 的哈希值是通过对 data chunk 的内容使用哈希算法（默认为 sha256）计算得出的。data chunk 的根哈希值是根据所有 data chunk 的哈希值计算的。

计算过程如下：

```go
// secondaryHashN represents the Integrity Hash calculated by the Nth secondary SP.
// segmentN_pieceN represents the Nth piece of the Nth segment of the object after EC encoding
IntegrityHashes = [primaryHash, secondaryHash1 ...secondaryHash6]
primaryHash := hash(hash(segment1)+hash(segment2)..+hash(segmentN))
secondaryHashN := hash(hash(segment1_pieceN)+hash(segment2_pieceN)..+hash(segmentN_pieceN))
```

例如，在处理一个 32MB 的文件时，我们会得到两个 Segment，分别称为 segment1 和 segment2。Primary SP 的完整性哈希值等于 `hash(hash(segment1) + hash(segment2))`。对于每个 Secondary SP，它都会存储 piece1 和 piece2，即各分 Segment 的编码结果。第一个 Secondary SP 的完整性哈希值等于 `hash(hash(segment1_piece1) + hash(segment2_piece1))`。

完整性哈希值是链上 Object 的重要元数据。在创建 Object 的过程中，会计算每个 Object 的完整性哈希值，并将此信息记录在区块链上，以确保数据的准确性。
