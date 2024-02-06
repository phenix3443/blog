---
title: Antlr
description:
slug: antlr
date: 2024-02-05T10:35:48+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: []
tags: []
images: []
---

## 概述

[ANTLR](https://www.antlr.org/)  是由 Terence Parr 教授在上世纪 90 年代初期使用 Java 语言开发的一个强大的语法分析器生成工具，至今 ANTLR 依然在积极开发，并且有着一个稳定的社区。ANTLR 支持生成 C#, Java, Python, JavaScript, C++, Swift, Go, PHP 等几乎所有主流编程语言的目标代码，并且 ANTLR 官方自己维护了 Java、C++、Go 等目标语言的 runtime 库。

本文中，我们会安装 ANTLR，尝试通过它来识别一个简单的“hello world” 语法， 并概览语言类应用程序的开发过程。 在此基础上，我们会通过 listener 和 visitor 两种方式来处理该语法对应的程序。 最后，我们将通过一系列的简单语法和程序来快速了解 ANTLR 的特性。

## 初识 ANTLR

本章中， 我们的目标是大体上知道 ANTLR 能做什么。 除此之外， 我们还希望探究语言类应用程序的架构。 在后续的章节中， 我们将会通过更多真实的例子来循序渐进地、 系统性地学习 ANTLR。 在开始之前， 我们需要首先安装 ANTLR，然后尝试用它编写一份简单的“hello world” 语法。

### 安装 ANTLR

ANTLR 是用 Java 编写的，但是通过`antlr4-tools`可以不用担心 Java 相关的环境设置：

```sh
pip3 install antlr4-tools
```

该命令创建 antlr4 和 antlr4-parse 可执行文件，如有必要，它们将下载并安装 Java 11 以及最新的 ANTLR jar:

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce antlr4_help.log >}}

- antlr4 用于生成词法和语法解析器对应的目标代码（后续介绍）。
- antlr4-parse 可以详细列出一个语言类应用程序在匹配输入文本过程中的信息， 这些输入文本可以来自文件或者标准输入。

### 运行 ANTLR 并测试识别程序

antlr 定义的语法规则放在后缀为`.g4`的规则文件中，下面是一个简单的、 识别类似 hello world 词组的语法：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce hello.g4>}}

该规则对应的代码如下：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce greetings.txt>}}

通过`antlr4-parse Hello.g4 prog greetings.txt -tokens`打印代码解析后对应的符号列表：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce tokens.txt >}}

也可以通过 `antlr4-parse Hello.g4 prog -gui` 直接在 GUI 窗口中展示词法分析结果。

![hello tree](image/hello_tree.png)

