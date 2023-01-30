---
title: "vscode tips"
slug: vscode-tips
description:
date: 2022-07-01T11:20:19+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
  - vscode
  - 最佳实践
  - docker
---

所有内容出自[官方文档](https://code.visualstudio.com/docs)。

## develop container

出于各种原因，可能是操作系统原因，或者编译器版本，也可能是环境变量冲突，我们需要为单个项目准备独立的开发环境，这种情况下 Docker 是一个很好地选择。[vscode Container](https://code.visualstudio.com/docs/remote/containers) 描述如何在 vscode 中使用 Docker 来为单个项目创建开发容器（dev container）。

vscode 使用`.devcontainer/devcontainer.json`或者`.devcontainer.json`以及可选的`Dockerfile`或`docker-compose.yml`来创建开发容器。

首先，根据提供的 Docker 文件或镜像名称创建开发容器使用的 image。 然后使用`devcontainer.json`中的一些设置创建并启动一个容器，重新安装和配置您的 Visual Studio Code 环境。

## SSH GCE

使用 `gcloud compute ssh <use@instance>` 登录 GCE 实例时，如果 user 不是本地 host 账号，而是实例上已有的账号，会登录出错，报 public key error 错误，这时候首先要删除原有用户 `sudo userdel -r <exist_user>`
