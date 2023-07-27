---
title: "go test"
description: 进行 go 代码测试
slug: go-test
date: 2022-07-15T15:08:52+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - go
tags:
  - test
---

## 概述

使用`testdata`目录保存测试所需的辅助数据。

Go 测试以两种不同的模式运行：

第一种称为本地目录模式，发生在没有 package 参数的情况下调用`go test`时（例如，`go test` 或`go test -v`）。在这种模式下，`go test`会编译在当前目录中找到的包和测试，然后运行生成的测试二进制文件。在这种模式下，缓存（下面讨论）被禁用。 package 测试完成后，`go test`将打印摘要行，其中显示测试状态（“ok”或“FAIL”）， package 名称和经过时间。

第二种称为程序包列表模式，发生在使用显式程序 package 参数调用`go test`时（例如`go test math`，`go test ./...`，甚至`go test .`）。在这种模式下，`go test`编译并测试命令行上列出的每个 package 。如果某个 package 测试通过，则`go test`仅打印该 package 最后的 “OK” 摘要行。如果 package 测试失败，则执行测试将打印完整的测试输出。如果使用 **-bench** 或 **-v** 标志调用，则`go test`会打印完整的输出，即使通过的 package 测试也是如此，以便显示请求的基准测试结果或详细的日志记录。在所有列出的 package 的测试完成并且输出了它们的输出之后，如果任何 package 测试失败，`go test`将打印最终的`Fail`状态。

仅在 package 列表模式下，`go test`会缓存成功的 package 测试结果，以避免不必要的重复运行测试。当可以从缓存中恢复测试结果时，`go test`将重新显示先前的输出，而不是再次运行测试二进制文件。如果发生这种情况，`go test`在摘要行中打印`(cached)`以代替经过的时间。

除了构建标志之外，`go test`可使用的标志还有：

```HTML
-args

  Pass the remainder of the command line (everything after -args) o the test binary, uninterpreted and unchanged.  Because this flag consumes the remainder of the command line, the package list (if present) must appear before this flag.

-c

  Compile the test binary to pkg.test but do not run it (where pkg is the last element of the package\'s import path). The file name can be changed with the -o flag.

-exec xprog

  Run the test binary using xprog. The behavior is the same as in 'go run'. See 'go help run' for details.

-i

  Install packages that are dependencies of the test. Do not run the test.

-json

  Convert test output to JSON suitable for automated processing.  See 'go doc test2json' for the encoding details.

-o file

  Compile the test binary to the named file.  The test still runs (unless -c or -i is specified).
```

## testflag

`go test`命令可以识别以下标志，这些标志控制测试执行：

```HTML
-bench regexp

  仅运行与正则表达式匹配的基准测试。

  默认情况下，不运行任何基准测试。 要运行所有基准，请使用`-bench`。 或`-bench=`。

  regexp 由无括号的斜杠（/）字符拆分为一系列正则表达式，并且基准标识符的每个部分都必须与序列中的相应元素（如果有）匹配。 匹配中父项（如果有）通过 b.N=1 标识子基准进行运行。 例如，在给定 -bench=X/Y 的情况下，与 X 匹配的顶级基准测试使用 b.N=1 来以找到与 Y 匹配的任何子基准，然后将其完整运行。

-benchtime t

  通过 t 指示对每个基准运行足够的迭代， t 为`time.Duration`（例如`-benchtime 1h30s`）。

  缺省值为 1 秒（1s）。特殊语法`Nx`表示要运行基准测试 N 次（例如，`-benchtime 100x`）。

-count n

  运行每个测试和基准测试 n 次（默认为 1）。

  如果设置了-cpu，则对每个 GOMAXPROCS 值运行 n 次。 Examples 始终运行一次。

-cover

  启用覆盖率分析。 请注意，由于覆盖率是通过在编译之前对源代码进行注释来实现的，因此启用覆盖率的编译和测试失败可能会报告与原始源不对应的行号。

-covermode set,count,atomic

  设置要测试 package 覆盖率分析的模式。 默认为`set`，启用 -race 后为 “atomic”。

  取值为:
  + set: bool: 语句是否运行?
  + count: int: 语句运行的次数?
  + atomic: int:  类似于 count, 但表示的是并行程序中的精确计数。消耗资源也更多。

- failfast

  首次测试失败后不开始新的测试。

-list regexp

  列出与正则表达式匹配的测试，基准或示例。

  不会运行任何测试，基准测试或示例。 这只会列出顶级测试。 不显示子测试或子基准。

-run regexp

  仅运行与正则表达式匹配的那些测试和示例。

  对于测试，正则表达式由无括号的斜杠（/）字符拆分为一系列正则表达式，并且测试标识符的每个部分都必须与序列中的相应元素（如果有）匹配。 请注意，也可能运行匹配项的父项，因此 -run=X/Y 匹配并运行并报告所有与 X 匹配的测试的结果，甚至是那些没有与 Y 匹配的子测试的测试，因为它必须运行它们以查找那些子测试。

-timeout d

  如果测试二进制文件的运行时间超过持续时间 d，则出现 panic。 如果 d 为 0，则禁用超时。 默认值为 10 分钟（10m）。

-v
  详细的输出：在运行所有测试时记录它们。 即使测试成功，也要打印 Log 和 Logf 调用中的所有文本。
```

