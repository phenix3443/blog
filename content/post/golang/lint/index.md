---
title: "linting golang"
date: 2022-07-12T14:05:21+08:00
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

### run

+ timeout: 分析的超时时间。默认一分钟。
+ tests:是否检查测试代码。默认 `false`。
+ skip-dirs-use-default: 默认跳过以这些结尾的目录：`vendor$, third_party$, testdata$, examples$, Godeps$, builtin$`。
+ skip-dirs: 跳过检查的目录，与 `skip-dirs-use-default`是相互独立的配置。
+ skip-files: 跳过检查的文件。

### linters

golangci-lint 支持多种 linter，具体应该选择应该根据项目而定，这里有一些推荐：

+ errcheck 用于检查返回的 error 是否被处理。
+ gosimple 简化代码。
+ govet 检查 Go 源代码并报告可疑结构，例如参数与格式字符串不一致的 Printf 调用。
+ ineffassign 检查已经赋值的变量没有使用。
+ unused 检查没有使用的常量、变量、函数和类型。
+ containedctx 检查包含 context 的 struct。
+ errname 检查 error 变量以 Err 为前缀，error 类型以 Error 为后缀。
+ errlint 用于查找会导致 Go 1.13 中引入的错误包装方案出现问题的代码。
+ gci 控制 golang 包导入顺序并使其始终具有确定性。
+ gocritic 提供检查错误、性能和样式问题的诊断。 无需通过动态规则重新编译即可扩展。 动态规则使用 AST 模式、过滤器、报告消息和可选建议以声明方式编写（强烈推荐）。
+ godot 检查注释使用 `.` 结尾。
+ goimports
+ ifshort 尽可能检查代码是否对 if 语句使用短语法。
+ misspell 检查拼写错误。
+ nestif 检查 if 的过度嵌套。
+ [revive](https://github.com/mgechev/revive) 工具本身可直接替换 golint。 可以替代:
  + `funlen` -> 函数长度。
  + `gocyclo` -> `cyclomatic` 圈复杂度。
  + `gomnd`，`goconst` -> `add-constant` 魔数。
  + `lll` -> `line-length-limit`单行长度。
  + `maintidx` -> `cognitive-complexity` ：认知复杂度是衡量代码难易程度的指标。 虽然圈复杂度可以很好地衡量代码的“可测试性”，但认知复杂度旨在提供更精确的代码理解难度度量。 对每个函数实施最大复杂度有助于保持代码的可读性和可维护性。
  + `errcheck` -> `unhandled-error`
+ tagliatelle 检查 struct tag 命名。
+ unconvert 检查不必要的类型转换。
+ whitespace 检测行首行位的空格。

{{< gist phenix3443 e02515e >}}

[^1]: [A guide to linting Go programs](https://freshman.tech/linting-golang/)
