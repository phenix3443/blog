---
title: "linting golang"
date: 2022-06-21T14:05:21+08:00
slug: linting-golang
draft: false
categories:
    - golang
tags:
    - lint
---

## golangci-lint

[golangci-lint](https://github.com/golangci/golangci-lint) 是常用的 golang lint 工具。

### 执行

执行 lint: `golangci-lint run`。

### 集成

可以方便的与常用的 IDE、github action 进行集成，参见 [integrations](https://golangci-lint.run/usage/integrations/)。

### 配置

配置文件 `.golangci.yml` 使用 yaml 格式，主要包含以下配置项：

+ run: 代码分析相关，可以用于设置检查超时时间、跳过检查的目录或者文件等。
+ output: 结果输出相关，可以设置输出格式（如 json）、输出文件位置等。
+ linters: 使用的各种 linter。可用的 linters 及其配置说明参见 [linters](https://golangci-lint.run/usage/linters/)。
+ linters-settings: 各 linter 对应的配置。
+ issues: 要排除的 issues 文本的正则表达式列表。linter 检查出来的问题称为 `issue`。有时候会产生一些误报([False Positives](https://golangci-lint.run/usage/false-positives/))，或者某些代码我们不希望检查，可以在这里进行配置。跳过 lint 检查还可以使用 [`nolint 指令`](https://golangci-lint.run/usage/false-positives/#nolint-directive)，但是更推荐配置在 `issues` 中。
+ severity: 设置要展示的告警级别，默认是 error。也可以针对单个 linter 进行设置。

更多详见[configuration](https://golangci-lint.run/usage/configuration/)。

### linters

+ [ ] 如何选择合适的 linter。

[^1]: [A guide to linting Go programs](https://freshman.tech/linting-golang/)
