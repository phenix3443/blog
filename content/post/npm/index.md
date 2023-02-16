---
title: "npm"
description:
date: 2023-02-16T10:43:45+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
  - javascript
  - npm
  - nvm
  - pnpm
---

## nvm

使用 [nvm](https://github.com/nvm-sh/nvm) 管理 nodejs。

```shell
nvm install --lts
nvm use --lts
nvm ls
```

## npm

```shell
npm config set registry https://registry.npm.taobao.org
```

## pnpm

[pnpm](https://pnpm.io/)，常用命令：

```shell
//查看源
pnpm config get registry
//切换淘宝源
pnpm config set registry https://registry.npm.taobao.org
// 设置存储路径，安装完记得重启下环境使其生效
pnpm config set store-dir /path/to/.pnpm-store

// 安装包
pnpm install <package>
pnpm i <package>
pnpm add <package>

pnpm remove <package>

//更新所有依赖项
pnpm up
pnpm upgrade
```

## yarn

[yarn](https://yarnpkg.com/)常用命令：

```shell
yarn config set registry https://registry.npm.taobao.org
```
