---
title: "如何在 Github Actions 中使用 Private Go Module"
description: 
date: 2022-05-12T02:56:34+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: false
categories:
    - git
tags:
    - github
    - actions
    - private-repo
---

本文展示展示如何设置 GitHub Actions 以使用托管在 GitHub 上的私有 go 模块，其他托管平台思路类似。

+ [creating-a-personal-access-token](https://docs.github.com/cn/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)

+ 将 token 作为 actions secret 添加到项目。参见 [using-encrypted-secrets-in-a-workflow](https://docs.github.com/cn/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow)

+ 配置 git 使用 actions secret 来拉取 repo (L12)。

  ```shell
  jobs:
  run:
    runs-on: ubuntu-latest
    env:
      GOPRIVATE: github.com/fabianMendez/privatemodule
      GH_ACCESS_TOKEN: ${{ secrets.GH_ACCESS_TOKEN }}
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
            go-version: '1.16'
      - run: git config --global url.https://$GH_ACCESS_TOKEN@github.com/.insteadOf https://github.com/
      - run: go build

  ```
