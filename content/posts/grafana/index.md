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

[grafana](https://grafana.com/docs/grafana/latest/introduction/) 能够查询、可视化、预警和探索您的 metrics、logs 和 traces。将时间序列转化为具有洞察力的图标和可视化的数据。

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

## Dashboard

[导入和导出 dashboard](https://grafana.com/docs/grafana/latest/dashboards/share-dashboards-panels/#dashboard-export) 可以方便的使用他人已经配置好的 dashboard。

## 配置

参考 [configuration](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/)

## 告警

![alert](images/alert.png)

## 应用

### 树莓派监控

![raspi](images/raspi.png)

### k3s 监控

![k3s](images/k3s.png)

## mlt

[intro-to-mlt](https://github.com/grafana/intro-to-mlt)

## Next
