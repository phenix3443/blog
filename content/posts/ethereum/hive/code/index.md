---
title: "hive 源码分析"
description: ethereum hive 源码分析
slug: eth-hive-code
date: 2022-11-24T21:13:40+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - ethereum
tags:
  - hive
  - test
---

## 引言

之前的文章中分析了 hive 中 [simulation 的运行原理]({{< ref "posts/ethereum/hive/overview#how-it-works">}}) 还有 [client 的声明周期]({{< ref "posts/ethereum/hive/client#client-lifecycle" >}})，本文结合源码分析一下 hive 执行流程：

`ethereum/rpc` 这个 simulator 的执行结果：

```log
% ./hive --sim 'ethereum/rpc$' --sim.limit rpc --client go-ethereum
INFO[11-24|21:40:11] building image                           image=hive/hiveproxy nocache=false pull=false
INFO[11-24|21:40:11] building 1 clients...
INFO[11-24|21:40:11] building image                           image=hive/clients/go-ethereum:latest dir=clients/go-ethereum nocache=false pull=false
INFO[11-24|21:40:11] building 1 simulators...
INFO[11-24|21:40:11] building image                           image=hive/simulators/ethereum/rpc:latest dir=simulators/ethereum/rpc nocache=false pull=false
INFO[11-24|21:40:12] running simulation: ethereum/rpc
INFO[11-24|21:40:12] hiveproxy started                        container=e1c9aa008358 addr=172.17.0.2:8081
INFO[11-24|21:40:13] API: suite started                       suite=0 name=rpc
INFO[11-24|21:40:13] API: test started                        suite=0 test=1 name="client launch (go-ethereum)"
INFO[11-24|21:40:19] API: client go-ethereum started          suite=0 test=1 container=1743f1a0
INFO[11-24|21:40:19] API: test started                        suite=0 test=2 name="http/GenesisBlockByNumber (go-ethereum)"
INFO[11-24|21:40:19] API: test started                        suite=0 test=3 name="http/ContractDeploymentOutOfGas (go-ethereum)"
...
INFO[11-24|21:40:19] API: test ended                          suite=0 test=2 pass=true
...
INFO[11-24|21:40:29] API: test ended                          suite=0 test=3 pass=true
...
INFO[11-24|21:40:40] API: test ended                          suite=0 test=1 pass=true
...
INFO[11-24|21:41:45] API: suite ended                         suite=0
INFO[11-24|21:41:46] simulation ethereum/rpc finished         suites=1 tests=77 failed=0
```

从上面的日志可以看出：

- 编译镜像：
  - hive/hiveproxy 将 simulation api 接收 simulation API 请求，并转发到 hive 控制器。
  - hive/clients/go-ethereum：latest 命令行指定的客户端。
  - hive/simulators/ethereum/rpc:latest 命令行指定的 simulator。
- 执行 simulation
  - 启动 hiveproxy
  - 启动 suit
  - 并行执行各种 test
    - 有些 test 需要启动 client
  - 完成 suit
- 完成 simulation

## hive 整体逻辑

