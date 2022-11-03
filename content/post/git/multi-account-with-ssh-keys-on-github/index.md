---
title: Github 多个账号开发实践
description: Github 上使用多个账号和 SSH key 进行项目开发
slug:
date: 2022-03-11 00:00:00+0000
image: github-ssh.png
categories:
tags:
    - github
    - git
    - ssh
---

如果在 Github  参与多个组织（organization）,每个组织中又对应各自不同账号不同的账号，本地开发过程中难免遇到不同项目需要切换身份的问题，这篇文章介绍了一种通过 git 和 ssh 配置解决该问题的方式。

1. 通过别名来管理多个秘钥文件。

   ```shell
    Host organization.github.com
        HostName github.com
        User git
        ProxyCommand nc -v -x 127.0.0.1:1080 %h %p
        IdentitiesOnly yes
        IdentityFile ~/.ssh/id_rsa.work

    Host personal.github.com
        HostName github.com
        User git
        ProxyCommand nc -v -x 127.0.0.1:1080 %h %p
        IdentitiesOnly yes
        IdentityFile ~/.ssh/id_rsa.personal

   ```

2. 测试 ssh 秘钥配置正确性。

   `ssh -T git@personal.github.com`
    > Hi {personal-name}! You've successfully authenticated, but GitHub does not provide shell access.

   `ssh -T git@taikochain.github.com`
    > Hi {work-name}! You've successfully authenticated, but GitHub does not provide shell access.

3. 以工作项目为例，解释应该怎么配置：

    假设工作项目仓库为`git@github.com:{organization-name}/{project-repo}.git`

    克隆项目代码，注意要将`github.com`修改为 ssh 配置中`Host`对应设置：

   `git clone git@organization.github.com:{organization-name}/{project-repo}.git`

4. 进入仓库配置相关信息：

   ```shell
    cd {project-repo}
    git config user.name {work-name}
    git config user.email {work-email}

   ```

    查看配置`git config --local --list`验证配置生效.

5. 步骤 3 中，每次 clone repo 都需要修改 repo 链接，不是很方便，这里可以通过修改`.gitconfig`解决：

  ```shell
   [url "git@{organization-name}.github.com:{organization-name}/"]
       insteadOf = git@github.com:{organization-name}/
  ```
