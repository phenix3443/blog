---
title: Solidity Lint
description: 使用 solhint 规范 solidity 代码
slug: solhint
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

[solhint](https://github.com/protofire/solhint) 和 [ethlint](https://github.com/duaraghav8/Ethlint) 都是 Solidity [linting](<https://en.wikipedia.org/wiki/Lint_(software)>) 工具，但从 [nmm trends](https://npmtrends.com/ethlint-vs-solhint-vs-solium) 可以看出 solhint 使用次数遥遥领先。所以选择 solhint 作为 lint 工具。

## 使用

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
