---
title: "iTerm2"
description: MacOS下高效使用 iTerm2
slug: iterm2
date: 2023-06-29T09:31:43+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - macos
tags:
  - iterm2
---

## 概述

[iTerm2](https://iterm2.com/) 是一款 macos 下使用的终端工具，用来替代系统默认的 terminal，本文针对日常使用配置做整理，请先阅读[官方文档](https://iterm2.com/documentation.html) 。

## Split Panes

将一个标签划分为多个窗格，每个窗格显示不同的会话。这个功能类似 tmux。

![Split Panes](https://iterm2.com/img/screenshots/split_panes.png)

## Hotkey Window

注册一个热键，当在另一个应用程序中时将 iTerm2 带到前台。个人不常用，系统默认的快捷键够用。

## Search

iTerm2 具有强大的页上查找功能。所有匹配的内容都会立即高亮显示。甚至还提供了正则表达式支持。

![search](https://iterm2.com/img/screenshots/find.png)

还支持搜索所有标签。

![Global search](https://iterm2.com/img/screenshots/global_search.png)

## Autocomplete

只要输入曾经出现在窗口的任何单词的开头，然后 `Cmd-;` 就会弹出一个有建议的窗口。

![Autocomplete](https://iterm2.com/img/screenshots/autocomplete.png)

## Copy Mode

直接修改选中。

![Copy Mode](https://iterm2.com/img/screenshots/copy_mode.png)

## Paste History

甚至可以选择将历史记录保存在磁盘上，这样它就不会丢失。

![Paste History](https://iterm2.com/img/screenshots/paste_history.png)

## Instant Replay

即时回放让可以恢复被从终端删除的文本。

![Instant Replay](https://iterm2.com/img/screenshots/instant_replay.gif)

## Tagged Profile

可以为不同的主机存储单独的配置。

![Tagged Profile](https://iterm2.com/img/screenshots/profiles1.png)

非常实用的一项功能，比如针对不同的主机保持不同的 tab 布局。

## Triggers

iTerm2 支持用户定义的触发器，即在收到与正则表达式相匹配的文本时运行的动作。可以用它来突出显示单词，自动响应提示，在重要事情发生时通知，等等。

![Triggers](https://iterm2.com/img/screenshots/triggers.png)

非常实用的功能。

## Smart Selection

iTerm2 可以执行 "Smart Selection"，通过识别光标下的内容并选择选择多少文本来突出显示 URL、电子邮件地址、文件名等等。

非常使用的功能，避免了移动光标进行选择。

## Shell Integration

iTerm2 可以与 shell 集成，所以它知道 shell 提示符在哪里，你正在输入什么命令，你在哪个主机上，以及你的当前目录是什么。这就实现了各种很酷的功能：你可以用 ⇧ ⌘↑ 和 ⇧ ⌘↓ 轻松地导航到以前的 shell 提示。

![Shell Integration](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-shell-integration-navigation-demo.gif)

非常实用的功能。

### Automatic Profile Switching

使用 Shell 集成功能，可以让 iTerm2 根据你正在做的事情来切换配置文件。例如，可以定义一个配置文件，当 ssh 到某个主机名时，或者当用户名是 root 时，甚至当在一个特定的目录中时，它总是被使用。

![Automatic Profile Switching](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-automatic-profile-switching.gif)

非常实用的功能。

## Inline Images

iTerm2 有一个自定义的转义序列，可以在终端中直接显示图像。甚至是 GIF 动画！

![Inline Images](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-inline-images-demo.gif)

## Timestamps

可以看到终端中每一行的最后修改时间。这对了解一项工作的完成时间很有用。

![Timestamps](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-timestamps.png)

非常实用的功能。

## Password Manager

iTerm2 的内置密码管理器将密码加密存储在 macOS 的钥匙串中。这可以用来保存一些远程服务密码。

![Password Manager](https://iterm2.com/img/screenshots/password_manager.png)

非常实用的功能。

## Advanced Paste

利用高级粘贴功能，可以在粘贴前编辑文本，将其转换为 base64，转换特殊字符，等等。

![Advanced Paste](https://iterm2.com/img/screenshots/advanced_paste.png)

非常使用的功能。比如替换字符串中不同的关键词。

## Annotations

可以在终端中选择文本并在 iTerm2 中为其添加注释。比如标记日志文件中的某些重点；或者标记反汇编过程中的每个寄存器作用。

![Annotations](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-annotations.png)

## Badges

可以在终端的右上方放一个徽章，显示关于当前会话的信息。它可以显示当前会话的用户名、主机名，甚至是自定义的数据，比如当前的 git 分支。

![Badges](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-badges.png)

非常实用的功能，可以高亮提示当前 host 的登录信息。

## Captured Output

捕获输出功能可直接捕获程序输出并执行预先设定的功能。比如捕获程序输出的警告和错误，并通过搜索引擎查找对应的解决方案。

![Captured Output](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-captured-output.gif)

非常实用的功能。
