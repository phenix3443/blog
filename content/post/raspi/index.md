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
- wpa_supplicant：它主要配置 WAP/WPA2 加密的 WiFi。它被设计成一个在后台运行的守护程序。它可以被看作是两个主要的可执行工具：
  - wpa_supplicant：在后台运行，等同于服务器。
  - wpa_cli：搜索、设置和连接到网络的前端，相当于客户端。

接下来，使用这两个工具，通过命令行配置 Linux 的 WiFi。我们根据要连接的网络的加密模式，选择合适的配置方法。

### 安装程序

`sudo apt install iw`。

### 查看本机无线网卡信息

`iw dev`

一般默认的无线网卡名字为 wlan0。

### 查看网卡状态

是否被激活：`iw dev wlan0 link`

如果没有激活，启动无线网卡：`sudo ip link set wlan0 up`

### 扫描附近的无线网络

`sudo iw dev wlan0 scan | grep SSID`

### 连接无密码/WEP 加密网络

如果所连接的网络没有加密, 则可以轻松地直接连接：

`sudo iw dev wlan0 connect <SSID>`

如果网络是用较低级的协议, WEP 加密的, 则也比较容易：

`sudo iw dev wlan0 connect <SSID> key 0:<WEP 密钥>`

### 连接 WPA/WPA2 加密网络

如果网络使用的是 WPA/WPA2 协议, 就需要使用[wpa_supplicant](https://wiki.archlinuxcn.org/zh-hans/Wpa_supplicant)。过程如下：

- 安装： `sudo apt install wpasupplicant`
- 设置配置文件： `sudo vim /etc/wpa_supplicant/wpa_supplicant-wlan0.conf`，内容如下：

  {{< gist phenix3443 087bc43a46348fae071aec2ae18acdf6 >}}

  - `ctrl_interface` 设置是为了 wpa_cli 链接。
  - `ap_scan=1` 可以开启扫描网络。

  配置文件详见[wpa_supplicant.conf](https://man.archlinux.org/man/wpa_supplicant.conf.5)。

  可以通过 `'killall -HUP wpa_supplicant` 应用修改后的配置文件，或者通过 `wpa_cli reconfigure` 达到同样的效果。

- 通过 [Systemd-networkd](https://wiki.archlinuxcn.org/zh-hans/Systemd-networkd) 启动 wpa_supplicant 还需要编写一个 service 文件：

  `sudo vim /etc/systemd/network/wlan0.network`
  {{< gist phenix3443 64b8a86001f4ce5e1f404845a8e44b9e >}}

  为 wlan0 接口启用 wpa_service：

  `sudo systemctl enable wpa_supplicant@wlan0.service`

  重启 systemd-networkd 和 wpa_supplicant 服务：

  ```shell
  sudo systemctl restart systemd-networkd.service
  sudo systemctl restart wpa_supplicant@wlan0.service
  ```

- 通过命令 `wpa_cli` 添加网络，wpa_cli 使用详见[wpa_cli](https://man.archlinux.org/man/wpa_cli.8)：

  `wpa_cli`启动后会显示一个交互提示符 (`>`)，同时带有 tab 补全及命令描述功能。

  使用 scan 和 scan_results 命令查看可用网络：

  ```shell
  > scan
  > OK
  > <3>CTRL-EVENT-SCAN-RESULTS
  > scan_results
  > ssid / frequency / signal level / flags / ssid
  > 00:00:00:00:00:00 2462 -49 [WPA2-PSK-CCMP][ESS] MYSSID
  > 11:11:11:11:11:11 2437 -64 [WPA2-PSK-CCMP][ESS] ANOTHERSSID
  ```

  要将网络与 MYSSID 进行关联，先添加网络，配置凭证并启用：

  ```shell
  > add_network
  > 0
  > set_network 0 ssid "MYSSID"
  > set_network 0 psk "passphrase"
  > enable_network 0
  > <2>CTRL-EVENT-CONNECTED - Connection to 00:00:00:00:00:00 completed (reauth) [id=0 id_str=]
  ```

  打开配置文件可以看到其中新增了 network 字段，配置文件可以包括一个或多个 network 配置。wpa_supplicant 将根据配置文件中的 network 顺序、网络安全级别（首选 WPA/WPA2）和信号强度自动选择最佳网络。

- 分配 IP: `sudo dhclient wlan0`
- 验证：
  - 通过 `iw dev wlan0 info` 查看是否已经链接上 SSID 对应的网络
  - 通过`ip addr show wlan0`查看分配的 IP。
