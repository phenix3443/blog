---
title: "hive 实践"
description: hive 踩坑记录
slug: hive-practices
date: 2022-12-07T10:31:21+08:00
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

之前的系列文章将 hive 做了一个比较全面的介绍：

- [使用和原理]({{< ref "../overview">}})
- [如何编写 simulation]({{< ref "../simulator">}})
- [如何编写 client]({{< ref "../client" >}})

这篇文章主要介绍 hive 使用过程中遇到的一些坑。

## EnodeURL

`hivesim.Client.EnodeURL()` 需要 `enode.sh` 文件以及 curl 工具，如果 simulator 代码中用到了这个功能，需要再 Dockerfile 中添加如下配置：

```shell
RUN apk add --update bash curl jq

# Inject the enode id retriever script
RUN mkdir /hive-bin
ADD enode.sh /hive-bin/enode.sh
RUN chmod +x /hive-bin/enode.sh
```

## testnet

hive 本身设计是针对单个 ethereum client 的测试，这种情况下单个 test case 一般只有三个角色以及对应的容器：

- hiveproxy
- ethereum client
- simulator

测试用例主要通过与 ethereum client 进行交互完成测试。

但是有些情况下，我们的测试需要再一个测试网络下面运行，test case 也不是针对单个 client，而是针对整个测试网络的行为，比如 merge 后的 ethereum，如何构建这样的测试网络以及组织测试用例是一个新的问题，实践过程中有两种思路。

### clientTestSpec

通过 clientTestSpec 进行 ‘套娃’ 的方式逐层搭建网络，示例 [simulators/ethereum/devp2p](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/simulators/devp2p/main.go#L60)

### TestSpec

自定义并启动 testnet，将其作为测试用例的运行参数 [simulators/optimism/l1ops](https://github.com/ethereum-optimism/hive/blob/cd83eca0374d25e8c1ac515e602320670140f240/simulators/optimism/l1ops/main.go#L50)
