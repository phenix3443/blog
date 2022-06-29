---
title: "Github Best Practices"
description: 记录 Github 最佳实践
date: 2022-06-28T01:50:36+08:00
slug: github-best-practices
image: 
math: 
license: 
hidden: false
comments: true
draft: false
tags:
    - practices
    - github
---

## issue

Github 通过 [issue](https://docs.github.com/en/issues) 来记录问题。issue 可以和 PR 进行关联，这样 PR merge 后，issue 也可以自动关闭。

## project

Github 通过 [project](https://docs.github.com/en/issues/trying-out-the-new-projects-experience/about-projects) 来跟进项目（project）的整体情况。可以将 issue 或者 PR 作为 item 加入到 project，在 project 中可以设置 issue 或者 PR 的优先级等字段（field），也可以根据这些字段进行筛选。

## actions

通过 [action](../use-github-actions/) 使用 Github 的 CI/CD 能力。[Awesome Actions](https://github.com/sdras/awesome-actions) 搜集了常用的 actions。

## 测试覆盖率

[codecov](https://github.com/codecov/codecov-action) 用来添加相关覆盖率检查。

## badges

[shileds](https://github.com/badges/shields) 用来在添加仓库的各种展示图标，如编译情况，代码覆盖率等。
