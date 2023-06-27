---
title: "k3s on raspi"
description: 在树莓派上部署 k3s
slug: k3s-on-raspi
date: 2023-06-22T16:58:28+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - kubernetes
tags:
  - raspi
  - k3s
  - ubuntu
---

## 概述

之前 [部署 k8s]({{< ref "../k8s-on-raspi" >}}) control-panel 的 raspi4B 没有任何任务的情况下，单机负载经常到 9-13，都无法正常 SSH 登录，所以决定还是切换到 k3s 来使用 kubernetes 部署家庭服务。

当前 k3s 版本：`v1.26.5+k3s1 (7cefebea)`。

## 准备工作

### vxlan

当前树莓派环境参见[家中的树莓派 4B]({{< ref "../raspi" >}})。

k3s 默认使用 [Flannel VXLAN](https://docs.k3s.io/zh/installation/requirements#%E7%BD%91%E7%BB%9C)，但当前操作系统(ubuntu 22.04 LTS) 不支持，需要进行安装，参见[GitHub 上的相关讨论](https://github.com/k3s-io/k3s/issues/4234)。

```shell
sudo apt update && sudo apt upgrade -y
sudo apt install -y linux-modules-extra-raspi
```

### 系统架构

| hostname | role   |
| -------- | ------ |
| rb1      | server |
| rb2      | agent  |
| rb3      | agent  |

## 部署 sever

按照[快速入门指南](https://docs.k3s.io/zh/quick-start) 进行部署。

使用 nginx-ingress 替代 traefik。

```shell
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn INSTALL_K3S_EXEC="--disable traefik" sh  -
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.0/deploy/static/provider/cloud/deploy.yaml
```

确认 k3s 服务运行状态 `systemctl status k3s`

查看 k3s 服务启动日志 `journalctl -u k3s`，下面的日志中列出了一些需要关注的信息，比如：

- apiserver/scheduler/controller-manager 启动选项(L11-L17)
- server node token 的位置(L19)
- server node 与 agent node 加入的方法(L20-L22)
- kubeconfig 位置(L23)
- PodCIDRs 范围(L48)

{{< gist phenix3443 cd9be018d3b26bcc32f2010cf26639e5 >}}

## 部署 agent

按照[快速入门指南](https://docs.k3s.io/zh/quick-start) 进行部署。

```shell
sudo cat  /var/lib/rancher/k3s/server/node-token

curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=https://192.168.122.11:6443 K3S_TOKEN=xxxxxx sh -
```

## dashboard

默认情况下不会部署 Dashboard。安装配置参见 [k8s-dashboard]({{< ref "../k8s-dashboard" >}})
