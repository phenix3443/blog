---
title: "使用 geth and solc 开发以太坊合约"
description: develop contract with geth and solc
date: 2022-05-11T21:49:51+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
  - solidity
tags:
  - geth
  - contract
---

## 编码

```solidity
// SPDX-License-Identifier: SimPL-3.0
pragma solidity ^0.8.9;

contract HelloWorld{
    function SayHello() public pure returns(string memory) {
        return "Hello World";
    }
}
```

## Geth

直接基于 JavaScript console 编写代码，比较低效，不推荐。

## 编译

[solidity](https://github.com/ethereum/solidity) ，安装`brew install solidity`。

## hardhat
