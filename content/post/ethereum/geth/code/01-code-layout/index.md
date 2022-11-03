---
title: "geth 代码布局"
description: source code layout
date: 2022-05-10T23:19:15+08:00
image: code-analsis.webp
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
    - geth
---

## layout

go-ethereum项目的组织结构基本上是按照功能模块划分的目录：

```shell
$ tree -L 2 -d
.
├── accounts  # 实现了一个高等级以太坊账户管理。
│   ├── abi
│   ├── external
│   ├── keystore
│   ├── scwallet
│   └── usbwallet
├── build  # 主要是编译和构建的一些脚本和配置。
│   └── deb
├── cmd  # 命令行工具。
│   ├── abidump # 解析给定的ABI数据并尝试从fourbyte数据库进行解释。
│   ├── abigen # 源代码生成器，用于将以太坊合约定义转换为易于使用、编译时类型安全的 Go package。如果合约字节码也可用，它可以在具有扩展功能的普通以太坊合约 ABI 上运行。 但是，它也接受 Solidity 源文件，使开发更加精简。
│   ├── bootnode # 以太坊客户端实现的精简版本，它只参与网络节点发现协议，但不运行任何更高级别的应用程序协议。 它可以用作轻量级引导节点，以帮助在专用网络中找到对等点。
│   ├── checkpoint-admin # 用于更新 checkpoint oracle 状态的工具。它提供了一系列功能，包括部署检查点oracle契约、签署新的检查点以及更新检查点oracle契约中的检查点。
│   ├── clef # 独立的签名工具，可以作为geth的签名后端。
│   ├── devp2p # 与网络层上的节点交互的实用程序，无需运行完整的区块链。
│   ├── ethkey # 用于处理以太坊秘钥文件的简单命令行工具。
│   ├── evm # EVM（以太坊虚拟机）的开发者实用程序版本，能够在可配置的环境和执行模式中运行字节码片段。 其目的是允许对 EVM 操作码进行隔离、细粒度的调试（例如 evm --code 60ff60ff --debug run）。
│   ├── faucet
│   ├── geth # 以太坊命令客户端，最重要的工具。
│   ├── p2psim # 用来模拟 HTTP API 的工具。
│   ├── puppeth # 创建新的以太坊网络的 CLI 向导。
│   ├── rlpdump # 开发人员实用工具，用于将二进制 RLP dumps（以太坊协议在网络和共识方面使用的数据编码）转换为用户友好的分层表示（例如 rlpdump --hex CE0183FFFFFFC4C304050583616263）。
│   └── utils # cmd 下面公共代码。
├── common
├── consensus # 以太坊共识算法。
├── console
├── contracts
├── core  # 以太坊核心数据结构和算法，block、state、vm 等。
├── crypto
├── docs
├── eth # 以太坊协议实现。
├── ethclient
├── ethdb # eth的数据库，包括实际使用的 leveldb 和供测试使用的 memorydb。
│   ├── dbtest
│   ├── leveldb
│   └── memorydb
├── ethstats # 网络状态的报告。
├── event # 处理实时事件。
├── graphql # 针对 Graph（图状数据）进行查询查询语言。
├── internal
│   ├── build
│   ├── cmdtest
│   ├── debug
│   ├── ethapi
│   ├── flags
│   ├── guide
│   ├── jsre
│   ├── shutdowncheck
│   ├── syncx
│   ├── testlog
│   ├── utesting
│   └── web3ext
├── les # 实现以太坊轻量协议子集。
│   ├── catalyst
│   ├── checkpointoracle
│   ├── downloader
│   ├── fetcher
│   ├── flowcontrol
│   ├── utils
│   └── vflux
├── light # 实现以太坊轻量级客户端按需检索的功能。
├── log # 提供人机友好的日志信息。
├── metrics # 统计数据。
│   ├── exp
│   ├── influxdb
│   ├── librato
│   └── prometheus
├── miner # 矿工相关，挖块和出块。
├── mobile # 移动断相关。
├── node # 以太坊多种类型的节点。
├── p2p
├── params
├── rlp
├── rpc
├── signer
├── swarm
├── tests
└── trie
```

## compile

可以通过`makefile`进行 build：

build geth:`make geth`,

或者 build 所有实用程序`make all`。

## install

`build/ci.go`可被项目 CI Scripts 进行调用，也可以用来编译`cmd/`下面的程序并将其安装到`build/bin`目录， 比如`go run build/ci.go install cmd/abigen`。
