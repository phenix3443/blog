---
title: "TypeScript Start"
description: TypScript 拾遗
slug: typescript-start
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

[TypeScript](https://www.typescriptlang.org/zh)

## 安装

安装编译器： `npm install -g typescript`

查看版本 `tsc --version`

编译代码文件 `tsc hello.ts`, 然后通过 `node hello.js` 运行代码。或者直接通过 [ts-node](https://www.npmjs.com/package/ts-node) 运行 `ts-node hello.ts`。

## 语法

- 类型是一种集合。[^1]
- 多种多样的 for 循环语法。c-for, for-in, for-of, forEach, every, some.
- 各种语法的 export 与 import: [https://segmentfault.com/a/1190000018249137]

## 资料

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript 入门教程](https://ts.xcatliu.com/)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)

[^1]: [Types as Sets](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html#types-as-sets)