更多使用说明参见 [antlr4-tools](https://github.com/antlr/antlr4-tools/tree/master)，还可以直接在 [antlr lab](http://lab.antlr.org/) 试验。

现在， 我们已经成功地安装了 ANTLR， 并尝试着用它分析了一个简单的语法。 在下一章中， 我们将学习一些重要的术语。 之后， 我们将会尝试建立一个简单的 golang 工程来进一步识别和翻译 hello 语法。

## 概览全局

在上节中， 我们安装了 ANTLR， 了解了如何构建和运行一个简单的示例语法。 在本节中， 我们将纵观全局， 学习语言类应用程序相关的重要过程、 术语和数据结构。随着学习的深入， 我们将认识一些关键的 ANTLR 对象， 并简单了解 ANTLR 在背后帮助我们完成的工作。

一般来说， 如果一个程序能够分析计算或者“执行” 语句， 我们就称之为解释器（ interpreter） 。 这样的例子包括计算器、 读取配置文件的程序和 Python 解释器。 如果一个程序能够将一门语言的语句转换为另外一门语言的语句， 我们称之为翻译器（ translator） 。 这样的例子包括 Java 到 C#的转换器和普通的编译器。

为了达到预期的目的， 解释器或者翻译器需要识别出一门特定语言的所有的有意义的语句、 词组和子词组。

识别语言的程序称为语法分析器（ parser）。语法是指约束语言中的各个组成部分之间关系的规则， 在本文中， 我们会通过 ANTLR 语法来指定语言的语法。

语法（ grammar） 是一系列规则的集合， 每条规则表述出一种词汇结构。

语法分析的过程分解为两个相似但独立的任务或者说阶段：

第一阶段将字符聚集为单词或者符号（ 词法符号， token） 的过程称为词法分析（ lexicalanalysis） 或者词法符号化（ tokenizing） 。 我们把可以将输入文本转换为词法符号的程序称为词法分析器（ lexer） 。 词法分析器可以将相关的词法符号归类， 例如 INT（ 整数） 、 ID（ 标识符） 、 FLOAT（ 浮点数） 等。 当语法分析器不关心单个符号， 而仅关心符号的类型时， 词法分析器就需要将词汇符号归类。 词法符号包含至少两部分信息： 词法符号的类型（ 从而能够通过类型来识别词法结构） 和该词法符号对应的文本。

第二个阶段是实际的语法分析过程， 在这个过程中， 输入的词法符号被“消费” 以识别语句结构，默认情况下， ANTLR 生成的语法分析器会建造一种名为语法分析树（ parse tree） 的数据结构，该数据结构记录了语法分析器识别出输入语句结构的过程， 以及该结构的各组成部分。图 2-1 展示了数据在一个语言类应用程序中的基本流动过程。

![recognizer](image/recognizer.png)

语法分析树的内部节点是词组名， 这些名字用于识别它们的子节点， 并将子节点归类。根节点是最抽象的一个名字， 在本例中即 stat（statement 的简写） 。 语法分析树的叶子节点永远是输入的词法符号。

由于我们使用一系列的规则指定语句的词汇结构， 语法分析树的子树的根节点就对应语法规则的名字。 在下文的长篇大论之前， 我们先看一个例子。 下面这条语法规则对应上图中的赋值语句子树的第一级：

```antlr
assign: ID '=' expr ';'; //匹配赋值语句
```

首先， 我们来认识一下 ANTLR 在识别和建立语法分析树的过程中使用的数据结构和类名。 熟悉这些数据结构将为我们未来的讨论奠定基础。前已述及， 词法分析器处理字符序列并将生成的词法符号提供给语法分析器， 语法分析器随即根据这些信息来检查语法的正确性并建造出一棵语法分析树。 这个过程对应的 ANTLR 类是 `CharStream`、 `Lexer`、 `Token`、 `Parser`， 以及 `ParseTree`。 连接词法分析器和语法分析器的“管道” 就是 TokenStream。图 2-2 展示了这些类型的对象在内存中的交互方式。

![antlr class](image/antlr-class.png)

![antlr class](image/sytex-tree.png)

ANTLR 尽可能多地使用共享数据结构来节约内存。 如图 2-2 所示， 语法分析树中的叶子节点（ 词法符号） 仅仅是盛放词法符号流中的词法符号的容器。 每个词法符号都记录了自己在字符序列中的开始位置和结束位置， 而非保存子字符串的拷贝。 其中， 不存在空白字符对应的词法符号（ 索引为 2 和 4 的字符） 的原因是， 我们假定我们的词法分析器会丢弃空白字符。

图 2-2 中也显示出， ParseTree 的子类 RuleNode 和 TerminalNode， 二者分别是子树的根节点和叶子节点。 RuleNode 有一些令人熟悉的方法， 例如 getChild（ ） 和 getParent（ ） ， 但是， 对于一个特定的语法， RuleNode 并不是确定不变的。 为了更好地支持对特定节点的元素的访问， ANTLR 会为每条规则生成一个 RuleNode 的子类。 如图 2-3 所示， 在我们的赋值语句的例子中， 子树根节点的类型实际上是 StatContext、 AssignContext 以及 ExprContext。

因为这些根节点包含了使用规则识别词组过程中的全部信息， 它们被称为上下文（ context） 对象。 每个上下文对象都知道自己识别出的词组中， 开始和结束位置处的词法符号， 同时提供访问该词组全部元素的途径。 例如， AssignContext 类提供了方法 ID（ ） 和方法 expr（ ） 来访问标识符节点和代表表达式的子树。

### 语法分析树监听器

ANTLR 的运行库提供了两种遍历树的机制。 默认情况下， ANTLR 使用内建的遍历器访问生成的语法分析树， 并为每个遍历时可能触发的事件生成一个语法分析树监听器接口（ parse-tree listener interface） 。

为了将遍历树时触发的事件转化为监听器的调用， ANTLR 运行库提供了 ParseTreeWalker 类。 我们可以自行实现 ParseTreeListener 接口， 在其中填充自己的逻辑代码（ 通常是调用程序的其他部分） ， 从而构建出我们自己的语言类应用程序。ANTLR 为每个语法文件生成一个 ParseTreeListener 的子类， 在该类中， 语法中的每条规则都有对应的 enter 方法和 exit 方法。例如， 当遍历器访问到 assign 规则对应的节点时， 它就会调用 enterAssign（ ） 方法， 然后将对应的语法分析树节点——AssignContext 的实例——当作参数传递给它。 在遍历器访问了 assign 节点的全部子节点之后， 它会调用 exitAssign（ ） 。 图 2-4 用粗虚线标识了 ParseTreeWalker 对语法分析树进行深度优先遍历的过程。

![listener](image/listener.png)

图 2-5 显示了在我们的赋值语句生成的语法分析树中， ParseTreeWalker 对监听器方法的完整的调用顺序。

![listener](image/listener-call.png)

监听器机制的优秀之处在于， 这一切都是自动进行的。 我们不需要编写对语法分析树的遍历代码， 也不需要让我们的监听器显式地访问子节点。

### 访问器

有时候， 我们希望控制遍历语法分析树的过程， 通过显式的方法调用来访问子节点。 在命令行中加入-visitor 选项可以指示 ANTLR 为一个语法生成访问器接口（ visitor interface） ， 语法中的每条规则对应接口中的一个 visit 方法。 图 2-6 是使用常见的访问者模式对我们的语法分析树进行操作的过程。

![listener](image/visitor.png)

后续查看具体代码示例。

## 代码生成

ANTLR 支持在多种目标语言中生成代码，生成的代码需要借助一个特定为目标语言生成代码的运行时库来支持。

### Golang Target

为了生成 Go 目标语言的代码，通常建议将源语法文件放在一个独立的包中，并使用 `go generate` 指令通过使用 shell 脚本方法生成代码。

下面是一个推荐的通用 golang 语言代码模板：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce init_layout.txt >}}

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce generate.go >}}

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce generate.sh >}}

