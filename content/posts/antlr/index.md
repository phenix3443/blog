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

[antlr](https://www.antlr.org/)

[官方教程](https://github.com/antlr/antlr4/blob/master/doc/getting-started.md)

[ANTLR4 权威指南](https://book.douban.com/subject/27082372/)

## 安装

可以直接在 [antlr lab](http://lab.antlr.org/) 试验。

也可以本地安装相关的工具：

```sh
pip install antlr4-tools
```

## 使用

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce >}}

打印符号列表

```sh
antlr4-parse Hello.g4 r -tokens
hello parrt
[@0,0:4='hello',<'hello'>,1:0]
[@1,6:10='parrt',<ID>,1:6]
[@2,12:11='<EOF>',<EOF>,2:0]
```

```sh
% antlr4-parse Hello.g4 r -trace
hello parrt
enter   r, LT(1)=hello
consume [@0,0:4='hello',<1>,1:0] rule r
consume [@1,6:10='parrt',<2>,1:6] rule r
exit    r, LT(1)=<EOF>
```

## 参考

- [使用 ANTLR 和 Go 实现 DSL 入门](https://tonybai.com/2022/05/10/introduction-of-implement-dsl-using-antlr-and-go/) 系列文章。
