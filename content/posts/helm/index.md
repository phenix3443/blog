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
series:
  - 如何一步步搭建家庭网络服务
---

本文介绍如何使用 helm 管理 kubernetes 应用。

<!--more-->

## 概述

[Helm](https://helm.sh/zh/) 是 kubernetes 的包管理工具。有三个重要的概念：

- chart 包含创建 Kubernetes 应用程序所必需的一组信息。
- config 包含了可以合并到打包的 chart 中的配置信息，用于创建一个可发布的对象。
- release 是 kubernetes 中一个与特定配置相结合的 chart 的运行实例。

Helm 安装 charts 到 Kubernetes 集群中，每次安装都会创建一个新的 release。

## 常用命令

- `helm completion zsh > $(brew --prefix)/share/zsh/site-functions/_helm` 为 zsh 安装自动补全，参见 [zsh 自动补全]({{< ref "posts/zsh#auto-completion" >}})
- `helm repo list` 已经安装的 repo 列表。
- `helm repo add <repo> <repo-url>` 添加新的 repo。
- `helm search repo <chart>` 在当前所有已添加的 repo 中查找 chart。
- `helm pull <repo>/<chart> --untar=true` 将 chart 拉取到本地但是不安装，方便检查内容。
- `helm show chart <repo>/<chart>` 显示 chart 相关信息。
- `helm install <release> <repo>/<chart>` 安装 chart。可以通过 `--wait` 参数等待安装完成后退出命令行。
- `helm status <release>` 显示 release 运行状态。
- `helm uninstall <release>` 卸载 release。
- `helm upgrade <release> <repo>/<chart>` 更新 release。

更多命令参见 [helm cheatsheet](https://helm.sh/zh/docs/intro/cheatsheet/)

## write chart

通过阅读下面的资料了解如何编写 chart。

- [chart 指南](https://helm.sh/zh/docs/topics/charts/) 阐述了使用 chart 的工作流。
- [Go 模板文档](https://pkg.go.dev/text/template) 说明了模板语法的细节。
- [Chart 模板指南](https://helm.sh/zh/docs/chart_template_guide/getting_started/) 循序渐进的介绍了如何编写 chart 中的模板。
- [Sprig](https://github.com/Masterminds/sprig) 提供了 chart template 使用 60 多个模板函数。
- [Chart 开发提示和技巧](https://helm.sh/zh/docs/howto/charts_tips_and_tricks/) 提供了编写模板时候一些额外注意的细节和技巧。
- [Helm Intellisense](https://marketplace.visualstudio.com/items?itemName=Tim-Koehler.helm-intellisense) 在 vscode 提供自动补全、lint 功能。

### alist chart

为 alist 程序创建 chart，然后会在 chart 中创建一些模板。

```shell
helm create alist
```

修改自动生成的 chart 代码，适配 alist 程序，修改过程中可以使用 `helm template` 本地渲染模板来进行调试：

```shell
helm template alist ./alist --debug
```

渲染结果会显示在标准输出中，查看不是很方便，但可以通过 [schelm](https://github.com/databus23/schelm) 将渲染结果保存在不同的文件中：

```shell
go install github.com/databus23/schelm@latest
helm template alist ./alist --debug -f my-values.yaml| schelm output
```

这样，就在本地编辑好了一个 chart，可以尝试安装到 k8s 中：

```shell
helm install alist ./alist -f values.yaml
```

## 仓库

为了将自己编写的 chart 可以分享给其他人使用，我们需要构建自己的 helm chart 仓库。

阅读 [chart 仓库指南](https://helm.sh/zh/docs/topics/chart_repository/) 了解 chart 仓库的文件结构以及如何托管仓库。

可以通过 Github Pages 来托管仓库，[chart-releaser](https://github.com/helm/chart-releaser) 帮助将 GitHub 仓库转化为 Helm chart 仓库。该工具的原理是将 Helm chart artifacts 添加到以 chart 版本命名的 GitHub Releases 中，然后为这些版本创建一个可托管在 GitHub Pages（或其他地方）的 index.yaml 文件。

使用 [chart releaser action](https://helm.sh/zh/docs/howto/chart_releaser_action/) 可以将发布操作自动化。创建 action 文件：`<git_repo>/.github/workflows/release.yaml`

{{< gist phenix3443 3db4032016e85abdd92f4cd78e56a362 >}}

## Artifact Hub

为了让编写的 chart 可以被其他人搜索到，我们需要将仓库注册到 [Artifact Hub](https://artifacthub.io/docs/)，它是一个基于 Web 的应用程序，可以查找、安装和发布 Kubernetes 包。

### add metadata file

名为 `artifacthub-repo.yml`的元数据文件可用于设置验证发布者或所有权声明等功能。请注意，该文件必须与 chart 仓库下的 `index.yaml` 文件位于同一级别，而且必须由 chart 仓库 HTTP 服务器提供。

- [如何查找 github repository ID]({{< ref "posts/github#repositoryID" >}})

### add annotations

Artifact Hub 使用 Chart.yaml 文件中的元数据，通常情况下，所需的大部分信息都已经存在，因此 chart 维护者不需要额外的工作就能将它们列在 Artifact Hub 上。

不过，有时可能需要提供更多的上下文，以帮助改善用户在 Artifact Hub 中的体验。这可以使用 Chart.yaml 文件中的一些 [特殊 annotation](https://artifacthub.io/docs/topics/annotations/helm/) 来实现。

阅读 [Artifact Hub 保存 helm chart repositories](https://artifacthub.io/docs/topics/repositories/helm-charts/) 了解更多。

### check

开发完成 helm chart repo 后，可以使用 [Artifact Hub 命令行工具 (ah)](https://artifacthub.io/docs/topics/cli/) 的 lint 子命令检查是否已准备好在 Artifact Hub 上出现。

```shell
brew install artifacthub/cmd/ah
ah lint
```

一旦添加了仓库，一切就准备就绪了。在添加新版本的 chart 或新 chart 到仓库时，它们会被自动编入索引并列在 Artifact Hub 中。

## kubernetes-dashboard 源码

通过 [kubernetes-dashboard](https://github.com/kubernetes/dashboard/tree/master/charts) 的 chart 学习如何编写 helm chart。

直接下载并解压 chart 源码。

```shell
helm pull kubernetes-dashboard/kubernetes-dashboard --untar=true
```

阅读过程中遇到的语法和函数都可以从下面的资源中找到：

## Next

- 目前的云平台部署都需要付费，可以学习 [如何在 Raspi 上部署 k8s 集群]({{< ref "posts/k8s-on-raspi" >}})。
