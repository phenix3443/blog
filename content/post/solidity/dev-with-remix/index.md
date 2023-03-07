---
title: "使用 Solidity + Remix 开发以太坊合约"
description: 使用 Remix 开发合约
slug: solidity-remix
date: 2022-04-14T13:52:24+08:00
image: img/ide.png
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
  - solidity
tags:
  - remix
  - contract
---

## Remix IDE

[Remix IDE](https://remix.ethereum.org/) 是一个 Web App，更多内容参见[官方文档](https://remix-ide.readthedocs.io/en/latest/index.html)

## 合约开发

编写 HelloWorld 程序了解开发过程。

### 编写代码

```solidity
// SPDX-License-Identifier: SimPL-3.0
pragma solidity ^0.8.9;

contract HelloWorld{
    function SayHello() public pure returns(string memory) {
        return "Hello World";
    }
}
```

![code.jpg](img/code.jpg)

### 编译代码

![compile.jpg](img/compile.jpg)

相关选项更详细的信息参考 [Remix Compiler](https://remix-ide.readthedocs.io/en/latest/compile.html)

### 部署合约

![deploy.jpg](img/deploy.jpg)

相关选项更详细的信息参考 [Remix Deploy ](https://remix-ide.readthedocs.io/en/latest/run.html)

### 运行合约

![run.jpg](img/run.jpg)

相关选项更详细的信息参考 [Remix Run](https://remix-ide.readthedocs.io/en/latest/udapp.html)

## Remixd

通过 [remixd](https://www.npmjs.com/package/@remix-project/remixd) remix 可以直接访问本地文件。

- 安装`npm install -g @remix-project/remixd`
- 检查安装结果：`remixd --version`
  > 0.6.1
- 启动 remixd

  `remixd -s <absolute-path> --remix-ide https://remix.ethereum.org`

  或者在项目目录下，直接启动 `remixd`

- remix-web 连接本地网络：

  ![remix-connect-localhost](img/remix-connect-localhost.png)

## Remix Desktop

[Remix Desktop](https://github.com/ethereum/remix-desktop) 是 [Remix IDE](https://remix.ethereum.org/) (Web App) 的 Electron 版本。它适用于 Linux、Windows 和 Mac。 顾名思义，它是一个桌面应用程序 - 因此您可以无缝访问计算机文件系统上的文件。

通过 brew 安装如果不是最新版本不能正常使用，这一点很坑爹，推荐直接通过 [github release](https://github.com/ethereum/remix-desktop/releases) 下载安装。

有 web app 不同：

- 访问您的硬盘

  Web app 在浏览器中运行，如果不使用 remixd，它无法访问您计算机的文件系统。 而使用 Remix Desktop 可以很容易地访问文件系统。

  保存和访问保存在计算机上的文件是 Remix Desktop 的一大优势。

  在 Remix Desktop 中，从 File 菜单（File -> Open Folder）中选择一个文件夹，使其成为文件资源管理器工作区中的活动文件夹。

- 版本控制 & 文件夹容量

  使用 Remix Desktop，版本控制就像使用任何其他桌面 IDE 一样。同样，工作区文件夹的大小受计算机硬盘驱动器的限制。在 Remix IDE (web app) 中，工作区文件夹的大小受浏览器本地存储大小的限制。有一些技术可以在浏览器中进行版本控制（例如使用 remixd 或 DGIT 插件），但这些都是针对浏览器固有限制的变通方法。

- 使用 Injected Web3 和 Metamask 部署到公共测试网

  Remix Desktop 无法访问 Metamask（浏览器插件），因此部署到公共链目前涉及使用 Wallet Connect 插件。Remix IDE 可以轻松访问 Metamask 浏览器插件。

但是我在使用的时候遇到不能打开本地文件夹的情况，如下图：

![remix-desktop-can-not-use](img/remix-desktop-empty.png)

所以暂时还是推荐浏览器配合 remixd 使用。
