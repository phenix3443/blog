---
title: "K3s on Raspi"
description:
date: 2023-06-22T16:58:28+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

## 安装

```shell
curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn sh -
```

```shell
mkdir -p $HOME/.kube
sudo cp -i /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

## 加入集群

```shell
sudo cat  /var/lib/rancher/k3s/server/node-token

curl -sfL https://rancher-mirror.rancher.cn/k3s/k3s-install.sh | INSTALL_K3S_MIRROR=cn K3S_URL=https://192.168.122.12:6443 K3S_TOKEN=K1000163dc920b1007d77efdb94c334cb65cae10abe5e927ebdf024c330d203a228::server:e5d486119dbc49f03796283f680a083b sh -
```
