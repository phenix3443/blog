---
title: "helm"
description: 使用 Helm 管理 kubernetes 应用
slug: helm
date: 2023-06-27T15:44:55+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - kubernetes
tags:
  - helm
---

## 概述

[Helm](https://helm.sh/zh/) 是 kubernetes 的包管理工具。有三个重要的概念：

- chart 创建 Kubernetes 应用程序所必需的一组信息。
- config 包含了可以合并到打包的 chart 中的配置信息，用于创建一个可发布的对象。
- release 是一个与特定配置相结合的 chart 的运行实例。

Helm 安装 charts 到 Kubernetes 集群中，每次安装都会创建一个新的 release。

## 常用命令

- `helm repo list` 已经安装的 repo 列表。
- `helm repo add truecharts https://charts.truecharts.org/` 添加新的 repo。
- `helm search repo cloudreve` 在当前所有已添加的 repo 中查找 chart。
- `helm pull truecharts/cloudreve` 将 chart 拉取到本地但是不安装，方便检查内容。
- `helm show chart truecharts/cloudreve` 显示 chart 相关信息。
- `helm install my-cloudreve truecharts/cloudreve` 安装 chart。可以通过 `--wait` 参数等待安装完成后退出命令行。
- `helm status my-cloudreve` 显示 release 运行状态。
- `helm uninstall my-cloudreve` 卸载 release。
- `helm upgrade my-cloudreve truecharts/cloudreve` 更新 release。

更多命令参见[helm cheatsheet](https://helm.sh/docs/intro/cheatsheet/)

## kubernetes-dashboard 源码

通过 [kubernetes-dashboard](https://github.com/kubernetes/dashboard/tree/master/charts)的 chart 学习如何编写 helm chart。

直接下载并解压 chart 源码。

```shell
helm pull kubernetes-dashboard/kubernetes-dashboard --untar=true
```

阅读过程中遇到的语法和函数都可以从下面的资源中找到：

- [helm 支持的 function list](https://helm.sh/zh/docs/chart_template_guide/function_list/)
- [Chart Development Tips and Tricks](https://helm.sh/zh/docs/howto/charts_tips_and_tricks/)

## 编写模板

通过[Chart 模板指南](https://helm.sh/zh/docs/chart_template_guide/getting_started/) 实际编写一个 chart。

## 调试模板

- helm lint 是验证 chart 是否遵循最佳实践的首选工具。[Helm Intellisense](https://marketplace.visualstudio.com/items?itemName=Tim-Koehler.helm-intellisense) 是 vscode 的扩展。

- `helm template --debug` 在本地测试渲染 chart 模板。
- `helm install --dry-run --debug` 我们已经看到过这个技巧了，这是让服务器渲染模板的好方法，然后返回生成的清单文件。
- `helm get manifest` 这是查看安装在服务器上的模板的好方法。

## Next

- 目前的云平台部署都需要付费，可以学习[如何在 Raspi 上部署 k8s 集群]({{< ref "../k8s-on-raspi" >}})。
