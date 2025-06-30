---
title: Slither
description: 使用 slither 提高合约代码质量
slug: slither
date: 2024-01-26T16:27:19+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series:
  - 以太坊开发工具链
  - 以太坊合约开发
categories: [ethereum]
tags: [solidity, linter, security]
images: []
---

## 概述

[Slither](https://github.com/crytic/slither) 是一个用 Python3 编写的 Solidity 静态分析框架。它运行一套漏洞检测器，打印有关合约细节的可视化信息，并提供一个 API 以轻松编写自定义分析。通过 Slither，开发人员可以查找漏洞，提高代码理解能力，并快速创建自定义分析原型。

## 功能

- 检测易受攻击的 Solidity 代码，误报率低。
- 识别源代码中出现错误的位置。
- 可轻松集成到 CI、Hardhat、Foundry 中。
- 内置 [“printers”](https://github.com/crytic/slither/wiki/Printer-documentation) 可快速报告重要的合约信息。printer 可以理解是各种合约细节的输出工具，例如调用图、继承图、函数 ID、数据依赖，函数简介等。
- 检测器 API，可使用 Python 编写自定义分析程序。
- 能够分析使用 Solidity >= 0.4 编写的合约。
- [中间表示](https://en.wikipedia.org/wiki/Intermediate_representation)（[SlithIR](https://github.com/trailofbits/slither/wiki/SlithIR)）可进行简单、高精度的分析。
- 正确解析 99.9% 的 Solidity 公共代码。
- 每份合约的平均执行时间少于 1 秒。
- 通在 [CI](https://github.com/marketplace/actions/slither-action) 集成 Github 的代码扫描。

## 安装

请注意，需要使用 [solc-select](https://github.com/crytic/solc-select) 将 Slither 使用的 solc 更新为 Forge 使用的相同版本：

```shell
pip3 install slither-analyzer
pip3 install solc-select
solc-select install 0.8.18
solc-select use 0.8.18
```

## 使用

```shell
slither .
```

如果你的项目有依赖关系，这是首选，因为 Slither 依赖底层编译框架来编译源代码。

不过，也可以在不导入依赖项的单个文件上运行 Slither：

```shell
slither tests/uninitialized.sol
```

### 配置

有些选项可以通过 json 配置文件设置。默认配置文件是`slither.config.json`，可通过 `--config-file file.config.json` 更改。

支持以下标志：

{{< gist phenix3443 babf3f1c9a94d0f73a5d9be791640670 >}}

推荐配置：

{{< gist phenix3443 5841a1a06d09d0d0e9942e47b1523b23 >}}

- 更多使用方法请参阅 [slither wiki](https://github.com/crytic/slither/wiki/Usage)。
- [detectors](https://github.com/crytic/slither/wiki/Detector-Documentation)。
- [printers](https://github.com/crytic/slither/wiki/Printer-documentation)。

## 禁用

在某些代码位置禁用检查：

- 在问题前添加 `//slither-disable-next-line DETECTOR_NAME`
- 在代码周围添加 `// slither-disable-start [detector] ...` 在代码周围添加 `// slither-disable-end [detector]` 以禁用大段的检测器
- 在变量声明前添加 `@custom:security non-reentrant`，向 Slither 表明该变量的外部调用是非 reentrant 的。

## CI

- [vscode-slither](https://marketplace.visualstudio.com/items?itemName=trailofbits.slither-vscode) 为 Slither 提供了 Visual Studio 代码集成，该扩展解决了命令行工具不能快速跳转到对应代码行的问题。

- [slither-action](https://github.com/marketplace/actions/slither-action) 可以在 GitHub Actions 工作流中针对项目运行 Slither 静态分析器。
