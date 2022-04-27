---
title: "以太坊合约开发环境 - Mac 篇"
description: develop contract on mac os
date: 2022-04-14T13:52:24+08:00
image: ide.png
math: 
license: 
hidden: false
comments: true
draft: true
categories:
    - 区块链
tags:
    - remix
    - 以太坊
    - Hardhat
    - vscode
    - solidity
    - contract
---

目标：编写合约，部署到测试环境中。

## Geth



## Remix

更多内容参见[使用文档](https://remix-ide.readthedocs.io/en/latest/index.html)

### run on WEB

使用网页版本 `https://remix.ethereum.org/` 

#### Remixd

通过 [remixd](https://www.npmjs.com/package/@remix-project/remixd)  remix 可以直接访问本地文件。

+ 安装 `npm install -g @remix-project/remixd`
+ 检查安装结果：`remixd --version`
  > 0.6.1
+ 启动 remixd `remixd -s <absolute-path> --remix-ide https://remix.ethereum.org`
+ remix-web 连接本地网络。

### run on Local

使用本地版本 `brew install remix-ide`

## VSCode

推荐安装以下扩展：


### solidity

[solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity) 可以用来做代码补全、跳转功能。

### solidity-visual-auditor

[solidity-visual-auditor](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor) 为 Visual Studio Code 提供了以安全为中心的语法和语义高亮显示、详细的类大纲、专门的视图、高级 Solidity 代码洞察和增强。

主要可以用来生成调用图。

## Hardhat
