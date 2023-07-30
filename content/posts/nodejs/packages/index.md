---
title: "JavaScript Packages Manager"
description: "Javascript 包管理系统"
slug: js-package-manager
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
  - npm
  - yarn
  - pnpm
---

本文介绍 JavaScript 包管理相关知识。

<!---->

## npm

[npm](https://www.npmjs.com/) 是当前最大的软件 registry。

### client

[npm cli](https://docs.npmjs.com/cli/v9/commands) 工具可和 registry 进行交互。常用的命令有：

#### install

可以安装多种形式的 package。关于 [package.json](https://docs.npmjs.com/cli/v9/configuring-npm/package-json)。

#### npx

[npx 使用教程](https://www.ruanyifeng.com/blog/2019/02/npx.html)

#### config

npm 通过 [`.npmrc`](https://docs.npmjs.com/cli/v9/configuring-npm/npmrc) 来管理配置，该文件有四个级别：

- project
- user
- global
- build-in

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

关于 yarn 与 npm 的比较，可以参看 [Yarn vs NPM: Which One is Best to Choose?](https://www.knowledgehut.com/blog/web-development/yarn-vs-npm)，这里直接说结论：如果不是为了兼容 Nodejs 老版本（<5.0），使用 yarn 更好。

## pnpm

[pnpm](https://pnpm.io/) 相比较 npm/yarn 速度更快，更省磁盘空间。

这里需要吐槽的 `pnpm path` 没有 `patch-package` 使用方便，而且有时候不能正常进行 patch。
