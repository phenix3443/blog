---
title: "Pull Docker Image"
description: 国内拉取 docker 镜像解决办法
slug: pull-docker-image
date: 2023-06-17T12:51:09+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - docker
tags:
  - images
  - proxy
  - registry
---

## 概述

国内拉取 ghcr/gcr/dockerhub/k8s 等的镜像比较困难，有几种方法可以尝试：

## 镜像加速

[docker proxy](https://dockerproxy.com/)提供多平台容器镜像代理服务,支持 Docker Hub, GitHub, Google, k8s, Quay 等镜像仓库。有两种[使用方法](https://dockerproxy.com/docs)：

- 修改 daemon.json 中的配置。缺点是只能支持 dockerHub。
- 替换 image 地址前缀。缺点是有些使用场景（一些自动化脚本）并不能进行如此修改。

总体来说，这种方法适合场景：

- 临时命令行 pull image。
- 只使用 dockerHub

## 配置 docker daemon

另外一种方法就是通过 systemd 为 docker damon 配置代理。[官方说明](https://docs.docker.com/config/daemon/systemd/#httphttps-proxy)。

```shell
sudo mkdir /etc/systemd/system/docker.service.d
sudo vim /etc/systemd/system/docker.service.d/http-proxy.conf
```

http-proxy.conf 内容：

```shell
[Service]
Environment="HTTP_PROXY=http://proxy.example.com:3128"
Environment="HTTPS_PROXY=https://proxy.example.com:3129"
Environment="NO_PROXY=localhost,127.0.0.1"
```

重启服务：

```shell
sudo systemctl daemon-reload
sudo systemctl restart docker
```

确认修改：

```shell
sudo systemctl show --property=Environment docker
```

`Environment=HTTP_PROXY=http://proxy.example.com:3128 HTTPS_PROXY=https://proxy.example.com:3129 NO_PROXY=localhost,127.0.0.1`

containerd 也可以用同样的方法。
