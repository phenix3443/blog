---
title: "zkEVM 学习"
description:
date: 2022-06-07T22:42:28+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - ethereum
tags:
  - zkEVM
---

## 资料

[A_Graduate_Course_in_Applied_Cryptography.pdf](./A_Graduate_Course_in_Applied_Cryptography.pdf) is Dan Boneh's textbook, his course [https://cs251.stanford.edu/syllabus.html] is also a good resource for zk learners.

[HAC](https://cacr.uwaterloo.ca/hac/) is another good crypto reference which is like a dictionary for concepts & pseudo-code algorithms.

Some potentially interesting lookup things that could improve the prover performance:

- Caulk - <https://eprint.iacr.org/2022/621>: Can potentially enable very large lookup tables which can make certain operations in circuits more efficient
- Standard Plookup - <https://eprint.iacr.org/2020/315>: Differs from the lookups currently used in halo2. The benefit here would be that the lookups could be done in differently sized columns than the circuit. Though unsure how much this could help combined with the different constraints of zkEVM. Theoretically worse than Caulk but maybe easier to implement.

<https://www.eventbrite.com/e/compiler-and-composability-tickets-377470232627?aff=ebdsoporgprofile>
