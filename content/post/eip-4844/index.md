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
draft: false
categories:
  - ethereum
  - eip
tags:
  - sharding
---

## 摘要(Abstract)[^1]

为“blob-carrying transaction”引入一种新的交易格式，其中包含大量无法通过 EVM 执行访问的数据，但其承诺(commitment)可以被访问。该格式旨在与完全分片(full sharding)所用格式完全兼容。

## 动机(Motivation)

从短期和中期来看，甚至可能从长期来看，Rollups 是 Ethereum 的唯一去信任的扩展解决方案。L1 的交易费用几个月来一直很高，现在更迫切需要做任何必要的事情来帮助促进整个生态系统转向 rollups。rollups 交易正在大大减少许多以太坊用户的费用：Optimism 和 Arbitrum 经常提供比 Ethereum 基础层本身低约 3-8 倍的费用，而有更好的数据压缩、可以避免包括签名的 ZK-rollups 的费用比基础层低大约 40-100 倍。

然而，即使这些费用对许多用户来说也太贵了。解决该问题长期解决方案一直是数据分片(data sharding)，这将为 rollups 可以使用的链上的块增加大约 16MB 的专用数据空间。然而，数据分片仍将需要相当长的时间来完成实施和部署。

本 EIP 通过实现分片中使用的交易格式，在这之前提供了一个权宜之计，但实际上没有分片这些交易。相反，这种交易格式的数据只是信标链的一部分，并被所有共识节点完全下载（但只在相对较短的延迟后可以被删除）。与完全的数据分片相比，这种 EIP 对可以包含的这些交易数量的上限有所降低，对应于每个区块的目标是~0.25MB，限制是~0.5MB。

## 规范(Specification)

### 参数(Parameters)

### 类型别名(Type aliases)

### 加密辅助(Cryptographic Helpers)

在整个提案中，我们使用[consensus 4844 specs](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844)中定义的加密方法和类。

具体来说，我们使用 [polynomial-commitments.md](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844/polynomial-commitments.md) 中的以下方法：

