---
title: "optimism specification: deposit transactions"
description: optimism 源码分析：deposit 交易
slug: op-deposits
date: 2022-11-18T20:34:20+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
  - optimism
tags:
  - bedrock
---

## 引言 [^1]

[Deposited transactions](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#deposited)，也称为 [deposits](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#deposits)，是在 L1 上发起并在 L2 上执行的交易。 本文档概述了一种用于 deposit 的新 [交易类型](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#transaction-type)。 它还描述了如何在 L1 上启动 deposits，以及 L2 上的授权和验证条件。

注意：deposited transaction 特指 L2 交易，deposit 可以指各个阶段的交易（比如 deposit L1 时）。

## The Deposited Transaction Type

[Deposited transactions](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#deposited) 与现有交易类型有以下显着区别：

1. 它们源自 L1 块，并且必须作为协议的一部分包含在内。
2. 它们不包括签名验证（请参阅 [User-Deposited Transactions]({{< ref "#user-deposited-transactions" >}}) 了解基本原理）。
3. 它们在 L1 上购买 L2 gas，因此，L2 gas 不可退还。

我们定义了一个新的 [EIP-2718](https://eips.ethereum.org/EIPS/eip-2718) 兼容交易类型，前缀为`0x7E`，然后是一个版本化的字节序列。第一个版本将`0x00`作为版本字节，然后是以下字段（rlp 按照它们在此处出现的顺序编码）：

- `bytes32 sourceHash`: source-hash，唯一标识 deposit 来源。
- `address from`: 发送者的账户地址。
- `address to`: 收款人账户的地址，如果 deposit 的交易是合约创建，则为空（零长度）地址。
- `uint256 mint`: 在 L2 上铸造的 ETH 数量。
- `uint256 value`: 发送到收件人账户的 ETH 数量。
- `bytes data`: 输入数据。
- `uint64 gasLimit`: L2 交易的 gasLimit。

与 [EIP-155](https://eips.ethereum.org/EIPS/eip-155) 交易相比，这种交易类型不包含签名信息，并且发件人地址明确。

我们选择`0x7E`，因为目前允许交易类型标识符最大到`0x7F`。选择一个较大的标识符可以最大限度地降低标识符在未来被 L1 链上的另一种交易类型使用的风险。我们不会选择`0x7F`本身，以防它被用于可变长度编码方案。

我们选择在 deposit transaction 中添加一个版本字段，使协议能够升级 deposit transaction 类型，而无需使用另一个 EIP-2718 交易类型。

### Source hash computation

deposit transaction 的 sourceHash 是根据来源计算的：

- User-deposited：`keccak256(bytes32(uint256(0)), keccak256(l1BlockHash, bytes32(uint256(l1LogIndex))))`。其中`l1BlockHash`、`l1LogIndex`都来自 L1 上 deposit 的日志事件。`l1LogIndex` 是 deposit 事件日志在区块日志事件组合列表中的索引。
- L1 attributes deposited：`keccak256(bytes32(uint256(1)), keccak256(l1BlockHash), bytes32(uint256(seqNumber)))`。其中 `l1BlockHash` 指存放信息属性的 L1 区块哈希。 `seqNumber = l2BlockNum - l2EpochStartBlockNum`，其中`l2BlockNum`为 L2 中包含 deposit tx 的 L2 区块号，`l2EpochStartBlockNum` 为 epoch 中第一个 L2 区块的区块号。

如果 deposit 中没有`sourceHash`，则两个不同的 `deposit transaction` 可能具有完全相同的哈希值。

外部的`keccak256`将实际的唯一标识信息与域进行哈希处理，以避免不同类型的源之间发生冲突。

我们不使用发送者的随机数来确保唯一性，因为这将需要在块推导期间从执行引擎读取额外的 L2 EVM 状态。

### Kinds of Deposited Transactions

虽然我们只定义了一种新的交易类型，但我们可以根据它们在 L2 区块中的位置来区分两种 deposited transactions ：

- 第一个交易必须是 [L1 attributes deposited transaction]({{< ref "#l1-attributes-deposited-transaction" >}})，然后是
- 提交给 L1 上的 deposit feed 合约的一系列零个或多个 [user-deposit transaction]({{< ref "#user-deposited-transactions" >}})。User-deposited transactions 仅出现在 L2 epoch 的第一个区块中。

我们只定义了一个新的交易类型，以尽量减少对 L1 客户端软件的修改和复杂性。

### Validation and Authorization of Deposited Transactions

如上所述，deposit 的交易类型不包括用于验证的签名。相反，授权由 [L2 chain derivation](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-derivation) 过程处理，如果正确应用该过程，将只会推导出具有 [L1 deposit 合约]({{< ref "#deposit-contract" >}}) 日志证明的`from`地址的交易。

### Execution

为了执行 deposited transaction：

首先，`from` 账户的余额必须增加`mint`量。

然后，根据交易的属性初始化 deposited transaction 的执行环境，其方式与 EIP-155 交易的方式完全相同。

具体来说，将创建一个以 `to` 地址为目标的新 EVM 调用框架，其初始化值如下：

- `CALLER` 和 `ORIGIN` 设置为 `from`
  - 来自 deposit feed contract 日志中的`from`没有变化（尽管地址可能已被 deposit feed contract 起了别名）。
- `context.calldata` 设置为 `data`
- `context.gas` 设置为 `gasLimit`
- `context.value` 设置为 `sendValue`

L2 不能购买 gas，也不提供退款。用于 deposit 的 gas 从 L2 上的 gas 池中减去。 Gas 使用量与其他交易类型（包括固有 gas）完全匹配。如果 deposit 耗尽 gas 或发生其他故障，mint 将成功并且帐户的随机数将增加，但不会发生其他状态转换。

如果 deposit 中的 `isSystemTransaction` 设置为 `true`，则 deposit 使用的 gas 是不做消耗。一定不能从 gas pool 中减去，收据的`usedGas`字段必须设置为 0。

应用程序开发人员注意事项：因为 `CALLER` 和 `ORIGIN` 设置为 `from`，使用 `tx.origin == msg.sender` 检查的语义将无法确定 deposit 交易期间调用者是否是为 EOA。相反，检查只能用于识别 L2 deposit 交易中的第一次调用。但是，此检查仍然满足开发人员使用此检查来确保 `CALLER` 无法在调用前后执行代码的常见情况。

#### Nonce Handling

尽管缺少签名验证，我们仍然会在执行 deposit 交易时增加`from`帐户的 nonce。在 rollup 上仅 deposit 的情况下，这对于交易排序或重放预防不是必需的，但是它与在 [合约创建](https://github.com/ethereum/execution-specs/blob/617903a8f8d7b50cf71bf1aa733c37897c8d75c1/src/ethereum/frontier/utils/address.py#L40) 期间使用 nonce 保持一致。它还可以简化与下游工具（例如钱包和区块浏览器）的集成。

## L1 Attributes Deposited Transaction {#l1-attributes-deposited-transaction}

[L1 attributes deposited transaction](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#l1-attributes-deposited-transaction) 是发送到 [L1 attributes predeployed contract]({{< ref "#l1-attributes-predeployed-contract" >}}) 的 deposit transaction.

该交易必须包含以下字段：

- `from` is 0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001 (the address of the [L1 Attributes depositor account]({{< ref "#l1-attributes-depositor-account" >}}))
- `to` is 0x4200000000000000000000000000000000000015 (the address of the L1 attributes predeployed contract).
- `mint` is 0
- `value` is 0
- `gasLimit` is set to 150,000,000.
- `isSystemTransaction` is set to true.
- `data` 是对 [L1 attributes predeployed contract]({{< ref "#l1-attributes-predeployed-contract" >}}) 的 `setL1BlockValues()` 函数的 ABI 编码调用，具有与相应的 L1 块关联的正确值（参见 [reference implementation]({{< ref "#l1-attributes-predeployed-contract-reference-implementation" >}})）

L1 attributes deposited transactions 不消耗任何 gas。

## Special Accounts on L2

L1 attributes deposit transaction 涉及两个特殊用途账户：

- The L1 attributes depositor account
- The L1 attributes predeployed contract

### L1 Attributes Depositor Account {#l1-attributes-depositor-account}

depositor account 是一个没有已知私钥的 EOA。它的地址是 `0xdeaddeaddeaddeaddeaddeaddeaddeaddeaddead0001`。它的值在执行 L1 attributes deposited transaction 期间由 `CALLER` 和 `ORIGIN` 操作码返回。

### L1 Attributes Predeployed Contract

L2 上的预部署合约，地址为`0x4200000000000000000000000000000000000015`，它在存储中保存相应 L1 块的某些块变量，以便在执行后续 deposited transactions 时可以访问它们。

预部署存储以下值：

- L1 块属性：
  - number (uint64)
  - timestamp (uint64)
  - basefee (uint256)
  - hash (bytes32)
- sequenceNumber (uint64)： 等于相对于 epoch 开始的 L2 块编号，即最后更改到 L1 属性的 L2 块的距离，并在新 epoch 开始时重置为 0。
- 与 L1 块相关的系统可配置项，请参阅 [系统配置规范](https://github.com/ethereum-optimism/optimism/blob/develop/specs/system_config.md)：
  - batcherHash (bytes32): A versioned commitment to the batch-submitter(s) currently operating.
  - l1FeeOverhead (uint256): The L1 fee overhead to apply to L1 cost computation of transactions in this L2 block.
  - l1FeeScalar (uint256): The L1 fee scalar to apply to L1 cost computation of transactions in this L2 block.

该合约实施了一种授权方案，因此它只接受来自 [depositor account]({{< ref "#l1-attributes-depositor-account" >}}) 的状态改变调用。

合约有如下 solidity 接口，可以按照 [合约 ABI 规范](https://docs.soliditylang.org/en/v0.8.10/abi-spec.html) 进行交互。

#### L1 Attributes Predeployed Contract: Reference Implementation {#l1-attributes-predeployed-contract-reference-implementation}

L1 Attributes predeploy contract 的参考实现可以在 [L1Block.sol](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/contracts/L2/L1Block.sol) 中找到。

在`packages/contracts`目录中运行`yarn build`之后，添加到 genesis file 的字节码将位于构建工件文件的 `deployedBytecode` 字段中，位于 `/packages/contracts/artifacts/contracts/L2/L1Block.sol/L1Block.json`。

## User-Deposited Transactions {#user-deposited-transactions}

[User-deposited transactions](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#user-deposited-transaction) 是由 [L2 链衍生过程](https://github.com/ethereum-optimism/optimism/blob/develop/specs/glossary.md#L2-chain-derivation) 生成的 [deposited transactions](https://github.com/ethereum-optimism/optimism/blob/develop/specs/deposits.md#the-deposited-transaction-type)。每个 User-deposited transactions 的内容由 L1 上的 [deposit Contract](https://github.com/ethereum-optimism/optimism/blob/develop/specs/deposits.md#deposit-contract) 发出的相应`TransactionDeposited`事件确定。

- `from` 与发出的值没有变化（尽管它可能已转换为 deposit feed contract 中的别名）。
- `to` 是任何 20 字节的地址（包括零地址）。
  - 在创建合约的情况下（参见 `isCreation`），此地址始终为零。
- `mint` is set to the emitted value.
- `value` is set to the emitted value.
- `gaslimit` is unchanged from the emitted value.
- `isCreation` is set to `true` if the transaction is a contract creation, `false` otherwise.
- `data` is unchanged from the emitted value. 根据`isCreation`的值，它被处理为调用数据或合约初始化代码。
- `isSystemTransaction` is set by the rollup node for certain transactions that have unmetered execution. It is `false` for user deposited transactions。

### Deposit Contract

Deposit Contract 被部署到 L1。Deposit transactions 源自 Deposit Contract 发出的`TransactionDeposited`事件中的值。

Deposit contract 负责维护维护 [guaranteed gas market](https://github.com/ethereum-optimism/optimism/blob/develop/specs/guaranteed-gas-market.md)，对 L2 上要使用的 gas 收取押金，保证单个 L1 区块的 guaranteed gas 总量不超过 L2 区块 gas limit。

Deposit Contract 处理两种特殊情况：

- 合约创建 deposit，通过将 `isCreation` 标志设置为`true`来指示。如果`to`地址不为零，合约将恢复。
- 来自合约账户的调用，在这种情况下，from 值被转换为其 L2 [alias]({{< ref "#address-aliasing" >}})。

#### Address Aliasing {#address-aliasing}

如果调用者是合约，地址将通过添加 `0x1111000000000000000000000000000000001111` 来转换。数学`unchecked`并在 Solidity `uint160` 上完成，因此该值将溢出。这可以防止 L1 上的合约与 L2 上的合约具有相同地址但代码不同的攻击。对于 EOA，我们可以安全地忽略这一点，因为它们保证具有相同的“代码”（即根本没有代码）。这也使得用户即使在 Sequencer 关闭时也可以与 L2 上的合约进行交互。

#### Deposit Contract Implementation: Optimism Portal

可以在 [OptimismPortal.sol](https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/contracts/L1/OptimismPortal.sol) 中找到 Deposit Contract 的参考实现。

## 总结

本文介绍了 optimism deposit 相关知识。关于 withdraw 参见 [这篇文章]({{< ref "posts/ethereum/optimism/bedrock/withdraw" >}})

[^1]: [deposits](https://github.com/ethereum-optimism/optimism/blob/develop/specs/deposits.md)
