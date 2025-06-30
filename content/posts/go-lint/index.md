---
title: go 代码检查工具
description: go 代码检查工具
slug: go-lint
date: 2022-07-12T14:05:21+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: [go]
tags: [tools]
images: []
---

## golangci-lint

[golangci-lint](https://github.com/golangci/golangci-lint) 是常用的 golang lint 工具。

安装以及升级：

```sh
brew install golangci-lint && brew upgrade golangci-lint
```

## 使用

`golangci-lint run` 对代码进行检查。

如何在包含数千个问题的大型项目中引入该工具呢？

我们的想法是不修复所有现有问题。只修复新添加的问题：新代码中的问题。要做到这一点，需要通过选项 `--new-from-rev=HEAD~1` 运行 golangci-lint 。

## 集成

可以方便的与常用的 IDE、github action 进行集成，参见 [integrations](https://golangci-lint.run/usage/integrations/)。

在 vscode 中的配置：

```json
{
  "go.lintTool": "golangci-lint",
  "go.lintFlags": ["--fast"]
}
```

## 配置

通过`.golangci.yml`使用 yaml 文件进行 [配置](https://golangci-lint.run/usage/configuration/)，主要包含以下配置项：

- run: 代码分析相关，可以用于设置检查超时时间、跳过检查的目录或者文件等。
- output: 结果输出相关，可以设置输出格式（如 json）、输出文件位置等。
- linters: 使用的各种 linter。可用的 linters 及其配置说明参见 [linters](https://golangci-lint.run/usage/linters/)，
- linters-settings: 各 linter 对应的配置。
- issues: 要排除的 issues 文本的正则表达式列表。linter 检查出来的问题称为`issue`。有时候会产生一些误报 ([False Positives](https://golangci-lint.run/usage/false-positives/))，或者某些代码我们不希望检查，可以在这里进行配置。跳过 lint 检查还可以使用 [nolint 指令](https://golangci-lint.run/usage/false-positives/#nolint-directive)，但是更推荐配置在`issues`中。
- severity: 设置要展示的告警级别，默认是 error。也可以针对单个 linter 进行设置。

## run

- timeout: 分析的超时时间。默认一分钟。
- tests: 是否检查测试代码。默认`false`。
- skip-dirs-use-default: 默认跳过以这些结尾的目录：`vendor$, third_party$, testdata$, examples$, Godeps$, builtin$`。
- skip-dirs: 跳过检查的目录，与`skip-dirs-use-default`是相互独立的配置。
- skip-files: 跳过检查的文件。

## linters

## 示例

{{< gist phenix3443 e02515ea525fa50ec8e26ab303f2acaa >}}

## 参考

- [A guide to linting Go programs](https://freshman.tech/linting-golang/)
