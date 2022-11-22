---
title: "hive clients"
description: hive client 介绍
slug: ethereum-hive-clients
date: 2022-11-22T15:48:26+08:00
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

## 引言[^1]

本文解释了客户端容器如何在 Hive 中工作。

客户端是可以通过 simulation 实例化的 docker 镜像。客户端定义由 Dockerfile 和相关资源组成。客户端定义位于 hive 存储库中 `clients/` 的子​​目录中。

当 hive 运行 simulation 时，它首先使用它们的 Dockerfile 构建所有客户端 docker 镜像，也就是在客户端目录中运行`docker build .` 。由于大多数客户端定义包装现有的 Ethereum 客户端，并且从源构建客户端可能需要很长时间，因此通常最好将 hive 客户端基于来自 Docker Hub 的预构建 docker 映像包装。

客户端 Dockerfile 应该支持一个名为`branch`的可选参数，它指定请求的客户端版本。用户可以通过将此参数附加到客户端名称来设置此参数，例如：

`./hive --sim my-simulation --client go-ethereum_v1.9.23,go_ethereum_v1.9.22`

有关客户端 Dockerfile 的示例，请参阅 [go-ethereum client definition](https://github.com/ethereum/hive/blob/master/clients/go-ethereum/Dockerfile)。

## hive.yaml

Hive 从客户端目录的 hive.yaml 文件中读取额外的元数据。目前，此文件的唯一目的是指定客户端的角色列表：

```yaml
roles:
  - "eth1"
  - "eth1_light_client"
```

角色列表可供 simulator使用，可用于根据功能区分客户端。声明客户端角色还表明客户端支持某些特定于角色的环境变量和文件。如果 `hive.yml` 缺失或未声明角色，则假定为 `eth1 角色。

## /version.txt

客户端 Dockerfiles 应该在构建期间生成一个 `/version.txt` 文件。 Hive 在构建容器后读取此文件，并将版本信息附加到启动客户端的所有测试套件的输出。

## /hive-bin

放置在客户端容器`/hive-bin`目录下的可执行文件可以通过 simulation  API 调用。

## Client Lifecycle

当 simulation 请求客户端实例时，hive 从客户端映像创建一个 docker 容器。 simulator 可以通过传递带有前缀 `HIVE_` 的环境变量来自定义容器。它还可以在启动前将文件上传到容器中。创建容器后，hive 只需运行 `Dockerfile` 中定义的入口点。

对于所有客户端容器，hive 在考虑客户端准备好供 simulator使用之前等待 TCP 端口 8545 打开。此端口可通过 `HIVE_CHECK_LIVE_PORT` 变量进行配置，并且可以通过将其设置为 0 来禁用检查。如果客户端容器在特定超时时间内未打开此端口，则 Hive 假定客户端启动失败。

入口点解析的环境变量和文件定义了 simulator 和客户端之间的“协议”。虽然 Hive 本身不需要支持任何特定的变量或文件，但 simulator通常希望客户端容器能够以某些方式进行配置。例如，为了针对多个以太坊客户端运行测试， simulator 需要能够将所有客户端配置为特定区块链，并让它们加入用于测试的 P2P 网络。

## Eth1 Client Requirements

参见官方原文。

[^1]: [hive clients](https://github.com/ethereum/hive/blob/master/docs/clients.md)
