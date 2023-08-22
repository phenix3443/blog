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

## example

{{< gist phenix3443 868da315757b9f430b417d27b297b3a6 >}}

## 编译器

solidity 源码需要通过 [solc](https://docs.soliditylang.org/zh/latest/installing-solidity.html) 编译后才可以由 [evm]({{< ref "../evm" >}}) 执行。虽然很多工具，如 [hardhat]({{< ref "../hardhat" >}})、[foundry]({{< ref "../foundry" >}}) 可以直接编译部署，但是了解 [编译器的配置](https://docs.soliditylang.org/zh/latest/using-the-compiler.html) 更有助于理解这些工具的相关设置。

## linters

[solhint](https://github.com/protofire/solhint) 和 [ethlint](https://github.com/duaraghav8/Ethlint) 都是 Solidity [linting](<https://en.wikipedia.org/wiki/Lint_(software)>) 工具，但从 [nmm trends](https://npmtrends.com/ethlint-vs-solhint-vs-solium) 可以看出 solhint 使用次数遥遥领先。所以选择 solhint 作为 lint 工具。

### solhint

```shell
npm install --save-dev solhint
```

#### config

创建配置文件 `.solhint.json`:

```shell
npx solhint --init
```

推荐配置，其中 prettier 参见：

{{< gist phenix3443 f4877a0043d8f2c13683c4c761754a8e >}}

更多配置规则参见 [solhint Rules](https://protofire.github.io/solhint/docs/rules.html)。

要忽略不需要验证的文件，可以使用 `.solhintignore` 文件。它支持 `.gitignore` 格式的规则。

#### script

编辑 package.json 以包含用于运行 Solhint 的新脚本：

```json
"lint:sol": "npx solhint src/**/*.sol scripts/**/*.sol",
```

执行 `npm run lint:sol` 来检查代码是否符合配置的规则。

## Formatters

### code style

[官方推荐的代码风格](https://docs.soliditylang.org/zh/latest/natspec-format.html#natspec)

### prettier

[Prettier]({{< ref "../../prettier" >}}) 能根据预定义的风格指南自动格式化代码库。

[Prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity) 是一款用于 solidity 文件的 Prettier，可与 Solhint 协同工作。它能帮助自动修复 Solhint 发现的许多错误，尤其是缩进和代码样式等简单错误。

```shell
npm install --save-dev prettier prettier-plugin-solidity
```

然后更新 ./solhint.json 以将 Prettier 添加为插件和规则 (L9、L11-13)。

{{< gist phenix3443 d87cf11df0bcf9c448f43488639a7ed8 >}}

`.prettierrc.yaml` ：
{{< gist phenix3443 b6d390da5db39688195118b20d3d0c54 >}}

package.json 添加 script:

```json
"format:sol": "prettier --write src/**/*.sol scripts/**/*.sol"
```

### git-hook

通过 [husky](https://www.npmjs.com/package/husky) 添加 git-hook。

```shell
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
npm pkg set scripts.prepare="husky install"
npx run prepare
npx husky add .husky/pre-commit "npm run format:sol"
```

## vscode 扩展

- [Juan Blanco Solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity)

  - 当前版本（v0.0.165）与 [prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) 扩展有冲突，不能使用`format on save`，详见 [prettier formatter not work if there is a prettier-vscode config file](https://github.com/juanfranblanco/vscode-solidity/issues/417)。推荐使用 `forge fmt` 作为 default formatter。

- [Nomic Foundation Solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)，

  - 有更多实用的功能，比如自动修复 SPDX 声明等。
  - 当前版本 (0.7.3) 直接导入 (direct import) 查找路径是 `./node_modules`， 这个不能指定就太难受了。

- [solidity-visual-auditor](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor) 为 Visual Studio Code 提供了以安全为中心的语法和语义高亮显示、详细的类大纲、专门的视图、高级 Solidity 代码洞察和增强。

主要可以用来生成调用图。

## 工具链

- [hardhat]({{< ref "../hardhat" >}})
- [foundry]({{< ref "../foundry" >}})

## 延伸阅读

- [Consensys 的最佳实践](https://consensys.github.io/smart-contract-best-practices/) 相当广泛，包括可以学习的 [成熟模式](https://consensys.github.io/smart-contract-best-practices/development-recommendations/) 和可以避免的 [已知陷阱](https://consensys.github.io/smart-contract-best-practices/attacks/)

## Next

- [hardhat]({{< ref "../hardhat" >}})
- [foundry]({{< ref "../foundry" >}})