以下标记也可以被`go test`识别，并且可以在执行期间用于分析测试：

```HTML
-benchmem

  打印基准的内存分配统计信息。

-blockprofile block.out

  所有测试完成后，将 goroutine 阻塞分析写入指定的文件。

  像-c 那样写测试二进制文件。

-blockprofilerate n

  通过使用 n 调用 runtime.SetBlockProfileRate 来控制 goroutine 阻塞分析中提供的详细信息。 请参阅“转到 doc runtime.SetBlockProfileRate”。

  profiler 的目的是程序花费的每 n 纳秒中平均采样一个阻塞事件。 默认情况下，如果设置了 =-test.blockprofile= 而没有此标志，则将记录所有阻塞事件，等效于 -test.blockprofilerate=1 。

-coverprofile cover.out

  所有测试通过后，将 coverage 配置文件写入文件。 需设置 =-cover= 。

-cpuprofile cpu.out

  退出之前，将 CPU 分析文件写入指定的文件。

-memprofile mem.out

  所有测试通过后，将内存分配分析写入文件。

-memprofilerate n

  通过设置 runtime.MemProfileRate 启用更精确（且 expensive）的内存分配分析。 请参阅“go doc runtime.MemProfileRate”。

  To profile all memory allocations, use -test.memprofilerate=1.

-mutexprofile mutex.out

  所有测试完成后，将互斥锁争用分析写入指定的文件。

-mutexprofilefraction n

  从持有竞争互斥量的 goroutine 的 n 个堆栈跟踪中采样 1。

-outputdir directory

  将 profile 文件中的输出文件放在指定目录中，默认情况下是运行“ go test”的目录。

-trace trace.out

  退出之前，将执行跟踪记录写入指定的文件。

```

这些标志中的每一个也可以通过可选的`test.`前缀来识别。 如`-test.v`。 但是，当直接调用生成的测试二进制文件（`go test -c`的结果）时，前缀是必需的。

`go test` 命令在调用测试二进制文件之前，视情况在可选 package 列表之前和之后重写或删除已识别的标志。

For instance, the command

```sh
go test -v -myflag testdata -cpuprofile=prof.out -x
```

will compile the test binary and then run it as

```sh
pkg.test -test.v -myflag testdata -test.cpuprofile=prof.out
```

（-x 标志被删除，因为它仅适用于 go 命令的执行，不适用于测试本身。）

生成 profile 文件的测试标记（除了覆盖率以外）还将测试二进制文件保留在 pkg.test 中，以便在分析配置文件时使用。

当`go test`运行测试二进制文件时，它将在相应程序包的源代码目录中运行。取决于测试，直接调用生成的测试二进制文件时可能需要执行相同的操作。

## coverage

执行结果中输入代码覆盖率：`go test ./... -cover`

生成代码覆盖率分析文件：`go test ./... -coverprofile=coverage.out`

在浏览器中浏览分析文件：`go tool cover -html=coverage.out`

查看每个函数的代码覆盖率：`go tool cover -func=coverage.out`

## gomock

[gomock](https://github.com/golang/mock) 是 Go 编程语言的模拟框架。

## gostub

[gostub](https://github.com/prashantv/gostub) 是一个使单元测试中的存根变得容易的库。

## go monkey

[monkey](https://github.com/bouk/monkey) 在 golang 中实现 monkeypatching。使用该工具需要注意：

1. 如果启用内联，Monkey 有时无法 patch 函数。尝试在禁用内联的情况下运行测试，例如：`go test -gcflags=-l`。 相同的命令行参数也可用于 build。
2. Monkey 不能在一些不允许同时写入和执行内存页面的安全导向操作系统上工作。比如 MacOS 12.15+。目前的实现并没有真正可靠的解决方法。
3. Monkey 不是线程安全的。或者任何种类的安全。

## goconvey

[goconvey](https://github.com/smartystreets/goconvey) 是一款 Go 测试工具。

[^1]: [GoStub 框架使用指南](https://www.jianshu.com/p/70a93a9ed186)
