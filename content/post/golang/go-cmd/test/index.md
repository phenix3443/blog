---
title: "go test"
description: 
date: 2022-05-12T15:08:52+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: false
categories:
    - golang
tags:
    - cmd
    - test
---


## 使用

`go test [build/test flags] [packages] [build/test flags & test binary flags]`

`go test` 用于测试 import 的 package。使用以下格式打印测试结果的摘要：

```HTML
ok   archive/tar   0.011s
FAIL archive/zip   0.022s
ok   compress/gzip 0.033s
...
```

然后是每个失败 package 的详细输出。

`go test` 重新编译每个 package，以及名为 “\*\_test.go” 的所有文件。这些文件可以包含测试函数，基准函数和示例函数。执行 `go help testfunc` 了解过多信息。每个列出的 package 都会执行单独的测试程序。以“_”（包括“_test.go”）或 “.” 开头的文件会被忽略。

后缀为 “_test” 的测试文件中声明的 package 将被编译为单独的程序包，然后与主测试二进制文件链接并运行。

go 工具将忽略名为 “testdata” 的目录，使其可用于保存测试所需的辅助数据。

作为构建测试二进制文件的一部分， `go test` 对 package 及其测试源文件运行 `go vet` 以发现重大问题。`go test` 不运行测试二进制文件，只报告 `go vet` 发现的任何问题。`go vet` 只使用默认的高置性度（high-confidence）子集检查。该子集是：'atomic', 'bool', 'buildtags', 'nilfunc', and 'printf'。 可以通过 `go doc cmd/vet` 查看这些和其他 vet 测试文档。要禁用 `go vet` 的运行，请使用 `-vet=off` 标志。

所有测试输出和摘要行都将打印到 go 命令的标准输出中，即使测试将自己的标准错误也是如此。（go 命令的标准错误保留用于构建测试的打印错误。）

Go 测试以两种不同的模式运行：

第一种称为本地目录模式，发生在没有 package 参数的情况下调用 `go test` 时（例如，`go test`  或 `go test -v` ）。在这种模式下， `go test` 会编译在当前目录中找到的包和测试，然后运行生成的测试二进制文件。在这种模式下，缓存（下面讨论）被禁用。 package 测试完成后， `go test` 将打印摘要行，其中显示测试状态（“ok”或“FAIL”）， package 名称和经过时间。

第二种称为程序包列表模式，发生在使用显式程序 package 参数调用 `go test` 时（例如 `go test math`，`go test ./...`，甚至 `go test .` ）。在这种模式下， `go test` 编译并测试命令行上列出的每个 package 。如果某个 package 测试通过，则 `go test` 仅打印该 package 最后的 “OK” 摘要行。如果 package 测试失败，则执行测试将打印完整的测试输出。如果使用 **-bench** 或 **-v** 标志调用，则 `go test` 会打印完整的输出，即使通过的 package 测试也是如此，以便显示请求的基准测试结果或详细的日志记录。在所有列出的 package 的测试完成并且输出了它们的输出之后，如果任何 package 测试失败， `go test` 将打印最终的 “Fail” 状态。

仅在 package 列表模式下， `go test` 会缓存成功的 package 测试结果，以避免不必要的重复运行测试。当可以从缓存中恢复测试结果时， `go test` 将重新显示先前的输出，而不是再次运行测试二进制文件。如果发生这种情况， `go test` 在摘要行中打印 “(cached)” 以代替经过的时间。

