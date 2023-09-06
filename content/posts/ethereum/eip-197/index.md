---
title: EIP-197
description: EIP-197：针对椭圆曲线 alt_bn128 的最优 ate 配对检查的预编译合约
slug: eip-197
date: 2023-09-06T10:55:30+08:00
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

本文译自 [EIP-197: Precompiled contracts for optimal ate pairing check on the elliptic curve alt_bn128](https://eips.ethereum.org/EIPS/eip-197)。

<!--more-->

## 简述

为了在区块 gas 限制内执行 zkSNARK 验证，需要为椭圆曲线的配对操作预编译合约。

## 摘要

这个 EIP 建议为特定配对友好的椭圆曲线添加预编译合约。这可以与 [EIP-196]({{< ref "../eip-196" >}}) 结合，以验证以太坊智能合约中的 [zkSNARKs]({{< ref "../zksnark" >}})。zkSNARKs 对以太坊的一般好处是，它将增加用户的隐私（因为零知识特性），并且可能也是一种可扩展性解决方案（因为其简洁性和高效可验证性）。

## 动机

当前在以太坊上执行的智能合约完全透明，这使得它们不适合涉及私人信息的几种用例，如位置、身份或过去交易的历史。zkSNARKs 的技术可能是解决这个问题的方法。虽然以太坊虚拟机理论上可以使用 zkSNARKs，但它们目前的成本过高，无法适应区块的 gas 限制。因此，这个 EIP 提议为一些能够启用 zkSNARKs 的基本原语指定某些参数，以便它们可以更有效地实施，同时降低 gas 成本。

请注意，固定这些参数绝不会限制 zkSNARKs 的使用案例，甚至可以无需进一步硬分叉就融入一些 zkSNARK 研究进展。

配对函数可以用来执行有限的乘法同态操作，这对当前的 zkSNARKs 是必要的。这个预编译可以用来在区块 gas 限制内运行这样的计算。这个预编译合约只指定了某个检查，而不是计算配对函数。原因是配对函数的值域是一个相当复杂的领域，可能会涉及编码问题，而在 zkSNARKs 中所有已知的配对函数的使用只需要指定的检查。

## 规范

对于 `block.number >= BYZANTIUM_FORK_BLKNUM` 的区块，请添加一个预编译合约，该合约与“[alt_bn128](https://blog.csdn.net/mutourend/article/details/128236672)”椭圆曲线群上的双线性函数有关。我们将以 [离散对数]({{< ref "../../cryptography" >}}) 的形式定义预编译合约。当然，离散对数被假设为难以计算，但我们将给出一个等效的规范，该规范利用了下文中可以有效计算的椭圆曲线配对函数。

Address: 0x8

对于一个加法表示的素数阶为 `q` 的循环群 `G` ，$log_P: G \rightarrow F_q$ 表示相对于生成元 `P` 在此群上的离散对数，即 $log_P(x)$ 是最小的非负整数 `n` ，使得 $n * P = x$ 。

预编译合约的定义如下，其中两个群 $G_1$ 和 $G_2$ 由其生成元 $P_1$ 和 $P_2$ 定义。两个生成元都具有相同的素数阶 `q` 。

```shell
Input: (a1, b1, a2, b2, ..., ak, bk) from (G_1 x G_2)^k
Output: If the length of the input is incorrect or any of the inputs are not elements of
        the respective group or are not encoded correctly, the call fails.
        Otherwise, return one if
        log_P1(a1) *log_P2(b1) + ... + log_P1(ak)* log_P2(bk) = 0
        (in F_q) and zero else.
```

请注意， `k` 是根据输入的长度确定的。按照下面的编码部分，`k` 是输入的长度除以 `192` 。如果输入长度不是 `192` 的倍数，那么调用将失败。空输入是有效的，结果会返回一。

为了检查一个输入是否是 $G_1$ 的元素，验证坐标的编码并检查它们是否满足曲线方程（或者是无穷大的编码）就足够了。对于 $G_2$ ，除此之外，还需要检查元素的阶是否等于群的阶 `q = 21888242871839275222246405745257275088548364400416034343698204186575808495617` 。

### 群定义

群组 $G_1$ 和 $G_2$ 是素数阶`q`的 [循环群]({{< ref "../../cryptography" >}}):

$$
q = 21888242871839275222246405745257275088548364400416034343698204186575808495617
$$

$G_1$ 是定义在在域 $F_p$
$$
p = 21888242871839275222246405745257275088696311157297823662689037894645226208583
$$

的椭圆曲线：

$$
Y^2 = X^3 + 3
$$

其生成元 $P_1$ ：

$$
P_1 = (1, 2)
$$

$G_2$ 定义在 $F_p^2 = F_p[i] / (i^2 + 1)$ 域（其 p 同上）的椭圆曲线：

$$
Y^2 = X^3 + 3/(i+9)
$$

其生成元 $P_2$：

$$
\begin{aligned}
P_2 = (\\\\
  &11559732032986387107991004021392285783925812861821192530917403151452391805634 * i + \\\\
  &10857046999023057135944570762232829481370756359578518086990519993285655852781, \\\\
  &4082367875863433681332203403145435568316851327593401208105741076214120093531 * i + \\\\
  &8495653923123431417604973247489272438418190587263600148770280649306958101930 \\\\
)
\end{aligned}
$$

请注意，$G_2$ 是在 $F_p^2$ 上的那条椭圆曲线的唯一一个阶为 `q` 的群。任何其他阶为 q 而非 $P_2$ 的生成元都会定义出相同的 $G_2$ 。然而， $P_2$ 的具体值对于怀疑阶为 q 的群存在性的读者来说是有用的。他们可以被指导去比较 $q* P_2$ 和 $P_2$ 的具体值。

### 编码

$F_p$ 的元素被编码为 32 字节的大端数。编码值 p 或更大是无效的。

$a * i + b$ 的元素被编码为 $F_p$ 的两个元素，即 (a, b) 。

椭圆曲线点被编码为一个`Jacobian pair` (X, Y) ，其中无穷远点被编码为 (0, 0) 。

请注意，数字 k 是根据输入长度推导出来的。

返回的数据长度始终恰好为 32 字节，并编码为 32 字节的大端数。

### Gas 费用

预编译合约的 gas 费用为 $80 000 * k + 100\\_000$ ，其中 k 是 point 的个数，或等同于输入长度除以 192。

## 理由

我们选择了特定的曲线 `alt_bn128` ，因为它特别适合用于 zkSNARKs，或者更具体地说，它们的配对函数的验证构建块。此外，通过选择这个曲线，我们可以与 ZCash 产生协同效应，并重复使用他们的一些组件和成果。

考虑过将曲线和域参数添加到输入的功能，但最终被拒绝，因为这会使规格复杂化；确定 gas 成本要困难得多，而且有可能在并非实际椭圆曲线或无法实现有效配对的情况下调用合约。

选择了非紧凑点编码，因为它仍然允许在智能合约本身中执行一些操作（包括完整的 y 坐标），并且可以比较两个编码点的相等性（没有第三个投影坐标）。

$F_p^2$ 中域元素的编码选择按此顺序进行，以便与元素本身的大端编码保持一致。

## 向后兼容性

与引入任何预编译合约一样，已经使用给定地址的合约将会改变其语义。因此，这些地址是从下面的“保留范围”中取出的，该范围低于 256。

## 测试用例

待撰写。

## 实施

预编译合约可以通过 [椭圆曲线配对函数]({{< ref "../../elliptic_curve#pairing" >}}) 来实现，更具体地说，是在 alt_bn128 曲线上的最优 ate 配对，这可以被有效地实现。为了看到这一点，首先注意到配对函数 e: $G_1*G_2 \rightarrow G_T$ 满足以下属性（ $G_1$ 和 $G_2$ 是以加法形式写的， $G_T$ 是以乘法形式写的）：

(1) $e(m \* P_1, n \* P_2) = e(P_1, P_2)^{m *n}$

(2) e 是非退化的

我们做如下推导（译注：这里为了方便理解，重新组织了推导过程）：

$$
\begin{align}
&e(a_1, b_1) * \ldots * e(a_k, b_k)\\\\
&\Rightarrow e(log_{P_1}^{a_1} * {P_1}, log_{P_2}^{b_1} * {P_2}) * \ldots * e(log_{P_1}^{a_k} * {P_1}, log_{P_2}^{b_k} * {P_2}) \\\\
&\Rightarrow e(P_1, P_2)^{log_{P_1}^{a_1} * log_{P_2}^{b_1}} * \ldots * e(P_1, P_2)^{log_{P_1}^{a_k} * log_{P_2}^{b_k}} \\\\
&\Rightarrow e(P_1, P_2)^{log_{P_1}^{a_1} * log_{P_2}^{b_1} + \ldots + log_{P_1}^{a_k} * log_{P_2}^{b_k}}
\end{align}
$$

当且仅当

$$
e(P_1, P_2)^{log_{P_1}^{a_1} * log_{P_2}^{b_1} + \ldots + log_{P_1}^{a_k} * log_{P_2}^{b_k}} = 1 (in G_T)
$$

可以得到

$$
log_{P_1}^{a_1} * log_{P_2}^{b_1} + \ldots + log_{P_1}^{a_k} * log_{P_2}^{b_k} = 0 (in F_q)
$$

因此，通过验证 $e(a_1, b_1) \*\ldots\* e(a_k, b_k) = 1$ ，可以实施预编译的合约。

译注：这里也就是说：通过验证 $e(a_1, b_1) \*\ldots\* e(a_k, b_k) = 1$，可以验证 $G_1$ 上的数据（$a_1 \ldots a_k$） 和 $G_2$ 上的数据（$b_1 \ldots b_k$） 之间存在某种约束关系。

这里可以找到实施方案：

- [libff](https://github.com/scipr-lab/libff/blob/master/libff/algebra/curves/alt_bn128/alt_bn128_g1.cpp) (C++)
- [bn](https://github.com/zcash/bn/blob/master/src/groups/mod.rs) (Rust)
- [Python](https://github.com/ethereum/py_pairing/blob/master/py_ecc/bn128/bn128_curve.py)

## Copyright

Copyright and related rights waived via CC0.

## Citation

Please cite this document as:

Vitalik Buterin <vitalik@ethereum.org>, Christian Reitwiessner <chris@ethereum.org>, "EIP-197: Precompiled contracts for optimal ate pairing check on the elliptic curve alt_bn128," Ethereum Improvement Proposals, no. 197, February 2017. [Online serial]. Available: <<https://eips.ethereum.org/EIPS/eip-197>.
