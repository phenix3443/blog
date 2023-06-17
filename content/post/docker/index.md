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

- [官方文档](https://docs.docker.com/) 不管是入门示例还是 reference 都很详细。

- [Install on ubuntu](https://docs.docker.com/engine/install/ubuntu/)

## Daemon

- [docker daemon configuration](https://docs.docker.com/config/daemon/)
- [docker daemon configure options](https://docs.docker.com/engine/reference/commandline/dockerd/#daemon-configuration-file)

`sudo vim /etc/docker/daemon.json`：

{{< gist phenix3443 956568e70d423973144e6a55a1477f32 >}}

- data-root：默认存储位置

重启 docker daemon:

`sudo systemctl daemon-reload && sudo systemctl restart docker`

通过 `docker info`验证配置是否修改成功。

## Client

### Config proxy in container

[Configure Docker container to use a proxy server](https://docs.docker.com/network/proxy/)

## Desktop

[Docker Desktop](https://docs.docker.com/desktop/) 是各平台上 docker gui clients 的相关介绍。其中 [mac faqs](https://docs.docker.com/desktop/faqs/macfaqs/) 中有很多值得看的信息。