缓存中匹配项的规则是，运行涉及相同的测试二进制文件，并且命令行上的标志完全来自一组受限制的“可缓存”测试标志： `-cpu，-list，-parallel，-run ，-short 和-v` 。 除此之外，不会缓存结果。要禁用测试缓存，请使用除可缓存标志以外的任何测试标志或参数。显式禁用测试缓存的惯用方式是使用 `-count=1` 。测试是否在 package 的源码根目录（通常是 `$GOPATH` ）中打开文件，或参考环境变量的测试仅与文件和环境变量未更改的将来运行相匹配。缓存的测试结果被视为立即执行，因此无论 `-timeout· 设置如何，成功的 package 测试结果都将被缓存并重新使用。

除了构建标志之外，`go test` 本身处理的标志还有：

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

测试二进制文件还接受控制测试执行的标志。 这些标志也可以通过“ go test”访问。 有关详细信息，请参见“ go help testflag”。

For more about specifying packages, see 'go help packages'.

## testflag

`go test` 命令的 flag 也适用于测试的二进制文件。

几个标志控制 profiling ，并生成适合 `go tool pprof` 执行的配置文件； 运行 “go tool pprof -h” 以获取更多信息。 pprof 的 `--alloc_space，--alloc_objects 和--show_bytes` 选项控制如何显示信息。

`go test` 命令可以识别以下标志，这些标志控制测试执行：

```HTML
- bench regexp

    仅运行与正则表达式匹配的基准测试。

    默认情况下，不运行任何基准测试。 要运行所有基准，请使用 “-bench”。 或 “-bench=”。

    regexp 由无括号的斜杠（/）字符拆分为一系列正则表达式，并且基准标识符的每个部分都必须与序列中的相应元素（如果有）匹配。 匹配中父项（如果有）通过 ~b.N=1~ 标识子基准进行运行。 例如，在给定 ~-bench=X/Y~ 的情况下，与 X 匹配的顶级基准测试使用 ~b.N=1~ 来以找到与 Y 匹配的任何子基准，然后将其完整运行。

- benchtime t

    通过 t 指示对每个基准运行足够的迭代， t 为 =time.Duration=（例如 =-benchtime 1h30s= ）。

    缺省值为 1 秒（1s）。特殊语法 =Nx= 表示要运行基准测试 N 次（例如， =-benchtime 100x= ）。

- count n

    运行每个测试和基准测试 n 次（默认为 1）。

    如果设置了-cpu，则对每个 GOMAXPROCS 值运行 n 次。 Examples 始终运行一次。

- cover

    启用覆盖率分析。 请注意，由于覆盖率是通过在编译之前对源代码进行注释来实现的，因此启用覆盖率的编译和测试失败可能会报告与原始源不对应的行号。

- covermode set,count,atomic

    设置要测试 package 覆盖率分析的模式。 默认为 ”set”，启用 =-race= 后为“ atomic”。

    The values:
    + set: bool: does this statement run?
    + count: int: how many times does this statement run?
    + atomic: int: count, but correct in multithreaded tests; significantly more expensive. Sets -cover.

- coverpkg pattern1,pattern2,pattern3

    只对与模式匹配的 package 的测试使用将覆盖率分析。默认设置是每个测试仅分析要测试的 package 。

    See 'go help packages' for a description of package patterns.

    Sets -cover.

- cpu 1,2,4

    指定应为其执行测试或基准的 GOMAXPROCS 值的列表。 默认值为 GOMAXPROCS 的当前值。

- failfast

    首次测试失败后，请勿开始新的测试。

- list regexp

    列出与正则表达式匹配的测试，基准或示例。

    不会运行任何测试，基准测试或示例。 这只会列出顶级测试。 不显示子测试或子基准。

- parallel n

    允许并行执行调用 =t.Parallel= 的测试函数。

    该标志的值是可以同时运行的最大测试数。 默认情况下，它设置为 GOMAXPROCS 的值。

    请注意，-parallel 仅适用于单个测试二进制文件。 根据-p 标志的设置，“ go test”命令也可以并行运行针对不同 package 的测试（请参阅“ go help build”）。

- run regexp

    仅运行与正则表达式匹配的那些测试和示例。

    对于测试，正则表达式由无括号的斜杠（/）字符拆分为一系列正则表达式，并且测试标识符的每个部分都必须与序列中的相应元素（如果有）匹配。 请注意，也可能运行匹配项的父项，因此 ~-run=X/Y~ 匹配并运行并报告所有与 X 匹配的测试的结果，甚至是那些没有与 Y 匹配的子测试的测试，因为它必须运行它们以查找那些子测试。

- short

    告诉长时间运行的测试以缩短其运行时间。

    它默认情况下是关闭的，但是在 all.bash 期间设置，以便安装 Go 树可以运行健全性检查，而不花费时间运行详尽的测试。

