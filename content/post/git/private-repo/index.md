---
title: "如何使用私有仓库"
description: how to use private repo
slug: how-to-use-private-repo
date: 2022-06-12T00:47:34+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: false
categories:
    - git
tags:
    - golang
    - github
    - actions
    - private-repo
---

本文介绍日常开发中和私有仓库相关的问题。

## Go module[^1]

虽然 Go 模块通常从其源代码仓库中分发，但 Go 团队还运行一些[中央 Go 模块服务](https://proxy.golang.org/)，以确保原始仓库发生问题时模块可以继续使用。默认情况下，Go 被配置为使用这些服务，但是当尝试下载私有模块时，它们可能会导致问题，因为它们无权访问这些私有模块。要告诉 Go 某些导入路径是私有的并且它不应该尝试使用中央 Go 服务，您可以使用 `GOPRIVATE` 环境变量。 `GOPRIVATE` 环境变量是导入路径前缀的逗号分隔列表，当遇到时，Go 工具将尝试直接访问它们，而不是通过中央服务。

为了使用私有模块，通过在 `GOPRIVATE` 变量中设置它来告诉 Go 将哪个路径视为私有的。例如 `github.com/your_github_username/mysecret`。这样有个问题：需要将每个私有存储库单独添加到 `GOPRIVATE` ，如下所示：

`export GOPRIVATE=github.com/your_github_username/mysecret,github.com/your_github_username/othersecret`

即使 Go 现在知道模块是私有的，但仍然不足以使用该模块。如果尝试导入私有模块，可能会看到类似于以下内容的错误：

```html
go get: module github.com/your_github_username/mysecret: git ls-remote -q origin in /Users/your_github_username/go/pkg/mod/cache/vcs/2f8c...b9ea: exit status 128:
	fatal: could not read Username for 'https://github.com': terminal prompts disabled
Confirm the import path was entered correctly.
If this is a private repository, see https://golang.org/doc/faq#git_https for additional information.
```

此错误消息显示 Go 尝试下载私有模块，但仍然无法访问。由于 go mod 使用 Git 下载模块，它通常会要求您输入凭据。但是，在这种情况下，Go 正在为您调用 Git，并且无法输入访问凭据。此时，要访问私有模块，需要为 Git 提供一种无需立即输入即可检索访问凭据的方法。

使用 SSH 密钥而不是 HTTPS 作为私有 Go 模块的身份验证方法，可以解决这个问题。Git 提供了一个名为 `insteadOf` 的配置选项。

`git config url."git@github.com:your_github_username".insteadOf "https://github.com/your_github_username"`

## Github Token[^2]

使用凭证而不是 public key 访问仓库。

## GitHub Actions[^3]

如何设置 GitHub Actions 以使用托管在 GitHub 上的私有 go 模块，其他托管平台思路类似。

+ 将 token 作为 actions secret 添加到项目。
+ 配置 git 使用 actions secret 来拉取 repo (L12)。

  ```shell
  jobs:
  run:
    runs-on: ubuntu-latest
    env:
      `GOPRIVATE`: github.com/fabianMendez/privatemodule
      GH_ACCESS_TOKEN: ${{ secrets.GH_ACCESS_TOKEN }}
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-go@v2
        with:
            go-version: '1.16'
      - run: git config --global url.https://$GH_ACCESS_TOKEN@github.com/.insteadOf https://github.com/
      - run: go build

  ```

[^1]: [how-to-use-a-private-go-module-in-your-own-project](https://www.digitalocean.com/community/tutorials/how-to-use-a-private-go-module-in-your-own-project)
[^2]: [creating-a-personal-access-token](https://docs.github.com/cn/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
[^3]: [using-encrypted-secrets-in-a-workflow](https://docs.github.com/cn/actions/security-guides/encrypted-secrets#using-encrypted-secrets-in-a-workflow)
