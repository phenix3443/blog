---
title: "Resilio"
description: 使用 Resilio 同步和备份文件
slug: Resilio
date: 2023-06-08T10:42:18+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - cloud
tags:
  - sync
  - resilio
---

## 概述

[Resilio](https://help.resilio.com/hc/en-us/categories/200140177-Get-started-with-Sync)（曾经名为“BitTorrent Sync”）是由 BitTorrent 公司开发的专有的对等网络数据同步工具，可在 Windows、OS X、Linux、Android、iOS 和 FreeBSD 上使用。其可在局域网、互联网上通过安全的、分布式的 P2P 技术在不同设备之间同步文件。

曾经买过该软件的终身授权版本，很划算，安装过程很简单，需要注意的是二次封装 [linuxserver/resilio-sync](https://hub.docker.com/r/linuxserver/resilio-sync) 镜像要比官方镜像更好配置。

{{< gist phenix3443 74bd4acfdfeac30fce4812eb3524a9d0 >}}

## 使用

- 预留好足够的空间。
- 删掉的文件是可以从隐藏目录 `.sync` 找回的。