- [verify_kzg_proof()](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844/polynomial-commitments.md#verify_kzg_proof)
- [verify_aggregate_kzg_proof()](https://github.com/ethereum/consensus-specs/blob/23d3aeebba3b5da0df4bd25108461b442199f406/specs/eip4844/polynomial-commitments.md#verify_aggregate_kzg_proof)

### Helpers

```python
def kzg_to_versioned_hash(kzg: KZGCommitment) -> VersionedHash:
    return BLOB_COMMITMENT_VERSION_KZG + sha256(kzg)[1:]
```

Approximates `factor * e ** (numerator / denominator)` using Taylor expansion:

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

### 新交易类型(New transaction type)

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

`max_priority_fee_per_gas` 和 `max_fee_per_gas` 字段遵循 [EIP-1559](https://eips.ethereum.org/EIPS/eip-1559) 语义，access_list 遵循 [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) 中的语义。

通过 “wrapper data” 对[EIP-2718](https://eips.ethereum.org/EIPS/eip-2718)扩展，类型化的交易可以用两种形式编码，具体取决于上下文：

- Network (default): `TransactionType || TransactionNetworkPayload, or LegacyTransaction`
- Minimal (as in execution payload): `TransactionType || TransactionPayload, or LegacyTransaction`

Execution-payloads/blocks 使用交易的 Minimal 编码。在交易池和本地交易日志中，则使用 network 编码。

对于以前的交易类型，network 编码没有区别，即 `TransactionNetworkPayload == TransactionPayload`。

`TransactionNetworkPayload` 用额外的数据包装 `TransactionPayload`：这个包装数据应该在签名验证之前或之后直接进行验证。

当一个 blob 交易通过网络（见下面的[network](https://eips.ethereum.org/EIPS/eip-4844#networking)部分）传输时，`TransactionNetworkPayload` 版本的交易也包括 `blob` 和 `kzgs`（承诺列表）。执行层在签名验证后根据内部 `TransactionPayload` 验证包装的有效性：

- `blob_versioned_hashes` 中的所有哈希值必须以字节 `BLOB_COMMITMENT_VERSION_KZG` 开头
- 一个有效区块中最多可能有 `MAX_DATA_GAS_PER_BLOCK // DATA_GAS_PER_BLOB` 个 blob 承诺。
- 有相等数量的版本哈希、KZG 承诺和 Blobs。
- KZG 承诺与版本化哈希相匹配，即 `kzg_to_versioned_hash(kzg[i]) == versioned_hash[i]`
- KZG 承诺与 blob 内容相匹配。(注意：这可以通过附加数据进行优化，使用从承诺和 blob 数据派生的两个点进行随机计算的证明)

通过下面的示例验证签名和计算 `tx.origin` ：

```python
def unsigned_tx_hash(tx: SignedBlobTransaction) -> Bytes32:
    # The pre-image is prefixed with the transaction-type to avoid hash collisions with other tx hashers and types
    return keccak256(BLOB_TX_TYPE + ssz.serialize(tx.message))

def get_origin(tx: SignedBlobTransaction) -> Address:
    sig = tx.signature
    # v = int(y_parity) + 27, same as EIP-1559
    return ecrecover(unsigned_tx_hash(tx), int(sig.y_parity)+27, sig.r, sig.s)
```

已签名的 blob 交易的哈希值应计算为：

```python
def signed_tx_hash(tx: SignedBlobTransaction) -> Bytes32:
    return keccak256(BLOB_TX_TYPE + ssz.serialize(tx))
```

### 区块头部扩展(Header extension)

通过一个新的 256 位无符号整数字段 `excess_data_gas` 来扩展当前的 header 编码。这是自该 EIP 被激活以来，链上消耗的过量数据 Gas 的运行总量。如果数据 Gas 总量低于目标值， `excess_data_gas` 的上限为 0。

因此，Header RLP 编码如下：

```python
rlp([
    parent_hash,
    0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347, # ommers hash
    coinbase,
    state_root,
    txs_root,
    receipts_root,
    logs_bloom,
    0, # difficulty
    number,
    gas_limit,
    gas_used,
    timestamp,
    extradata,
    prev_randao,
    0x0000000000000000, # nonce
    base_fee_per_gas,
    withdrawals_root,
    excess_data_gas
])
```

`excess_data_gas` 的值可以使用 parent header 和块中的 blob 数来计算

```python
def calc_excess_data_gas(parent: Header, new_blobs: int) -> int:
    consumed_data_gas = new_blobs * DATA_GAS_PER_BLOB
    if parent.excess_data_gas + consumed_data_gas < TARGET_DATA_GAS_PER_BLOCK:
        return 0
    else:
        return parent.excess_data_gas + consumed_data_gas - TARGET_DATA_GAS_PER_BLOCK

```

对于第一个分叉后区块，`parent.excess_data_gas`取值为 0 。

### 信标链验证(Beacon chain validation)

现在， Blobs 在共识层中被引用，但没有完全编码在 beacon block body 中，也就是说没有将其全部内容嵌入 body 中，而是将 Blobs 的内容作为一个 “sidecar” 单独传播。

这种 “sidecar” 设计通过黑盒化 `is_data_available()`为将来的数据增加提供了前向兼容性：在完全分片(full sharding) 的情况下，`is_data_available()`可以被数据可用性采样（DAS）所取代，从而避免网络上的所有 beacon node 下载所有 blob。

请注意，共识层的任务是为数据的可用性持久化 blob，而执行层则不是。

`ethereum/consensus-specs` repo 定义了本 EIP 中涉及的以下信标节点变化：

- 信标链：处理更新的信标块(beacon block)，并确保 Blobs 是可用的。
- P2P 网络：广播和同步更新的信标块类型和新的 Blobs sidecars。
- 诚实的验证者：产生带有 Blobs 的信标块，发布 Blobs 的 sidecars。

### Opcode to get versioned hashes

我们添加了一个操作码 `DATAHASH`(其字节值为 `HASH_OPCODE_BYTE`)，该操作码从堆栈顶部按照大端 uint256 读取 `index`，如果 `index<len(tx.message.blob_versioned_hashes)`，则将其替换为堆栈中的 `tx.message.blob_versioned_hashes[index]`，否则为零的 bytes32 值。该操作码的 Gas 成本为 `HASH_OPCODE_GAS`。

### Point evaluation precompile

在 `POINT_EVALUATION_PRECOMPILE_ADDRESS` 处增加一个预编译，验证一个 KZG 证明，该证明声称一个 blob（由一个承诺代表）在一个给定的点计算为一个给定的值。

预编译消耗 `POINT_EVALUATION_PRECOMPILE_GAS`, 并执行以下逻辑：

```python
def point_evaluation_precompile(input: Bytes) -> Bytes:
    """
    Verify p(z) = y given commitment that corresponds to the polynomial p(x) and a KZG proof.
    Also verify that the provided commitment matches the provided versioned_hash.
    """
    # The data is encoded as follows: versioned_hash | z | y | commitment | proof |
    versioned_hash = input[:32]
    z = input[32:64]
    y = input[64:96]
    commitment = input[96:144]
    kzg_proof = input[144:192]

    # Verify commitment matches versioned_hash
    assert kzg_to_versioned_hash(commitment) == versioned_hash

    # Verify KZG proof
    assert verify_kzg_proof(commitment, z, y, kzg_proof)

    # Return FIELD_ELEMENTS_PER_BLOB and BLS_MODULUS as padded 32 byte big endian values
    return Bytes(U256(FIELD_ELEMENTS_PER_BLOB).to_be_bytes32() + U256(BLS_MODULUS).to_be_bytes32())
```

预编译必须拒绝非规范的字段元素（例如提供的字段元素必须严格小于 `BLS_MODULUS`）。

### Gas accounting

引入 data gas 作为一种新的 Gas 类型。它独立于普通 Gas，并遵循自己的目标规则，类似于 EIP-1559。我们使用 `excess_data_gas` header 字段来存储计算 data gas price 所需的持久性数据。目前，只有 Blobs 是以 data gas 来定价的。

```python
def calc_data_fee(tx: SignedBlobTransaction, parent: Header) -> int:
    return get_total_data_gas(tx) * get_data_gasprice(header)

def get_total_data_gas(tx: SignedBlobTransaction) -> int:
    return DATA_GAS_PER_BLOB * len(tx.message.blob_versioned_hashes)

def get_data_gasprice(header: Header) -> int:
    return fake_exponential(
        MIN_DATA_GASPRICE,
        header.excess_data_gas,
        DATA_GASPRICE_UPDATE_FRACTION
    )
```

block 的有效性条件被修改为包括 data gas 检查：

```python
def validate_block(block: Block) -> None:
    ...

    for tx in block.transactions:
        ...

        # the signer must be able to afford the transaction
        assert signer(tx).balance >= tx.message.gas * tx.message.max_fee_per_gas + get_total_data_gas(tx) * tx.message.max_fee_per_data_gas

        # ensure that the user was willing to at least pay the current data gasprice
        assert tx.message.max_fee_per_data_gas >= get_data_gasprice(parent(block).header)
```

通过 `calc_data_fee` 计算的实际 `data_fee` 在交易执行前从发送方余额中扣除并销毁，并且在交易失败的情况下不予退还。

### Networking

节点不得自动向其对等节点广播 blob 交易。相反，这些交易只能通过 `NewPooledTransactionHashes` 消息来宣布，然后可以通过 `GetPooledTransactions` 手动请求。

交易在执行层网络上以 `TransactionType || TransactionNetworkPayload` 的形式呈现，其有效载荷是一个 SSZ 编码的容器：

```python
class BlobTransactionNetworkWrapper(Container):
    tx: SignedBlobTransaction
    # KZGCommitment = Bytes48
    blob_kzgs: List[KZGCommitment, MAX_TX_WRAP_KZG_COMMITMENTS]
    # BLSFieldElement = uint256
    blobs: List[Vector[BLSFieldElement, FIELD_ELEMENTS_PER_BLOB], LIMIT_BLOBS_PER_TX]
    # KZGProof = Bytes48
    kzg_aggregated_proof: KZGProof
```

我们对 `BlobTransactionNetworkWrapper` 对象进行网络级验证，如下所示：

```python
def validate_blob_transaction_wrapper(wrapper: BlobTransactionNetworkWrapper):
    versioned_hashes = wrapper.tx.message.blob_versioned_hashes
    commitments = wrapper.blob_kzgs
    blobs = wrapper.blobs
    # note: assert blobs are not malformatted
    assert len(versioned_hashes) == len(commitments) == len(blobs)

    # Verify that commitments match the blobs by checking the KZG proof
    assert verify_aggregate_kzg_proof(blobs, commitments, wrapper.kzg_aggregated_proof)

    # Now that all commitments have been verified, check that versioned_hashes matches the commitments
    for versioned_hash, commitment in zip(versioned_hashes, commitments):
        assert versioned_hash == kzg_to_versioned_hash(commitment)
```

## 基本原理(Rationale)

### On the path to sharding

该 EIP 引入了 blob 交易，其格式与最终分片规范中预期存在的格式相同。这为 rollups 提供了一个临时但重要的扩展方案，允许它们最初扩展到每槽 0.25MB，单独的收费市场允许收费非常低，而这个系统的使用是有限的。

rollups 式扩展的核心目标是提供临时的扩展方案，而不给 rollups 式扩展带来额外的开发负担。今天，rollups 使用 calldata。在未来，rollups 将别无选择，只能使用分片数据（也称为 "blob"），因为分片数据将更加便宜。因此，在这一过程中，rollups 无法避免对其处理数据的方式进行大规模的升级，至少有一次。但我们可以做的是，确保 rollups 只需要升级一次。这立即意味着正好有两种可能的权宜之计：（i）减少现有 calldata 的 Gas 成本，以及（ii）提前提出将用于分片数据，但实际不需要分片的格式。以前的 EIP 都是第（i）类的解决方案；这个 EIP 是第（ii）类的解决方案。

设计这个 EIP 的主要权衡是，现在实现更多与以后必须实现更多：我们是在实现完全分片的过程中实现 25% 的工作，还是 50%，还是 75%？

这个 EIP 中已经完成的工作包括：

- 一个新的交易类型，其格式与“完全分片”中需要的完全相同
- 完全分片所需的所有执行层逻辑
- 完全分片所需的所有执行/共识交叉验证逻辑
- `BeaconBlock` 验证和数据可用性采样 blobs 之间的层分离
- 完全分片所需的大部分 `BeaconBlock` 逻辑
- 为 Blobs 提供一个自我调整的独立 Gas 价格

要实现完全分片，还需要做的工作包括：

- 共识层中 `blob_kzgs` 的低度(low-degree)扩展，允许 2D 采样
- 数据可用性采样的实际实现
- PBS（提议者/构建者分离），以避免要求个别验证者在一个槽中处理 32MB 的数据
- 保管证明或类似的协议中要求每个验证者验证每个块中分片数据的特定部分

这个 EIP 也为长期的协议清理奠定了基础：

- 它增加了一个 SSZ 交易类型，并为所有应该是 SZZ 的新交易类型铺平了道路。
- 它定义了 `TransactionNetworkPayload`，以分离交易类型的网络和区块编码。
- 它的 gas 价格更新规则更简洁，可以适用于主要的 basefee。

### rollups 如何运行(How rollups would function)

与其将 rollups 块数据放在交易的 calldata 中，rollups 将期望 rollups 块提交者将数据放在 blob 中。这保证了可用性（这也是 rollups 需要的），但比 calldata 要便宜得多。rollups 需要数据一次可用，足够长的时间以确保诚实的行为者能够构建 rollups 状态，但不是永远。

Optimistic rollups 只需要在提交欺诈证明时实际提供基础数据。欺诈证明可以在较小的步骤中验证交易，每次最多通过 calldata 加载 blob 的几个值。对于每个值，它将提供一个 KZG 证明，并使用点计算预编译来验证该值与之前提交的 versioned hash，然后像今天这样对该数据进行欺诈证明验证。

ZK rollups 将为他们的交易或状态变化数据提供两个承诺：blob 中的 kzg 和使用 ZK rollups 内部使用的任何证明系统的一些承诺。他们将使用等价协议的承诺证明，使用计算预编译来证明 kzg（协议确保指向可用数据）和 ZK rollup 自己的承诺指向相同的数据。

### Versioned hashes & precompile return data

我们使用版本化的哈希值（而不是 kzgs）作为执行层中对 blob 的引用，以确保对未来变化的向前兼容。例如，如果我们由于量子安全的原因需要切换到 Merkle 树+STARKs，那么我们将添加一个新的版本，允许点计算预编译与新格式一起工作。rollups 将不必对它们的工作方式进行任何 EVM 级别的改变；定序器将只需在适当的时候切换到使用新的交易类型。

然而，点计算发生在一个有限字段内，而且只有在字段模数(field modulus)已知的情况下，它才会被很好地定义。智能合约可以包含一个将承诺版本映射到模数的表格，但这将不允许智能合约考虑到未来升级到一个尚不知道的模数。通过允许访问 EVM 内部的模数，可以构建智能合约，使其能够使用未来的承诺和证明，而不需要升级。

为了不增加另一个预编译，我们直接从点计算预编译中返回模子和多项式 degree。然后它可以被调用者使用。这也是 "免费 "的，因为调用者可以直接忽略返回值的这一部分而不产生额外的费用--在可预见的未来仍然可以升级的系统可能会暂时使用这种途径。

### Data gasprice update rule

data Gas price 更新规则是为了接近公式 `data_gasprice = MIN_DATA_GASPRICE * e**(excess_data_gas / DATA_GASPRICE_UPDATE_FRACTION)`，其中 `excess_data_gas` 是相对于“目标”数量（每块 `TARGET_DATA_GAS_PER_BLOCK`），链所消耗的数据 Gas 总 “额外”数量。就像 EIP-1559 一样，这是一个自我修正的公式：随着过剩量的增加，data_gasprice 会呈指数级增长，减少使用量，最终迫使过剩量回落。

每个区块的行为大致如下。如果 `N` 块消耗了 `X` 个 data Gas，那么在 `N+1` 块中，多余的 data Gas 增加了 `X-TARGET_DATA_GAS_PER_BLOCK`，因此 `N+1` 块的数据 Gas 价格按照 `e**((X - TARGET_DATA_GAS_PER_BLOCK) / DATA_GASPRICE_UPDATE_FRACTION)`增加 。因此，它与现有的 EIP-1559 有类似的效果，但更 "稳定"，因为它对相同的总使用量有相同的反应，不管它是如何分配的。

参数 `DATA_GASPRICE_UPDATE_FRACTION` 控制 blob gas 的最大变化率。它的目标是每块的最大变化率为 `e(TARGET_DATA_GAS_PER_BLOCK / DATA_GASPRICE_UPDATE_FRACTION) ≈ 1.125`。

### 吞吐量(Throughput)

`TARGET_DATA_GAS_PER_BLOCK` 和 `MAX_DATA_GAS_PER_BLOCK` 的值被选为对应于每块 2 个 Blobs（0.25 MB）和最大 4 个 Blobs（0.5 MB）的目标。这些小的初始限制是为了最大限度地减少该 EIP 对网络造成的压力，预计在未来的升级中会增加，因为网络在更大的块下显示出可靠性。

## 向后兼容性(Backwards Compatibility)

### Blob 不可访问性(Blob non-accessibility)

该 EIP 引入了一种交易类型，它有不同的 mempool 版本（`BlobTransactionNetworkWrapper`）和 execution-payload 版本（`SignedBlobTransaction`），两者之间只能单向转换。blobs 在 `BlobTransactionNetworkWrapper` 中，而不是在 `SignedBlobTransaction` 中；相反，它们包含在了 `BeaconBlockBody`。这意味着，现在有一部分交易将无法从 web3 API 中访问。

### Mempool issues

Blob 交易在 mempool 层有很大的数据量，这带来了 mempool DoS 的风险，虽然不是前所未有的风险，因为这也适用于有大量 calldata 的交易。

通过只广播 blob 交易的公告，接收节点将可以控制接收哪些交易和多少交易，使他们可以将吞吐量控制在一个可接受的水平。[EIP-5793](https://eips.ethereum.org/EIPS/eip-5793) 将通过扩展 `NewPooledTransactionHashes` 公告消息以包括交易类型和大小，给节点提供进一步的细粒度控制。

此外，我们建议在 mempool 交易替换规则中加入 1.1 倍的数据 gasprice bump 要求。

## Test Cases

TBD

## Security Considerations

这个 EIP 使每个信标块的存储需求最大增加了 0.5MB。这比现在一个块的理论最大尺寸（30M Gas/每 calldata 字节 16 Gas=1.875M 字节）大 4 倍，所以它不会大大增加最坏情况下的带宽。合并后(Post-merge)，区块时间预计是静态的，而不是不可预测的泊松分布，为大型区块的传播提供了一个保证期。

这种 EIP 的持续负载比减少 calldata 成本的替代方案要低得多，即使 calldata 是有限的，因为没有现有的软件可以无限期地存储 blob，也没有预期它们需要存储的时间与执行有效载荷一样长。这使得实施一项政策更加容易，例如在 30-60 天后，这些 blob 应该被删除，与提议的（但尚未实施的）执行有效载荷历史的一年轮换时间相比，这个延迟要短得多。

## Copyright

Copyright and related rights waived via CC0.

## Citation

Please cite this document as:

Vitalik Buterin (@vbuterin), Dankrad Feist (@dankrad), Diederik Loerakker (@protolambda), George Kadianakis (@asn-d6), Matt Garnett (@lightclient), Mofi Taiwo (@Inphi), Ansgar Dietrichs (@adietrichs), "EIP-4844: Shard Blob Transactions [DRAFT]," Ethereum Improvement Proposals, no. 4844, February 2022. [Online serial]. Available: https://eips.ethereum.org/EIPS/eip-4844.

## 参考

[^1]: [EIP-4844](https://eips.ethereum.org/EIPS/eip-4844)

```

```
