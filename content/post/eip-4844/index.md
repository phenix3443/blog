---
title: "EIP-4844"
description: EIP-4844
slug: eip-4844
date: 2023-03-24T14:07:57+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
  - eip
tags:
---

## 摘要(Abstract)[^1]

为 "blob-carrying 事务"引入一种新的事务格式，其中包含大量无法通过 EVM 执行访问的数据，但其承诺可以被访问。该格式旨在与将用于完全分片(full sharding)的格式完全兼容。

## 动机(Motivation)

从短期和中期来看，甚至可能从长期来看，Rollups 是 Ethereum 的唯一无信任的扩展解决方案。L1 的交易费用几个月来一直很高，现在更迫切需要做任何必要的事情来帮助促进整个生态系统转向滚动。滚动式交易正在大大减少许多以太坊用户的费用：Optimism 和 Arbitrum 经常提供比 Ethereum 基础层本身低~3-8 倍的费用，而 ZK 滚动，有更好的数据压缩，可以避免包括签名，其费用比基础层低~40-100 倍。

然而，即使这些费用对许多用户来说也太贵了。解决 rollups 本身的长期不足的长期解决方案一直是数据分片，这将为 rollups 可以使用的链增加每块~16MB 的专用数据空间。然而，数据分片仍将需要相当长的时间来完成实施和部署。

本 EIP 通过实现分片中使用的交易格式，在这之前提供了一个权宜之计，但实际上没有分片这些交易。相反，这种交易格式的数据只是信标链的一部分，并被所有共识节点完全下载（但只在相对较短的延迟后可以被删除）。与完全的数据分片相比，这种 EIP 对可以包含的这些交易数量的上限有所降低，对应于每个区块的目标是~0.25MB，限制是~0.5MB。
[EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)它将“blobs”数据短期存储在信标节点(`beacon node`)。blob 足够小，可以保持磁盘使用的可控性，同时，blob 远大于现在的 calldata，可以更好地支持 rollup 上的高 TPS。

## 规范(Specification)

### 参数(Parameters)

### 类型别名(Type aliases)

### 加密辅助(Cryptographic Helpers)

在整个提案中，我们使用[https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844)中定义的加密方法和类。

具体来说，我们使用 [polynomial-commitments.md](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844/polynomial-commitments.md) 中的以下方法：

- [verify_kzg_proof()](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844/polynomial-commitments.md#verify_kzg_proof)
- [verify_aggregate_kzg_proof()](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844/polynomial-commitments.md#verify_aggregate_kzg_proof)

### Helpers

```python
def kzg_to_versioned_hash(kzg: KZGCommitment) -> VersionedHash:
    return BLOB_COMMITMENT_VERSION_KZG + sha256(kzg)[1:]
```

Approximates factor \* e \*\* (numerator / denominator) using Taylor expansion:

```python
def fake_exponential(factor: int, numerator: int, denominator: int) -> int:
    i = 1
    output = 0
    numerator_accum = factor * denominator
    while numerator_accum > 0:
        output += numerator_accum
        numerator_accum = (numerator_accum * numerator) // (denominator * i)
        i += 1
    return output // denominator
```

### New transaction type

我们引入了一种新的 [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) 交易类型，格式为单字节 `BLOB_TX_TYPE`，后跟包含交易内容的 `SignedBlobTransaction` 容器的 SSZ 编码：

```python
class SignedBlobTransaction(Container):
    message: BlobTransaction
    signature: ECDSASignature

class BlobTransaction(Container):
    chain_id: uint256
    nonce: uint64
    max_priority_fee_per_gas: uint256
    max_fee_per_gas: uint256
    gas: uint64
    to: Union[None, Address] # Address = Bytes20
    value: uint256
    data: ByteList[MAX_CALLDATA_SIZE]
    access_list: List[AccessTuple, MAX_ACCESS_LIST_SIZE]
    max_fee_per_data_gas: uint256
    blob_versioned_hashes: List[VersionedHash, MAX_VERSIONED_HASHES_LIST_SIZE]

class AccessTuple(Container):
    address: Address # Bytes20
    storage_keys: List[Hash, MAX_ACCESS_LIST_STORAGE_KEYS]

class ECDSASignature(Container):
    y_parity: boolean
    r: uint256
    s: uint256
```

### Header extension

### Beacon chain validation

### Opcode to get versioned hashes

### Point evaluation precompile

### Gas accounting

### Networking

## Rationale

### On the path to sharding

### How rollups would function

### Versioned hashes & precompile return data

### Data gasprice update rule

### Throughput

## Backwards Compatibility

### Blob non-accessibility

### Mempool issues

## Test Cases

## Security Considerations

## Copyright

## 参考

[^1]: [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)

```

```
