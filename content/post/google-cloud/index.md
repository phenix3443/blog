---
title: "Google Cloud"
description:
slug: gcloud
date: 2023-01-12T15:52:07+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
  - gcloud
---

## 概述

## Container Registry

[Container Registry](https://cloud.google.com/container-registry/docs?hl=zh-cn) 是 google 提供的镜像管理服务。

对应的 gcloud 命令行是 `gcloud container`

## Google Cloud SDK

[Cloud SDK](https://cloud.google.com/sdk?hl=zh-cn) 用于与 Google Cloud 产品和服务进行交互的库和工具，支持多种语言。

### gcloud cli

[Google Cloud Client](https://cloud.google.com/sdk/docs?hl=zh-cn) 是用于管理 Google Cloud 上托管资源和应用的命令行工具。

```shell
gcloud GROUP | COMMAND [--account=ACCOUNT]
    [--billing-project=BILLING_PROJECT] [--configuration=CONFIGURATION]
    [--flags-file=YAML_FILE] [--flatten=[KEY,...]] [--format=FORMAT]
    [--help] [--project=PROJECT_ID] [--quiet, -q]
    [--verbosity=VERBOSITY; default="warning"] [--version, -v] [-h]
    [--access-token-file=ACCESS_TOKEN_FILE]
    [--impersonate-service-account=SERVICE_ACCOUNT_EMAILS] [--log-http]
    [--trace-token=TRACE_TOKEN] [--no-user-output-enabled]
```

可以通过 `gcloud cheat-sheet` 查看常见的命令和备忘清单。[参考指南](https://cloud.google.com/sdk/gcloud/reference) 有所有的命令个的详细说明。

常见的子命令：

- gcloud info 列出安装信息以及当前配置。
- gcloud config list 列出当前配置。
- gcloud auth list 列出授权的凭据。
- gcloud help compute ssh 查看子命令帮助信息。
