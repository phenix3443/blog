---
title: "Taiko Debug Environment"
description: Taiko 源码调试环境
slug: taiko-debug-env
date: 2023-08-29T16:11:52+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series:
  - taiko 源码解析
categories: [ethereum]
tags: [taiko, vscode]
images: []
---

本文介绍如何基于 vscode 搭建 Taiko-client 源码开发调试环境，其中的使用技巧也可用于 Golang/Solidity 调试环境的搭建。

<!--more-->

## 概述

## Task

使用 [vscode tasks](https://code.visualstudio.com/docs/editor/tasks) 封装常用的任务，例如 Build/StartTestNet：

- 将任务的执行单独封装在脚本中，不需要在额外的设置环境变量。

{{< gist phenix3443 6439bb0f74566116d6e30b6a8db7af7b >}}

```shell
docker compose -f integration_test/nodes/docker-compose.yml logs -f l1_node

docker compose -f integration_test/nodes/docker-compose.yml logs -f l2_execution_engine
```

## Debug

使用 [vscode debugging](https://code.visualstudio.com/docs/editor/debugging) 调试 taiko-client:

- 可以在运行的时候给程序添加断点，随时暂停程序，查看变量信息。

{{< gist phenix3443 fa13456469c45aa8e9ddf210602c7dfe >}}

## Next

已经搭建好了调试环境，让我们一步步的看下 taiko 程序的执行。

## taiko-mono

```shell
pnpm install
```

# 功能特点

- 一键启动调试。
- 调试后自动清理现场。

## vscode 扩展

## 调试

基于 vscode 提供的 [Debugging](https://code.visualstudio.com/docs/editor/debugging) 和 [Task](https://code.visualstudio.com/docs/editor/tasks) 功能定制，启动调试只需要两步：

1. 启动 L2 执行层节点：

   ![Start L2](images/start-L2.png)

2. 启动 Taiko 客户端

   ![Start Taiko Client](images/start-L2.png)
