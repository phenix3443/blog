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

在 Linux 系统下有两个主要的 WiFi 配置工具：

- wireless tools：主要配置 WEP 加密的 WiFi。现在 iwconfig 等命令已经被 iw 取代，本文中 iw 也部分用于 WiFi 配置。
- wpa_supplicant：它主要配置 WAP 和 WPA2 加密的 WiFi。它被设计成一个在后台运行的守护程序。它可以被看作是两个主要的可执行工具：
  - wpa_supplicant：在后台运行，等同于服务器。
  - wpa_cli：搜索、设置和连接到网络的前端，相当于客户端。

接下来，使用这两个工具，通过命令行配置 Linux 的 WiFi。我们根据要连接的网络的加密模式，选择合适的配置方法。

### 安装程序

`sudo apt install iw`。

### 查看无线网卡信息

`iw dev`

### 查看网卡状态

是否被激活：`iw dev wlan0 link`

如果没有激活，启动无线网卡：`sudo ip link set wlan0 up`

### 扫描附近的无线网络

`sudo iw dev wlan0 scan | grep SSID`

### 连接网络

如果所连接的网络没有加密, 则可以轻松地直接连接`sudo iw dev wlan0 connect <SSID>`

如果网络是用较低级的协议, WEP 加密的, 则也比较容易 `sudo iw dev wlan0 connect <SSID> key 0:<WEP 密钥>`

#### WPA/WPA2 协议

如果网络使用的是 WPA 或者 WPA2 协议, 则稍微复杂

- 安装 wpasupplicant `sudo apt install wpasupplicant`
- 设置配置文件 `sudo vim /etc/wpa_supplicant/config.conf`
- 如果已有该文件, 则备份原有文件, 在新文件中加入如下内容：{{< gist phenix3443 087bc43a46348fae071aec2ae18acdf6 >}}
- 以上述配置文件启动 wpa_supplicant：`sudo wpa_supplicant -i wlan0 -c /etc/wpa_supplicant/config.conf -B`
- 分配 IP: `sudo dhclient wlan0`
- 通过 `iw dev wlan0 info` 查看是否已经链接上 SSID 对应的网络，通过`ip addr show wlan0`查看分配的 IP。

## 参考

- [WiFi connection from the command line in Linux](https://devpress.csdn.net/linux/62fa3bb37e6682346618e0af.html)
- [Ubuntu 通过命令行连接 WIFI](https://developer.aliyun.com/article/704878)
