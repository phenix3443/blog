---
title: zkEVM Spec
description:
slug: zkevm-spec
date: 2023-09-01T20:58:33+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: []
categories: [ethereum]
tags: [rollup, zkevm]
images: []
---

<!--more-->

## 概述

目前，每个以太坊节点都必须验证以太坊虚拟机中的每笔交易。这意味着每笔交易都会增加每个人都必须做的工作，以验证以太坊的历史。更糟糕的是，每笔交易都需要每个新节点进行验证。这使得每个新节点同步到网络所需的工作量不断增加。我们希望为以太坊区块建立一个有效性证明，以避免这种情况。我们有两个目标：

1. 创建一个支持智能合约的 zkrollup
2. 为每个以太坊区块创建有效性证明

这意味着为 `EVM + state reads/writes + signatures` 创建有效性证明。

为了简化，我们将证明分为两个部分：

1. [state proof](https://github.com/privacy-scaling-explorations/zkevm-specs/blob/master/specs/state-proof.md)：state/memory/stack 操作已正确执行。这并不检查是否读/写了正确的位置。我们允许证明者在此选择任何位置，并在 evm proof 中确认其正确性。
2. [evm proof](https://github.com/privacy-scaling-explorations/zkevm-specs/blob/master/specs/evm-proof.md)：这将检查是否在正确的时间调用了正确的操作码。它检查这些操作码的有效性，并确认每个操作码和 state proof 都执行了正确的操作。

只有在验证这两个证明都有效后，我们才能确信以太坊区块的执行是正确的。

## State Proof

state proof 可以帮助 evm proof 检查所有随机读写访问记录是否有效，方法是先按唯一索引分组，然后按访问顺序排序。我们将访问顺序称为`ReadWriteCounter`（ReadWriteCounter），它计算访问记录的数量，同时也是记录的唯一标识符。生成 state proof 时，也会生成`BusMapping`，并作为 lookup table 共享给 evm proof。

### 随机读写数据

state proof 维护 EVM 校验的 [随机访问数据](https://github.com/privacy-scaling-explorations/zkevm-specs/blob/master/specs/evm-proof.md#Random-Accessible-Data) 的读写部分。

state proof 中记录的操作有：

- Start：交易开始和填充行。
- Memory：作为字节数组的调用内存
- Stack：作为 RLC 编码字数组的调用堆栈
- Storage：账户存储为键值映射
- CallContext： 调用上下文
- Account：账户状态（nonce、余额、代码散列）
- TxRefund： TxRefund：要退还给 Tx 发送方的值
- TxAccessListAccount：账户访问列表状态：账户访问列表状态
- TxAccessListAccountStorage：账户存储访问列表的状态：账户存储访问列表的状态
- TxLog：交易日志状态
- TxReceipt： 交易收据状态：交易收据状态

每种操作使用不同的参数进行索引。详情请参见 [RW 表](https://github.com/privacy-scaling-explorations/zkevm-specs/blob/master/specs/tables.md#rw_table)。

所有表键的连接将成为数据的唯一索引。每条记录都会附带一个`ReadWriteCounter`，并且记录必须首先按其唯一索引分组，然后再按其`ReadWriteCounter`进行排序。鉴于要访问以前的记录，每个目标都有自己的格式和更新规则，例如，memory 中的值应符合 8 位。

### 电路约束

约束分为两组：

- 影响所有操作的全局约束，如键的词序。
- 针对每个操作的特定约束。每个操作类型都使用类似选择器的表达式，以启用仅适用于该操作的额外约束。

对于所有必须保证正确排序/值转换的约束，我们使用固定 lookup table 对连续单元格之间的差值进行范围检查。由于我们使用 lookup table 来证明排序的正确性，因此对于必须排序的每一列，我们都需要定义其可包含的最大值（与固定 lookup table 的大小相对应）；这样，两个连续的单元格按顺序排列时，其差值会在 lookup table 中找到，而反向排序时，差值会绕到一个很大的值（由于字段运算），导致结果不在 lookup table 中。

<!-- todo: 剩余待补充 -->

### 关于账户和存储访问

RwTable 中所有账户和存储的读写都与 Merkle Patricia Trie (MPT) Circuit 相关联。这是因为，与在每个区块中初始化为 0 的其他条目不同，账户和存储通过以太坊状态和存储尝试在区块中持续存在。

一般来说，我们会将每个密钥（账户的 [地址，field_tag]，存储的 [地址，storage_key]）的第一次和最后一次访问链接到使用链式根的 MPT 证明（一个证明的下一个根匹配下一个证明的上一个根）。最后，我们将第一个证明的 root_previous 与 block_previous.root 匹配，将最后一个证明的 root_next 与 block_next.root 匹配。

将账户和存储访问与 MPT 证明联系起来，需要将存在/不存在的情况分开处理：EVM 支持为不存在的账户读取账户字段，为不存在的存储槽读取存储槽；但由于这些值不存在，因此无法验证 MPT 包含证明。此外，有些 EVM 情况需要明确验证账户不存在。在 MPT 方面，这可以通过引入不存在证明来解决。将账户的读/写访问（如 EVM Circuit 对 RwTable 所做的那样）与 MPT 存在/不存在证明联系起来的规则描述 [如下](https://github.com/privacy-scaling-explorations/zkevm-specs/blob/master/specs/evm-proof.md#account-non-existence)。

## EVM 证明

EVM 证明通过验证区块中包含的所有事务都有正确的执行结果，来论证状态 trie root 的转换是有效的。

EVM 电路重新实现了 EVM，但是从验证的角度来看的，这意味着只要不与结果相矛盾，验证者可以帮助提供提示。例如，验证者可以提示这个调用是否会还原，或者这个操作码是否遇到错误，然后 EVM 电路就可以验证执行结果是否正确。

一个区块中包含的事务可能是简单的以太坊转账、合约创建或合约交互，由于每个事务的执行轨迹都不尽相同，我们无法采用固定的电路布局来验证特定区域中的特定逻辑，而是需要一个芯片来验证所有可能的逻辑，这个芯片会不断重复以填充整个电路。
