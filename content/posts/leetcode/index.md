---
title: Leetcode 算法练习
description: 算法练习
slug: leetcode
date: 2023-11-03T14:45:44+08:00
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

## 训练方法

1. 知识分解
2. 刻意练习
3. 及时反馈

## 切题四件套

- 理解题目
- 可能解法
  - 对比（时间、空间复杂度）
  - 延伸
- 编写代码
- 测试用例

## 递归

## 深度优先搜索

```python
visited = set()
def dfs(node,visited):
  visited.add(node)
  # process current node
  ...
  for next_node in node.children():
    if next_node not in visited:
      dfs(next_node, visited)
```

## 广度优先搜索

```python
def BFS(graph, start, end):
  queue = []
  queue.append([start])
  visited.add(start)
  while queue:
    node = queue.pop()
    visited.add(node)
    process(node)
    nodes=generate_related_nodes(node)
    queue.push(nodes)
```

## 动态规划

1. 递归 + 记忆化 -> 递推。
   1. 递归是一种自上而下的思考方式，递推是一直自下而上的思考方式。
   2. 记忆化是将计算过程中的状态存储下来，避免重复计算。
2. 状态定义：`states[i][...]`。 状态的定义是解决问题的核心。位置 `i` 上的状态可能有多个。
3. 状态转移方程： `states[i][...] = process(states[i-1][...],states[i-2][...],....)`。
4. 位置 i 最优子结构：`states[n][...]` 中存在符合题目要求的最优解。 `dp[i] = bestOf(states[i][...])`。
5. 题目结果 `bestOf(dp[0]..dp[n])`

以斐波拉契数列为例：
递归：自顶向下，时间复杂度 O(2^n)。

```python
def fib(n):
  if n < 1:
    return n
  return fib(n-1) + fib(n-2)
```

重复计算：`fib(n-1)` 和 `fib(n-2)` 会计算共同元素 `fib(i)`。可以画出树状图更加清晰的明白。

动态规划：复杂度降低为 O(n)。

```python
def fib(n):
  dp = [0,1]
  for i in range(2,n):
    dp.appepnd(dp[i-1] + dp[i-2])
  return dp[n-1]
```

按照解题步骤分析：

1. 定义状态，找出最优子结构。
   从递归分析需要进行“记忆化”的状态。记忆化是为了解决递归过程中位置 i 状态的重复计算问题，从递归过程可以看出：
   1. 这道题中位置 i 处的状态只有一个，因此 `states[i]` 只需要一维。
   2. 因为只有一个状态，所以 `states[i]` 就是最优子结构，也就是最优解 `dp[i]`。
2. 定义状态转义方程。
   其实就是递归公式：`states[i] = states[i-1] + states[i-2]`。
3. 找到状态初始值。

- [70. 爬楼梯](https://leetcode-cn.com/problems/climbing-stairs/)
- [120. 三角形最小路径和](https://leetcode-cn.com/problems/triangle/)
- [152. 乘积最大子序列](https://leetcode-cn.com/problems/maximum-product-subarray/)
