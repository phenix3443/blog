---
title: "Foundry"
description:
slug: 使用 foundry 编写智能合约
date: 2023-03-15T10:17:15+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series: [以太坊开发工具链]
categories: ["以太坊"]
tags: ["ethereum", "foundry", "solidity", "smart-contract", "testing"]
---

本文介绍如何使用 Foundry 编写智能合约。

<!--more-->

## 概述

[foundry](https://github.com/foundry-rs/foundry) 是用 Rust 编写的用于以太坊应用程序开发的快速、可移植和模块化工具包。包括：

foundry 由以下部分组成：

- [Forge](https://github.com/foundry-rs/foundry/blob/master/forge): 以太坊测试框架（类似 Truffle, Hardhat 和 DappTools）。
- [Cast](https://github.com/foundry-rs/foundry/blob/master/cast): 用于与 EVM 智能合约互动，发送交易和获取链上数据，可用于合约调试。
- [Anvil](https://github.com/foundry-rs/foundry/blob/master/anvil): 本地以太坊节点，类似于 Ganache、Hardhat 网络。
- [Chisel](https://github.com/foundry-rs/foundry/blob/master/chisel): 快速、实用、详细的 solidity [REPL](https://www.zhihu.com/question/53865469)。

### 特色

- [快速](https://github.com/foundry-rs/foundry#how-fast) 灵活的编译管道。
  - 自动检测和安装 Solidity 编译器版本（在 ~/.svm 下）。
  - 增量编译和缓存：只对更改的文件进行重新编译。
  - 并行编译。
  - 支持非标准目录结构（如 [Hardhat repos](https://twitter.com/gakonst/status/1461289225337421829)）。
- 用 Solidity 编写测试（与 DappTools 类似），可有效减少上下文切换。相比 `hardhat+ethers` 合约使用 solidity，而部署测试等使用 js 或者 ts，而对于 foundry 工具，合约、部署、测试等都使用 solidity，不需要在多种编程语言之间进行切换。
- 通过缩小输入和打印反例进行快速模糊测试。
- 快速远程 RPC 分叉模式，利用类似 tokio 的 Rust 异步基础架构。
- 灵活的调试日志
  - DappTools 风格，使用 `DsTest` 输出的日志
  - Hardhat 风格，使用流行的 `console.sol` 合约
- 便携（5-10MB）且易于安装，无需 Nix 或其他软件包管理器
- 通过 [Foundry GitHub](https://github.com/foundry-rs/foundry-toolchain) 操作实现快速 CI。

## 安装

```shell
curl -L https://foundry.paradigm.xyz | bash
```

这将安装 `fourndryup`，然后只需按照屏幕上的说明进行操作，执行 `fourndryup` 命令将安装 foundry 的其他组件。

### 自动补全

foundry 带有 [shell 自动补全](https://book.getfoundry.sh/config/shell-autocompletion) 功能。

添加 [zsh 自动补全]({{< ref "posts/zsh/#auto-completion" >}})：

```shell
forge completions zsh > $(brew --prefix)/share/zsh/site-functions/_forge
cast completions zsh > $(brew --prefix)/share/zsh/site-functions/_cast
anvil completions zsh > $(brew --prefix)/share/zsh/site-functions/_anvil
```

## 配置

{{< gist phenix3443 333a25e2168cdba73ca7098efd95c8a4 >}}

我并不喜欢 foundry 使用 git 来管理依赖，这会导致很多问题：

- mono 项目中依赖难以升级。
- 依赖的 import 路径与 repository name 不一致，需要额外编写 remappings.txt 来解决。

结合 npm 管理依赖是更好的解决办法。

## forge

### 创建项目

### 管理依赖

forge 默认使用 [git 子模块](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E5%AD%90%E6%A8%A1%E5%9D%97) 管理依赖项，这意味着它可以与任何包含智能合约的 GitHub 存储库配合使用。

但是个人认为这里不应该这样使用，这样的设计很不利于 mono 项目，试想一下，mono 中 project-A 的依赖项配置位于整个 mono project 的 root-dir 下面，想想就不合理，而且添加和更新依赖也会遇到一系列的 [问题](https://github.com/foundry-rs/foundry/issues/3720)。

git submodules 不应该做 package manager 的事情。

### 编译

```shell
% forge build
[⠢] Compiling...The application panicked (crashed).
Message:  checksum not found
Location: /Users/runner/.cargo/git/checkouts/ethers-rs-c3a7c0a0ae0fe6be/8c5c248/ethers-solc/src/compile/mod.rs:463

This is a bug. Consider reporting it at https://github.com/foundry-rs/foundry

Backtrace omitted. Run with RUST_BACKTRACE=1 environment variable to display it.
Run with RUST_BACKTRACE=full to include source snippets.
zsh: abort      forge build
```

如果出现上面的报错，需要在配置文件中设置`solc_version`。

### 测试

一个好的做法是将 `test_Revert[If|When]_Condition` 与 `expectRevert` cheatcode 结合使用（下一节将更详细地解释作弊代码）。

#### 不变量测试 (invariant test)

不变式测试允许对一组不变式表达式进行测试，测试的对象是来自预定义合约的预定义函数调用随机序列。在执行每次函数调用后，都会对所有已定义的不变式进行断言。

不变式测试是暴露协议中不正确逻辑的有力工具。由于函数调用序列是随机的，并且有模糊输入，因此不变式测试可以揭示边缘情况和高度复杂协议状态中的错误假设和不正确逻辑。

不变式测试活动有两个维度：运行和深度：

运行：函数调用序列生成和运行的次数。
深度：特定运行中函数调用的次数。每次函数调用后，都会断言所有已定义的不变式。如果函数调用回退，深度计数器仍会递增。
此处将对这些变量和其他不变式配置方面进行说明。

与在 Foundry 中运行标准测试时在函数名前缀上 test 相似，不变式测试也是在函数名前缀上 invariant（例如，函数 invariant_A()）。

配置不变式测试的执行
用户可通过 Forge 配置原语控制不变式测试的执行参数。配置可以全局应用，也可以按测试应用。有关此主题的详细信息，请参阅 📚 全局配置 和 📚 在线配置。

#### 差异测试 (Differential Testing)

Forge 可用于 differential testing 和 differential fuzzing。甚至可以使用 [ffi cheatcode](https://book.getfoundry.sh/cheatcodes/ffi.html) 对非 EVM 可执行文件进行测试。

##### 背景

[differential testing](https://en.wikipedia.org/wiki/Differential_testing) 通过比较每个函数的输出，交叉引用同一函数的多个实现。假设我们有一个函数规范 F(X)，以及该规范的两个实现：f1(X) 和 f2(X)。我们希望 `f1(x) == f2(x)` 适用于输入空间中的所有 x。如果 `f1(x) != f2(x)`，我们就知道至少有一个函数错误地实现了 F(X)。这个测试相等性和识别差异的过程是 differential testing 的核心。

differential fuzzing 是 differential testing 的扩展。differential fuzzing 以编程方式生成许多 x 值，以发现人工选择的输入可能无法揭示的差异和边缘情况。

> 注意：这里的 `==` 运算符可以是自定义的相等定义。例如，如果测试浮点实现，可以使用具有一定容差的近似相等。

这类测试在现实生活中的一些应用包括：

- 比价升级前后的实现
- 根据已知参考实现测试代码
- 确认与第三方工具和依赖关系的兼容性

以下是 Forge 用于差异测试的一些示例。

入门： ffi 作弊码

[ffi](https://book.getfoundry.sh/cheatcodes/ffi.html) 允许您执行任意 shell 命令并捕获输出。这是一个模拟示例：

#### Script{#forge_script}

### 部署

可以通过 [forge create](https://book.getfoundry.sh/reference/forge/forge-create) 命令部署合约：

{{< gist phenix3443 868da315757b9f430b417d27b297b3a6 >}}
{{< gist phenix3443 5ea8620ec1457eeaa5d3316180b7ba14 >}}
{{< gist phenix3443 d4bd06898a1e22af839a777e970369ae >}}

但是 `forge create` 命令不支持动态链接：如果代码引入了库合约，应该预部署库合约，并通过 `--libraries` 手动指定库合约的地址，这无疑是件麻烦的事情。

[Solidity Script](https://book.getfoundry.sh/tutorials/solidity-scripting) 是一种使用 Solidity 声明式部署合约的方法，相比较`forge create`限制更少，也更加友好。

{{< gist phenix3443 63a443fea5660f37a7343fae51dc9e38 >}}

{{< gist phenix3443 b2086c7e86b8c127e3503304a87f1fb0 >}}

{{< gist phenix3443 6e14fec106f1909ba4091219d27d8422 >}}

{{< gist phenix3443 e176ea52c457d3157f4c3ff50c3bd7fa >}}

{{< gist phenix3443 b254a4c5718fbaba5cffa730eaca41d4 >}}

## Cast

### 查看余额

```shell
cast balance --rpc-url http://127.0.0.1:8545 -e 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

```shell
9999.999590116000000000
```

### 查看交易

```shell
cast tx --rpc-url http://127.0.0.1:8545 0xab10eb28fa2bb1ecc0641c73a14a59e7d594f6c35efa322921b9158461eb6dec --json
```

查看上面合约部署的结果：

```json
{
  "hash": "0xab10eb28fa2bb1ecc0641c73a14a59e7d594f6c35efa322921b9158461eb6dec",
  "nonce": "0x0",
  "blockHash": "0xfadb58bc05550d9e061a7b49982ce9dba7f84b0cc6af161b1115fc41919b3e51",
  "blockNumber": "0x1",
  "transactionIndex": "0x0",
  "from": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
  "to": null,
  "value": "0x0",
  "gasPrice": "0xee6b2800",
  "gas": "0x19e2c",
  "input": "0x608060405234801561001057600080fd5b5060e38061001f6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80633acb315014602d575b600080fd5b604080518082018252600b81526a12195b1b1bc815dbdc9b1960aa1b60208201529051605891906061565b60405180910390f35b600060208083528351808285015260005b81811015608c578581018301518582016040015282016072565b506000604082860101526040601f19601f830116850101925050509291505056fea2646970667358221220b9ff3e936eee55cb18c5673b26d650f22c94dd400af97be41d3d51518c4a29ff64736f6c63430008140033",
  "v": "0x0",
  "r": "0x8de4144ce716a9a063c02631d46684ddca9bd96afe8950942355b224fa60d2c7",
  "s": "0x62738fce4538165b0b67f55c847e96642d28c817cb112cb0cc3a55cc4b8804ac",
  "type": "0x2",
  "accessList": [],
  "maxPriorityFeePerGas": "0xb2d05e00",
  "maxFeePerGas": "0x12a05f200",
  "chainId": "0x7a69"
}
```

### 调用函数

{{< gist phenix3443 7053c482e1b219e8830742ccc0a746bf >}}

更多详细信息参见 [cast reference](https://book.getfoundry.sh/reference/cast/)。

## Anvil

Anvil 是 Foundry 附带的本地测试网节点。可以使用它从前端测试您的合约或通过 RPC 进行交互。类似于 [hardhat network]({{< ref "posts/ethereum/hardhat#network" >}})

anvil 也支持 fork 其他 chain 来方便测试，更多参考 [anvil Reference](https://book.getfoundry.sh/reference/anvil/)。

## Chisel

Chisel 是 Solidity REPL（"读取-评估-打印循环 "的缩写），允许开发人员编写和测试 Solidity 代码片段。它为编写和执行 Solidity 代码提供了一个交互式环境，并为处理和调试代码提供了一套内置命令。这使它成为快速测试和试验 Solidity 代码的有用工具，而无需启动沙箱代工测试套件。

## Next
