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

- chart 包含创建 Kubernetes 应用程序所必需的一组信息。
- config 包含了可以合并到打包的 chart 中的配置信息，用于创建一个可发布的对象。
- release 是 kubernetes 中一个与特定配置相结合的 chart 的运行实例。

Helm 安装 charts 到 Kubernetes 集群中，每次安装都会创建一个新的 release。

## 常用命令

- `helm repo list` 已经安装的 repo 列表。
- `helm repo add my-repo https://charts.my-repo.org/` 添加新的 repo。
- `helm search repo my-chart` 在当前所有已添加的 repo 中查找 chart。
- `helm pull my-repo/my-chart --untar=true` 将 chart 拉取到本地但是不安装，方便检查内容。
- `helm show chart my-repo/my-chart` 显示 chart 相关信息。
- `helm install my-release my-repo/my-chart` 安装 chart。可以通过 `--wait` 参数等待安装完成后退出命令行。
- `helm status my-release` 显示 release 运行状态。
- `helm uninstall my-release` 卸载 release。
- `helm upgrade my-release my-repo/my-chart` 更新 release。

更多命令参见[helm cheatsheet](https://helm.sh/zh/docs/intro/cheatsheet/)

## write chart

通过阅读下面的资料了解如何编写 chart。

- [chart](https://helm.sh/zh/docs/topics/charts/) 阐述了使用 chart 的工作流。
- [Go 模板文档](https://pkg.go.dev/text/template)说明了模板语法的细节。
- [Chart 模板指南](https://helm.sh/zh/docs/chart_template_guide/getting_started/) 循序渐进的介绍了如何编写 chart 中的模板。
- [Sprig](https://github.com/Masterminds/sprig) 提供了 chart template 使用 60 多个模板函数。
- [Chart 开发提示和技巧](https://helm.sh/zh/docs/howto/charts_tips_and_tricks/)提供了编写模板时候一些额外注意的细节和技巧。
- [Helm Intellisense](https://marketplace.visualstudio.com/items?itemName=Tim-Koehler.helm-intellisense) 在 vscode 提供自动补全、lint 功能。

## alist chart

为 alist 程序创建 chart，然后会在 chart 中创建一些模板。

```shell
helm create alist
```

修改自动生成的 chart 代码，适配 alist 程序，修改过程中可以不断通过下面的命令查看本地渲染的效果进行调试：

```shell
helm template alist ./alist --debug
```

渲染结果会显示在标准输出中，通过[schelm](https://github.com/databus23/schelm) 将渲染结果保存在不同的文件中：

```shell
go install github.com/databus23/schelm@latest
helm template alist ./alist --debug -f my-values.yaml| schelm output
```

## 仓库

- [chart 仓库指南](https://helm.sh/zh/docs/topics/chart_repository/) 描述了 chart 仓库的结构

通过 github pages 托管自己的 chart 仓库。

[helm/chart-releaser](https://github.com/helm/chart-releaser) 帮助将 GitHub 仓库转化为 Helm chart 仓库。原理是将 Helm chart artifacts 添加到以 chart 版本命名的 GitHub Releases 中，然后为这些版本创建一个可托管在 GitHub Pages（或其他地方）的 index.yaml 文件。

```shell
brew tap helm/tap
brew install chart-releaser
cr completion zsh >> ~/.zshrc
```

## Artifact Hub

## kubernetes-dashboard 源码

通过 [kubernetes-dashboard](https://github.com/kubernetes/dashboard/tree/master/charts)的 chart 学习如何编写 helm chart。

直接下载并解压 chart 源码。

```shell
helm pull kubernetes-dashboard/kubernetes-dashboard --untar=true
```

阅读过程中遇到的语法和函数都可以从下面的资源中找到：

## Next

- 目前的云平台部署都需要付费，可以学习[如何在 Raspi 上部署 k8s 集群]({{< ref "../k8s-on-raspi" >}})。
