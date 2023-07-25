---
title: "Github Actions"
description: 使用 Github Action 进行持续集成
slug: github-actions
date: 2022-06-21T15:57:20+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - github
tags:
  - actions
---

## 概述

[Actions](https://docs.github.com/en/actions) 是 Github 用于 CI/CD 的工具。

当 `repository` 发生 `events`时触发 GitHub Actions `workflows`，例如`open pull request` 或 `create issue`。workflow 包含一个或多个可以按顺序或并行运行的`jobs`。 每个 job 都将在其自己的`runner`内运行，并具有一个或多个`steps`，这些步骤要么运行自定义的脚本，要么运行一个`action`，action 是一种可重复使用的扩展，可以简化工作流程。

### Workflow

`workflow`定义在`repo`的`.github/workflows`目录中，由`repo`中的`event`触发运行，也可以手动触发，按定时触发。

`repo`可以有多个`workflow`，每个`workflow`可以执行一组不同的任务。 例如，一个`workflow`来拉取请求，执行构建和测试，另一个`workflow`在每次创建发布时部署应用程序，还有另一个`workflow`在每次有人打开新问题时添加标签。

workflow 可以互相引用，请参阅 [Reusing workflows](https://docs.github.com/en/actions/learn-github-actions/reusing-workflows)

### Event

`event`是`repo`中触发`workflow`运行的特定活动。活动可能源自 GitHub，例如，当有人创建拉取请求、打开 issue 或将提交推送到`repo`。

也可以通过执行定时任务、调用 github REST API 或者手动触发`workflow`的执行。

### Jobs

`job`是`workflow`中在同一`runner`上执行的一组`step`。

每个`step`要么是一个将要执行的 shell 脚本，要么是一个将要运行的`action`。`step`按顺序执行并且相互依赖。由于每个`step`都在同一个`runner`上执行，因此 step 直接拿可以共享数据。例如，可以有一个构建应用程序的`step`，然后是一个测试已构建应用程序的`step`。

可以配置一个`job`间的依赖关系；默认情况下，`job`没有依赖关系并且彼此并行运行。 例如，可能有多个不同架构的`build jobs`，它们之间没有依赖关系，但是`packaging jobs`依赖它们。`packaging job`等待`build jobs`全部运行完成后才会运行。

### Actions

`action`是 GitHub Actions 平台的自定义应用程序，它执行复杂但经常重复的任务。`action`可用来拉取`repo`，为构建环境设置正确的工具链，或设置对云提供商的身份验证。

可以编写自己的`action`，也可以在 [GitHub Marketplace](https://github.com/marketplace?type=actions) 中找到想要的`action`。详见 [Finding and customizing actions](https://docs.github.com/en/actions/learn-github-actions/finding-and-customizing-actions)

通过`action`来减少`workflow`文件中的重复代码。

### Runners

`runner`是运行`workflow`的服务器。 每个`runner`一次可以运行一个`job`。 GitHub 提供 Ubuntu Linux、Microsoft Windows 和 macOS 来运行`workflow`； 每个`workflow`运行都在一个全新的、新配置的虚拟机中执行。 如果需要不同的操作系统或需要特定的硬件配置，可以托管自己的`runner`。

## 示例

参考 [Create an example workflow](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions#create-an-example-workflow)

## cache

为了使 workflow 更快、更高效，可以为依赖项（比如 go module）和其他经常重用的文件创建和使用缓存。详见 [Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)。

## deploy

[About continuous deployment](https://docs.github.com/en/actions/deployment/about-deployments/about-continuous-deployment)

## 参考

- [Run workflow, step, or job based on file changes GitHub Actions](https://how.wtf/run-workflow-step-or-job-based-on-file-changes-github-actions.html)
