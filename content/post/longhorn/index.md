---
title: "longhorn"
description:
slug: longhorn
date: 2023-07-07T15:58:05+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - kubernetes
  - distribute-storage
tags:
  - longhorn
---

## 概述

如何将所有工作节点上磁盘在 kubernetes 池化使用？分布式块存储系统[longhorn](https://longhorn.io/docs/1.4.2/what-is-longhorn/)提供一种解决方案。

## 安装

按照[官方指南](https://longhorn.io/docs/1.4.2/deploy/install/install-with-helm/) 可以很顺利的进行安装。

因为要集群外部访问，定义 ingress：

{{< gist phenix3443 4e60d32e1df2aa10a93d10efb99969a9 >}}

## 配置
