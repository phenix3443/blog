---
title: Kubectl
description: kubectl 使用
slug: kubectl
date: 2023-09-19T17:12:18+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: [k8s]
tags: [kubectl]
images: []
---

## 概述

## 自动补全

### bash

```shell
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

### zsh

```shell
echo '[[ $commands[kubectl] ]] && source <(kubectl completion zsh)' > $(brew --prefix)/share/zsh/site-functions/_kubectl
```

kubectl 这个命令还是比较长的，如果给它一个更短的别名可以节省很多时间，设置

```shell
alias k=kubectl
```

这样就可以使用 k get pod 这样的命令去获取 pod 信息，但是这样的别名没有自动补全：

```sh
alias k=kubectl
complete -F __start_kubectl k
```

这样就完美了，k 命令也有了自动补全。
