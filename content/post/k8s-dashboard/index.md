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

## Manifest 部署

```shell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
```

官方推荐使用[helm 部署](https://artifacthub.io/packages/helm/k8s-dashboard/kubernetes-dashboard)。

### 运行状态

```shell
kubectl -n kubernetes-dashboard get pods,svc

NAME                                            READY   STATUS    RESTARTS   AGE
pod/dashboard-metrics-scraper-7bc864c59-rpzk7   1/1     Running   0          107m
pod/kubernetes-dashboard-6c7ccbcf87-nmnds       1/1     Running   0          107m

NAME                                TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)    AGE
service/kubernetes-dashboard        ClusterIP   10.43.159.137   <none>        443/TCP    107m
service/dashboard-metrics-scraper   ClusterIP   10.43.204.81    <none>        8000/TCP   107m
```

### 集群外部访问

默认 dashboard 只能在集群内部访问，有两种方法支持集群外部访问。

#### NodePort

将 service 从 ClusterIP 改为 NodePort，为此[编辑 kubernetes-dashboard service](https://github.com/kubernetes/dashboard/blob/master/docs/user/accessing-dashboard/README.md#nodeport)：

```shell
kubectl -n kubernetes-dashboard edit service kubernetes-dashboard
```

在服务对应的配置文件中，将 `type: ClusterIP` 修改为 `type: NodePort`。

查看部署状态

```shell
kubectl -n kubernetes-dashboard get svc,pods

NAME                                             READY   STATUS    RESTARTS         AGE
pod/dashboard-metrics-scraper-5cb4f4bb9c-s7qn5   1/1     Running   99 (2m27s ago)   22h
pod/kubernetes-dashboard-6967859bff-gndtg        1/1     Running   83 (2m27s ago)   22h

NAME                                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)         AGE
service/dashboard-metrics-scraper   ClusterIP   10.110.149.173   <none>        8000/TCP        2d4h
service/kubernetes-dashboard        NodePort    10.100.197.19    <none>        443:31707/TCP   2d4h
```

浏览器打开 `https://<control-plane-ip>:31707`，可以看到登录界面。control-plane-ip 可以通过执行 `kubectl cluster-info` 看到。

![dashboard login](images/token.png)

#### Ingress

[Ingress](https://kubernetes.io/zh-cn/docs/concepts/services-networking/ingress/) 是对集群中服务的外部访问进行管理的 API 对象，典型的访问方式是 HTTP。可以提供负载均衡、SSL 终结和基于名称的虚拟托管。

{{< gist phenix3443 459b9d083ac6fc0ea2967bdbac0bb1e0 >}}

```shell
kubectl apply -f ingress.yaml
echo "192.168.12.11 k3s" | sudo tee /etc/hosts
```

浏览器打开 `http://k3s` 也可以看到登录界面。

##### TLS

可以通过设定包含 TLS 私钥和证书的 Secret 来保护 Ingress。 Ingress 只支持单个 TLS 端口 443，并假定 TLS 连接终止于 Ingress 节点（与 Service 及其 Pod 之间的流量都以明文传输）。

```shell
kubectl -n kubernetes-dashboard create secret tls kubernetes-dashboard-ingress-tls --key example.com.cf.key --cert example.com.cf.pem
```

{{< gist phenix3443 1b501124b31aff7e9e011e3a8d0f9b23 >}}

```shell
kubectl apply -f ingress.yaml
echo "192.168.12.11 k3s-dashboard.example.com" | sudo tee /etc/hosts
```

浏览器打开 `https://k3s-dashboard.example.com` 也可以看到登录界面。

## Helm 部署

### k3s

由于 Helm kubeconfig 的默认位置是 `$HOME/.kube/config`，所以需要做如下配置：

```shell
mkdir -p $HOME/.kube
sudo cp -i /etc/rancher/k3s/k3s.yaml $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

### 部署

关于 helm，参见 [使用 Helm 管理 kubernetes 应用]({{< ref "../helm" >}})。

```shell
helm repo add kubernetes-dashboard https://kubernetes.github.io/dashboard/
```

可以看到当前的版本是：

```shell
helm search repo kubernetes-dashboard

NAME                                            CHART VERSION   APP VERSION     DESCRIPTION
kubernetes-dashboard/kubernetes-dashboard       6.0.8           v2.7.0          General-purpose web UI for Kubernetes clusters
```

还是自己生成 TLS，这一步也可以直接用系统生成的。

```shell
kubectl create secret tls kubernetes-dashboard-ingress-tls --key example.com.cf.key --cert example.com.cf.pem
```

values.yaml 是 Helm 部署需要的配置：

{{< gist phenix3443 de94f0122c593a10afe4b89831b7547c >}}

```shell
helm install -f values.yaml kubernetes-dashboard kubernetes-dashboard/kubernetes-dashboard
```

执行成功后提示如下：

```shell
Release "kubernetes-dashboard" has been upgraded. Happy Helming!
NAME: kubernetes-dashboard
LAST DEPLOYED: Tue Jun 27 23:37:45 2023
NAMESPACE: default
STATUS: deployed
REVISION: 8
TEST SUITE: None
NOTES:
*********************************************************************************
*** PLEASE BE PATIENT: kubernetes-dashboard may take a few minutes to install ***
*********************************************************************************
From outside the cluster, the server URL(s) are:
     https://k3s-dashboard.example.com
```

## 创建用户

我们知道：

- kubernetes 所有的资源都是通过 API 进行访问。
- 命名空间下的所有资源都是通过 Role 进行授权访问的。

为了保护集群数据，默认情况下，Dashboard 会使用最少的 [RBAC](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/rbac/) 配置进行部署。

```shell
kubectl -n kubernetes-dashboard get role

NAME                   CREATED AT
kubernetes-dashboard   2023-06-27T05:25:31Z
```

可以看到默认只创建了 `kubernetes-dashboard` 这一个角色(role)，该角色也只能管理 kubernetes-dashboard 命名空间内的资源。

```shell
kubectl -n kubernetes-dashboard describe role kubernetes-dashboard

Name:         kubernetes-dashboard
Labels:       k8s-app=kubernetes-dashboard
Annotations:  <none>
PolicyRule:
  Resources       Non-Resource URLs  Resource Names                     Verbs
  ---------       -----------------  --------------                     -----
  secrets         []                 [kubernetes-dashboard-certs]       [get update delete]
  secrets         []                 [kubernetes-dashboard-csrf]        [get update delete]
  secrets         []                 [kubernetes-dashboard-key-holder]  [get update delete]
  configmaps      []                 [kubernetes-dashboard-settings]    [get update]
  services/proxy  []                 [dashboard-metrics-scraper]        [get]
  services/proxy  []                 [heapster]                         [get]
  services/proxy  []                 [http:dashboard-metrics-scraper]   [get]
  services/proxy  []                 [http:heapster:]                   [get]
  services/proxy  []                 [https:heapster:]                  [get]
  services        []                 [dashboard-metrics-scraper]        [proxy]
  services        []                 [heapster]                         [proxy]
```

如果 dashboard 需要通过 apiserver 管理集群就需要满足对应的[身份认证](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/authentication/)需求，这就涉及到了 [ServiceAccount](https://kubernetes.io/zh-cn/docs/reference/access-authn-authz/service-accounts-admin/) 相关知识。

按照[创建示例用户](https://github.com/kubernetes/dashboard/blob/master/docs/user/access-control/creating-sample-user.md) 为 dashboard service 以服务账户(ServiceAccount)方式创建管理员(admin-user)，该服务账号通过 ClusterRoleBinding 到系统的 cluster-admin role 上，进而有权限可以管理集群所有资源。

创建以下资源清单文件：

{{< gist phenix3443 122e758c289090eadc94873beda35f8a >}}

{{< gist phenix3443 81024fee19684a1db7d567a3131ae7c2 >}}

部署 admin-user 配置：

```shell
kubectl create -f admin-user.yaml -f admin-user-bind.yaml
```

当前，Dashboard 仅支持使用 Bearer 令牌登录。获取管理员令牌：

```shell
kubectl -n kubernetes-dashboard create token admin-user
```

在浏览器中输入产生的 token ，系统会认为是 admin-user 登录，进而可以操作集群。

![cluster info](images/cluster-info.png)

## Next

- [helm]({{< ref "../helm" >}})
