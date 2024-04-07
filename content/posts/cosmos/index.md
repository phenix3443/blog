---
title: Cosmos
description:
slug: cosmos
date: 2023-12-28T17:16:13+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: []
tags: []
images: []
---

## 概述

Cosmos 是一个独立并行区块链的去中心化网络。每个区块链都由 Tendermint 共识这样的 BFT 共识算法构建。

在 Cosmos 之前，区块链是孤立的、无法相互通信。同时很难建立这样的网络，并且只能处理每秒少量的交易。

## 架构

## 技术

## 生态

## 教程

1. 初始化链：

    ```shell
    ./build/simd init  mychain --chain-id my-test-chain --home local 
    ```

2. 生成测试账号：

    ```shell
    ./build/simd keys add my_validator --keyring-backend test --home ./local
    ```

    ```html
    - address: cosmos1u3jlve9esd8du4x5tn2eyzac2fhzc2hakngt7k

    name: my_validator
    pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"Aw9PoXRI6QxlXWfupoh56HoVs8JktKYKYAhzisl8Q0QD"}'
    type: local

    ```

3. 添加 genesis 账号

    ```shell
    ./build/simd genesis add-genesis-account cosmos1u3jlve9esd8du4x5tn2eyzac2fhzc2hakngt7k 100000000000stake --home local
    ```

4. 称为 validator 节点：

```shell
    # Create a gentx.

./build/simd genesis gentx my_validator 100000000stake --chain-id my-test-chain --keyring-backend test --home local

# Add the gentx to the genesis file

./build/simd genesis collect-gentxs --home local
```

5. 启动节点

```shell
./build/simd start --home local
```

6. 导出私钥

```shell
./build/simd keys export my_validator --unarmored-hex --unsafe --keyring-backend test --home local
```

7. greenfield-cmd 导入私钥

```shell
./build/gnfd-cmd --home ./tutorial  --passwordfile tutorial/password.txt account import tutorial/key.txt
```
