---
title: EIP-196
description: EIP-196：用于在椭圆曲线 alt_bn128 上进行加法和标量乘法操作的预编译合约
slug: eip-196
date: 2023-09-06T10:45:21+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: true
series: [eip 学习]
categories: [ethereum]
tags: [eip]
images: []
---

本文译自 [EIP-196: Precompiled contracts for addition and scalar multiplication on the elliptic curve alt_bn128](https://eips.ethereum.org/EIPS/eip-196)

<!--more-->

## 简述

为了在区块 gas 限制内执行 zkSNARK 验证，需要预编译的椭圆曲线操作合约。

## 摘要

这个 EIP 建议为特定配对友好的椭圆曲线的加法和标量乘法添加预编译合约。这可以与 [EIP-197]({{< ref "../eip-196" >}}) 结合，以验证以太坊智能合约中的 [zkSNARKs]({{< ref "../zksnark" >}})。zkSNARKs 对以太坊的一般好处是，它将增加用户的隐私（因为零知识特性），并且可能也是一种可扩展性解决方案（因为其简洁性和高效可验证性特性）。

## 动机

当前在以太坊上执行的智能合约完全透明，这使得它们不适合涉及私人信息的几种用例，如位置、身份或过去交易的历史。zkSNARKs 的技术可能是解决这个问题的方法。虽然以太坊虚拟机理论上可以使用 zkSNARKs，但它们目前的成本过高，无法适应区块的 gas limit。因此，这个 EIP 提议为一些能够启用 zkSNARKs 的基本原语指定某些参数，以便它们可以更有效地实施，同时降低 gas 成本。

请注意，虽然固定这些参数可能看起来像是限制了 zkSNARKs 的使用场景，但这些基本元素可以以足够灵活的方式组合，甚至应该可以在不需要进一步硬分叉的情况下，允许未来进一步研究 zkSNARK。

## 规范

如果 `block.number >= BYZANTIUM_FORK_BLKNUM`，请为“[alt_bn128](https://blog.csdn.net/mutourend/article/details/128236672)”椭圆曲线上的点加法（ADD）和标量乘法（MUL）添加预编译合约。

Address of ADD: `0x6` Address for MUL:`0x7`

alt_bn128 是定义在有限域 F_p：

$$
p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
$$

的椭圆曲线：
$$
Y^2 = X^3 + 3
$$

### 编码

域元素和标量被编码为 32 字节的大端数字。曲线上的点被编码为两个域元素 `(x, y)` ，其中无穷远点被编码为 (0, 0) 。

对象的元组被编码为它们的连续体。

对于这两种预编译合约，如果输入的内容比预期的短，那么会假设其在末尾虚拟填充了零（即，与 CALLDATALOAD 操作码的语义兼容）。如果输入的内容比预期的长，那么末尾多余的字节将被忽略。

返回的数据长度总是如指定的那样（即，它并非“未填充”）。

### 确切的语义

无效输入：对于这两份合约，如果任何输入点不在曲线上，或者任何域元素（点坐标）等于或大于域模数 p，那么合约就会失败。标量可以是 0 和 `2**256-1` 之间的任何数字。

#### ADD

输入：两个曲线点 `(x, y)` 。输出：曲线点 `x + y` ，其中 `+` 是上述椭圆曲线 alt_bn128 上的点加法。对无效输入失败，并消耗所有提供的 gas。

#### MUL

输入：曲线点和标量 `(x, s)` 。输出：曲线点 `s *x` ，其中`*` 是上述椭圆曲线 alt_bn128 上的标量乘法。对无效输入失败并消耗所有 gas。

### Gas 费用

- Gas cost for ECADD: 500
- Gas cost for ECMUL: 40000

## 理由

我们选择了特定的曲线 alt_bn128 ，因为它特别适合用于 zkSNARKs，或者更具体地说，它们的验证构建块——配对函数。此外，通过选择这个曲线，我们可以与 ZCash 产生协同效应，并重复使用他们的一些组件和成果。

曾考虑将曲线和域参数添加到输入的功能，但最终被拒绝，因为这会使规范复杂化：确定 gas 成本变得更加困难，而且可能会在不是实际椭圆曲线的东西上调用合约。

选择了非紧凑点编码，因为它仍然允许在智能合约本身中执行一些操作（包括完整的 y 坐标），并且可以比较两个编码点的相等性（没有第三个投影坐标）。

## 向后兼容性

与引入任何预编译合约一样，已经使用给定地址的合约将会改变其语义。因此，这些地址是从下面的“保留范围”中取出的，该范围低于 256。

## 测试用例

Inputs to test:

- Curve points which would be valid if the numbers were taken mod p (should fail).
- Both contracts should succeed on empty input.
- Truncated input that results in a valid curve point.
- Points not on curve (but valid otherwise).
- Multiply point with scalar that lies between the order of the group and the field (should succeed).
- Multiply point with scalar that is larger than the field order (should succeed).

## 实现

这些基本原语的实现可以在这里找到：

- [libff](https://github.com/scipr-lab/libff/blob/master/libff/algebra/curves/alt_bn128/alt_bn128_g1.cpp) (C++)
- [bn](https://github.com/zcash/bn/blob/master/src/groups/mod.rs) (Rust)

在两个代码库中，都使用了名为 G1 的 alt_bn128 曲线上的特定群组。

- [Python](https://github.com/ethereum/py_pairing/blob/master/py_ecc/bn128/bn128_curve.py) - 可能是最自足且最易读的。

## Copyright

Copyright and related rights waived via CC0.

## Citation

Christian Reitwiessner <chris@ethereum.org>, "EIP-196: Precompiled contracts for addition and scalar multiplication on the elliptic curve alt_bn128," Ethereum Improvement Proposals, no. 196, February 2017. [Online serial]. Available: <https://eips.ethereum.org/EIPS/eip-196>.
