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

注意安装过程中需要用到 root 权限的，不要使用`sudo`，而使用 `sudo su` 切换到 root 用户执行。

## 安装 kubeadm

### 准备开始

- 三台 raspi 4B 8G，安装 ubuntu 22.04 LTS。
- 关闭 swap，在 /etc/fstab 中注释掉 `swapfile` 这一行（系统并未开启）。

## 安装运行时

关于[容器运行时的对比](https://www.zhangjiee.com/blog/2021/container-runtime.html)，两台安装 containerd，一台安装 cri-o。

### 转发 IPv4 并让 iptables 看到桥接流量

- [官方指南](https://kubernetes.io/zh-cn/docs/setup/production-environment/container-runtimes/#%E8%BD%AC%E5%8F%91-ipv4-%E5%B9%B6%E8%AE%A9-iptables-%E7%9C%8B%E5%88%B0%E6%A1%A5%E6%8E%A5%E6%B5%81%E9%87%8F)

### cgroup 驱动

需要确保 kubelet 与将来使用的运行时的 cgroup 都使用 systemd 驱动。

当前 kubelet(v1.27.3) 默认驱动已经是 cgroup。

### containerd

按照[官方说明](https://github.com/containerd/containerd/blob/main/docs/getting-started.md#option-2-from-apt-get-or-dnf)通过 docker 进行安装。

生成默认配置文件：

```shell
containerd config default > /etc/containerd/config.toml
```

做如下修改：

#### 配置 systemd cgroup 驱动

```conf
[plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options]
  SystemdCgroup = true
```

由于是从软件包（例如，RPM 或者 .deb）中安装 containerd，你可能会发现其中默认禁止了 CRI 集成插件。你需要启用 CRI 支持才能在 Kubernetes 集群中使用 containerd。 要确保 cri 没有出现在配置文件中 disabled_plugins 列表内。

#### 重载沙箱（pause）镜像

```conf
[plugins."io.containerd.grpc.v1.cri"]
  sandbox_image = "registry.aliyuncs.com/google_containers/pause:3.9"
```

注意：通过`kubeadm config images list` 可以看到当前 kubeadm 使用的 `registry.k8s.io/pause` 是 3.9，所以这里也应使用该版本。

配置文件修改以后需要重启 containerd，`systemctl restart containerd`

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

#### 重载 crio 沙箱（pause）镜像

```conf
# /etc/crio/crio.conf
[crio.image]
pause_image="registry.k8s.io/pause:3.9"
```

启动 service

```shell
systemctl enable crio && systemctl start crio
```

### docker

`docker info`：

{{< gist phenix3443 06b7030ae49c93a2c5c8dfa03a7a09a6 >}}

Docker Engine 没有实现 CRI， 而这是容器运行时在 Kubernetes 中工作所需要的。 为此，必须安装一个额外的服务 cri-dockerd。

```shell
git clone https://github.com/Mirantis/cri-dockerd.git
cd cri-dockerd
make cri-dockerd
sudo su
install -o root -g root -m 0755 cri-dockerd /usr/local/bin/cri-dockerd
install packaging/systemd/* /etc/systemd/system
sed -i -e 's,/usr/bin/cri-dockerd,/usr/local/bin/cri-dockerd,' /etc/systemd/system/cri-docker.service
systemctl daemon-reload
systemctl enable cri-docker.service
systemctl enable --now cri-docker.socket
```

## 安装 kubeadm、kubelet 和 kubectl

需要 apt 配置代理才能从 `packages.cloud.google.com` 安装。

## 配置 cgroup 驱动程序

## 创建集群

### 初始化控制平面节点

```shell
sudo su
kubeadm init --apiserver-advertise-address=192.168.122.12 --pod-network-cidr=192.168.0.0/16 --cri-socket=unix:///var/run/containerd/containerd.sock --image-repository registry.aliyuncs.com/google_containers
kubeadm init --apiserver-advertise-address=10.170.0.7 --pod-network-cidr=192.168.0.0/16 --cri-socket=unix:///var/run/containerd/containerd.sock --image-repository registry.aliyuncs.com/google_containers
```

- `apiserver-advertise-address：kubeadm` 使用 eth0 的默认网络接口（通常是内网 IP）做为 Master 节点的 advertise address ，如果我们想使用不同的网络接口，可以使用 `--apiserver-advertise-address` 参数来设置
- `pod-network-cidr：pod-network-cidr`: 指定 pod 网络的 IP 地址范围，它取决于你在下一步选择的哪个网络网络插件，比如我在本文中使用的是 Calico 网络，指定为 192.168.0.0/16。

成功后显示结果如下：

{{< gist phenix3443 da397677e15eeefac2467fb72bd9cc8d >}}

#### 普通用户

根据提示，使用普通账号执行如下命令：

```shell
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

#### 安装网络

根据[指南](https://docs.tigera.io/calico/latest/getting-started/kubernetes/quickstart)安装 calico 网络创建。

#### init 失败处理

- 切换至 root 权限：`sudo su`
- 执行重置命令：`kubeadm reset -f  --cri-socket=unix:///var/run/containerd/containerd.sock`
- 删除所有相关数据:

  ```shell
  rm -rf /etc/cni /etc/kubernetes /var/lib/dockershim /var/lib/etcd /var/lib/kubelet /var/run/kubernetes ~/.kube/\*
  ```

- 刷新所有防火墙(iptables)规则

```shell
iptables -F && iptables -X
iptables -t nat -F && iptables -t nat -X
iptables -t raw -F && iptables -t raw -X
iptables -t mangle -F && iptables -t mangle -X
```

## 加入数据节点

```shell
kubeadm join 192.168.122.12:6443 --token i4rla7.y2gsmo510tmwp56v \
 --discovery-token-ca-cert-hash sha256:3685a037eac2789e52d80b47cfda26645fc111a852769af294ebeaf5490e2352
```
