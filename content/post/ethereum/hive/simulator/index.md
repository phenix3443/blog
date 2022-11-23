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

simulator 位于 hive 仓库的 `simulators/` 目录中。每个 simulator 都有一个专用的子目录。当 hive 运行 simulation 时，它首先在 simulator 目录中使用 docker build 构建镜像。该镜像必须包含测试所需的所有资源。

当 simulator 容器入口点运行时，`HIVE_SIMULATOR` 环境变量被设置为 API 服务器的 URL。

simulation  API 采用特定的数据模型，该模型决定了 API 的使用方式。为了使用 API 执行任何操作，simulator 必须首先请求启动测试套件并记住其 ID。测试套件由 simulator 分配名称和描述。API 提供的所有其他资源都在测试套件范围内，并一直保留到 simulator 结束测试套件。

接下来，simulator 可以启动测试用例。测试用例被命名并且还有一个由 API 服务器分配的 ID。套件中的多个测试用例可随时运行。请注意，测试套件没有总体通过/失败状态，只有测试用例有。一个套件必须至少启动一个测试用例，否则无法报告任何结果。

在测试用例的上下文中，可以启动客户端容器。客户端与测试相关联，并在启动它们的测试结束时自动关闭。如果要针对单个客户端执行许多测试，最好创建专门的 “client launch” 测试来启动客户端，然后将其他测试的结果作为单独的测试用例发出信号。

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

## 创建 Dockerfile

simulator 需要有一个 Dockerfile 才能运行。

在客户端测试的 `Files:` 部分可以看出，simulation 需要一个 `genesis.json` 文件来指定 client 的 genesis 状态。 genesis.json 的示例可以在 `simulators/devp2p/init/` 目录中找到。可以复制现有的创世块或创建自己的创世块。确保将所有支持文件添加到 Dockerfile 中的容器。 Dockerfile 可能如下所示：

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

最后，回到仓库的根目录（`cd ../../..`）并运行simulation。

`./hive --sim my-simulation --client go-ethereum,openethereum`

可以使用 hiveview 检查结果。

## Simulation API Reference[^2]

## 总结

[^1]: [hive simulator](https://github.com/ethereum/hive/blob/master/docs/simulators.md)
[^2]: [hive simulation API Reference](https://github.com/ethereum/hive/blob/master/docs/simulators.md#simulation-api-references)
