---
title: Polynomial
description: 多项式
slug: polynomial
date: 2023-09-06T10:34:43+08:00
featured: false
draft: false
comment: true
toc: true
reward: true
pinned: false
carousel: false
series: 
  - 以太坊中的密码学
categories:
  - cryptography
  - ethereum
tags:
  - zkevm
  - zkp
  - commitments
---

本文介绍多项式相关知识。

<!--more-->

## 概述

多项式 (Polynomial) 是代数学中的基础概念，是由称为未知数的`变量`和称为`系数`的常数通过有限次加减法，乘法以及自然数幂次的乘方运算得到的代数表达式。以单变量多项式为例说明：

$$
f(x) = \sum_{i=0}^{n}a_i x^i = a_0 + a_1x + ... + a_nX^n = a_0,a_1,....,a_n
$$

- Degree $deg(f(x))=n$

以上是系数表示形式，系数序列确定多项式也就确定了。还有一种表示方法是使用 n+1 点值对表示 n 次多项式。

$$
f(x) = (x_0,y_0),(x_1,y_1),....,(x_n,y_n)
$$

同样，这种方法也能唯一确定多项式。

两种表示方法，各有其应用场景，比如系数表示法在计算多项式相加的场合效率高，而点值表示法则应用在多项式相乘计算场合。

由于两种表示法本质是同一个东西，所以二者可以相互转化，其中 [FFT](https://oi-wiki.org/math/poly/fft/) 就是实现系数表达到点值表示的转换方法，而 IFFT 正好相反。关于 FFT 和 IFFT 深入解读超出本文范围，请自行查阅资料。

建议阅读 [币圈李白：零知识证明 KZG Commitment 1:Polynomial Commitment](https://www.youtube.com/watch?v=nkrk3jLj8Jw) 建议阅读。详细介绍了：

- 如何使用拉格朗日差值将数据转为多项式
- 多项式性质和应用
- 多项式承诺在零知识证明（交互式、非交互式）中的应用
- 简要介绍了 KZG。
