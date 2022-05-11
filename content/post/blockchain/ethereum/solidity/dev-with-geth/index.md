---
title: "使用 geth and solc 开发以太坊合约"
description:  develop contract with geth and solc
date: 2022-05-11T21:49:51+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: true
categories:
    - 区块链
tags:
    - geth
    - solc
    - ethereum
    - solidity
    - contract
---

## 编码

``` solidity
// SPDX-License-Identifier: SimPL-3.0
pragma solidity ^0.8.9;

contract HelloWworld{
    function SayHello() public pure returns(string memory) {
        return "Hello World";
    }
}
```

## Geth

直接基于 JavaScript console 编写代码，比较低效，不推荐。

## 编译

[solidity](https://github.com/ethereum/solidity) ，安装 `brew install solidity`。

## hardhat

### nvm

使用 [nvm](https://github.com/nvm-sh/nvm) 管理 nodejs。

``` shell
nvm install v16.15.0
nvm use v16.15.0
nvm ls
```

### npm

```shell
npm config set registry https://registry.npm.taobao.org
```
