---
title: "ABI"
description: 
date: 2022-06-16T17:37:48+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: true
categories:
    - 区块链
tags:
    - 源码分析
    - 以太坊
---

## 概述

[Contract ABI Specification](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#basic-design) 详细介绍了 abi 相关的规范。

[abi](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#pkg-overview) package 实现了以太坊ABI。

以太坊 ABI 是强类型的，在编译时已知并且是静态的。 ABI package 处理基本类型转换，不处理切片转换。

[Argument](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#Argument)包含参数的名称和相应的类型。打包和测试参数时使用类型。

[Type](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#Type) 是支持的参数类型（Argument) 的反射。

对于 golang 中的 `struct` 、`slice` 等复杂结构，我们需要自行定义对应的 Argument 的反射。

## 如何在 golang 中实现 abi.encode
