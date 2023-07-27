---
title: "Ubuntu Locale Settings"
description: Ubuntu 本地化设置
slug: locale
date: 2023-06-15T14:30:18+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ubuntu
tags:
  - locale
  - timezone
---

## timezone

```shell
date -R
tzselect
sudo cp /usr/share/zoneinfo/Asia/Shanghai  /etc/localtime
date -R
```
