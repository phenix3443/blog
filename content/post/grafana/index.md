---
title: "grafana"
description: 使用 Grafana 进行数据可视化
slug: grafana
date: 2023-07-14T12:03:01+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - monitor
tags:
  - grafana
---

## 概述

## 部署

{{< gist phenix3443 5cad23af76232780c8141e9a9c5bec66 >}}

```shell
helm repo add grafana https://grafana.github.io/helm-charts &&
    helm repo update &&
    helm upgrade grafana grafana/grafana -f grafana/values.yaml --install --namespace monitor --create-namespace
```

{{< gist phenix3443 9ab7660a7f802055b39480a32e6adbdb >}}

浏览器打开：

```shell
kubectl port-forward services/grafana 6789:80
```
