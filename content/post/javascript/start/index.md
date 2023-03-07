---
title: "Javascript Pieces"
description: Javascript 拾遗
slug: js-pieces
date: 2023-02-27T17:48:50+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
categories:
  - Javascript
tags:
---

## 概述

## 模块

- [理解前端模块概念：CommonJs 与 ES6Module](https://zhuanlan.zhihu.com/p/262524554)：命名导出、命名导入
- [深入浅出 node.js 的模块系统](https://juejin.cn/post/7134884052619755533)
- [CommonJS 和 ES6 模块的区别](https://juejin.cn/post/6844904067651600391)

## 异步编程

多线程，子线程实现异步。

主线程会等待子线程完成么？

### promise

### async[^1]

将 async 关键字加到函数申明中，表示它返回的是 promise，而不是直接返回值。

```js
var callback = async () => {
  return "hello";
};

callback().then((val) => {
  console.log(val);
});
```

async 函数一定会返回一个 promise 对象。如果一个 async 函数的返回值看起来不是 promise，那么它将会被隐式地包装在一个 promise 中。

例如，如下代码：

```js
async function foo() {
  return 1;
}
```

等价于：

```js
function foo() {
  return Promise.resolve(1);
}
```

### await

async 函数的函数体可以被看作是由 0 个或者多个 await 表达式分割开来的。从第一行代码直到（并包括）第一个 await 表达式（如果有的话）都是同步运行的。这样的话，一个不含 await 表达式的 async 函数是会同步运行的。然而，如果函数体内有一个 await 表达式，async 函数就一定会异步执行。

promise 的 resolve 值会被当作该 await 表达式的返回值。使用 async/await 关键字就可以在异步代码中使用普通的 try/catch 代码块。

```js
(async () => {
  console.log(
    await (async function () {
      return 100;
    })()
  );
})();
```

await 表达式会**暂停整个 async 函数的执行进程并出让其控制权**，只有当其等待的基于 promise 的异步操作被 resolve 或被 reject 之后才会恢复进程。

在 await 表达式之后的代码可以被认为是存在在链式调用的 then 回调中，多个 await 表达式都将加入链式调用的 then 回调中，返回值将作为最后一个 then 回调的返回值。

```js
function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

async function test() {
  let message = "1st block";

  console.log("before 1th await:", message);
  await (async function () {
    console.log(message);
    message = "2th block";
  })();

  console.log("before 2th await:", message);
  await new Promise((resolve, reject) => {
    console.log(message);
    message = "3th block";
    reject("rejected in 2th block");
  });
  // those code will not run because promise is rejected
  console.log("before 3th await:", message);
  await (async function () {
    console.log(message);
    message = "4th block";
  })();
  console.log("after 3th await:", message);
}

console.log("main start");
test().catch((err) => {
  console.log(err); // show 'rejected in 2th block'
});
console.log("main end");
```

## 参考资料

- [MDN web docs](https://developer.mozilla.org/en-US/)
- [Node.js Docs](https://nodejs.org/en/docs/)

[^1]: [async 函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/async_function)
