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

之前[在树莓派集群上部署了 k8s]({{< ref "../k8s-on-raspi" >}})，发现运行 control-panel 的节点在没有任何任务的情况下，负载也经常到 9-13，已经无法正常 SSH 登录，所以决定使用 k3s 来部署 kubernetes 集群。

当前 k3s 版本：`v1.26.5+k3s1 (7cefebea)`。

## 系统架构

整体架构使用[带有嵌入式数据库的单服务器](https://docs.k3s.io/zh/architecture#%E5%B8%A6%E6%9C%89%E5%B5%8C%E5%85%A5%E5%BC%8F%E6%95%B0%E6%8D%AE%E5%BA%93%E7%9A%84%E5%8D%95%E6%9C%8D%E5%8A%A1%E5%99%A8%E8%AE%BE%E7%BD%AE)形式。

![带有嵌入式数据库的单服务器](https://docs.k3s.io/zh/img/k3s-architecture-single-server-dark.svg)

## 部署准备

- 根据[安装要求](https://docs.k3s.io/zh/installation/requirements)检查准备工作。
- [树莓派注意事项](https://docs.k3s.io/zh/advanced#raspberry-pi)。

### 网络拓扑

使用[家中闲置树莓派 4B]({{< ref "../raspi" >}})来搭建整个集群。

| hostname | role   |
| -------- | ------ |
| rb1      | server |
| rb2      | agent  |
| rb3      | agent  |

### 软件支持

#### vxlan

k3s 默认使用 [Flannel VXLAN](https://docs.k3s.io/zh/installation/requirements#%E7%BD%91%E7%BB%9C)管理集群网络，从 Ubuntu 21.10 开始，对 Raspberry Pi 的 vxlan 支持已移至单独的内核模块中。

```shell
sudo apt update && sudo apt upgrade -y
sudo apt install -y linux-modules-extra-raspi
```

## 部署

### 安装 server

参考 [快速入门指南](https://docs.k3s.io/zh/quick-start) 进行部署。

使用[配置文件](https://docs.k3s.io/zh/installation/configuration#%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)控制安装：

{{< gist phenix3443 4768186a97f4db5e3d89e73e18872631 >}}

- 任何账户执行官方脚本安装的 kubectl 默认的 kubeconfig 都是 `/etc/rancher/k3s/k3s.yaml`，而不是 `~/.kube/config`，所以这里最好设置 `write-kubeconfig-mode: 644`。
- 由于 traefik 在处理 HTTPS backend service 方面不方便，使用 nginx-ingress 替代。

```shell
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -
```

### 设置 kubeconfig

为当前用户设置 kubeconfig，这个配置虽然不会被 k3s 安装的 kubectl 用到，但是下面的 helm 会用到。

```shell
mkdir -p $HOME/.kube
sudo cp -i /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### 安装 helm

{{< gist phenix3443 9122aa42bd7e012f667234d3d5042bf2 >}}

关于 helm 参与[使用 helm 管理 kubernetes 应用]({{< ref "../helm" >}})

### 部署 ingress-nginx

#### 设置代理

[nginx-ingress](https://kubernetes.github.io/ingress-nginx/) 启动的 pods 需要从国内无法访问的 `registry.k8s.io` 拉取镜像，给 containerd 临时配置[配置 HTTP 代理](https://docs.k3s.io/zh/advanced#%E9%85%8D%E7%BD%AE-http-%E4%BB%A3%E7%90%86) 可以解决该问题。

```shell
# cat /etc/systemd/system/k3s.service.env
CONTAINERD_HTTP_PROXY=http://clash:7890
CONTAINERD_HTTPS_PROXY=http://clash:7890
CONTAINERD_NO_PROXY=127.0.0.0/8,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16
```

重新启动 k3s 服务：

```shell
sudo systemctl restart k3s
```

#### 安装 ingress-nginx

按照[官方文档](https://kubernetes.github.io/ingress-nginx/deploy/)安装，这里我们选择使用 helm 安装。

```shell
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
```

确认部署结果：

{{< gist phenix3443 2404bdd045dfad3b2614cbd9db38d25c >}}

#### 删除代理

如果之前给 containerd 安装了代理，最好删掉，避免影响服务。

```shell
sudo rm /etc/systemd/system/k3s.service.env
sudo systemctl restart k3s
```

### 注意事项

- [rootless 模式运行 server](https://docs.k3s.io/zh/advanced#%E4%BD%BF%E7%94%A8-rootless-%E6%A8%A1%E5%BC%8F%E8%BF%90%E8%A1%8C-server%E5%AE%9E%E9%AA%8C%E6%80%A7) 比较复杂，不建议使用。

### 运行状态

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

## Next

- [kubernetes-dashboard 管理集群]({{< ref "../k8s-dashboard" >}})。默认情况下 k3s 不会部署 Dashboard，可以安装来管理集群。
