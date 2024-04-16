---
title: Rust Tools
description: rust 工具链
slug: rust-tools
date: 2023-09-09T11:07:27+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: [如何构建高效的开发工具链]
categories: [rust]
tags: [rustup,cargo,vscode]
images: []
---

本文介绍 Rust 学习资源。

<!--more-->

## 概述

Rust 是一种系统级编程语言，具有内存安全性和并发性，并且适用于各种不同的应用程序领域。

## rustup

`rustup` 是一个用于管理 Rust 编程语言工具链的命令行工具。rustup 的主要功能是帮助用户安装、升级和管理 Rust 编程语言的不同版本和组件，以及与 Rust 相关的工具。

以下是 rustup 的主要功能和用法：

### 安装 Rust

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

这将下载 rustup-init 脚本并运行它，引导完成 Rust 的安装过程。可以选择默认安装或自定义安装选项。

### 升级 Rust

```shell
rustup update
```

这将检查是否有可用的新版本，并将的 Rust 工具链升级到最新版本。

### 切换 Rust 版本

rustup 允许同时安装多个 Rust 版本，并在它们之间轻松切换。要切换到不同的 Rust 版本，可以运行以下命令：

```shell
rustup default <version>
```

其中 `<version>` 是要切换到的具体 Rust 版本的名称或标识符。

### 管理组件

除了 Rust 编译器和标准库，rustup 还可以用于安装和管理不同的 Rust 组件，例如工具链、文档和额外的库。可以使用命令来安装和管理这些组件。

#### 安装工具链

```shell
rustup toolchain install <toolchain>
```

#### 安装文档

```shell
rustup component add rust-docs
```

#### 管理 target

rustup 还可以管理不同的 target 三元组，这些三元组用于指定 Rust 编译器的目标平台。这对于交叉编译和构建不同目标的二进制文件非常有用。

添加 target 三元组：

```shell
rustup target add <target>
```

列出已安装的 target 三元组：

```shell
rustup target list
```

这些是 rustup 的一些基本功能和用法。它是 Rust 社区推荐的 Rust 工具链管理工具，使得在不同 Rust 版本之间切换和管理 Rust 组件变得非常方便。

## cargo

[Cargo](https://doc.rust-lang.org/cargo/) 是 Rust 编程语言的官方构建工具和包管理器。它的主要目标是简化 Rust 项目的创建、构建、依赖管理和发布过程，使 Rust 开发更加轻松和高效。Cargo 不仅是 Rust 的构建工具，还负责管理 Rust 项目的依赖项、文档生成和其他与项目相关的任务。

以下是 Cargo 的一些主要功能和用法：

### 项目创建

使用 Cargo 可以轻松创建新的 Rust 项目。只需运行以下命令，Cargo 就会为生成一个新的项目骨架：

```shell
cargo new my_project
```

这将创建一个新的目录，其中包含一个默认的项目结构，包括 src 目录、Cargo.toml 配置文件和一个默认的 Rust 源文件。

### 依赖管理

Cargo 管理项目的依赖关系。可以在 Cargo.toml 文件中列出项目所需的依赖项，然后运行 cargo build 命令，Cargo 将自动下载并构建这些依赖项。这使得在 Rust 项目中使用第三方库变得非常简单。

```toml
[dependencies]
serde = "1.0"
```

### 构建项目

使用 cargo build 命令可以构建项目，生成可执行文件或库文件。生成的文件通常存放在 target 目录下。

```shell
cargo build
```

### 运行项目

使用 cargo run 命令可以编译并运行项目。

```shell
cargo run
```

### 测试

Cargo 提供了一组命令用于编写和运行测试。测试代码可以放在 tests 目录下，或者使用 #[cfg(test)] 属性将测试代码放在源文件中。

```shell
cargo test
```

### 文档生成

Cargo 可以生成项目的文档，并通过 cargo doc 命令将文档保存在 target/doc 目录下。这使得项目的文档非常容易生成和维护。

```shell
cargo doc
```

### 发布项目

使用 cargo publish 命令可以将 Rust 包发布到 [crates.io](https://crates.io/)，这是 Rust 社区的官方包仓库，使其他人可以使用和共享的代码。

```shell
cargo publish
```

其他任务：Cargo 还支持其他任务，如检查项目、清理构建文件、查看项目依赖关系等。通过运行 cargo --help 命令，可以查看所有可用的 Cargo 命令和选项。

更多参见 [The Cargo Book](https://doc.rust-lang.org/cargo/)

## vscode

- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer) 它会实时编译和分析你的 Rust 代码，提示代码中的错误，并对类型进行标注。你也可以使用官方的 Rust 插件取代。
- [rust syntax](https://marketplace.visualstudio.com/items?itemName=dustypomerleau.rust-syntax)：为代码提供语法高亮。
- [crates](https://marketplace.visualstudio.com/items?itemName=serayuzgur.crates)：帮助你分析当前项目的依赖是否是最新的版本。
- [toml]({{< ref "posts/toml#vscode" >}})：Rust 使用 toml 做项目的配置管理。可以配置 TOML 相关的扩展。
- [rust test lens](https://marketplace.visualstudio.com/items?itemName=hdevalke.rust-test-lens)：可以帮你快速运行某个 Rust 测试。
- [Codeium](https://marketplace.visualstudio.com/items?itemName=Codeium.codeium)：基于 AI 的自动补全，可以帮助你更快地撰写代码。
