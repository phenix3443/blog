---
title: "TypeScript"
description: TypScript 学习总结
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

本文介绍 typescript 学习资源。

<!---->

## 概述

[TypeScript](https://www.typescriptlang.org/zh)

## 安装

在项目中使用单独的 typescript、tslint、[ts-node](https://www.npmjs.com/package/ts-node) 配置

```shell
mkdir test && cd test
npm init
npm install --save-dev typescript tslint @types/ts-node
```

查案当前 typescript 编译器版本：

```shell
npx tsc --version
```

编译代码文件 `tsc hello.ts`, 然后通过 `node hello.js` 运行代码。

```shell
npx ts-node hello.ts
```

或者直接通过 运行 `ts-node hello.ts`。

## 语法

- 类型是一种集合。[^1]
- 多种多样的 for 循环语法。c-for, for-in, for-of, forEach, every, some.

## 资料

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript 入门教程](https://ts.xcatliu.com/)
- [深入理解 TypeScript](https://jkchao.github.io/typescript-book-chinese/)

## 参考

[^1]: [Types as Sets](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes-oop.html#types-as-sets)

## Next