[main](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/hive.go#L19) 描述了 hive 整体运行逻辑。

```go
func main() {
    ...
    // 从文件目录查询可用的 clients and simulators.
    inv, err := libhive.LoadInventory(".")
    ...
    // 使用命令行中指定的 --sim 参数正则匹配生成要执行的 simulator
    simList, err := inv.MatchSimulators(*simPattern)
    ...
    // Create the docker backends.
    dockerConfig := &libdocker.Config{
        Inventory:   inv,
        PullEnabled: *dockerPull,
    }
    ...
    // builder 用于 hive runner 构建镜像
    // cb(containerBackend) 管理 container 创建、启动、删除，
    // 以及 docker 中创建、删除网络，在网络中添加、删除 container
    builder, cb, err := libdocker.Connect(*dockerEndpoint, dockerConfig)
    ...

    // env 是启动 container(simulator 以及其他测试依赖 container) 相关配置参数
    env := libhive.SimEnv{
        LogDir:             *testResultsRoot,
        SimLogLevel:        *simLogLevel,
        SimTestPattern:     *simTestPattern,
        SimParallelism:     *simParallelism,
        SimDurationLimit:   *simTimeLimit,
        ClientStartTimeout: *clientTimeout,
    }
    // runner 用于执行 simulation 的对象实例
    runner := libhive.NewRunner(inv, builder, cb)

    // 获取命令行 --client 指定的客户端列表
    clientList := splitAndTrim(*clients, ",")

    // 构建执行 simulation 需要相关镜像： hiveproxy、clients、simulator
    if err := runner.Build(ctx, clientList, simList); err != nil {
        fatal(err)
    }
    ...

    var failCount int
    // 执行命令行 --sim 指定的 simulator（可以通过正则表达式匹配多个）
    // 可以看到这里传入了启动 container 相关的 env 参数
    for _, sim := range simList {
        result, err := runner.Run(ctx, sim, env)
        if err != nil {
            ...
        }
    }
}
```

## build images

[Runner.Build](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/internal/libhive/run.go#L43) 构建 simulation 运行所需相关镜像。

```go
func (r *Runner) Build(ctx context.Context, clientList, simList []string) error {
    // hive proxy image
    if err := r.container.Build(ctx, r.builder); err != nil {
        return err
    }
    // clients images
    if err := r.buildClients(ctx, clientList); err != nil {
        return err
    }
    // simulator images
    return r.buildSimulators(ctx, simList)
}
```

### hiveproxy {#hiveproxy}

hiveproxy 实现了 hive API 服务器代理。这是供“hive”命令行工具内部使用的。hiveproxy 负责将源自私有 docker 网络的 HTTP 请求中继到通常在 Docker 外部运行的 hive 控制器（命令行的 hive 程序）。 代理前端接受请求，并通过代理容器的 stdio 流将它们中继到后端。

前端还有可由后端通过 RPC 触发辅助功能。具体来说，它可以运行 TCP 端点探测，hive 使用这些探测来确认客户端容器已经启动。

## run simulator

通过 [Runner.run](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/internal/libhive/run.go#L163) 来看下执行单个 simulator 的流程。

```go
// run runs one simulation.
func (r *Runner) run(ctx context.Context, sim string, env SimEnv) (SimResult, error) {
    log15.Info(fmt.Sprintf("running simulation: %s", sim))

    // 命令行定义的 clients
    clientDefs := make(map[string]*ClientDefinition)
    ...
    // Start the simulation API.
    tm := NewTestManager(env, r.container, clientDefs)
    ...
    log15.Debug("starting simulator API server")
    // 启动 hiveproxy container, 将 simulation API 转发到外部的 hive 控制器
    server, err := r.container.ServeAPI(ctx, tm.API())

    // Create the simulator container.
    opts := ContainerOptions{
        Env: map[string]string{
            "HIVE_SIMULATOR":    "http://" + server.Addr().String(), // hiveproxy ip:port
            "HIVE_PARALLELISM":  strconv.Itoa(env.SimParallelism),
            "HIVE_LOGLEVEL":     strconv.Itoa(env.SimLogLevel),
            "HIVE_TEST_PATTERN": env.SimTestPattern,
        },
    }
    containerID, err := r.container.CreateContainer(ctx, r.simImages[sim], opts)
    ...
    // 启动 simulator container，执行定义的相关测试
    sc, err := r.container.StartContainer(ctx, containerID, opts)
    // 等待 simulator finish，搜集结果返回
    // Count the results.
    var result SimResult
    for _, suite := range tm.Results() {
        ...
        for _, test := range suite.TestCases {
            ...
        }
    }
    return result, err
}
```

### TestManager

`TestManager` 用于在 simulation 执行期间统计执行结果。

[TestManager.API](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/internal/libhive/testmanager.go#L117) 返回处理 [simulation API](https://github.com/ethereum/hive/blob/master/docs/simulators.md#simulation-api-reference) 的 HTTP 路由。

```go
// newSimulationAPI creates handlers for the simulation API.
func newSimulationAPI(b ContainerBackend, env SimEnv, tm *TestManager) http.Handler {
    api := &simAPI{backend: b, env: env, tm: tm}

    // API routes.
    router := mux.NewRouter()
    router.HandleFunc("/clients", api.getClientTypes).Methods("GET")
    router.HandleFunc("/testsuite/{suite}/test/{test}/node/{node}/exec", api.execInClient).Methods("POST")
    router.HandleFunc("/testsuite/{suite}/test/{test}/node/{node}", api.getNodeStatus).Methods("GET")
    router.HandleFunc("/testsuite/{suite}/test/{test}/node", api.startClient).Methods("POST")
    router.HandleFunc("/testsuite/{suite}/test/{test}/node/{node}", api.stopClient).Methods("DELETE")
    router.HandleFunc("/testsuite/{suite}/test", api.startTest).Methods("POST")
    // post because the delete http verb does not always support a message body
    router.HandleFunc("/testsuite/{suite}/test/{test}", api.endTest).Methods("POST")
    router.HandleFunc("/testsuite", api.startSuite).Methods("POST")
    router.HandleFunc("/testsuite/{suite}", api.endSuite).Methods("DELETE")
    router.HandleFunc("/testsuite/{suite}/network/{network}", api.networkCreate).Methods("POST")
    router.HandleFunc("/testsuite/{suite}/network/{network}", api.networkRemove).Methods("DELETE")
    router.HandleFunc("/testsuite/{suite}/network/{network}/{node}", api.networkIPGet).Methods("GET")
    router.HandleFunc("/testsuite/{suite}/network/{network}/{node}", api.networkConnect).Methods("POST")
    router.HandleFunc("/testsuite/{suite}/network/{network}/{node}", api.networkDisconnect).Methods("DELETE")
    return router
}
```

`api.startTest` 和 `api.endTest` 中看到之前日志中 test 启动和结束的相关日志：

```log
INFO[11-24|21:40:13] API: test started                        suite=0 test=1 name="client launch (go-ethereum)"
INFO[11-24|21:40:40] API: test ended                          suite=0 test=1 pass=true
```

### run hiveproxy

[ServeAPI](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/internal/libdocker/proxy.go#L23) 启动 hiveproxy container, 并在 hiveproxy 与 hive 之间建立消息通道。

```go
// ServeAPI starts the API server.
func (cb *ContainerBackend) ServeAPI(ctx context.Context, h http.Handler) (libhive.APIServer, error) {
    inR, inW := io.Pipe()
    outR, outW := io.Pipe()

    // hive 通过 Input 与 Output 与 hiveporxy 进行交流。
    opts := libhive.ContainerOptions{Output: outW, Input: inR}
    // 创建 hiveproxy container
    id, err := cb.CreateContainer(ctx, hiveproxyTag, opts)
    ...
    // Launch the proxy server before starting the container.
    var (
        proxy     *hiveproxy.Proxy
        proxyErrC = make(chan error, 1)
    )
    go func() {
        var err error
        // 后台运行，接收来自 hiveproxy 的请求
        proxy, err = hiveproxy.RunBackend(outR, inW, h)
    }()

    // 启动 hiveproxy container
    info, err := cb.StartContainer(ctx, id, opts)
    cb.proxy = proxy

    srv := &proxyContainer{
        cb:              cb,
        containerID:     id,
        containerIP:     net.ParseIP(info.IP),
        containerWait:   info.Wait,
        containerStdin:  inR,
        containerStdout: outW,
        proxy:           proxy,
    }

    // Register proxy in ContainerBackend, so it can be used for CheckLive.
    cb.proxy = proxy
    log15.Info("hiveproxy started", "container", id[:12], "addr", srv.Addr())
    return srv, nil
}
```

### run test {#run-test}

[启动 simulator 容器](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/internal/libhive/run.go#L218) 后就开始执行其中定义相关测试代码代码。以 [devp2p](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/simulators/devp2p/main.go#L14) 为例了解执行流程。

```go
func main() {
    discv4 := hivesim.Suite{
        Name:        "discv4",
        Description: "This suite runs Discovery v4 protocol tests.",
        Tests: []hivesim.AnyTest{
            hivesim.ClientTestSpec{
                ...
            },
        },
    }

    eth := hivesim.Suite{
        Name:        "eth",
        Description: "This suite tests a client's ability to accurately respond to basic eth protocol messages.",
        Tests: []hivesim.AnyTest{
            hivesim.ClientTestSpec{
                ...
            },
        },
    }

    snap := hivesim.Suite{
        ...
    }

    hivesim.MustRun(hivesim.New(), discv4, eth, snap)
}
```

跟踪 `hivesim.MustRun` 可以看到所有的执行所有 test case 的地方：

```go

// RunSuite runs all tests in a suite.
func RunSuite(host *Simulation, suite Suite) error {
    ...
    suiteID, err := host.StartSuite(suite.Name, suite.Description, "")
    if err != nil {
        return err
    }
    defer host.EndSuite(suiteID)

    for _, test := range suite.Tests {
        // 调用了所有 test case 的 runTest 方法
        if err := test.runTest(host, suiteID, &suite); err != nil {
            return err
        }
    }
    return nil
}
```

hive 默认定义两种 testCase 类型，分别来看下：

#### TestSpec

```go
func (spec TestSpec) runTest(host *Simulation, suiteID SuiteID, suite *Suite) error {
    test := testSpec{
        suiteID:   suiteID,
        suite:     suite,
        name:      spec.Name,
        desc:      spec.Description,
        alwaysRun: spec.AlwaysRun,
    }
    return runTest(host, test, spec.Run)
}
```

TestSpec.runTest 直接调用 test case 逻辑。

#### ClientTestSpec

[ClientTestSpec.runTest](https://github.com/ethereum/hive/blob/f0f647240e9bfb24d0658ad88005faeafdf53008/hivesim/testapi.go#L339) 描述了单个 ClientTestSpec 类型的 simulation 核心逻辑：

```go
func (spec ClientTestSpec) runTest(host *Simulation, suiteID SuiteID, suite *Suite) error {
    clients, err := host.ClientTypes()
    if err != nil {
        return err
    }
    for _, clientDef := range clients {
        // 根据 test case 中指定的 role 过滤命令行中指定的 client，然后对其执行所有的 test case.
        // 如果 test case 没有指定 role，对所有的额 client 执行测试。
        // 'role' is an optional filter, so eth1 tests, beacon node tests,
        // validator tests, etc. can all live in harmony.
        if spec.Role != "" && !clientDef.HasRole(spec.Role) {
            continue
        }
        test := testSpec{
            suiteID:   suiteID,
            suite:     suite,
            name:      clientTestName(spec.Name, clientDef.Name),
            desc:      spec.Description,
            alwaysRun: spec.AlwaysRun,
        }
        // runTest 是一个封装函数
        err := runTest(host, test, func(t *T) {
            // 执行测试前启动 client
            client := t.StartClient(clientDef.Name, spec.Parameters, WithStaticFiles(spec.Files))
            // 调用自定义的测试逻辑
            spec.Run(t, client)
        })
        if err != nil {
            return err
        }
    }
    return nil
}
```

从上面的代码可以看出 client container 是在执行测试用例的过程中启动的，与日志也匹配：

```log
INFO[11-24|21:40:13] API: test started                        suite=0 test=1 name="client launch (go-ethereum)"
INFO[11-24|21:40:19] API: client go-ethereum started          suite=0 test=1 container=1743f1a0
INFO[11-24|21:40:40] API: test ended                          suite=0 test=1 pass=true
```

另外，从对 `spec.Role`的判断，我们可以明白 simulation 中该字段的用途：“If no role is specified, the test runs for all available client types.”，如果没有指定该字段，那么 spec.Run 针对命令行中指定的所有 client 都会运行，这可能不是我们想要的。

```go
func runTest(host *Simulation, test testSpec, runit func(t *T)) error {
    if !test.alwaysRun && !host.m.match(test.suite.Name, test.name) {
        fmt.Fprintf(os.Stderr, "skipping test %q because it doesn't match test pattern %s\n", test.name, host.m.pattern)
        return nil
    }

    // Register test on simulation server and initialize the T.
    t := &T{
        Sim:     host,
        SuiteID: test.suiteID,
        suite:   test.suite,
    }
    // 调用 hiveproxy.StartTest 上报
    testID, err := host.StartTest(test.suiteID, test.name, test.desc)
    if err != nil {
        return err
    }
    t.TestID = testID
    t.result.Pass = true
    defer func() {
        t.mu.Lock()
        defer t.mu.Unlock()
        // 调用 hiveproxy.EndTest 上报
        host.EndTest(test.suiteID, testID, t.result)
    }()

    // Run the test function.
    done := make(chan struct{})
    go func() {
        defer func() {
            if err := recover(); err != nil {
                buf := make([]byte, 4096)
                i := runtime.Stack(buf, false)
                t.Logf("panic: %v\n\n%s", err, buf[:i])
                t.Fail()
            }
            close(done)
        }()
        // 自己编写的的测试函数
        runit(t)
    }()
    <-done
    return nil
}
```

## 总结

本文先从 main 函数整体梳理了 hive 执行流程，主要分为两步：构建镜像以及运行 simulation。 然后解释单个 simulation 执行过程中说明 TestManager、 hiveproxy 两个重要组件的作用，以及 simulator、hiveproxy、hive、client 是如何交互的。需要注意，client 容器是在 test case 执行过程中按需启动的，它的生命周期只存在于 test case 执行期间。
