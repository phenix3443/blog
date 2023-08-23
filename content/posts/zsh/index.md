---
title: zsh
description: 高效使用 zsh
slug: zsh
date: 2023-08-23T02:09:46+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: [如何构建高效的开发工具链]
categories: [shell]
tags: [zsh, autocompletion]
images: []
---

本文介绍 zsh 使用。

<!--more-->

## 函数

## 自动补全{#auto-completion}

简而言之，在`.zshrc`中写入以下内容，更多信息参见 [延伸阅读]({{< ref "#more_read" >}})：

{{< gist phenix3443 3109fe349e3525c80831429fa7108b36 >}}

例如，要添加 hugo 的补全功能：

```shell
hugo completion zsh > $(brew --prefix)/share/zsh/site-functions/_hugo
```

### zsh-completions

通过 [zsh-completions](https://formulae.brew.sh/formula/zsh-completions) 安装更多补全脚本：

```shell
brew install zsh-completions
```

根据提示更新 `FPATH`：

```shell
FPATH=$(brew --prefix)/share/zsh-completions:$FPATH
```

### 目录权限问题

如果启动终端时出现如下提示：

```shell
zsh compinit: insecure directories, run compaudit for list.
Ignore insecure directories and continue [y] or abort compinit [n]?
```

输入 compaudit 进行诊断，会列出不安全的目录列表，这些目录权限过高，需要将用户组写权限去掉。

例如：

```shell
$ compaudit
There are insecure directories:
/usr/local/share/zsh-completions
```

执行下面的语句修复：

```shell
chmod g-w /usr/local/share/zsh-completions
```

### 延伸阅读{#more_read}

- 关于 `fpath` 请看 [how-to-define-and-load-your-own-shell-function-in-zsh](https://unix.stackexchange.com/questions/33255/how-to-define-and-load-your-own-shell-function-in-zsh)
- 通过 `man zshbuiltins` 查看 `autoload man page` 了解`autoload`更多信息。
- 关于`-Uz`参数看这里 [What is the difference between `autoload` and `autoload -U` in Zsh?](https://unix.stackexchange.com/questions/214296/what-is-the-difference-between-autoload-and-autoload-u-in-zsh)
- 关于 zsh 补全功能参见官方文档 [zsh Completion System](https://zsh.sourceforge.io/Doc/Release/Completion-System.html)。
