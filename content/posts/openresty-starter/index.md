---
title: OpenResty Starter
description: OpenResty 开发框架
slug: openresty-starter
date: 2023-07-23T11:58:06+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: []
categories: [openresty]
tags: [nginx, lua]
images: []
---

本文介绍自己编写的一套 openresty 开发框架。

<!--more-->

## 概述

本项目总结 openresty 日常开发的功能和模块，最终目的是规范和简化开发流程、实现低耦合、高内聚的项目。规范的方面主要包括：

- 项目结构
- 项目文档
- 代码结构
- 代码文档
- 单元测试
- 接口测试
- 打包部署
- 统计监控
- 性能测试

## 项目结构

- nginx/ 主要业务代码。
  - lib/ 代码中可能会用到的动态链接库（.so）。
  - lua/ Lua 核心代码。
    - conf/ 业务配置。
    - interface/ 业务接口。
      - inner/ 内部接口。
    - cache/ 缓存相关，主要包括业务代码和 redis、memcache 等接口的封装。
    - database/ 持久化数据化，主要包括业务代码和 MySQL 等接口的封装。
    - upstream/ 第三方服务接口封装。
    - misc/ 工具库
    - mock/ 第三方服务 mock 接口。
    - falcon/ 上报 falcon 的 metrics 相关封装。
  - sbin/ 和服务运行相关的脚本。
  - conf/ nginx 配置文件。
- doc/ 项目文档。
  - overview 项目详细介绍。
  - protocol 项目接口使用的协议。
  - environment 项目 mock/develop/pre-release/release 环境的配置。
  - storage 项目涉及的存储的说明，比如 MySQL、Redis 等。
- script/ 辅助脚本。
- test/ 测试脚本，主要是接口测试。
- CMakeLists.txt 打包配置。
- build_openresty.sh openresty 安装脚本。
- install.cmake 安装包制作脚本。
- Dockerfile openresty-develop-framework 镜像配置。
- Dockerfile.code 项目代码生成的存储卷镜像配置。
- README.md 项目说明。
- mock.sh 建立 mock 环境的脚本。
- config.ld LDoc 配置文件。使用 LDoc 生成 Lua 源码文件的相关文档。详见 [LDoc 手册](https://phenix3443.github.io/notebook/lua/ldoc-manual.html)。

## 单元测试

使用 LuaUnit 测试 Lua 源码。详见 [LuaUnit 实践](https://phenix3443.github.io/notebook/lua/luaunit.html)

为了方便测试，除接口外的源码文件中不应该调用 nginx_lua_module 系列的函数。

## 接口测试

使用 python3 编写接口测试脚本：

- Pipfile 使用 pipenv 建立与主机环境隔离的运行环境。
- config.py 配置文件。
- log_cfg.py 日志配置文件，使用 python 内置的 logging 库。
- example_db.py 数据库接口。
- example_cache.py 缓存接口。
- upstream.py 第三方服务接口。
- example_server.py 对应服务接口的 HTTP 客户端。
- test_example.py 服务接口测试用例。

## 安装 openresty

考虑到最好在生产环境自行安装 openresty，所以打包好的文件没有 nginx 执行程序。

```shell
./build_openresty.sh <project-dir>
```

## 打包代码

```shell
cd build
cmake .. -DCMAKE_INSTALL_PREFIX=<project-dir>
make install
```

## 部署代码

将打包好的文件替换 =openresty/nginx 下的同名文件。

如果业务前端有在 nginx 代理，在代理的 =nginx.conf 加入以下内容：

```nginx
include <path-to-project>/project.proxy.nginx.conf;
```

## Docker

不要将所有代码都放在一个镜像中，最佳实践：以 openresty-develop-framework 镜像挂载项目代码制作的存储卷启动容器。

## 统计监控

- falcon 监控服务运行状态。
- ELK （todo）全链路跟踪。

## 性能测试

## 压测

推荐使用 `tcpcopy` 进行压测。其他工具介绍参见：

- [十个免费的 WEB 压力测试工具](https://coolshell.cn/articles/2589.html)
- [哪款网站压力测试工具值得推荐？](https://www.zhihu.com/question/21861449)

## 定位

使用火焰图定位性能瓶颈。详见 [openresty-systemtap-toolkit 实践](https://phenix3443.github.io/notebook/openresty/openresty-systemtap-toolkit.html)