- timeout d

    如果测试二进制文件的运行时间超过持续时间 d，则出现 panic。 如果 d 为 0，则禁用超时。 默认值为 10 分钟（10m）。

- v

    详细的输出：在运行所有测试时记录它们。 即使测试成功，也要打印 Log 和 Logf 调用中的所有文本。

- vet list

    将 `go test` 期间的 `go vet` 调用配置为使用逗号分隔的 vet 检查列表。

    如果列表为空，则“ go test”将运行“ go vet”，并带有经过整理的被认为总是值得解决的检查清单。

    如果列表为“ off”，则“ go test”根本不会运行“ go vet”。

```

以下标记也可以被`go test` 识别，并且可以在执行期间用于分析测试：

```HTML
- benchmem

    打印基准的内存分配统计信息。

- blockprofile block.out

    所有测试完成后，将 goroutine 阻塞分析写入指定的文件。

    像-c 那样写测试二进制文件。

- blockprofilerate n

    通过使用 n 调用 runtime.SetBlockProfileRate 来控制 goroutine 阻塞分析中提供的详细信息。 请参阅“转到 doc runtime.SetBlockProfileRate”。

    profiler 的目的是程序花费的每 n 纳秒中平均采样一个阻塞事件。 默认情况下，如果设置了 =-test.blockprofile= 而没有此标志，则将记录所有阻塞事件，等效于 ~-test.blockprofilerate=1~ 。

- coverprofile cover.out

    所有测试通过后，将 coverage 配置文件写入文件。 需设置 =-cover= 。


- cpuprofile cpu.out

    退出之前，将 CPU 分析文件写入指定的文件。

- memprofile mem.out

    所有测试通过后，将内存分配分析写入文件。

- memprofilerate n

    通过设置 runtime.MemProfileRate 启用更精确（且 expensive）的内存分配分析。 请参阅“go doc runtime.MemProfileRate”。

    To profile all memory allocations, use -test.memprofilerate=1.

- mutexprofile mutex.out

    所有测试完成后，将互斥锁争用分析写入指定的文件。

- mutexprofilefraction n

    从持有竞争互斥量的 goroutine 的 n 个堆栈跟踪中采样 1。

- outputdir directory

    将 profile 文件中的输出文件放在指定目录中，默认情况下是运行“ go test”的目录。

- trace trace.out

    退出之前，将执行跟踪记录写入指定的文件。

```

这些标志中的每一个也可以通过可选的“test.”前缀来识别。 如 -test.v 。 但是，当直接调用生成的测试二进制文件（`go test -c` 的结果）时，前缀是必需的。

`go test`  命令在调用测试二进制文件之前，视情况在可选 package 列表之前和之后重写或删除已识别的标志。

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

当“ go test”运行测试二进制文件时，它将在相应程序包的源代码目录中运行。取决于测试，直接调用生成的测试二进制文件时可能需要执行相同的操作。

命令行 package 列表（如果存在）必须出现在 `go test` 命令未知的任何标志之前。继续上面的示例，程序包列表必须出现在-myflag 之前，但可能出现在-v 的任一侧。

当“ go test”以程序包列表模式运行时，“ go test”会缓存成功的程序包测试结果，以避免不必要的重复运行测试。要禁用测试缓存，请使用除可缓存标志以外的任何测试标志或参数。显式禁用测试缓存的惯用方式是使用 ~-count=1~ 。

为了避免将测试二进制文件的参数解释为已知标志或程序包名称，请使用-args（请参阅“ go help test”），该参数会将命令行的其余部分传递给未经解释和更改的测试二进制文件。

For instance, the command

```sh
go test -v -args -x -v
```

will compile the test binary and then run it as

```sh
pkg.test -test.v -x -v
```

Similarly,

```sh
go test -args math
```

will compile the test binary and then run it as

```sh
pkg.test math
```

在第一个示例中，-x 和第二个 -v 不变地传递到测试二进制文件，并且对 go 命令本身没有影响。 在第二个示例中，参数 math 传递给测试二进制文件，而不是被解释为程序包列表。