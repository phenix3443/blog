---
title: Evmos
description:
slug: evmos
date: 2024-04-26T15:29:13+08:00
featured: false
draft: true
comment: true
toc: true
reward: true
pinned: false
carousel: false
math: false
series: []
categories: []
tags: []
images: []
---

## 概述

## feemarket

本文档说明 feemarket 模块，该模块允许为网络定义全局交易费用。

此模块旨在支持 cosmos-sdk 中的 EIP1559。

x/auth 模块中的 MempoolFeeDecorator 需要被重写，以便检查基础费用以及最小燃料价格，允许实现一个全局费用机制，该机制根据网络活动的不同而变化。
