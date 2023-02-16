---
title: Github 多个账号开发实践
description: Github 上使用多个账号和 SSH key 进行项目开发
slug: github-multi-accounts
date: 2022-03-11 00:00:00+0000
image: github-ssh.png
tags:
  - github
  - git
  - ssh
---

如果在 Github 有多个账号，比如同时有个人账号以及多个组织账号（organization），开发过程中难免需要切换身份，这篇文章介绍解决此场景下遇到的问题。

这里我们假设处理场景：

- 个人账户对应的仓库是 personal_repo
- 组织账户对应的仓库是 organization_resp

最终目的: 自动识别对应仓库的用户身份，并正确的 pull & push 仓库代码。

注意，本文中带有大括号符号是需要自行命名替换的变量或者文件。

## 配置 SSH

配置不同身份登录 github 时使用的登录认证信息。如果两个 repo 在不同的站点，那直接配置即可，但是当前场景不同的身份都是登录 github，为了进行区分，需要通过给 github 起别名的方式来让两种身份进行区分。

生成 SSH 公钥私钥：

```shell
ssh-keygen -f {personal}
ssh-keygen -f {organization}
```

配置 SSH 登录：

```config
 Host {organization}.github.com
     HostName github.com
     User git
     ProxyCommand nc -v -x 127.0.0.1:1080 %h %p
     IdentitiesOnly yes
     IdentityFile ~/.ssh/{organization}

 Host {personal}.github.com
     HostName github.com
     User git
     ProxyCommand nc -v -x 127.0.0.1:1080 %h %p
     IdentitiesOnly yes
     IdentityFile ~/.ssh/{personal}

```

测试 ssh 秘钥配置正确性：

`ssh -T git@{personal}.github.com`

> Hi {personal-name}! You've successfully authenticated, but GitHub does not provide shell access.

`ssh -T git@{organization}.github.com`

> Hi {organization-name}! You've successfully authenticated, but GitHub does not provide shell access.

## 配置 Git

下面配置仓库对应的身份信息，以便进行 commit/push 操作时候可以获取到正确的身份信息：

```shell
cd {personal_repo}
git config user.name {personal-name}
git config user.email {personal-email}

cd {organization_repo}
git config user.name {organization-name}
git config user.email {organization-email}
```

查看配置`git config --local --list`验证配置生效。

如果不同身份下的仓库很多，那么上面的操作就显得繁琐，可以通过 git-config 来解决。

```shell
git config -f {personal}.gitconfig user.name {personal_name}
git config -f {personal}.gitconfig user.email {personal_email}

git config -f {organization}.gitconfig user.name {organization_name}
git config -f {organization}.gitconfig user.email {organization_email}

git config --global includeIf."hasconfig:remote.*.url:*github.com:{personal}/**".path {personal}.gitconfig
git config --global includeIf."hasconfig:remote.*.url:*github.com:{organization}/**".path {organization}.gitconfig
```

进入到不同的额仓库目录，执行 `git config --get user.name` 验证是否与配置相同。

## 打通 git 与 SSH

git 底层使用 ssh 来访问 github，上述过程中，repo 对应的仓库 URL 都是 `github.com`, 但 SSH 配置中为了区分身份，给 `github.com` 配置了别名，这会导致仓库不能正确 push/pull。

该问题可以通过 git 的 `insteadOf` 来解决：

```shell
 [url "git@{organization}.github.com:{organization}/"]
     insteadOf = git@github.com:{organization}/
```
