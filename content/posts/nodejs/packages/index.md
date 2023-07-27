---
title: "Node.js Packages Manager"
description: "node.js 包管理系统"
slug: nodejs-package-manager
date: 2023-02-23T10:43:45+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - javascript
tags:
  - nodejs
  - npm
  - yarn
  - pnpm
---

## npm

[npm](https://www.npmjs.com/) 用户配置文件放在 `~/.npmrc`，项目也可以有自己的配置文件。关于配置文件的信息可以通过 `npm help npmrc` 来查看。

可通过命令 `npm config list` 产看当前配置。

由于国内直接使用 npm 的官方镜像是比较慢，可以通过更换其他国内镜像进行加速。这里推荐淘宝 npm 镜像，同步频率目前为 10 分钟一次。

`npm config set registry https://registry.npm.taobao.org`

但这种方法搜索 package 时需要添加`--registry=https://registry.npmjs.org`。

### patch-package

可用于修改第三方 package 后生成 patch，方便后续使用或者分发。

## yarn

[yarn](https://yarnpkg.com/) 是由 Facebook、Google、Exponent 和 Tilde 联合推出了一个新的 JS 包管理工具，目标是解决 npm 已有的一些问题，比如速度慢，安装版本不统一等。

```shell
yarn config set registry https://registry.npm.taobao.org
```

关于 yarn 与 npm 的比较，可以参看[Yarn vs NPM: Which One is Best to Choose?](https://www.knowledgehut.com/blog/web-development/yarn-vs-npm)，这里直接说结论：如果不是为了兼容 Nodejs 老版本（<5.0），使用 yarn 更好。

## pnpm

[pnpm](https://pnpm.io/) 相比较 npm/yarn 速度更快，更省磁盘空间。

这里需要吐槽的 `pnpm path` 没有 `patch-package` 使用方便，而且有时候不能正常进行 patch。
