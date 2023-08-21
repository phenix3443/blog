---
title: Write Upgradeable Contract
description: 编写可升级的智能合约
slug: write-upgradeable-contract
date: 2023-08-21T11:23:41+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: [以太坊合约开发]
categories: [ethereum]
tags: [solidity, contract, upgradeable, OpenZeppelin]
images: []
---

本文我们将学习构建可升级智能合约背后的基本设计原则。最后，你应该明白我们为什么要升级智能合约，如何升级智能合约，以及升级时需要考虑哪些问题。

<!--more-->

## 合约升级

区块链是不可变的，这是区块链技术的核心原则之一。以太坊区块链上存储的数据，包括部署到区块链上的智能合约，也是不可变的。

在深入探讨如何升级智能合约的细节之前，我们先来想想为什么要升级智能合约：

- 修复漏洞。
- 改进功能。
- 修改不再需要或不再有用的功能。
- 优化代码以更有效地使用以太坊 gas。
- 应对技术、市场或社会的演变。
- 无需将整个社区的用户迁移到新版本的应用程序。

只要有足够的时间，大多数东西都需要进行一些修复工作。但区块链上存储的数据是不可变的。那么，智能合约如何才能升级呢？

简而言之，智能合约本身无法改变--一旦部署到区块链上，它们就是永久不可改变的。但一个 dApp 可以设计成由一个或多个智能合约共同运行，以作为其“后端 (backend)”。这意味着我们可以升级这些智能合约之间的交互模式。升级智能合约并不意味着我们要修改已部署的智能合约的代码，而是意味着我们要把一个智能合约换成另一个。我们这样做的方式（在大多数情况下）意味着最终用户无需改变他们与 dApp 的交互方式。

因此，升级智能合约实际上就是**用新的智能合约替代旧的智能合约**。实际上，新的智能合约会被使用，而旧的智能合约会被“抛弃”在链上，因为它们是不可变的。

## 如何升级

