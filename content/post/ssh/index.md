---
title: "ssh 实践"
description: 
date: 2022-06-02T10:39:36+08:00
image: 
math: 
license: 
hidden: false
comments: true
draft: false
categories:
    - 最佳实践
tags:
    - ssh
---

## 概述

本文描述 [SSH](https://www.ssh.com/) 的使用实践，官方资料可以参考 [SSH 学院](https://www.ssh.com/academy/ssh)。

## SSH 实现

## SSH key

## sshd_config

## ssh_config

参考官方文档 [SSH config file for OpenSSH client](https://www.ssh.com/academy/ssh/config) 。

### ProxyCommand

指定连接 server 的命令，可用于通过代理访问 server，如 `ProxyCommand nc -X connect -x 127.0.0.1:7890 %h %p`。

### ServerAliveInterval

客户端在向服务器发送空数据包之前将等待的秒数（以保持连接处于活动状态）。避免 SSH 被强行中断，重连导致的不便。

## SSH Commands

参见 [SSH Command](https://www.ssh.com/academy/ssh/command)

### ssh-keygen

[ssh-keygen](https://www.ssh.com/academy/ssh/keygen) 有相关步骤的详细介绍：

1. create an SSH key: `ssh-keygen -t rsa -b 4096`
2. copy the public key to the server: `ssh-copy-id -i ~/.ssh/tatu-key-ecdsa user@host`
3. add key to SSH agent:

   [ssh-agent](https://www.ssh.com/academy/ssh/agent) 是一个可以保存用户私钥的程序，因此私钥密码只需要提供一次。

[github](https://docs.github.com/cn/authentication/connecting-to-github-with-ssh) 上也有生成 SSH key 的相关说明。
