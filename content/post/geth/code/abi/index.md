---
title: "合约应用二进制接口"
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
tag:
    - ethereum
    - hive
    - test
---

## 概述

以太坊合约应用二进制接口 (ABI) 是在以太坊生态系统中与合约交互的标准方式，既可以从区块链外部进行，也可以用于合约间交互。数据根据其类型进行编码。由于编码不是自描述的，因此需要一个说明（也就是 `abi.json`）才能解码。更多参见[合约 ABI 规范](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#basic-design)。

Golang 的 [abi package](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#pkg-overview) 实现了以上规范，通过该 package 不仅可以根据 abi.json 与合约交互，还有对多个参数进行自定义编码。

合约接口相关的操作可通过 [abi.ABI](https://pkg.go.dev/github.com/ethereum/go-ethereum/accounts/abi#ABI) 可用来根据 `abi.json` 编码合约接口。本文主要介绍如何不通过 `abi.json` 文件进行参数的编码解码。

## 参数类型

首先，需要通过 [aib.NewType](https://github.com/ethereum/go-ethereum/blob/v1.10.26/accounts/abi/type.go#L70) 定义参数对应的 abi 类型。

```go
// NewType creates a new reflection type of abi type given in t.
func NewType(t string, internalType string, components []ArgumentMarshaling) (typ Type, err error)
```

+ `t` 是 [abi 接口规范支持的类型](https://docs.soliditylang.org/en/v0.8.13/abi-spec.html#types)，有两个测试用例可以参考：
  + [TestTypeRegexp](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/accounts/abi/type_test.go#L33) 描述了 t 字段的整数书写规范。
  + [TestTypeCheck](https://github.com/ethereum/go-ethereum/blob/c4a662176ec11b9d5718904ccefee753637ab377/accounts/abi/type_test.go#L119) 描述了 t 字段与 golang 类型映射关系。
+ `internalType` 是 solidity 0.5.10 开始引入的一个 abi 字段，具体解释参见[这篇文章](https://ethereum.stackexchange.com/questions/76953/what-is-the-purpose-of-internaltype-now-generated-by-the-solidity-compiler-in)。该字段对于 encode/decode 没有影响，只用于 debug，通常设置为空字符串即可。
+ `components` 用于定义符合字段，常用来定义 struct 的字段或者数组的成员类型。

### 基础类型

```go

var (
    int8Type, _    = abi.NewType("int8", "", nil)
    uint8Type, _   = abi.NewType("uint8", "", nil)
    boolType, _    = abi.NewType("bool", "", nil)
    addressType, _ = abi.NewType("address", "", nil)
    strType, _     = abi.NewType("string", "", nil)
    byte32Type, _  = abi.NewType("bytes", "", nil)
    bytesType      = abi.Type{T: abi.BytesTy}
)
```

### 数组

```go
var (
    int8ArrayType, _ = abi.NewType("int8[3]", "int8", nil)
    strArrayType, _  = abi.NewType("string[]", "string", nil)
)
```

### struct

```go
type Person struct {
    Name    string
    Address common.Address
    Contact []Person // 注意这里不能使用指针，因为 args 定义无法使用指针
}

var (
    personType, _ = abi.NewType("tuple", "", []abi.ArgumentMarshaling{
        // abi.ArgumentMarshaling 对应 struct field，注意顺序要与 struct 字段顺序保持一致
        {
            Name: "name", // 将来会作为 struct json tag
            Type: "string",
        },
        {
            Name: "address",
            Type: "address",
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
)
```

## 编码解码 {#encode-arguments}

```go
import (
    "testing"

    "github.com/ethereum/go-ethereum/accounts/abi"
    "github.com/ethereum/go-ethereum/common"
    "github.com/stretchr/testify/require"
)

// 上面的类型定义
...

var (
    alice = Person{
        Name:    "alice",
        Address: common.HexToAddress("0x0001"),
    }
    bob = Person{
        Name:    "bob",
        Address: common.HexToAddress("0x0002"),
        Contact: []Person{alice},
    }
)

// 测试编码解码
func TestABI(t *testing.T) {
    args := abi.Arguments{
        {
            Name: "name",
            Type: strType,
        },
        {
            Name: "age",
            Type: int8Type,
        },
        {
            Name: "sex",
            Type: bytesType,
        },
        {
            Name: "teachers",
            Type: strArrayType,
        },
        {
            Name: "person",
            Type: personType,
        },
    }

    packed, err := args.Pack("alice", int8(10), []byte("female"), []string{"bob", "john"}, &bob)
    require.Nil(t, err)

    unpacked, err := args.Unpack(packed)
    require.Nil(t, err)

    // 定义与 args 参数对应的结构体
    res := struct {
        Name     string // 注意字段名要与 args 中参数的字段名相匹配，而且需要首字母大写，可导出
        Age      int8
        Sex      []byte
        Teachers []string
        Person   *Person // 注意这里是可以使用指针的，但是要预先声明字段，保留内存空间
    }{
        Person: new(Person),
    }

    err = args.Copy(&res, unpacked)
    require.Nil(t, err)
    require.EqualValues(t, bob, *res.Person)
}
```
