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

参见 [使用 Slither 提高代码质量]({{< ref "posts/ethereum/slither" >}})

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
