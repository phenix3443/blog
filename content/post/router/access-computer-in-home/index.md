---
title: "Access Computer in Home"
description:
date: 2023-01-26T00:10:13+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
tags:
  - router
  - ddns
  - gpon
---

## 概述

### 网络环境

- 中兴 ZXHN F650 千兆光猫
- amplifi HD 家用路由器

## 如果有公网 IP

### 公网 IP

可以通过外部网站（[ipw](https://ipw.cn/)）查看自己的 IP 地址信息：

### DDNS

通过 DDNS 自动更新阿里云域名绑定，推荐使用 docker 镜像： [newfuture/ddns](https://hub.docker.com/r/newfuture/ddns)

### 端口映射

#### 桥接模式

#### 静态路由

## 没有公网 IP

### 穿透

异次元介绍了[几种穿透方法](https://www.iplaysoft.com/tag/%E7%A9%BF%E9%80%8F)
