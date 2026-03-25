---
title: "飞连与公司 API：远端 Mac + Tailscale 的开发机分流思路"
description: 用专用 Mac 跑飞连与轻量 SOCKS，开发机用 Clash 分流公司网关与个人 API，避免与本机透明代理打架。
slug: feilian-vpn-proxy-isolation
date: 2026-03-25T12:00:00+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - best-practices
tags:
  - proxy
  - clash
  - tailscale
  - macos
series:
  - 如何一步步搭建家庭网络服务
---

很多团队会提供「必须连公司 VPN 才能访问」的 LLM 网关，同时开发者又会使用自购的第三方 API。若在本机再装一套企业 VPN，很容易和本机已经在跑的透明代理（例如 Clash TUN）在路由、DNS 上叠床架屋，排错很烦。

<!--more-->

## 思路概览

把「必须走飞连」的那一侧，放到一台**长期在线的小主机**上（例如 Intel Mac Mini）：只在这台机器上登录飞连，并在本机起一个**轻量 SOCKS 入口**（常用工具如 gost）。开发机通过 **Tailscale** 拿到这台机器的虚拟网地址，像访问内网服务一样连过去；再在开发机上的 **Clash** 里写规则：访问公司 API 域名时走这条 SOCKS，其余流量仍走原来的代理策略。

这样，IDE 侧可以继续用 **Code Switch R** 一类工具，把「公司」和「个人」多个供应商放在同一入口里；真正走哪条链路，交给 Clash 按域名分流，而不是在系统里开两套 VPN。

## 为什么这样拆

- **飞连**往往依赖 GUI 登录，没有稳定的「纯容器无头」用法，单独一台机器常驻登录更省事。
- **Tailscale** 解决「家宽、外出时找不到公司 LAN」的问题，用虚拟网 IP 访问 Mini 上的端口即可。
- **Clash** 继续扮演「总闸门」：TUN 接管流量后，公司域名与普通外网域名各走各的出站，避免在开发机上混用两套 VPN。

## 落地时要注意的两点

一是 macOS 上 Tailscale 的 **虚拟网卡编号会变**，Clash 若把到 Mini 的流量走错接口，会出现 TLS 握手失败；用配置生成脚本在每次同步时**自动检测当前 utun** 并写回，会稳定很多。

二是域名与 DNS 的维护：公司域名、Tailscale 相关域名适合放进**独立的规则集仓库**里版本管理，Clash 主配置只引用 rule-provider，减少在 `base.yaml` 里堆长列表；DNS 侧若用 fake-ip，也可以用 **rule 模式**配合 GEOSITE，减少手写域名。

## 小结

这不是「某一种代理软件」的教程，而是一种**职责拆分**：VPN 会话留在专用机、加密远程访问交给 Tailscale、策略分流交给 Clash、多供应商聚合交给 Code Switch R。按这个顺序拆，本机代理栈会相对干净，也适合长期维护。

更完整的技术说明（背景、选型、术语表）见 home-lab 仓库：`claude/feilian-vpn-proxy-isolation.md`。
