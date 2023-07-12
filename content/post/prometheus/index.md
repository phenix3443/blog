---
title: "prometheus & grafana"
description: 使用 Prometheus & grafana 进行数据可视化
slug: prometheus
date: 2023-07-11T21:46:43+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - monitor
tags:
  - prometheus
  - grafana
---

## Prometheus

[prometheus](https://prometheus.io/docs/introduction/overview/)

{{< gist phenix3443 03617913d6d8d1577a202a91c9921c80>}}

```shell
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts &&
    helm repo update &&
    helm upgrade prometheus prometheus-community/prometheus -f prometheus/values.yaml --install
```

浏览器打开:

```shell
kubectl port-forward services/prometheus-server 6789:80
```

## Grafana

{{< gist phenix3443 5cad23af76232780c8141e9a9c5bec66 >}}

```shell
helm repo add grafana https://grafana.github.io/helm-charts &&
    helm repo update &&
    helm upgrade grafana grafana/grafana -f grafana/values.yaml --install
```

浏览器打开：

```shell
kubectl port-forward services/grafana 6789:80
```
