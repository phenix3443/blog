---
title: "BlockScout"
description: 如何搭建自己的区块浏览器
slug: blockscout
date: 2023-03-19T00:56:18+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - explorer
---

## 概述

[Blockscout](https://www.blockscout.com/) 是一个功能全面的[^1]、开源的 EVM 区块浏览器，为以太坊生态系统内外的 100 多个执行层链和测试网提供服务[^2]。

### 合约代码调用分析

[Sol2Uml](https://github.com/blockscout/blockscout-rs/tree/main/visualizer)

### 合约交互

[Interacting with Smart Contracts](https://docs.blockscout.com/for-users/interacting-with-smart-contracts) 描述了合约交互的过程。

### 合约验证

[Verifying a Smart Contract](https://docs.blockscout.com/for-users/verifying-a-smart-contract) 介绍了网页界面操作的细节。

底层是用 Rust 编写的微服务来提供快速高效的合同验证。该应用程序作为 HTTP 服务器运行，并使用 REST API 发出验证请求。[Smart Contract Verification](https://docs.blockscout.com/for-developers/information-and-settings/smart-contract-verification) 这篇文章介绍了实现细节。

## 配置

blockscout 很多功能配置是通过环境变量[^3]来进行控制，所有区块链都必须定义一些环境变量[^4]，除此之外，剩余的配置（比如修改图标什么的）在 [Configuration Options](https://docs.blockscout.com/for-developers/configuration-options) 有说明。

## 本地部署

我们可以使用 docker-compose 在 Docker 容器中本地运行 Blockscout[^5]。

## k8s 部署

[手动部署](https://docs.blockscout.com/for-developers/manual-deployment)

## 参考

[^1]: [Blockscout Features](https://docs.blockscout.com/about/features)
[^2]: [Projects Using Blockscout](https://docs.blockscout.com/about/projects)
[^3]: [ENV Variables](https://docs.blockscout.com/for-developers/information-and-settings/env-variables)
[^4]: [Deployment Differences Between Chains](https://docs.blockscout.com/for-developers/information-and-settings/deployment-differences-between-chains)
[^5]: [Docker Integration](https://github.com/blockscout/blockscout/tree/master/docker-compose)
