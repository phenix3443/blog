---
title: "Node.js Pieces"
description: "Nodejs 拾遗"
date: 2023-02-22T22:45:03+08:00
slug: nodejs-pieces
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
  - nvm
---

## Node.js

[Node.js](https://nodejs.org/zh-cn/) 是一个开源、跨平台的 JavaScript 运行时环境。

## nvm

[nvm](https://github.com/nvm-sh/nvm) 可以用来管理当前 `shell` 使用的 Nodejs 版本。

常用命令：

- 查看可安装版本: `nvm ls-remote`
- 查看已安装版本：`nvm ls`
- 安装指定版本 Nodejs: `nvm install <version>`，比如最新的 `lts` 版本：`nvm install --lts`
- 使用指定版本: `nvm use --lts`，项目中可以使用 [.nvmrc](https://github.com/nvm-sh/nvm#nvmrc) 文件进行版本控制。
- 显示当前使用版本: `nvm current`
- 在指定版本上运行 `command` ：`nvm exec [<version>] [<command>]`,如果使用了 `.nvmrc` 文件，`version`参数可以不用指定，比如 `nvm exec yarn start`
- Run `node` on `version` with `args` as arguments. `nvm run [<version>] [<args>]`, Uses `.nvmrc` if available and version is omitted.
- 取消当前 `shell` 行的 nvm 效果：`nvm deactivate`

```shell
Example:
  nvm install 8.0.0                     Install a specific version number
  nvm use 8.0                           Use the latest available 8.0.x release
  nvm run 6.10.3 app.js                 Run app.js using node 6.10.3
  nvm exec 4.8.3 node app.js            Run `node app.js` with the PATH pointing to node 4.8.3
  nvm alias default 8.1.0               Set default node version on a shell
  nvm alias default node                Always default to the latest available node version on a shell

  nvm install node                      Install the latest available version
  nvm use node                          Use the latest version
  nvm install --lts                     Install the latest LTS version
  nvm use --lts                         Use the latest LTS version
```

更多用法参考[使用说明](https://github.com/nvm-sh/nvm#usage)。
