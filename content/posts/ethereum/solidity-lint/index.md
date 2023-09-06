---
title: Solidity 静态分析器
description: 使用 solidity 静态分析器规范 solidity 代码
slug: solidity-lint
date: 2023-08-23T14:50:25+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series:
  - 以太坊开发工具链
  - 以太坊合约开发
categories: [ethereum]
tags: [solidity, linter]
images: []
---

本文介绍 solhint 规范 solidity 代码。

<!--more-->

## 概述

## solhint

[solhint](https://github.com/protofire/solhint) 和 [ethlint](https://github.com/duaraghav8/Ethlint) 都是 Solidity [linting](<https://en.wikipedia.org/wiki/Lint_(software)>) 工具，但从 [nmm trends](https://npmtrends.com/ethlint-vs-solhint-vs-solium) 可以看出 solhint 使用次数遥遥领先。所以选择 solhint 作为 lint 工具。

安装：

```shell
npm install --save-dev solhint
```

生成 [配置](https://protofire.github.io/solhint/#configuration) 文件 `.solhint.json`：

```shell
npx solhint --init
```

TL:DR 推荐使用下面的配置：

{{< gist phenix3443 f4877a0043d8f2c13683c4c761754a8e >}}

可以通过 `npx solhint list-rules` 检查配置是否生效。

更多配置规则参见 [solhint Rules](https://protofire.github.io/solhint/docs/rules.html)。

要忽略不需要验证的文件，可以使用 `.solhintignore` 文件。它支持 `.gitignore` 格式的规则。

还可以通过 [注释来控制 solhint 的检查行为](https://protofire.github.io/solhint/#configure-the-linter-with-comments)。

在 package.json 中添加用于 lint 的 script：

```json
{
  "lint:sol": "npx solhint src/**/*.sol script/**/*.sol test/**/*.sol"
}
```

执行 `npm run lint:sol` 来检查代码是否符合配置的规则。

## Slither

[Slither](https://github.com/crytic/slither) 是一个用 Python3 编写的 Solidity 静态分析框架。它运行一套漏洞检测器，打印有关合约细节的可视化信息，并提供一个 API 以轻松编写自定义分析。通过 Slither，开发人员可以查找漏洞，提高代码理解能力，并快速创建自定义分析原型。

### 功能

- 检测易受攻击的 Solidity 代码，误报率低。
- 识别源代码中出现错误的位置。
- 可轻松集成到 CI、Hardhat、Foundry 中。
- 内置 [“printers”](https://github.com/crytic/slither/wiki/Printer-documentation) 可快速报告重要的合约信息。
- 检测器 API，可使用 Python 编写自定义分析程序。
- 能够分析使用 Solidity >= 0.4 编写的合约。
- [Intermediate representation](https://en.wikipedia.org/wiki/Intermediate_representation)（[SlithIR](https://github.com/trailofbits/slither/wiki/SlithIR)）可进行简单、高精度的分析。
- 正确解析 99.9% 的 Solidity 公共代码。
- 每份合约的平均执行时间少于 1 秒。
- 通在 [CI](https://github.com/marketplace/actions/slither-action) 集成 Github 的代码扫描。

### 安装

请注意，需要使用 [solc-select](https://github.com/crytic/solc-select) 将 Slither 使用的 solc 更新为 Forge 使用的相同版本：

```shell
pip3 install slither-analyzer
pip3 install solc-select
solc-select install 0.8.18
solc-select use 0.8.18
```

### 配置

有些选项可以通过 json 配置文件设置。默认配置文件是`slither.config.json`，可通过 `--config-file file.config.json` 更改。

支持以下标志：

{{< gist phenix3443 babf3f1c9a94d0f73a5d9be791640670 >}}

推荐配置：

{{< gist phenix3443 5841a1a06d09d0d0e9942e47b1523b23 >}}

有关详细信息，请参阅 [slither wiki](https://github.com/crytic/slither/wiki/Usage)。

### 使用

```shell
slither .
```

如果你的项目有依赖关系，这是首选，因为 Slither 依赖底层编译框架来编译源代码。

不过，也可以在不导入依赖项的单个文件上运行 Slither：

```shell
slither tests/uninitialized.sol
```

#### 禁用

在某些代码位置禁用检查：

- 在问题前添加 `//slither-disable-next-line DETECTOR_NAME`
- 在代码周围添加 `// slither-disable-start [detector] ...` 在代码周围添加 `// slither-disable-end [detector]` 以禁用大段的检测器
- 在变量声明前添加 `@custom:security non-reentrant`，向 Slither 表明该变量的外部调用是非 reentrant 的。

#### CI

[vscode-slither](https://marketplace.visualstudio.com/items?itemName=trailofbits.slither-vscode) 为 Slither 提供了 Visual Studio 代码集成，该扩展解决了命令行工具不能快速跳转到对应代码行的问题。

[slither-action](https://github.com/marketplace/actions/slither-action) 可以在 GitHub Actions 工作流中针对项目运行 Slither 静态分析器。

## mythril

[mythril](https://github.com/ConsenSys/mythril) 是一款 EVM 字节码安全分析工具。它可以检测为 EVM 兼容区块链构建的智能合约中的安全漏洞。它使用 symbolic execution, SMT solving and taint analysis 来检测各种安全漏洞。[MythX](https://mythx.io/) 安全分析平台也使用该工具（与其他工具和技术相结合）。

建议智能合约开发人员使用 [MythX 工具](https://github.com/b-mueller/awesome-mythx-smart-contract-security-tools)，因为它对可用性进行了优化，并涵盖了更广泛的安全问题。

要使用 mythril 测试项目，这里有一个示例 `mythril.config.json`：

{{< gist phenix3443 d2eb494b8e0bfd8ce8d671d45530685c >}}

### 安装

如果同时使用 mythril 和 slither ，二者都是用 python 编写的，二者在一些依赖上存在版本冲突，所以 mythril 使用 docker 安装和使用。

```shell
docker pull mythril/myth
```

### 使用

```shell
myth analyze src/Contract.sol --solc-json mythril.config.json
```

如果通过 docker 安装：

```shell
docker run -v $(pwd):/code --workdir /code  mythril/myth analyze src/*.sol --solc-json mythril.config.json
```

有关详细信息，请参阅 [mythril 文档](https://mythril-classic.readthedocs.io/en/develop/)。

您可以使用 `--solc-json` 标志将自定义 Solc 编译器输出传递给 Mythril。 例如：
