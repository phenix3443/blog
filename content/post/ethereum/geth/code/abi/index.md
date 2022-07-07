---
title: "Contract Application Binary Interface"
slug: contract-abi-encode
description:
date: 2022-07-05T13:37:48+08:00
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

合约应用二进制接口 (ABI) 是在以太坊生态系统中与合约交互的标准方式，既可以从区块链外部进行，也可以用于合约间交互。数据根据其类型进行编码。 由于编码不是自我描述的，因此需要一个说明（常见的 abi json 文件）才能解码。更多参见[合约 ABI 规范](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#basic-design)。

## ABI in Go

[package abi](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#pkg-overview) 在 Golang 中实现了以上规范。该 package 不仅可以根据 abi.json 与合约交互，还有单独编码相关参数。

### 编码合约接口

[abi.ABI](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#ABI) 可用来根据 abi.json 编码合约接口。

### 编码参数

有时候我们并没有单独的 abi.json 文件，但又需要单独对多个参数（argument）进行 abi 编码，比如合约接口参数本身是先经过 abi.encode 后的 bytes。

这种情况下，可以使用[`func (arguments Arguments) Pack(args ...interface{}) ([]byte, error)`](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#Arguments.Pack)，其中 Arguments 定义了参数中多个 argument 的序列化方式。示例代码：

```go
func TestAbi_encodeMultiArguments(t *testing.T) {
	// 1. 为 argument 定义基础类型。
	intType, _ := abi.NewType("int8", "", nil)
	strType, _ := abi.NewType("string", "", nil)
	// 2. 定义 Arguments。
	args := abi.Arguments{
		{
			Name: "name",
			Type: strType,
		},
		{
			Name: "age",
			Type: intType,
		},
	}
	// 3. 执行序列化。
	packed, err := args.Pack("alice", int8(10))
	if err != nil {
		t.Fatalf("pack err: %v", err)
	}
	t.Log("abi encoded", hexutil.Encode(packed))
}

```

需要注意的问题：

1. 通过 [`abi.NewType`](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#NewType) 定义 argument 对应的 [`ABI规范中定义的基础类型`](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#types) 类型。

2. abi.NewType 第一个参数如果是 `int` `uint`，必须要指定长度，如 int8,int256。

### 定义结构体对应的 ABI 类型

某些情况下，argument 类型 struct，对应 [ABI 规范中定义的 tuple](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#handling-tuple-types)。

```go

var (
	personType, _ = abi.NewType("tuple", "Person", []abi.ArgumentMarshaling{
		{
			Name: "name", // 对应的字段名字要大写
			Type: "string",
		},
		{
			Name: "address",
			Type: "address",
		},
		{
			Name: "father",
			Type: "tuple", // 如果 type=="tuple",Components 定义的就是 struct 成员类型。
			Components: []abi.ArgumentMarshaling{
				{
					Name: "name",
					Type: "string",
				},
				{
					Name: "address",
					Type: "address",
				},
			},
		},
		{
			Name: "contact",
			Type: "tuple[]", // 如果 type=="tuple[]",Components 定义的就是数组元素的类型。
			Components: []abi.ArgumentMarshaling{
				{
					Name: "name",
					Type: "string",
				},
				{
					Name: "address",
					Type: "address",
				},
			},
		},
	})

	args = abi.Arguments{
		abi.Argument{
			Name: "person",
			Type: personType,
		},
	}
)

func TestAbi_encodeNestStruct(t *testing.T) {
	alice := &Person{
		Name:    "alice",
		Address: common.HexToAddress("0x0001"),
	}
	bob := &Person{
		Name:    "bob",
		Address: common.HexToAddress("0x0002"),
		Father:  &Person{},
		Contact: []*Person{
			alice,
		},
	}
	packed, err := args.Pack(&bob)
	if err != nil {
		t.Fatalf("pack err: %v", err)
	}
	t.Log("abi encoded", hexutil.Encode(packed))
}

```
