---
title: "Solidity"
description: 使用 solidity 开发以太坊智能合约
slug: solidity
date: 2022-05-11T21:49:51+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series:
  - 以太坊开发工具链
  - 以太坊合约开发
categories:
  - ethereum
tags:
  - solidity
---

本文介绍如何使用 solidity 开发智能合约。

<!--more-->

## 概述

[solidity](https://soliditylang.org/) 是一种静态类型的、面向合约的高级语言，用于在以太坊平台上实现智能合约。

- [官方文档](https://docs.soliditylang.org/zh/latest/index.html)
- [中文文档](https://docs.soliditylang.org/zh/latest/)
- [使用 foundry chisel 交互式工具]({{< ref "../foundry#chisel" >}}) 学习语法

## 示例代码

{{< gist phenix3443 868da315757b9f430b417d27b297b3a6 >}}

## 编译器

solidity 源码需要通过 [solc](https://docs.soliditylang.org/zh/latest/installing-solidity.html) 编译后才可以由 [evm]({{< ref "../evm" >}}) 执行。虽然很多工具，如 [hardhat]({{< ref "../hardhat" >}})、[foundry]({{< ref "../foundry" >}}) 可以直接编译部署，但是了解 [编译器的配置](https://docs.soliditylang.org/zh/latest/using-the-compiler.html) 更有助于理解这些工具的相关设置。

## code style

[官方推荐的代码风格](https://docs.soliditylang.org/zh/latest/natspec-format.html#natspec)

### lint code

通过 [solhint]({{< ref "../solhint" >}}) 来检查代码。

### lint commit

通过 [commitlint]({{< ref "../../conventional-commit" >}}) 规范项目的 commit message。

```shell
npm install --save-dev @commitlint/cli @commitlint/config-conventional
```

### format code

[Prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity) 是一款用于 solidity 文件的 [Prettier]({{< ref "../../prettier" >}}) 插件，可与 [solhint]({{< ref "../solhint" >}}) 协同工作。它能帮助自动修复 Solhint 发现的许多错误，尤其是缩进和代码样式等简单错误。

```shell
npm install --save-dev prettier prettier-plugin-solidity
```

将下面的配置添加到 `.solhint.json` 对应的位置：

{{< gist phenix3443 d87cf11df0bcf9c448f43488639a7ed8 >}}

对应的也需要更新 prettier 配置：

{{< gist phenix3443 b6d390da5db39688195118b20d3d0c54 >}}

package.json 添加用于格式化项目中的 solidity 文件的 script：

```json
{
  "format:sol": "prettier --write src/**/*.sol script/**/*.sol test/**/*.sol"
}
```

### 自动化

通过 [husky]({{< ref "../../husky" >}}) 将上面的这些操作自动化。

```shell
npx husky add .husky/pre-commit "npm run format:sol"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
```

## vscode 扩展

- [Juan Blanco Solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)

- [Nomic Foundation Solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)，

  - 有更多实用的功能，比如自动修复 SPDX 声明等。
  - 当前版本 (0.7.3) 直接导入 (direct import) 查找路径是 `./node_modules`， 这个不能指定就太难受了，也不能支持 import 声明中文件的跳转，不推荐使用。

- [Solidity Contract Flattener](https://marketplace.visualstudio.com/items?itemName=tintinweb.vscode-solidity-flattener)
- [Solidity Visual Developer](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor) 为 Visual Studio Code 提供了以安全为中心的语法和语义高亮显示、详细的类大纲、专门的视图、高级 Solidity 代码洞察和增强。

## 集成测试工具

[foundry]({{< ref "../foundry" >}}) 相比 [hardhat]({{< ref "../hardhat" >}}) 编译合约更加快速，也不用额外学习 js/ts 脚本来部署和编写测试用例。

## 延伸阅读

- [Consensys 的最佳实践](https://consensys.github.io/smart-contract-best-practices/) 相当广泛，包括可以学习的 [成熟模式](https://consensys.github.io/smart-contract-best-practices/development-recommendations/) 和可以避免的 [已知陷阱](https://consensys.github.io/smart-contract-best-practices/attacks/)

## Next

- [hardhat]({{< ref "../hardhat" >}})
- [foundry]({{< ref "../foundry" >}})
