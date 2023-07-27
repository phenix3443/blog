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

{{< gist phenix3443 94c598c1a80738ab343bb98a1669bf82 >}}

- 为了节省磁盘空间只开启 2 个 replica 。
- 需要集群外访问可以开启 ingress。

## 实践

将 longhorn 作为 mysql 的持久存储：

{{< gist phenix3443 d0e1ef1adefd08c404880efba93b5401 >}}

如果 mysql 反复重启，可以尝试增加了几个 probe 的 initDelay 来解决。

{{< gist phenix3443 7924a5991a8fad601854fb3766dfeeb9 >}}

可以根据提示来来创建客户端，连接 mysql 数据库。

## Next

- [通过 prometheus 监控集群状态]({{< ref "../prometheus" >}})
