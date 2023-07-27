---
title: "apt pieces"
description: 使用 apt 管理软件包
slug: apt
date: 2023-06-17T19:42:07+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ubuntu
tags:
  - apt
---

## 概述

## proxy

通过代理安装软件：`sudo vim /etc/apt/apt.conf.d/proxy.conf`

添加如下内容：

```shell
Acquire::http::Proxy "http://username:password@proxy-server-ip:8181/";
Acquire::https::Proxy "https://username:password@proxy-server-ip:8182/";
```
