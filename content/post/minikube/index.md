---
title: "minikube"
description: 通过 minikube 学习 k8s
slug: minikube
date: 2023-02-21T21:46:10+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - kubernetes
tags:
  - minikube
---

## 概述

为了方便开发和体验 Kubernetes，社区提供了可以在本地部署的开发环境 Minikube。

- [minikube 官方教程](https://minikube.sigs.k8s.io/docs/start/)

```shell
brew install minikube
```

## 基本使用

### 启动集群

由于国内网络原因，无法下载相关的镜像，官方给出了[解决办法](https://minikube.sigs.k8s.io/docs/faq/#i-am-in-china-and-i-encounter-errors-when-trying-to-start-minikube-what-should-i-do)(`minikube start --image-mirror-country='cn'`)不可以用。

![cn image failed](images/cn-failed.png)

需要直接使用代理，可以参考[使用 clash 设置透明代理]({{< ref "../clash" >}})

启动集群

![minikube start](images/start.png)

该命令会在 kubectl 的配置文件(`${HOME}/.kube/config`)中添加 minikube 相关的信息，并将 current-context 设置为 minikube，方便进一步做测试。

![change kubeconfig](images/change-kubeconfig.png)

### 查看集群信息

查看一下当前集群信息：
![cluster info](images/cluster-info.png)

当前已经部署的 pods：

![get pods](images/get-pods.png)

### 启动控制面板

```shell
minikube dashboard
```

![start dashboard](images/start-dashboard.png)

会自动在浏览器打开 dashboard 界面：

![dashboard](images/dashboard.png)

可以简单浏览一下默认启动的 Services/cluster/namespaces/config 等资源信息。

### 删除集群

可以随时删除已经启动的集群以方便测试。

```shell
minikube stop && minikube delete --all
```

更多的命令行参数参见 [commands](https://minikube.sigs.k8s.io/docs/commands/)。

### 集群外访问

minikube service 命令可以访问 NodePort 类型的 service。

```shell
minikube service kubernetes-dashboard -n kubernetes-dashboard
```

## addons

minikube 内置了可以轻松部署的应用程序和服务列表，例如 Istio 或 Ingress。

```shell
minikube addons enable metrics-server
minikube addons enable ingress
minikube addons enable dashboard
```
