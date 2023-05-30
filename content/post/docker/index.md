---
title: "Docker Pieces"
description: docker 拾遗
slug: docker
date: 2023-01-11T11:58:33+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - docker
tags:
---

## 概述

[官方文档](https://docs.docker.com/) 不管是入门示例还是 reference 都很详细。

## Docker Daemon

- [修改镜像默认存储位置](https://cloud.tencent.com/developer/article/1835999)
- [如何配置 docker 通过代理服务器拉取镜像](https://www.lfhacks.com/tech/pull-docker-images-behind-proxy/)

## Docker Client

## Docker Desktop

[Docker Desktop](https://docs.docker.com/desktop/) 是各平台上 docker gui clients 的相关介绍。其中 [mac faqs](https://docs.docker.com/desktop/faqs/macfaqs/) 中有很多值得看的信息。

## 镜像加速器

修改配置文件可以参考[how to change settings](https://docs.docker.com/desktop/settings/mac/)。

```json
{
  "registry-mirrors": ["https://dockerproxy.com"]
}
```

推荐使用[docker proxy](https://dockerproxy.com/)，支持多个 registry，中科大、阿里等的镜像源都有限制。

重启 docker daemon:

```shell
systemctl daemon-reload
systemctl restart docker
```

验证是否成功：`docker info`，出现 `Registry Mirrors` 字段。

```html
Registry Mirrors: https://dockerproxy.com/
```
