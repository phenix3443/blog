---
title: "The Merge"
description: 以太坊合并
date: 2022-09-21T13:59:49+08:00
image:
math:
license:
hidden: false
comments: true
draft: true
---

對 Ethereum 來說，最大的效能瓶頸不是達成共識的速度，也不是網路傳輸的速度，而是交易驗證的速度。

如果我們把共識和交易執行拆開：驗證節點在收到一筆交易時不再執行該筆交易，而是單純檢查交易發起人有沒有足夠的錢來支付把他的交易資料收進區塊裡的費用。當節點不需執行交易，效能就不再受到交易執行效能的限制，也就是 EVM 的限制。在這個模型下，PoW 礦工或 PoS 驗證者都可以專注在對「交易資料」達成共識，不需煩惱「交易執行」，這時候 TPS 就只受限於共識達成的速度或是網路傳輸的速度。

Rollup Sequencer 把交易打包送到 L1 上，利用 L1 的安全性，確保交易的排序。只要 L1 沒有被攻擊、沒有 re-org，就可以確定交易順序沒有改變。只要確定了交易順序，任何人都能獨自算出當前 Rollup 的狀態。