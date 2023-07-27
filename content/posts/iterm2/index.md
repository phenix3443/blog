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
draft: false
categories:
  - macos
tags:
  - iterm2
---

## 概述

[iTerm2](https://iterm2.com/) 是一款 macos 下使用的终端工具，用来替代系统默认的 terminal，本文针对日常使用配置做整理，请先阅读[官方文档](https://iterm2.com/documentation.html) 。

## window && tab && panel

### 窗口快捷键

- `Cmd+左箭头，Cmd+右箭头`可以在标签间导航。`Cmd-{`和 `Cmd-}`也是如此。
- `Cmd+数字`可以直接导航到一个标签。
- `Cmd+Option+Number` 可以直接导航到一个窗口。
- `cmd-shift-O` 快速打开。可以通过标签标题、命令名称、主机名称、用户名、配置文件名称、目录名称、徽章标签等进行搜索。还可以创建新的标签，改变当前会话的配置文件，以及打开窗口布局。如果用`/`打开通往各种命令的快捷方式。

### Split Panes

将一个标签划分为多个窗格，每个窗格显示不同的会话。这个功能类似 tmux。

![Split Panes](https://iterm2.com/img/screenshots/split_panes.png)

快捷键：

- `cmd-d` 垂直分割。
- `cmd-shift-d` 水平分割。
- `cmd-opt-arrow` 或 `cmd-[`和 `cmd-]`在分割的窗格中导航。
- `cmd-shift-enter`“最大化” 当前面板--隐藏该标签中的所有其他面板。再按一下这个快捷键，就可以恢复被隐藏的窗格。

### Window Arrangements

可以用菜单选项 `Window > Save Window Arrangement` 对打开的 `windows, tabs, and panes` 做一个快照。然后使用 `Window > Restore Window Arrangement` 来恢复这个配置，或者可以选择在启动 iTerm2 时用 `Preferences > General > Open saved window arrangement` 来自动恢复它。

### Hotkey Window

注册一个热键，当在另一个应用程序中时将 iTerm2 带到前台。个人不常用，通过系统默认的快捷键(`cmd-tab`)进行切换。

## Search

iTerm2 具有强大的页上查找功能。所有匹配的内容都会立即高亮显示。甚至还提供了正则表达式支持。

![search](https://iterm2.com/img/screenshots/find.png)

还支持搜索所有标签。

![Global search](https://iterm2.com/img/screenshots/global_search.png)

## Autocomplete

只要输入曾经出现在窗口的任何单词的开头，然后 `Cmd-;` 就会弹出一个有建议的窗口，然后 tab 进行补全，enter 选中。

![Autocomplete](https://iterm2.com/img/screenshots/autocomplete.png)

## Paste History

`cmd-shift-H` 访问剪贴板历史，可以选择将历史记录保存在磁盘上，这样它就不会丢失。

![Paste History](https://iterm2.com/img/screenshots/paste_history.png)

## Instant Replay

即时回放让可以恢复被从终端删除的文本，主要可以查看一闪而过的显示，比如 top 命令，下面的这个 gif 描述了该命令的典型使用场景。

![Instant Replay](https://iterm2.com/img/screenshots/instant_replay.gif)

## Profile

设置保存在 profile 中。

![Tagged Profile](https://iterm2.com/img/screenshots/profiles1.png)

### Automatic Profile Switching

使用 Shell 集成功能，可以让 iTerm2 根据正在做的事情来切换 profile。例如，可以定义一个 profile，当 ssh 到某个主机名时，或者当用户名是 root 时，甚至当在一个特定的目录中时，它总是被使用。

![Automatic Profile Switching](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-automatic-profile-switching.gif)

### Dynamic Profiles

[Dynamic Profiles](https://iterm2.com/documentation-dynamic-profiles.html) 是一项有用的功能，可以通过 property list 方式定义 profile，在运行时动态被加载。避免了手工在 UI 界面进行编辑 profile 文件。

## Triggers

iTerm2 支持用户定义的触发器，即在收到与正则表达式相匹配的文本时运行的动作。可以用它来突出显示单词，自动响应提示，在重要事情发生时通知，等等。

![Triggers](https://iterm2.com/img/screenshots/triggers.png)

触发器的一个高级用途是捕获与正则匹配的输出，并在工具箱中只显示这些匹配的行。例如，可以创建一个触发器来匹配编译器错误。当运行 Make 时，错误会出现在的窗口边上，可以点击每个错误来直接跳到它。

## Text Selection

### 点击

- 单击并拖动来执行正常选择。
- 单击一个位置并按住 Shift 键单击另一位置来进行选择：无需拖动。
- 双击选择整个单词。
- 单击三次可选择整行。
- 四击执行“Smart Selection”，通过识别光标下的内容并选择选择多少文本来突出显示 URL、电子邮件地址、文件名等等。

可以在`Preferences > Pointer`修改这种行为，比如将触摸板三指点击设置智能选择。

其他点击动作：

- 按住 cmd 并点击一个 URL，它将被打开。
- 按住 cmd 并点击一个文件名，它将被打开。当按住 cmd 点击一个文本文件的名字时，对 MacVim、TextMate 和 BBEdit 有特殊的支持：如果它后面是冒号和行号，文件将在该行号处打开。
- 选择时按住 cmd 和 option，将进行一个矩形选择。
- 基于选中文本的不同，右击选中文本可以执行网络搜索，或者发送邮件等动作。

### 无点击

要想不使用鼠标选择文本，按 `cmd-f` 打开查找栏。输入想复制的文本的开头，查找功能将在窗口中选择它。然后按 `tab` 键，选择的末端将提前一个字。要把选择的开头向左移动，按 `shift-tab`。这种方式最多只能选择一行文字。

### Copy Mode

[Copy Mode](https://iterm2.com/documentation-copymode.html)支持通过键盘选择文本，是键盘党非常实用的功能。

![Copy Mode](https://iterm2.com/img/screenshots/copy_mode.png)

## Shell Integration

iTerm2 可以与 unix [Shell 集成](https://iterm2.com/documentation-shell-integration.html)，以便它可以跟踪命令历史记录、当前工作目录、主机名等，甚至可以通过 ssh 进行跟踪。

![Shell Integration](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-shell-integration-navigation-demo.gif)

这可以实现一些有用的功能：

- 回到之前标记（mark）的位置。
- 当前命令完成运行时发出警报。
- 可以右键单击远程主机上的文件名（例如，在 ls 的输出中）来下载它。

  - iTerm2 根据主机名字猜测 ssh host 中的名字，但二者可能不同，这会导致 ssh 连接失败，参考[how-can-i-override-the-hostname](https://gitlab.com/gnachman/iterm2/-/wikis/scp-not-connecting#how-can-i-override-the-hostname)，解决办法：

    Edit your login script on the remote machine (~/.login, ~/.profile, ~/.bash_profile, ~/.zshrc, or ~/.config/fish/config.fish, depending on your shell). You should see a line like this:

    ```shell
    test -e "${HOME}/.iterm2_shell_integration.tcsh" && source "${HOME}/.iterm2_shell_integration.tcsh"
    ```

    Prior to that line, set the environment variable iterm2_hostname to the proper name to connect to. For example:

    ```shell
    export iterm2_hostname=foo.example.com
    ```

- 按住 option 并将文件从 Finder 拖放到 iTerm2 中进行上传。
- 查看过去执行的命令历史、最近或者频繁访问的目录。
- 通过 hostnames, usernames, or username+hostname 切换 profile。

### Utilities

[Utilities](https://iterm2.com/documentation-utilities.html) 中包含了一系列有用的 shell 脚本：

- imgcat： 在终端中内嵌显示图像。
- it2copy: 将文本复制到粘贴板。也可以通过 ssh 服务远程主机上的内容。
- it2dl/it2ul： 通过 ssh 下载/上传文件。类似于 sz/rz 功能。

## Inline Images

iTerm2 有一个自定义的转义序列，可以在终端中直接显示图像。甚至是 GIF 动画！

![Inline Images](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-inline-images-demo.gif)

## Timestamps

可以看到终端中每一行的最后修改时间。这对了解一项工作的完成时间很有用。

![Timestamps](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-timestamps.png)

非常实用的功能。

## Password Manager

iTerm2 的内置密码管理器将密码加密存储在 macOS 的钥匙串中。这可以用来保存一些远程服务密码，在 SSH 的时候进行自动填充。

![Password Manager](https://iterm2.com/img/screenshots/password_manager.png)

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

非常实用的功能，可以高亮提示当前 host 的登录信息。详见[badges](https://iterm2.com/documentation-badges.html)

## Captured Output

捕获输出功能可直接捕获程序输出并执行预先设定的功能。比如捕获程序输出的警告和错误，并通过搜索引擎查找对应的解决方案。

![Captured Output](https://iterm2.com/img/screenshots/v3-screen-shots/iterm2-captured-output.gif)

非常实用的功能。详见[Captured Output](https://iterm2.com/documentation-captured-output.html)。

## Status Bar

iTerm2 提供了一个可配置、可编写脚本的[Status Bar](https://iterm2.com/documentation-status-bar.html)。目的是显示有关正在工作的环境的最新信息，并在适当的情况下提供有用的交互。
