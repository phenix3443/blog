---
title: "Build K8s With Raspi"
description: 用树莓派搭建 k8s 集群
slug: build-k8s-with-raspi
date: 2023-06-17T14:53:53+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - k8s
tags:
  - raspi
  - k8s
  - ubuntu
---

## 概述

按照官方的[使用 kubeadm 引导集群](https://kubernetes.io/zh-cn/docs/setup/production-environment/tools/kubeadm/)进行搭建部署。

## 安装 kubeadm

### 准备开始

- 三台 raspi 4B 8G，安装 ubuntu 22.04 LTS。
- 关闭 swap，在 /etc/fstab 中注释掉 `swapfile` 这一行（系统并未开启）。
- [转发 IPv4 并让 iptables 看到桥接流量](https://kubernetes.io/zh-cn/docs/setup/production-environment/container-runtimes/#%E8%BD%AC%E5%8F%91-ipv4-%E5%B9%B6%E8%AE%A9-iptables-%E7%9C%8B%E5%88%B0%E6%A1%A5%E6%8E%A5%E6%B5%81%E9%87%8F)

## 安装运行时

关于[容器运行时的对比](https://www.zhangjiee.com/blog/2021/container-runtime.html)，两台安装 docker，一台安装 cri-o。

### docker

`docker info`：

{{< gist phenix3443 06b7030ae49c93a2c5c8dfa03a7a09a6 >}}

Docker Engine 没有实现 CRI， 而这是容器运行时在 Kubernetes 中工作所需要的。 为此，必须安装一个额外的服务 cri-dockerd。

```shell
git clone https://github.com/Mirantis/cri-dockerd.git
cd cri-dockerd
make cri-dockerd
sudo install -o root -g root -m 0755 cri-dockerd /usr/local/bin/cri-dockerd
sudo install packaging/systemd/* /etc/systemd/system
sudo sed -i -e 's,/usr/bin/cri-dockerd,/usr/local/bin/cri-dockerd,' /etc/systemd/system/cri-docker.service
sudo systemctl daemon-reload
sudo systemctl enable cri-docker.service
sudo systemctl enable --now cri-docker.socket
```

### cri-o

```shell
sudo su
export VERSION=1.24 OS=xUbuntu_22.04

echo "deb [signed-by=/usr/share/keyrings/libcontainers-archive-keyring.gpg] https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/ /" > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable.list
echo "deb [signed-by=/usr/share/keyrings/libcontainers-crio-archive-keyring.gpg] https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$VERSION/$OS/ /" > /etc/apt/sources.list.d/devel:kubic:libcontainers:stable:cri-o:$VERSION.list

mkdir -p /usr/share/keyrings
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable/$OS/Release.key | gpg --dearmor -o /usr/share/keyrings/libcontainers-archive-keyring.gpg
curl -L https://download.opensuse.org/repositories/devel:/kubic:/libcontainers:/stable:/cri-o:/$VERSION/$OS/Release.key | gpg --dearmor -o /usr/share/keyrings/libcontainers-crio-archive-keyring.gpg

apt-get update
apt-get install cri-o cri-o-runc
```

## 安装 kubeadm、kubelet 和 kubectl

需要 apt 配置代理才能从 packages.cloud.google.com 安装。

## 配置 cgroup 驱动程序

## 创建集群

### 初始化控制平面节点

`sudo kubeadm init --apiserver-advertise-address=192.168.122.12 --pod-network-cidr=192.168.0.0/16`

- `apiserver-advertise-address：kubeadm` 使用 eth0 的默认网络接口（通常是内网 IP）做为 Master 节点的 advertise address ，如果我们想使用不同的网络接口，可以使用 `--apiserver-advertise-address` 参数来设置
- `pod-network-cidr：pod-network-cidr`: 指定 pod 网络的 IP 地址范围，它取决于你在下一步选择的哪个网络网络插件，比如我在本文中使用的是 Calico 网络，指定为 192.168.0.0/16。

## 加入数据节点
