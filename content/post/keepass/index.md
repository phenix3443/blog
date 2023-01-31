---
title: "KeePass使用"
description: keepass：快平台密码管理方案
slug: keepass
date: 2023-01-31T15:51:09+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
tags:
  - KeePass
---

## 概述

keepass 是一种密码管理软件，相比较 LastPass、1password，它开源免费，有跨平台多种实现，可以满足日常需要，关键还免费。这里记录一下各平台的最佳选择：

## KeePassxc

[keepass](https://keepass.info/) 官方只有 Windows 版本， 界面简陋，但很多功能需要可以配合插件使用，其实功能拓展性更强。

[keepassxc](https://keepassxc.org/) 是一个桌面跨平台的客户端，相比原版的 keepass，优点：

- 设置上更简单易用，界面上也更好看。
- 配合浏览器插件 KeePassXC_Browser 更是无缝衔接。
- 可以直接解析其他软件（如 LastPass、1password 等）导出的密码数据。

缺点是目前还不支持通过 webDAV 加载数据库，但是这个可以通过坚果云或者 oneDriver 等同步网盘解决。[这篇文章](https://mephisto.cc/tech/keepassxc/) 这篇文章介绍了使用。

## KeePass2Android

[KeePass2Android](https://github.com/PhilippC/keepass2android) 是 Android 上的解决方案，相比较 [KeePassDX](https://www.keepassdx.com/) 支持通过 webDAB 加载数据库。 [这篇文章](https://github.com/1688aa/KeePass-Instructions-for-use/blob/master/%E5%AE%89%E5%8D%93%E7%89%88%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E/%E5%AE%89%E5%8D%93%E7%89%88%E4%BD%BF%E7%94%A8%E8%AF%B4%E6%98%8E.md) 是一个使用说明。

## keepassium

[keepassium](https://www.appinn.com/keepassium-for-ios/) 是 IOS 上的应用，[这篇文章](https://www.appinn.com/keepassium-for-ios/) 介绍了简单使用。