根据是否需要访问者（visitors）或监听器（listeners）以及其他 ANTLR 选项的情况，设置 `generate.sh`。

执行以下命令将生成解析器的代码：

```sh
go generate ./...
```

根据语法 Hello.g4， ANTLR 自动生成了很多文件：

{{< gist phenix3443 346e20208c0fb75ea0ddc190733bd2ce generated_layout.txt >}}

目前， 我们仅仅需要大致了解这个过程， 下面简单介绍一下生成的文件：

- ArrayInitParser.java： 该文件包含一个语法分析器类的定义。
- ArrayInitLexer.java： ANTLR 能够自动识别出我们的语法中的文法规则和词法规则。 这个文件包含的是词法分析器的类定义。
- ArrayInit.tokens： ANTLR 会给每个我们定义的词法符号指定一个数字形式的类型， 然后将它们的对应关系存储于该文件中。 有时， 我们需要将一个大型语法切分为多个更小的语法， 在这种情况下， 这个文件就非常有用了。 通过它， ANTLR 可以在多个小型语法间同步全部的词法符号类型。 更多内容请参阅 4.1 节中的“语法导入” 部分。
- ArrayInitListener.java， ArrayInitBaseListener.java： 默认情况下，ANTLR 生成的语法分析器能将输入文本转换为一棵语法分析树。 在遍历语法分析树时， 遍历器能够触发一系列“事件” （ 回调） ， 并通知我们提供的监听器对象。ArrayInitListener 接口给出了这些回调方法的定义， 我们可以实现它来完成自定义的功能。 ArrayInitBaseListener 是该接口的默认实现类，为其中的每个方法提供了一个空实现。 ArrayInitBaseListener 类使得我们只需要覆盖那些我们感兴趣的回调方法（ 详见 7.2 节） 。 通过指定-visitor 命令行参数， ANTLR 也可以为我们生成语法分析树的访问器。

#### 将生成的语法分析器与 Java 程序集成

在语法准备就绪之后， 我们就可以将 ANTLR 自动生成的代码和一个更大的程序进行集成。 在本节中， 我们将会使用一个简单的单测调用我们的“hello 语句解析器” 。

#### 构建一个语言类应用程序

我们继续完成能够处理数组初始化语句的示例程序， 下一个目标是能够翻译初始化语句， 而不仅仅是能够识别它们。 例如， 我们想要将 Java 中， 类似{99， 3， 451}的 short 数组翻译成"\u0063\u0003\u01c3"。 注意， 其中十进制数字 99 的十六进制表示是 63。为了完成这项工作， 程序必须能够从语法分析树中提取数据。 最简单的方案是使用 ANTLR 内置的语法分析树遍历器进行深度优先遍历， 然后在它触发的一系列回调函数中进行适当的操作。 正如我们之前看到的那样， ANTLR 能够自动生成一个监听器接口和一个默认的实现类。

我们如果想要通过编写程序来操纵输入的数据的话， 只需要继承 ArrayInitBaseListener 类， 然后覆盖其中必要的方法即可。 我们的基本思想是，在遍历器进行语法分析树的遍历时， 令每个监听器方法翻译输入数据的一部分并将结果打印出来。监听器机制的优雅之处在于， 我们不需要自己编写任何遍历语法分析树的代码。 事实上， 我们甚至都不知道 ANTLR 运行库是怎么遍历语法分析树、 怎么调用我们的方法的。 我们只知道， 在语法规则对应的语句的开始和结束位置处， 我们的监听器方法可以得到通知。

为此， 我们需要编写方法， 在遇到对应的输入词法符号或者词组的时候， 打印出转换后的字符串。 内置的语法分析树遍历器会在各种词组的开始和结束位置触发监听器的回调函数。 下面是遵循我们的翻译规则的一个监听器的实现类。

## 参考

- [使用 ANTLR 和 Go 实现 DSL 入门](https://tonybai.com/2022/05/10/introduction-of-implement-dsl-using-antlr-and-go/) 系列文章。
- [官方教程](https://github.com/antlr/antlr4/blob/master/doc/getting-started.md)
- [ANTLR4 权威指南](https://book.douban.com/subject/27082372/)
