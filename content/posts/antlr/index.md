---
title: Antlr
description:
slug: antlr
date: 2024-02-05T10:35:48+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: []
tags: []
images: []
---

## 概述

[ANTLR](https://www.antlr.org/)  是由 Terence Parr 教授在上世纪 90 年代初期使用 Java 语言开发的一个强大的语法分析器生成工具，至今 ANTLR 依然在积极开发，并且有着一个稳定的社区。ANTLR 支持生成 C#, Java, Python, JavaScript, C++, Swift, Go, PHP 等几乎所有主流编程语言的目标代码，并且 ANTLR 官方自己维护了 Java、C++、Go 等目标语言的 runtime 库。

[官方教程](https://github.com/antlr/antlr4/blob/master/doc/getting-started.md)

[ANTLR4 权威指南](https://book.douban.com/subject/27082372/)

## 使用

`pip install antlr4-tools` 将安装 antlr4 和 antlr4-parse 两个工具，

- antlr4 用于生成词法和语法解析器对应的目标代码（后续介绍）。
- antlr4-parse 用于分析 g4 文件中定义的语法。

antlr 定义的语法规则放在后缀为`.g4`的规则文件中，这里实现一个简单的`hello` 语法规则：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce hello.g4>}}

该规则对应的代码如下：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce greetings.txt>}}

通过`antlr4-parse Hello.g4 prog greetings.txt -tokens`打印代码解析后对应的符号列表：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce tokens.txt >}}

也可以通过 `antlr4-parse Hello.g4 prog -gui` 直接在 GUI 窗口中展示词法分析结果。

![hello tree](image/hello_tree.png)

更多使用说明参见 [antlr4-tools](https://github.com/antlr/antlr4-tools/tree/master).

还可以直接在 [antlr lab](http://lab.antlr.org/) 试验。

## 代码生成

ANTLR 支持在多种目标语言中生成代码，生成的代码需要借助一个特定为目标语言生成代码的运行时库来支持。

### Golang Target

为了生成 Go 目标语言的代码，通常建议将源语法文件放在一个独立的包中，并使用 `go generate` 指令通过使用 shell 脚本方法生成代码。

下面是一个推荐的通用 golang 语言代码模板：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce init_layout.txt >}}

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce generate.go >}}

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce generate.sh >}}

根据是否需要访问者（visitors）或监听器（listeners）以及其他 ANTLR 选项的情况，设置 `generate.sh`。

执行以下命令将生成解析器的代码：

```sh
go generate ./...
```

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce generated_layout.txt >}}

可以通过导入解析包来使用生成的代码，比如添加 `parser/hello_test.go` 用于后续测试生成的代码。

## 参考

- [使用 ANTLR 和 Go 实现 DSL 入门](https://tonybai.com/2022/05/10/introduction-of-implement-dsl-using-antlr-and-go/) 系列文章。
