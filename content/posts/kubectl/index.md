---
title: Kubectl
description: kubectl 使用
slug: kubectl
date: 2023-09-19T17:12:18+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: [kubernetes]
tags: [kubectl]
images: []
---

## 概述

## 自动补全

### bash

启用自动补全：

```shell
echo "source <(kubectl completion bash)" >> ~/.bashrc
```

### zsh

启用补全功能：

```shell
echo '[[ $commands[kubectl] ]] && source <(kubectl completion zsh)' > $(brew --prefix)/share/zsh/site-functions/_kubectl
```

## 别名

kubectl 这个命令如果有更短的别名可以更方便输入：

```shell
alias k=kubectl
```

但是这样的别名没有自动补全，我们需要继续修改：

```sh
alias k=kubectl
complete -F __start_kubectl k
```
