---
title: "Cryptography In blockchain"
description: 区块链中的密码学
slug: cryptography-in-blockchain
date: 2023-04-04T22:18:38+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
series:
  - 以太坊中的密码学
categories:
  - ethereum
tags:
  - cryptography

math: true
---

本文介绍区块链中的密码学知识。

<!--more-->

## 多项式{#polynomial}

多项式 (Polynomial) 是代数学中的基础概念，是由称为未知数的`变量`和称为`系数`的常数通过有限次加减法，乘法以及自然数幂次的乘方运算得到的代数表达式。以单变量多项式为例说明：

$$
f(x) = a_0 + a_1x + ... + a_nX^n = a_0,a_1,....,a_n
$$

以上是系数表示形式，系数序列确定多项式也就确定了。还有一种表示方法是使用 n+1 点值对表示 n 次多项式。

$$
f(x) = (x_0,y_0),(x_1,y_1),....,(x_n,y_n)
$$

同样，这种方法也能唯一确定多项式。

两种表示方法，各有其应用场景，比如系数表示法在计算多项式相加的场合效率高，而点值表示法则应用在多项式相乘计算场合。

由于两种表示法本质是同一个东西，所以二者可以相互转化，其中 [FFT](https://oi-wiki.org/math/poly/fft/) 就是实现系数表达到点值表示的转换方法，而 IFFT 正好相反。关于 FFT 和 IFFT 深入解读超出本文范围，请自行查阅资料。

## 哈希函数

[一文读懂 SHA256 算法原理及其实现](https://zhuanlan.zhihu.com/p/94619052)

## 群环域

参考 [群环域](http://accu.cc/content/cryptography/group_ring_field/)

### 有限域

参考 [有限域](http://accu.cc/content/cryptography/ecc/#_1)

## 椭圆曲线

- [椭圆曲线密码学的简单介绍](https://zhuanlan.zhihu.com/p/26029199)
- [一文读懂 ECDSA 算法如何保护数据](https://zhuanlan.zhihu.com/p/97953640)
- [椭圆曲线密码学简介（一）：实数域的椭圆曲线及其群运算规则](https://zhuanlan.zhihu.com/p/102807398) 以及后续系列文章。

### 配对

- [Exploring Elliptic Curve Pairings](https://medium.com/@VitalikButerin/exploring-elliptic-curve-pairings-c73c1864e627), 简体中文版 [探索椭圆曲线配对](https://zhuanlan.zhihu.com/p/592591301)，[繁体中文版](https://medium.com/cryptocow/exploring-elliptic-curve-pairings-e322a3f029e8)

## 延伸阅读