智能合约通常通过使用一种名为 [代理模式 (Proxy Pattern)](https://en.wikipedia.org/wiki/Proxy_pattern) 的软件架构模式进行升级。简而言之，代理是更大软件系统中的一个软件，它代表系统的另一部分。在传统的 Web2 计算中，代理位于客户端应用程序和服务器应用程序之间。正向代理代表客户端应用程序，反向代理代表服务器应用程序。

在智能合约的世界里，代理更像是一个反向代理，代表另一个智能合约行事。它是一种 [中间件 (middleware)](https://zh.wikipedia.org/wiki/%E4%B8%AD%E9%97%B4%E4%BB%B6)，可以将前端传入的流量重定向到系统后端的正确智能合约。作为一个智能合约，代理拥有自己的以太坊合约地址，该地址是 “稳定的”（即不变的）。因此，可以更换系统中的其他智能合约，只需用新部署的智能合约的正确地址更新代理智能合约即可。dApp 的最终用户直接与代理进行交互，而与其他智能合约的交互只能通过代理间接进行。

因此，在智能合约开发中，代理模式是通过以下两部分实现的：

- 代理智能合约（`proxy smart contract`）
- 执行合约 (`execution contract`)，也称为逻辑合约 (`logic contract`) 或实现合约 (`implementation contract`)。

在本文中，我们将分别把这些元素称为代理合约和逻辑合约。

代理模式有三种常见的变体，我们将在下文中讨论。

## 简单代理模式

简单代理模式 (Simple Proxy Pattern) 的结构如下所示。

![simple proxy pattern](https://blog.chain.link/wp-content/uploads/2022/11/End-user-proxy-contract-and-logic-contract.png)

让我们深入了解一下它的工作原理。

在 EVM 中，有一种叫做“执行上下文 (`execution context`)”的东西，可将其视为代码执行的空间。

因此，代理合约有自己的执行上下文，所有其他智能合约也是如此。代理合约也有自己的存储空间，数据和以太坊余额都永久存储在区块链上。智能合约持有的数据和余额被称为 [“状态 (state)”](https://ethereum.org/en/developers/docs/evm/#state)，状态是其执行上下文的一部分。

代理合约使用 storage 变量来跟踪组成 dApp 的其他智能合约的地址。这就是它如何重定向交易并调用相关智能合约的方法。

不过，要把 [消息调用 (message calls)](https://docs.soliditylang.org/zh/latest/introduction-to-smart-contracts.html#index-12) 传递给正确的合约，还有一个巧妙的技巧。代理合约并不只是对逻辑合约进行普通的函数调用，它还使用了一种叫做 [委托调用（delegatecall）](https://docs.soliditylang.org/zh/latest/introduction-to-smart-contracts.html#index-13) 的方法。 委托调用与普通函数调用类似，只不过目标地址的代码是在调用合约的上下文中执行的。如果逻辑合约的代码更改了 storage 变量，这些更改就会反映在代理合约的存储变量中，即反映在代理合约的状态中。

那么，委托调用逻辑在代理合约中处于什么位置呢？答案就在代理合约的 [fallback 函数](https://docs.soliditylang.org/zh/latest/contracts.html#fallback) 中。当代理合约收到它不支持的函数调用时，代理合约的 fallback 函数将被调用来处理该函数。代理合约在其 fallback 函数中使用自定义逻辑，将调用重定向到逻辑合约。

将这一原则应用于代理和逻辑合约，delegatecall 将调用逻辑合约的代码，但该代码会在代理合约的执行上下文中运行。这意味着逻辑合约中的代码有权更改代理合约中的状态--它可以更改 [状态变量](https://docs.soliditylang.org/zh/latest/structure-of-a-contract.html#structure-state-variables) 和存储在代理合约中的其他数据。这就有效地将应用程序的状态与执行的代码分离开来。代理合约有效地保存了 dApp 的所有状态，这意味着可以在不丢失状态的情况下更改逻辑。

现在，在 EVM 中，应用程序状态和应用程序逻辑已经解耦，我们可以通过更改逻辑合约来升级应用程序，并将新地址交给代理合约。但应用程序的状态不会受到升级的影响。

使用代理时，我们需要注意两个常见问题。

一个是 [存储碰撞（storage collisions）](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#unstructured-storage-proxies)，另一个是 [代理选择器冲突（proxy select clashing）](https://medium.com/nomic-foundation-blog/malicious-backdoors-in-ethereum-proxies-62629adf3357)。可以阅读链接中关于存储碰撞的文章了解更多信息，但现在我们将重点关注选择器冲突，因为它们是我们要研究的代理模式的根本原因。

如前所述，代理将所有函数调用委托给逻辑合约。但是，代理合约本身也有函数，这些函数是其内部函数，也是其运行所必需的。例如，代理合约需要一个类似 `upgradeTo(address newAdd)` 的函数来升级到新逻辑合约的地址。那么，如果代理合约和逻辑合约的函数具有相同的名称和签名（参数和类型），会发生什么情况呢？代理合约如何知道是调用自己的函数还是`delegatecall`逻辑合约调用？这就是所谓的 “代理选择器冲突“，它是一个可以被利用的安全漏洞，或者至少是一个恼人错误的根源。

从技术上讲，即使名称不同，这种冲突也可能发生在函数之间。这是因为每个可公开调用的函数（可在 [ABI](https://blog.chain.link/what-are-abi-and-bytecode-in-solidity/) 中定义的函数）在字节码级别都由 [一个长度为四个字节的标识符](https://docs.soliditylang.org/zh/latest/abi-spec.html#function-selector) 来标识。由于只有四个字节，因此从技术上讲，两个完全不同的函数签名的前四个字节有可能恰好相同，从而为不同的函数签名产生相同的标识符，导致冲突。

幸运的是，当冲突是由同一合约中的函数签名产生时，Solidity 编译器可以检测到这种子类型的选择器冲突；但当冲突发生在不同合约之间时，则无法检测到。例如，如果冲突发生在代理合约和逻辑合约之间，编译器将无法检测到，但在同一代理合约内，编译器会检测到冲突。

解决这个问题的方法就是 “透明 (transparent)”代理模式，[Open Zeppelin 已经推广了这种模式](https://blog.openzeppelin.com/the-transparent-proxy-pattern)。

## 透明代理模式{#transparent}

透明代理模式 (Transparent Proxy Pattern) 是指终端用户（调用者）发起的函数调用总是被路由到逻辑合约而不是代理合约。但是，如果调用者是代理的管理员，代理就会知道要调用自己的管理功能。这很直观，因为只有管理员才能调用代理合约中的管理功能来管理升级和其他管理任务，如果发生冲突，可以合理推定管理员有意调用代理合约的功能，而不是逻辑合约的功能。但是，如果调用者是任何其他非管理员地址，代理总是会将调用委托给相关的逻辑合约。我们可以通过检查 `message.sender` 值来识别调用者。

在这种模式下，代理合约将在其 fallback 函数中设置逻辑，以解析 `message.sender` 和被调用的函数选择器，并相应地调用其自身的一个函数或委托给逻辑合约。

正如我们将在代码演练中看到的，OpenZeppelin 合约增加了另一层抽象，升级功能由 [ProxyAdmin 合约](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/transparent/ProxyAdmin.sol)（一个或多个代理合约的管理员智能合约）拥有。代理管理员合约必须是升级相关功能的调用者。因此，终端用户将直接与代理进行交互，代理将委托逻辑合约进行调用，但升级和管理请求将通过代理管理合约传递，然后代理管理合约将升级请求转发给代理。

透明代理模式有一些缺点。如果处理不慎，它们很容易发生函数选择器冲突，运行成本也会更高（因为 EVM 需要额外的 gas 为每次委托调用加载逻辑合约地址），以这种模式部署代理合约也会花费更多 gas。

## UUPS 模式{#uups}

`通用可升级代理标准（Universal Upgradable Proxy Standard,UUPS）` 是在 [EIP1822](https://eips.ethereum.org/EIPS/eip-1822) 中提出的，目的是为代理合约创建一个与所有合约普遍兼容的标准。它克服了代理函数选择器冲突的问题。这种模式也使用了 Solidity 的`delegatecall`操作，但在简单/透明代理模式中，所有升级都由代理合约管理，而在 UUPS 中，升级由逻辑合约（特别是逻辑合约继承的“可代理（proxiable）”的智能合约）处理。

逻辑合约仍将在代理合约的上下文中执行，从而利用代理合约的存储、余额和地址，但逻辑合约继承自包含升级功能的可代理父合约。可代理智能合约中包含的升级逻辑用于更新逻辑合约的地址，而逻辑合约的地址存储在代理合约中。

由于 Solidity 编译器能够检测到同一合约中出现的函数选择器冲突，因此父可代理合约中的升级逻辑有助于编译器识别此类冲突，从而降低冲突发生的可能性。

UUPS 代理模式也有缺点。虽然这种模式的部署成本更低（gas 更少），但使用这种模式维护 dApp 的智能合约可能更具挑战性。

一个重要的问题是，由于升级逻辑不在代理合约中，而是在逻辑合约的可代理父合约中，如果更新后的逻辑合约未能继承可代理，那么升级功能就不会被继承，将来也就无法升级智能合约。

不过，这个问题也有好处：UUPS 模式允许通过不再继承可代理合约来取消升级功能，而这是透明代理模式所不具备的。这也是 OpenZeppelin 和其他公司 [推荐](https://docs.openzeppelin.com/contracts/4.x/api/proxy#transparent-vs-uups) 使用 UUPS 而不是透明代理的原因，尽管在撰写本文时，透明代理仍然更受欢迎。

## Transparent vs UUPS Proxies

OpenZeppelin 最初的代理服务器采用的是 [透明代理模式（Transparent Proxy Pattern）]({{< ref "#transparent" >}})。虽然这种模式仍在提供，但我们现在的建议是转向 [UUPS 代理模式]({{< ref "#uups" >}})，它既轻便又通用。

虽然这两种代理都有相同的升级接口，但在 UUPS 代理中，升级是由实现处理的，最终可以被移除。而透明代理则将升级和管理逻辑包含在代理本身中。这意味着 [TransparentUpgradeableProxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#TransparentUpgradeableProxy) 的部署成本要高于 UUPS 代理。

UUPS 代理使用 [ERC1967Proxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#ERC1967Proxys) 实现。请注意，该代理本身不可升级。实现的作用是在合约逻辑中包含更新实现地址所需的所有代码，该地址存储在代理存储空间的特定插槽中。这就是 [UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) 合约的作用所在。从 UUPSUpgradeable 合约继承（并使用相关访问控制机制覆盖 `_authorizeUpgrade` 函数）后，您的合约就会变成符合 UUPS 标准的实现。

需要注意的是，由于两个代理都使用相同的存储槽来存储实现地址，因此使用 [TransparentUpgradeableProxy](https://docs.openzeppelin.com/contracts/4.x/api/proxy#TransparentUpgradeableProxy) 的 UUPS 兼容实现可能会允许非管理员执行升级操作。

默认情况下，[UUPSUpgradeable](https://docs.openzeppelin.com/contracts/4.x/api/proxy#UUPSUpgradeable) 中的升级功能包含一种安全机制，可防止升级到不符合 UUPS 标准的实现。这可以防止升级到不包含必要升级机制的实施合约，因为这将永远锁定代理的可升级性。这种安全机制可以通过以下任一方式绕过

- 在实现中添加一个标志机制，触发后将禁用升级功能。

- 升级到一个具有升级机制的实现，但不进行额外的安全检查，然后再升级到另一个没有升级机制的实现。

该安全机制的当前实现使用 [EIP1822](https://eips.ethereum.org/EIPS/eip-1822) 来检测实现所使用的存储插槽。之前的实现依赖于回滚检查，现已废弃。使用旧机制的合约可以升级到新机制。但反过来是不可能的，因为旧的实现（4.5 版之前）不包括 ERC1822 接口。

## 代码演练

下面，我们将通过使用 [OpenZeppelin]({{< ref "../openzeppelin" >}}) 和 [Foundry]({{< ref "../foundry" >}}) 从头开始创建和部署一个可升级的智能合约。

如果你使用 Hardhat，可以参考 [Upgradable Smart Contracts: What They Are and How To Deploy Your Ow](https://blog.chain.link/upgradable-smart-contracts/)

### Project Setup

{{< gist phenix3443 868da315757b9f430b417d27b297b3a6 >}}

我们通过 [@openzeppelin/contracts-upgradeable](https://docs.openzeppelin.com/contracts/4.x/upgradeable) 将 [之前]({{< ref "../solidity/#example" >}}) 使用的`Counter`合约修改为可升级的`UpgradeableCounterV1`合约：

```shell
forge install openzeppelin-contracts/contracts --no-commit
forge install OpenZeppelin/openzeppelin-contracts-upgradeable --no-commit
```

`foundry install`安装的目录与 Solidity import 路径不一样，所以需要设置`remappings.txt`

```shell
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
@openzeppelin/contracts-upgradeable=lib/openzeppelin-contracts-upgradeable/contracts/
```

在`.env`文件中设置必要的环境变量，并通过`source .env`导入。

{{< gist phenix3443  034f9b4de8775d8bc30ef9a50c91e0b7 >}}

### Smart Contract Code

在使用 OpenZeppelin Upgrades 处理可升级合约时，编写 Solidity 代码时需要注意一些小问题。

值得一提的是，这些限制源于以太坊虚拟机的工作方式，适用于所有使用可升级合约的项目，而不仅仅是 OpenZeppelin Upgrades。

#### Initializers

您可以将 Solidity 合约与 OpenZeppelin Upgrades 结合使用，无需进行任何修改，但其构造函数除外。基于代理的可升级合约中不能使用构造函数。要了解这一限制背后的原因，参阅 [Proxies](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies#the-constructor-caveat)。

这意味着，当合约搭配 OpenZeppelin Upgrades 使用时，需要将其构造函数更改为常规函数，通常命名为 `initialize`，并在其中运行所有设置逻辑。

```solidity
// NOTE: Do not use this code snippet, it's incomplete and has a critical vulnerability!

pragma solidity ^0.6.0;

contract MyContract {
    uint256 public x;

    function initialize(uint256 _x) public {
        x = _x;
    }
}
```

虽然 Solidity 能确保构造函数在合约生命周期内只被调用一次，但普通函数却可以被调用很多次。为了防止合约被多次初始化，你需要添加一个检查以确保初始化函数只被调用一次。

```solidity
// contracts/MyContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

contract MyContract {
    uint256 public x;
    bool private initialized;

    function initialize(uint256 _x) public {
        require(!initialized, "Contract instance has already been initialized");
        initialized = true;
        x = _x;
    }
}
```

由于这种模式在编写可升级合约时非常常见，因此 OpenZeppelin Contracts 提供了一个`Initializable` 基础合约，它有 `initializer modifier` 来处理此问题：

```solidity
// contracts/MyContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MyContract is Initializable {
    uint256 public x;

    function initialize(uint256 _x) public initializer {
        x = _x;
    }
}
```

构造函数与普通函数的另一个区别是，Solidity 会自动调用合约所有祖先的构造函数。在编写 initializer 时，你需要特别注意手动调用所有基础合约的 initializer。请注意，即使在使用继承时，初始化修饰符也只能调用一次，因此父契约应使用 `onlyInitializing` 修饰符：

```solidity
// contracts/MyContract.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract BaseContract is Initializable {
    uint256 public y;

    function initialize() public onlyInitializing {
        y = 42;
    }
}

contract MyContract is BaseContract {
    uint256 public x;

    function initialize(uint256 _x) public initializer {
        BaseContract.initialize(); // Do not forget this call!
        x = _x;
    }
}
```

#### UpgradeableCounter

{{< gist phenix3443 a12ba30c5d2d542a256f3588ec828a98 >}}

更多知识参见 [OpenZeppelin: Writing Upgradeable Contracts](https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable)

### Deploy Script

使用以下脚本部署此逻辑合约：

{{< gist phenix3443 ab528785ae6e86e00803fb4204215034 >}}

执行下面的命令部署合约：

```shell
forge script scripts/deploy_CounterV1.s.sol --rpc-url ${RPC_URL} --broadcast -vvvv
```

{{< gist phenix3443 aeeadd703cc233393d78466e3fccbcd0 >}}

可以在以后升级已部署的合约实例。默认情况下，只有最初部署合约的地址才有权升级合约。

`deployProxy` 将创建以下交易：

- 部署逻辑合约（我们的 UpgradeableCounter 合约）。
- 部署代理合约并运行任何初始化函数。
- 部署 ProxyAdmin 合约（我们代理的管理员）。

我们可以使用以下命令运行部署脚本，将合约部署到本地测试网。

这样，终端中会出现类似下图的确认信息，但合同地址不同。记下这个合约地址。注意，这是代理合约的地址，而不是逻辑合约的地址。我们需要代理合约的地址，因为它是我们用来与逻辑合约交互的稳定（不变）地址。

您可以在 [此处](https://docs.openzeppelin.com/upgrades-plugins/1.x/api-hardhat-upgrades#common-options) 学习 `deployProxy()` 的文档及其配置选项。请注意，默认模式为“transparent”，但可以通过明确设置该配置选项，指定希望代理遵循 UUPS 模式。

### Cast console

在升级我们的合约之前，让我们使用 Cast 与它进行交互，测试一下合约部署结果是否符合预期。

{{< gist phenix3443 3b230f4fdb1808e356c9d0c0741beaee >}}

### Upgraded Logic Contract

现在，让我们来整理出一个更新的逻辑合约，它具有一些新增功能。请看下面的 UpgradeableCounterV2。你会注意到以下变化：

- 新增了一个名为 price 的公共存储变量，其类型为 int，用于存储检索到的价格。

在这个阶段，我们必须注意一个有关存储变量的重要技术问题。你会看到，管理状态变量被保留在完全相同的位置上，而新增变量则在其后声明。这是因为在更新逻辑合约时，不能改变状态变量的声明顺序，否则会导致存储冲突（也称为存储碰撞），因为 storage context 在代理合约中（如上文所述）。这是因为状态变量一般是在代理合约的上下文中 [分配存储布局“插槽（slot）”](https://docs.soliditylang.org/zh/latest/internals/layout_in_storage.html) 的，而这些插槽在逻辑合约升级时必须保持不变。因此，我们不能替换存储槽或在其间插入新的存储槽。所有新的状态变量都必须在最后添加到之前未被占用的槽中。OpenZeppellin 使用 [EIP1967](https://eips.ethereum.org/EIPS/eip-1967) 存储槽 (storage slot) 来避免逻辑合约中的存储冲突。有关 OpenZeppelin 代理模式和存储的更多详细信息，请点击 [此处](https://blog.openzeppelin.com/proxy-patterns/)。

### Deploy Script for Upgrade Contract

升级逻辑合约有了不同的名称和新的功能。我们可以通过调用 `upgradeProxy` 函数来升级 V1 实例，该函数会创建以下交易：

- 部署更新后的逻辑合约（我们的 UpgradeableCounterV2 合约）。
- 调用 `ProxyAdmin` 合约（我们代理的管理员）更新代理合约以指向新的逻辑合约。

我们更新后的脚本将位于 `scripts/upgrade_counter.s.sol` 中，看起来像这样（注意我们使用的是 `upgradeProxy` 而不是 `deployProxy`）。 需要注意的是，必须在运行脚本之前添加已部署合约的地址，这一点非常重要--如果忘记了这一点，就很容易犯错，可能会让你困惑好几个小时！

然后我们可以运行脚本：

我们应该看到如下输出：

请注意，代理地址是不变的。但是，如果您回到 Etherscan 并查看代理合约发出的事件，就会发现一个新的“升级”事件和一个新的执行合约地址。

如果您的合约部署时间过长，请向下滚动至本博客的故障排除部分。

现在，让我们使用 Cast 与升级后的合约进行交互。

运行以下命令，一次一个。

就是这样！你刚刚升级了你的逻辑合约，而与你交互的合约（代理合约）并没有改变！代理合约将逻辑函数调用委托给在代理合约中注册为最新逻辑合约的逻辑合约！

## 总结

我们已经介绍了如何升级智能合约、为什么要升级，以及围绕升级智能合约的新兴实践。我们了解了一些设计模式、一些可能会绊倒你的问题，还运行了一些代码来部署和升级一个简单的智能合约。如果遇到任何问题，可以留言等待解答。

## 参考

- [OpenZeppelin: Using with Upgrades](https://docs.openzeppelin.com/contracts/4.x/upgradeable)
- [Foundry 教程：使用多种方式编写可升级的智能合约（上）](https://blog.wongssh.cf/2022/07/18/foundry-contract-upgrade-part1/)
- [Foundry 教程：使用多种方式编写可升级的智能合约（下）](https://blog.wssh.trade/posts/foundry-contract-upgrade-part2/)
