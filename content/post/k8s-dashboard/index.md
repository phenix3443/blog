---
title: "kubernetes Dashboard"
description: kubernetes dashboard 使用
slug: k8s-dashboard
date: 2023-06-25T21:39:04+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - kubernetes
tags:
  - dashboard
---

## 概述

[Kubernetes Dashboard](https://github.com/kubernetes/dashboard) 是一个通用的、基于 Web 的 Kubernetes 集群的用户界面。它允许用户管理集群中运行的应用程序，并对其进行故障排除，以及管理集群本身。

## 部署

```shell
sudo kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

官方推荐使用[helm 部署](https://artifacthub.io/packages/helm/k8s-dashboard/kubernetes-dashboard)：

### 运行状态

```shell
sudo kubectl -n  kubernetes-dashboard get pods

NAME                                        READY   STATUS    RESTARTS   AGE
dashboard-metrics-scraper-7bc864c59-rpzk7   1/1     Running   0          64s
kubernetes-dashboard-6c7ccbcf87-nmnds       1/1     Running   0          64s
```

## NodePort 访问

默认 dashboard 只能在集群内部访问，为了在集群外部访问，需要将 service 从 ClusterIP 改为 NodePort，为此[编辑 kubernetes-dashboard service](https://github.com/kubernetes/dashboard/blob/master/docs/user/accessing-dashboard/README.md#nodeport)：

```shell
sudo kubectl -n kubernetes-dashboard edit service kubernetes-dashboard
```

在服务对应的配置文件中，将 `type: ClusterIP` 修改为 `type: NodePort`，保存文件。

查看部署状态

```shell
kubectl get po,svc -n kubernetes-dashboard
NAME                                             READY   STATUS    RESTARTS         AGE
pod/dashboard-metrics-scraper-5cb4f4bb9c-s7qn5   1/1     Running   99 (2m27s ago)   22h
pod/kubernetes-dashboard-6967859bff-gndtg        1/1     Running   83 (2m27s ago)   22h

NAME                                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
service/dashboard-metrics-scraper   ClusterIP   10.110.149.173   <none>        8000/TCP        2d4h
service/kubernetes-dashboard        NodePort    10.100.197.19    <none>        443:31707/TCP   2d4h
```

浏览器打开 `https://<control-plane-ip>:31707`，可以看到登录界面。control-plane-ip 可以通过执行 `kubectl cluster-info` 看到。

![dashboard login](images/token.png)

## Ingress 访问

通过 ingress-nginx 配置访问：

{{< gist phenix3443 459b9d083ac6fc0ea2967bdbac0bb1e0 >}}

## 创建示例用户

为了保护集群数据，默认情况下，Dashboard 会使用最少的 [RBAC](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/rbac/) 配置进行部署。我们知道：

- kubernetes 所有的资源都是通过 API 进行访问。
- 命名空间下的所有资源都是通过 Role 进行授权访问的。

所以 dashboard 需要 通过 apiserver 查询集群的所有信息，必然需要满足对应的[身份认证](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/)需求，这就涉及到了 [ServiceAccount](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/service-accounts-admin/) 相关知识。

按照[创建示例用户](https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md) 为 dashboard service 创建管理员(admin-user)服务账户(ServiceAccount)，该服务账号通过 ClusterRoleBinding 到系统的 cluster-admin role 上，进而有权限可以管理集群所有资源。

创建以下资源清单文件：

{{< gist phenix3443 122e758c289090eadc94873beda35f8a >}}

{{< gist phenix3443 81024fee19684a1db7d567a3131ae7c2 >}}

部署 admin-user 配置：

```shell
kubectl create -f dashboard.admin-user.yml -f dashboard.admin-user-role.yml
```

当前，Dashboard 仅支持使用 Bearer 令牌登录。获取管理员令牌：

```shell
sudo kubectl -n kubernetes-dashboard create token admin-user
```

在浏览器中输入产生的 token ，系统会认为是 admin-user 登录，进而可以操作集群。

![cluster info](images/cluster-info.png)

## SSL 证书

由于 dashboard 安装时默认生成了证书，所以需要先删除默认证书：

```shell
sudo kubectl -n kubernetes-dashboard get svc,pods
```

使用自己的证书重新生成：

```shell
sudo kubectl -n kubernetes-dashboard create secret tls kubernetes-dashboard-tls --key panghuli.tech.cf.key --cert panghuli.tech.cf.pem
```

## 域名访问

通过 NodePort 部署的 service 最终映射到外部的 port 还是具有不确定性，如果手动指定又可能会产生冲突。解决这个问题就需要用到 [ingress](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress/)。

- k8s 需要先手动部署[ingress controller](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress-controllers/)
- k3s 默认安装了[traefik-ingress-controller](https://docs.k3s.io/zh/networking#traefik-ingress-controller)

为 dashboard service 编写一个 ingress。

## 参考

- [a](https://cloudnative.to/blog/general-kubernetes-dashboard/)
- [b](https://blog.51cto.com/u_1472521/50018740)
