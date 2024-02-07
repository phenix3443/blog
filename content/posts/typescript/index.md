---
title: "TypeScript"
description: TypeScript 入门
slug: typescript
date: 2023-02-23T22:11:08+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - typescript
tags:
---

## 概述

本文介绍 [TypeScript](https://www.typescriptlang.org/zh) 的项目模板 [typescript-starter](https://github.com/phenix3443/typescript-starter) 是如何搭建的。

## 安装

在项目中使用单独的 [typescript](https://www.npmjs.com/package/typescript)、[eslint](https://www.npmjs.com/package/eslint)、[ts-node](https://www.npmjs.com/package/ts-node) 配置

```sh
pnpm init &&
pnpm install --save-dev typescript tslint ts-node
```

## tsc

查看当前 typescript 编译器 ([tsc](https://www.typescriptlang.org/docs/handbook/compiler-options.html)) 的版本：

```shell
pnpm tsc --version
```

使用 `tsc --init` 在当前工作目录使用推荐设置创建 tsconfig.json，具体的配置项信息参见 [官方说明](https://www.typescriptlang.org/tsconfig)。

{{< gist phenix3443 edb0d6ccf63a5a4cfb3463726765cfb5 hello.ts >}}

通过 ts-node 可以直接执行脚本，不需要预先将 ts 编译为 js： `pnpm ts-node hello.ts`

## eslint

[eslint](https://eslint.org/)

可以通过 `pnpm dlx @eslint/create-config` 交互式的生成配置。

## ts-node

## 语法

- 类型是一种集合。[^1]
- 多种多样的 for 循环语法。c-for, for-in, for-of, forEach, every, some.

## 资料

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript 入门教程](https://ts.xcatliu.com/)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)

## 参考
