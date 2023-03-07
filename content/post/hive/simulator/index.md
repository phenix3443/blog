---
title: "ethereum hive simulator"
description: 如何编写 hive simulator
slug: eth-hive-simulator
date: 2022-11-22T18:33:20+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tag:
    - ethereum
    - hive
    - test
---

## 引言[^1]

本文解释了如何编写 hive  simulator 。

simulator 是针对 hive 提供的基于 HTTP simulation  API [^2] 编写的程序。simulator 可以用任何编程语言编写，只要它们可使用 docker 打包。

simulator 位于 hive 仓库的 `simulators/` 目录中。每个 simulator 都有一个专用的子目录。当 hive 运行 simulation 时，它首先在 simulator 目录中使用 `docker build` 构建镜像。该镜像必须包含测试所需的所有资源。

当 simulator 容器入口点（entry point）运行时，`HIVE_SIMULATOR` 环境变量被设置为 API 服务器的 URL（参见[源码](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/internal/libhive/run.go#L218))。

simulation  API 采用特定的数据模型，该模型决定了 API 的使用方式。为了使用 API 执行任何操作，simulator 必须首先请求启动测试套件并记住其 ID。测试套件由 simulator 分配名称和描述。API 提供的所有其他资源都在测试套件范围内，并一直保留到 simulator 结束测试套件。

接下来，simulator 可以启动测试用例。测试用例被命名并且还有一个由 API 服务器分配的 ID。套件中的多个测试用例可随时运行。请注意，测试套件没有总体通过/失败状态，只有测试用例有。一个套件必须至少启动一个测试用例，否则无法报告任何结果。

在测试用例的上下文中，可以启动客户端容器。客户端与测试用例相关联，并在启动它们的测试用例结束时自动关闭（参见[代码分析]({{< ref "../code#run-test" >}})）。如果要针对单个客户端执行许多测试，最好创建专门启动客户端的 “client launch” 测试，然后在该测试中运行其他测试用例（参见 [devp2p](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/simulators/devp2p/main.go#L34)）。

simulator 必须在结束测试套件之前报告所有正在运行的测试用例的结果。

## simulator 环境变量

以下是 hive 在启动 simulator 时设置的所有环境变量的列表。

| Variable            | Meaning                                      | Hive Flag           |
|---------------------|----------------------------------------------|---------------------|
| `HIVE_SIMULATOR`    | URL of the API server                        |                     |
| `HIVE_TEST_PATTERN` | Regular expression, selects suites/tests     | `--sim.limit`       |
| `HIVE_PARALLELISM`  | Integer, sets test concurrency               | `--sim.parallelism` |
| `HIVE_LOGLEVEL`     | Decimal 0-5, configures simulator log levels | `--sim.loglevel`    |

## 用 Go 编写 simulator

虽然 simulator 可以用任何语言编写（毕竟它们只是 docker 容器），但 hive 提供了一个 Go 库，它以类似于标准库 “testing package” 的方式包装 simulation API[^2]。请务必查看 [hivesim package](https://pkg.go.dev/github.com/ethereum/hive/hivesim) 以获取更多如何使用 Go 编写 simulator 的信息。

simulator 作为独立的 Go 模块包含在 hive 仓库中。首先在 `./simulators` 中创建一个新的子目录并初始化一个 Go 模块：

```shell
mkdir ./simulators/ethereum/my-simulation
cd ./simulators/ethereum/my-simulation
go mod init github.com/ethereum/hive/simulators/ethereum/my-simulation
go get github.com/ethereum/hive/hivesim@latest
```

现在创建 simulator 文件 `my-simulation.go`

```go
package main

import "github.com/ethereum/hive/hivesim"

func main() {
    suite := hivesim.Suite{
        Name:        "my-suite",
        Description: "This test suite performs some tests.",
    }
    // add a plain test (does not run a client)
    suite.Add(hivesim.TestSpec{
        Name:        "the-test",
        Description: "This is an example test case.",
        Run: runMyTest,
    })
    // add a client test (starts the client)
    suite.Add(hivesim.ClientTestSpec{
        Name:        "the-test-2",
        Description: "This is an example test case.",
        Files: map[string]string{"/genesis.json": "genesis.json"},
        Run: runMyClientTest,
    })

    // Run the tests. This waits until all tests of the suite
    // have executed.
    hivesim.MustRunSuite(hivesim.New(), suite)
}


func runMyTest(t *hivesim.T) {
    // write your test code here
}

func runMyClientTest(t *hivesim.T, c *hivesim.Client) {
    // write your test code here
}
```

### test suit && test case[^3]

一个测试套件可以包含多个测试用例（test case）。 测试用例代表针对一个或多个客户端的单独测试。

`Suite` 有一个额外的字段 `Tests`，它表示测试套件要执行的所有测试用例。 可以使用 `Add()` 方法将测试用例添加到套件中。

测试用例可以用用三种表示：

+ `TestSpec`：默认不启动任何客户端。
+ `ClientTestSpec`：针对单个客户端的测试，要留意 `Role` 字段的定义和使用：“If no role is specified, the test runs for all available client types.”，如果没有指定该字段，那么 spec.Run 针对命令行中指定的所有 client 都会运行，这可能不是我们想要的。。
+ 实现`AnyTest` 接口的任何 struct。

  ```go
  type AnyTest interface {
      runTest(*Simulation, SuiteID) error
  }
  ```

### hivesim.T

```go
type T struct {
    Sim     *Simulation
    TestID  TestID
    SuiteID SuiteID
    mu      sync.Mutex
    result  TestResult
}
```

`hivesim.T` 代表一个正在运行的测试，其行为很像 testing.T，但有一些额外的方法来启动客户端。测试可以在运行时使用“T”对象授予它的资源。

`T` 对象中的 `Sim` 字段（它是指向 `Simulation` 实例的指针）特别有用，因为它提供了几种与 hive simulation API 通信的方法，例如：

+ starting / ending test suites and tests
+ starting / stopping / getting information about a client
+ creating / removing networks
+ connecting / disconnecting containers to/from a network
+ getting the IP address of a container on a specific network

### run a test suit

可以在 `Suite` 上调用 `RunSuite()` 或 `MustRunSuite()`，唯一的区别是错误处理：

+ `RunSuite()` 将运行 `Suite` 中的所有测试，失败时返回错误。
+ `MustRunSuite()` 将运行 `Suite` 中的所有测试，如果执行有问题则退出进程。

这两个函数都采用指向“Simulation”和“Suite”实例的指针。

要通过 Simulation API 在 hive 执行上面定义的 simulator，需要调用 `New()`， 这将查找 hive host URI 并返回一个能够进行 simulation api 调用的实例。

### Dockerfile

simulator 需要有一个 Dockerfile 才能运行。

在 `hivesim.ClientTestSpec` 的 `Files:` 字段可以看出，simulation 需要一个 `genesis.json` 文件来指定 client 的 genesis 状态。 `genesis.json` 的示例可以在 `simulators/devp2p/init/` 目录中找到。可以复制现有的创世块或创建自己的创世块。确保将所有支持文件添加到 Dockerfile 中的容器。 Dockerfile 可能如下所示：

```dockerfile
FROM golang:1-alpine AS builder
RUN apk --no-cache add gcc musl-dev linux-headers
ADD . /source
WORKDIR /source
RUN go build -o ./sim .

# Build the runner container.
FROM alpine:latest
ADD . /
COPY --from=builder /source/sim /
ENTRYPOINT ["./sim"]
```

## 运行simulation

最后，回到仓库的根目录运行测试：

`./hive --sim my-simulator --client go-ethereum,openethereum`

可以使用 hiveview 检查结果。 更多客户端命令参见 [hive overview]({{< ref "../overview#tools">}})

## Simulation API Reference

直接查看官方说明[^2]。

## 总结

+ 运行时，simulator 实际上是 simulation 运行的测试环境（host）。
+ simulator 中可以运行多个 test suit, 每个 suit 可以包含多个 test spec，也就是 test case。

[^1]: [hive simulator](https://github.com/ethereum/hive/blob/master/docs/simulators.md)
[^2]: [hive simulation API Reference](https://github.com/ethereum/hive/blob/master/docs/simulators.md#simulation-api-references)
[^3]: [hivesim](https://pkg.go.dev/github.com/ethereum/hive/hivesim)
