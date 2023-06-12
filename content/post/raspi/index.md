---
title: "Raspi"
description: 树莓派使用
slug: raspi
date: 2023-06-12T21:41:26+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - raspi
tags:
  - raspi
---

## 概述

## 无线网络

安装无线网络工具：`sudo apt install iw`

查看无线网卡信息： `iw dev`

启动无线网卡：`sudo ip link set wlan0 up`

查询状态，当前是否有链接：`iw dev wlan0 link`

扫描无线网络： `sudo iw dev wlan0 scan | less`

连接网络：

## 参考

- [WiFi connection from the command line in Linux](https://devpress.csdn.net/linux/62fa3bb37e6682346618e0af.html)
