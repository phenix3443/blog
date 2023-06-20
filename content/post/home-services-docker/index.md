---
title: "家庭服务--docker部署篇"
description: 家庭服务的整体设计
slug: home-services-docker
date: 2023-06-20T19:41:08+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - cloud
tags:
  - docker
  - home-services
---

## 概述

[设计原则](../home-services-guide/) 之前已经说清楚了，这里描述的是如何在内网部署服务。

- 总体来说，将服务看成组织为单个的 service，通过 docker compose 进行定义和部署。
- 所有的服务都共享同一个名为 home 的 network，包括提供内网穿透的 cloudflared 服务。这样所有的服务都可以相互访问，而且都不用 host 对外暴露端口。
