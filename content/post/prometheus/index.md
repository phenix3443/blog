---
title: "prometheus"
description: 使用 Prometheus 监控系统
slug: prometheus
date: 2023-07-11T21:46:43+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - monitor
tags:
  - prometheus
---

## 概述

[prometheus](https://prometheus.io/docs/introduction/overview/)

### 部署

```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts &&
    helm repo update &&
    helm upgrade prometheus prometheus-community/prometheus -f prometheus/values.yaml --install --namespace monitor --create-namespace
```

浏览器打开:

```shell
kubectl port-forward services/prometheus-server 6789:80
```

{{< gist phenix3443 03617913d6d8d1577a202a91c9921c80>}}

## 参考

- [prometheus book](https://yunlzheng.gitbook.io/prometheus-book/)

## Next

- [使用 grafana 进行数据可视化]({{< ref "../grafana" >}})
