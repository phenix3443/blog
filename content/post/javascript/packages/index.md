---
title: "JavaScript Packages"
description: "JavaScript 包管理系统"
slug: js-packages
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
  - pnpm
  - yarn
---

## npm

查看当前配置

`npm config list`

默认配置文件放在 `~/.npmrc`，关于配置文件的信息可以通过 `npm help npmrc` 来查看。

由于国内直接使用 npm 的官方镜像是非常慢的，这里推荐使用淘宝 NPM 镜像。
淘宝 NPM 镜像是一个完整 npmjs.org 镜像，你可以用此代替官方版本(只读)，同步频率目前为 10 分钟 一次以保证尽量与官方服务同步。

`npm config set registry https://registry.npm.taobao.org`

还可以使用淘宝定制的 cnpm (gzip 压缩支持) 命令行工具代替默认的 npm:

`npm install -g cnpm --registry=https://registry.npmmirror.com`

这样就可以通过 cnpm 安装模块了 `cnpm install [name]`

但是这种方法执行`npm search`时候需要添加`--registry=https://registry.npmjs.org` , 所以可选择不更改软件源，而是设置代理：

`npm config set proxy http://127.0.0.1:7890`

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
