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

要同时使用 [Solhint]({{< ref "../solidity-lint" >}})  和 Prettier 来处理 Git 提交中更改的 Solidity 文件，你需要在 lint-staged 配置中指定这两个工具。这样，在每次提交前，改动的 Solidity 文件将首先被 Solhint 检查，然后由 Prettier 格式化。以下是配置这些工具的步骤：

```sh
npm install solhint prettier prettier-plugin-solidity lint-staged  @commitlint/cli @commitlint/config-conventional --save-dev
```

- [commitlint]({{< ref "../../conventional-commit" >}}) 规范项目的 commit message。
- [Prettier-plugin-solidity](https://github.com/prettier-solidity/prettier-plugin-solidity) 是一款用于 solidity 文件的 [Prettier]({{< ref "../../prettier" >}}) 插件，用于自动格式化 solidity 代码。

接下来，在你的 package.json 文件中设置 lint-staged 来指定在提交包含特定文件类型时运行 Prettier：

```json
Copy code
"lint-staged": {
  "*.{js,jsx,ts,tsx}": "prettier --write",
  "*.md": "prettier --write"
}
```

通过 [husky]({{< ref "../../husky" >}}) 将上面的这些操作自动化。以便在每次提交前运行 lint-staged 和 commit 检查 ：

````sh
npx husky install
npx husky add .husky/pre-commit "npx lint-staged"
npx husky add .husky/commit-msg 'npx --no -- commitlint --edit "$1"'
````

对应的也需要更新 prettier 配置：

{{< gist phenix3443 b6d390da5db39688195118b20d3d0c54 >}}

## vscode 扩展

### Juan Blanco Solidity

推荐安装。

[Juan Blanco Solidity](https://marketplace.visualstudio.com/items?itemName=JuanBlanco.solidity) 提供代码高亮，自动补全等功能。

该扩展将自己作为 solidity 文件的默认 formatter，但是不能支持 format-on-save，我们需要在 vscode 配置中做如下修改：

```json
"[solidity]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
```

### Nomic Foundation Solidity

[Nomic Foundation Solidity](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity)，

- 有更多实用的功能，比如自动修复 SPDX 声明等。
- 当前版本 (0.7.3) 直接导入 (direct import) 查找路径是 `./node_modules`， 这个不能指定就太难受了，也不能支持 import 声明中文件的跳转，不推荐使用。

### Solidity Visual Developer

推荐安装。

[Solidity Visual Developer](https://marketplace.visualstudio.com/items?itemName=tintinweb.solidity-visual-auditor) 为 Visual Studio Code 提供：

- 以安全为中心的语法和语义高亮显示
- inline codelens，图示调用、继承关系，UML 展示
- Code Augmentation / Annotations / Hover / Tooltip
- 详细的 outline。
- 通过 [surya](https://github.com/ConsenSys/surya) 输出专门的视图，Surya 是一款用于智能合约系统的实用工具。它提供大量可视化输出和合约结构信息。它还支持以多种方式查询函数调用图，以帮助人工检查合约。

  - graph 输出调用视图。
  - ftrace 命令输出一个树状的函数调用跟踪，该跟踪源于定义的 "CONTRACT::FUNCTION"，并遍历 "所有|内部|外部 "类型的调用。外部调用用橙色标记，内部调用不着色。
  - uml 生成类图。该功能依赖 [PlantUML](https://plantuml.com/zh/)，macos 安装：

    ```shell
    brew install --cask temurin
    brew install graphviz
    ```

- 高级 Solidity 代码洞察和增强。
- flatten 命令输出源代码的 flatten 版本，所有导入语句都替换为相应的源代码。引用已导入文件的导入语句将被简单地注释掉。

## 集成测试工具

### foundry

[foundry]({{< ref "../foundry" >}}) 相比 [hardhat]({{< ref "../hardhat" >}}) 编译合约更加快速，也不用额外学习 js/ts 脚本来部署和编写测试用例。

## 第三方库

### OpenZepplin

[OpenZepplin]({{< ref "../openzeppelin" >}}) 是合约开发的常用库，提前安装。

```shell
pnpm install @openzeppelin/contracts @openzeppelin/contracts-upgradeable
```

## 延伸阅读

- [Consensys 的最佳实践](https://consensys.github.io/smart-contract-best-practices/) 相当广泛，包括可以学习的 [成熟模式](https://consensys.github.io/smart-contract-best-practices/development-recommendations/) 和可以避免的 [已知陷阱](https://consensys.github.io/smart-contract-best-practices/attacks/)

## contract-starter

[contract-starter](https://github.com/phenix3443/contract_starter) 包含了上面所有的配置，可以直接 [使用该项目作为合约项目的仓库模板](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template)。

## Next
