---
title: "Contract Application Binary Interface"
description: 
date: 2022-06-16T17:37:48+08:00
slug: contract-abi
image: 
math: 
license: 
hidden: false
comments: true
draft: false
categories:
    - 区块链
tags:
    - 源码分析
    - 以太坊
---

## 概述

合约应用二进制接口 (ABI) 是在以太坊生态系统中与合约交互的标准方式，既可以从区块链外部进行，也可以用于合约间交互。 数据根据其类型进行编码。 由于编码不是自我描述的，因此需要一个说明（abi json 文件）才能解码。更多参见[合约 ABI 规范](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#basic-design)。

## ABI in Go

[package abi](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#pkg-overview) 在 Golang 中实现了以上规范。package 不仅提供了结构体（type ABI）根据 abi.json 与合约交互，还有单独编码参数的结构体（type Argument）.

### 如何按照 abi.encode 编码指定变量

某些情况下，需要对复合类型（struct、slice等）进行 ABI 编码， 这时候就需要：

1. 为符合类型定义为 Type。
   + [Type](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#Type) 是支持的参数类型（Argument) 的反射，这里可以使用 [ABI规范中定义的基础类型](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#types) 或者将基础类型通过 `abi.NewType` 组合成自定义类型。
   + [如何处理 tuple](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#handling-tuple-types) 描述了如何使用 `tuple` 来定义 struct 和 array 类型的反射。
   + [nest struct](https://phenix.github.com/phenix3443/test/blob/ae7e88e0ea2a085b9ea97bb6c52dde6dbb09e150/geth/abi_test.go#L27) 针对嵌套的结构体定义实现 ABI 类型反射做了了测试。

2.调用 `(*Arguments).Pack` 进行编码。
