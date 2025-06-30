---
title: "Uniswap Price Oracles"
description: uniswap 价格预言机
slug: uniswap-price-oracles
date: 2023-03-09T17:59:57+08:00
image:
math:
license:
hidden: false
comments: true
draft: false
categories:
  - uniswap
tags:
  - oracle
---

## 概述

`价格预言机 (Price Oracle)` 是用于查看特定资产的价格信息的工具。在未引入 Oracle 时，uniswap 可能存在资产偏差阈值较大，价格更新较慢等问题。

以太坊上的许多 Oracle 设计都是在 `ad-hoc basis` 上实现的，具有不同程度的去中心化和安全性。正因为如此，该生态系统已经见证了许多出名的黑客攻击，其中主要的攻击媒介就是 Oracle 实现。[这里](https://samczsun.com/taking-undercollateralized-loans-for-fun-and-for-profit/) 将讨论其中的一些漏洞。

Uniswap V2 使用的价格预言称为 `TWAP(Time-Weighted Average Price)`，即时间加权平均价格。不同于 chainlink 预言机取自多个不同交易所的数据作为数据源，TWAP 的数据源来自于 Uniswap 自身的交易数据，价格的计算等操作都是在链上执行的。因此，TWAP 是属于链上预言机。

## 时间加权平均价格 [^1]

![v2_onchain_price_data](https://docs.uniswap.org/assets/images/v2_onchain_price_data-c051ebca6a5882e3f2ad758fa46cbf5e.png)

如上图可知，合约第一个区块为 block 122，此时的价格和时间差都为 0。所以

`priceCumulative = 0`

到了 block 123 时，取自上个区块中最后一次交易的价格 10.2，且时间差为 7，所以可计算此时的

`priceCumulative=10.2 * 7 = 71.4`

再到下一个区块 124，去上个区块中最后一笔交易 10.3，且时间差为 8，可计算出此时的

`priceCumulative = 71.4 + (10.3 * 8) = 153.8`

block 125 同理可计算出此时的

`priceCumulative = 153.8 + (10.5 * 5) = 206.3`

实现上，在 UniswapV2Pair 合约中，会存储两个变量 `price0CumulativeLast` 和 `price1CumulativeLast`，在 `_update()` 函数中会更新这两个变量：

```solidity
contract UniswapV2Pair {
  ...
  uint32 private blockTimestampLast;
  uint public price0CumulativeLast;
  uint public price1CumulativeLast;
  ...
  // update reserves and, on the first call per block, price accumulators
  function _update(uint balance0, uint balance1, uint112 _reserve0, uint112 _reserve1) private {
    ...
    uint32 blockTimestamp = uint32(block.timestamp % 2**32);
    uint32 timeElapsed = blockTimestamp - blockTimestampLast;
    if (timeElapsed > 0 && _reserve0 != 0 && _reserve1 != 0) {
      // * never overflows, and + overflow is desired
      price0CumulativeLast += uint(UQ112x112.encode(_reserve1).uqdiv(_reserve0)) * timeElapsed;
      price1CumulativeLast += uint(UQ112x112.encode(_reserve0).uqdiv(_reserve1)) * timeElapsed;
    }
    blockTimestampLast = blockTimestamp;
    ...
  }
}
```

`price0CumulativeLast` 和 `price1CumulativeLast` 分别记录了 token0 和 token1 的累计价格。所谓累计价格，其代表的是整个合约历史中每一秒的 Uniswap 价格总和。且只会在每个区块第一笔交易时执行累加计算，累加的值不是当前区块的第一笔交易的价格，而是在这之前的最后一笔交易的价格，所以至少也是上个区块的价格。取自之前区块的价格，可以大大提高操控价格的成本，所以自然也提高了安全性。

UniswapV2 的 TWAP 主要缺点是需要链下程序定时触发合约中的 `update()`函数，存在维护成本。UniswapV3 解决了这个问题 [^2]。

## 固定时间窗口

![v2_twap](https://docs.uniswap.org/assets/images/v2_twap-fdc82ab82856196510db6b421cce9204.png)

从上图可以看出新价格的计算过程：

该图是计算时间间隔为 1 小时的 TWAP，取自开始和结束时的累计价格和两个区块之间的时间戳。`用两者的累计价格相减除以时间间隔即可得到这一小时内的 TWAP 价格了`。这是 TWAP 最简单的计算方式，也称为固定时间窗口的 TWAP。还有一种方式是基于滑动时间窗口来计算的。

官方实现了一个 [24 小时 TWAP Oracle](https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/examples/ExampleOracleSimple.sol)，直接贴代码看下

```solidity
pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

import 'posts/libraries/UniswapV2OracleLibrary.sol';
import 'posts/libraries/UniswapV2Library.sol';

// fixed window oracle that recomputes the average price for the entire period once every period
// note that the price average is only guaranteed to be over at least 1 period, but may be over a longer period
contract ExampleOracleSimple {
    using FixedPoint for *;

    uint public constant PERIOD = 24 hours;

    IUniswapV2Pair immutable pair;
    address public immutable token0;
    address public immutable token1;

    uint    public price0CumulativeLast;
    uint    public price1CumulativeLast;
    uint32  public blockTimestampLast;
    FixedPoint.uq112x112 public price0Average;
    FixedPoint.uq112x112 public price1Average;

    constructor(address factory, address tokenA, address tokenB) public {
        IUniswapV2Pair _pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, tokenA, tokenB));
        pair = _pair;
        token0 = _pair.token0();
        token1 = _pair.token1();
        price0CumulativeLast = _pair.price0CumulativeLast(); // fetch the current accumulated price value (1 / 0)
        price1CumulativeLast = _pair.price1CumulativeLast(); // fetch the current accumulated price value (0 / 1)
        uint112 reserve0;
        uint112 reserve1;
        (reserve0, reserve1, blockTimestampLast) = _pair.getReserves();
        require(reserve0 != 0 && reserve1 != 0, 'ExampleOracleSimple: NO_RESERVES'); // ensure that there's liquidity in the pair
    }

    function update() external {
        (uint price0Cumulative, uint price1Cumulative, uint32 blockTimestamp) =
            UniswapV2OracleLibrary.currentCumulativePrices(address(pair));
        uint32 timeElapsed = blockTimestamp - blockTimestampLast; // overflow is desired

        // ensure that at least one full period has passed since the last update
        require(timeElapsed >= PERIOD, 'ExampleOracleSimple: PERIOD_NOT_ELAPSED');

        // overflow is desired, casting never truncates
        // cumulative price is in (uq112x112 price * seconds) units so we simply wrap it after division by time elapsed
        price0Average = FixedPoint.uq112x112(uint224((price0Cumulative - price0CumulativeLast) / timeElapsed));
        price1Average = FixedPoint.uq112x112(uint224((price1Cumulative - price1CumulativeLast) / timeElapsed));

        price0CumulativeLast = price0Cumulative;
        price1CumulativeLast = price1Cumulative;
        blockTimestampLast = blockTimestamp;
    }

    // note this will always return 0 before update has been called successfully for the first time.
    function consult(address token, uint amountIn) external view returns (uint amountOut) {
        if (token == token0) {
            amountOut = price0Average.mul(amountIn).decode144();
        } else {
            require(token == token1, 'ExampleOracleSimple: INVALID_TOKEN');
            amountOut = price1Average.mul(amountIn).decode144();
        }
    }
}
```

PERIOD 指定为了 24 小时，说明这个示例计算 TWAP 的固定时间窗口为 24 小时，即每隔 24 小时才更新一次价格。

该示例也只保存一个交易对的价格，即 token0-token1 的价格。price0Average 和 price1Average 分别就是 token0 和 token1 的 TWAP 价格。比如，token0 为 WETH，token1 为 USDC，那 price0Average 就是 WETH 对 USDC 的价格，而 price1Average 则是 USDC 对 WETH 的价格。

update() 函数就是更新 TWAP 价格的函数，这一般需要链下程序的定时任务来触发，按照这个示例的话，就是链下的定时任务需要每隔 24 小时就定时触发调用 update() 函数。

update() 函数的实现逻辑也和上面所述的公式一致：

读取出当前最新的累计价格和当前的时间戳；
计算出当前时间和上一次更新价格时的时间差 timeElapsed，要求该时间差需要达 24 小时；
根据公式 TWAP = (priceCumulative - priceCumulativeLast) / timeElapsed 计算得到最新的 TWAP，即 priceAverage；
更新 priceCumulativeLast 和 blockTimestampLast 为当前最新的累计价格和时间戳。
不过，有一点需要注意，因为 priceCumulative 本身计算存储时是做了左移 112 位的操作的，所以计算所得的 priceAverage 也是左移了 112 位的。

consult() 函数则可查询出用 TWAP 价格计算可兑换的数量。比如，token0 为 WETH，token1 为 USDC，假设 WETH 的价格为 3000 USDC，查询 consult() 时，若传入的参数 token 为 token0 的地址，amountIn 为 2，那输出的 amountOut 则为 `3000 * 2 = 6000`，可理解为若支付 2 WETH，就可根据价格换算成 6000 USDC。

## 滑动时间窗口

固定时间窗口 TWAP 的原理和实现，比较简单，但其最大的不足就是价格变化不够平滑，时间窗口越长，价格变化就可能会越陡峭。因此，在实际应用中，更多其实是用滑动时间窗口的 TWAP。

所谓滑动时间窗口 TWAP，就是说，计算 TWAP 的时间窗口并非固定的，而是滑动的。这种算法的主要原理就是将时间窗口划分为多个时间片段，每过一个时间片段，时间窗口就会往右滑动一格，如下图所示：

![slid](https://ask.qcloudimg.com/http-save/yehe-2884847/a71284761356b11d1d91fb890bccf76b.png?imageView2/2/w/2560/h/7000)

上图所示的时间窗口为 1 小时，划分为了 6 个时间片段，每个时间片段则为 10 分钟。那每过 10 分钟，整个时间窗口就会往右滑动一格。而计算 TWAP 时的公式则没有变，依然还是取自时间窗口的起点和终点。如果时间窗口为 24 小时，按照固定时间窗口算法，每隔 24 小时 TWAP 价格才会更新，但使用滑动时间窗口算法后，假设时间片段为 1 小时，则 TWAP 价格是每隔 1 小时就会更新。

Uniswap 官方也同样提供了这种 [滑动时间窗口 TWAP 实现的示例代码](https://github.com/Uniswap/v2-periphery/blob/master/contracts/examples/ExampleSlidingWindowOracle.sol):

```solidity
pragma solidity =0.6.6;

import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Pair.sol';
import '@uniswap/lib/contracts/libraries/FixedPoint.sol';

import 'posts/libraries/SafeMath.sol';
import 'posts/libraries/UniswapV2Library.sol';
import 'posts/libraries/UniswapV2OracleLibrary.sol';

// sliding window oracle that uses observations collected over a window to provide moving price averages in the past
// `windowSize` with a precision of `windowSize / granularity`
// note this is a singleton oracle and only needs to be deployed once per desired parameters, which
// differs from the simple oracle which must be deployed once per pair.
contract ExampleSlidingWindowOracle {
    using FixedPoint for *;
    using SafeMath for uint;

    struct Observation {
        uint timestamp;
        uint price0Cumulative;
        uint price1Cumulative;
    }

    address public immutable factory;
    // the desired amount of time over which the moving average should be computed, e.g. 24 hours
    uint public immutable windowSize;
    // the number of observations stored for each pair, i.e. how many price observations are stored for the window.
    // as granularity increases from 1, more frequent updates are needed, but moving averages become more precise.
    // averages are computed over intervals with sizes in the range:
    //   [windowSize - (windowSize / granularity) * 2, windowSize]
    // e.g. if the window size is 24 hours, and the granularity is 24, the oracle will return the average price for
    //   the period:
    //   [now - [22 hours, 24 hours], now]
    uint8 public immutable granularity;
    // this is redundant with granularity and windowSize, but stored for gas savings & informational purposes.
    uint public immutable periodSize;

    // mapping from pair address to a list of price observations of that pair
    mapping(address => Observation[]) public pairObservations;

    constructor(address factory_, uint windowSize_, uint8 granularity_) public {
        require(granularity_ > 1, 'SlidingWindowOracle: GRANULARITY');
        require(
            (periodSize = windowSize_ / granularity_) * granularity_ == windowSize_,
            'SlidingWindowOracle: WINDOW_NOT_EVENLY_DIVISIBLE'
        );
        factory = factory_;
        windowSize = windowSize_;
        granularity = granularity_;
    }

    // returns the index of the observation corresponding to the given timestamp
    function observationIndexOf(uint timestamp) public view returns (uint8 index) {
        uint epochPeriod = timestamp / periodSize;
        return uint8(epochPeriod % granularity);
    }

    // returns the observation from the oldest epoch (at the beginning of the window) relative to the current time
    function getFirstObservationInWindow(address pair) private view returns (Observation storage firstObservation) {
        uint8 observationIndex = observationIndexOf(block.timestamp);
        // no overflow issue. if observationIndex + 1 overflows, result is still zero.
        uint8 firstObservationIndex = (observationIndex + 1) % granularity;
        firstObservation = pairObservations[pair][firstObservationIndex];
    }

    // update the cumulative price for the observation at the current timestamp. each observation is updated at most
    // once per epoch period.
    function update(address tokenA, address tokenB) external {
        address pair = UniswapV2Library.pairFor(factory, tokenA, tokenB);

        // populate the array with empty observations (first call only)
        for (uint i = pairObservations[pair].length; i < granularity; i++) {
            pairObservations[pair].push();
        }

        // get the observation for the current period
        uint8 observationIndex = observationIndexOf(block.timestamp);
        Observation storage observation = pairObservations[pair][observationIndex];

        // we only want to commit updates once per period (i.e. windowSize / granularity)
        uint timeElapsed = block.timestamp - observation.timestamp;
        if (timeElapsed > periodSize) {
            (uint price0Cumulative, uint price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
            observation.timestamp = block.timestamp;
            observation.price0Cumulative = price0Cumulative;
            observation.price1Cumulative = price1Cumulative;
        }
    }

    // given the cumulative prices of the start and end of a period, and the length of the period, compute the average
    // price in terms of how much amount out is received for the amount in
    function computeAmountOut(
        uint priceCumulativeStart, uint priceCumulativeEnd,
        uint timeElapsed, uint amountIn
    ) private pure returns (uint amountOut) {
        // overflow is desired.
        FixedPoint.uq112x112 memory priceAverage = FixedPoint.uq112x112(
            uint224((priceCumulativeEnd - priceCumulativeStart) / timeElapsed)
        );
        amountOut = priceAverage.mul(amountIn).decode144();
    }

    // returns the amount out corresponding to the amount in for a given token using the moving average over the time
    // range [now - [windowSize, windowSize - periodSize * 2], now]
    // update must have been called for the bucket corresponding to timestamp `now - windowSize`
    function consult(address tokenIn, uint amountIn, address tokenOut) external view returns (uint amountOut) {
        address pair = UniswapV2Library.pairFor(factory, tokenIn, tokenOut);
        Observation storage firstObservation = getFirstObservationInWindow(pair);

        uint timeElapsed = block.timestamp - firstObservation.timestamp;
        require(timeElapsed <= windowSize, 'SlidingWindowOracle: MISSING_HISTORICAL_OBSERVATION');
        // should never happen.
        require(timeElapsed >= windowSize - periodSize * 2, 'SlidingWindowOracle: UNEXPECTED_TIME_ELAPSED');

        (uint price0Cumulative, uint price1Cumulative,) = UniswapV2OracleLibrary.currentCumulativePrices(pair);
        (address token0,) = UniswapV2Library.sortTokens(tokenIn, tokenOut);

        if (token0 == tokenIn) {
            return computeAmountOut(firstObservation.price0Cumulative, price0Cumulative, timeElapsed, amountIn);
        } else {
            return computeAmountOut(firstObservation.price1Cumulative, price1Cumulative, timeElapsed, amountIn);
        }
    }
}
```

要实现滑动时间窗口算法，就需要将时间分段，还需要保存每个时间段的 priceCumulative。在这实现的示例代码中，定义了结构体 Observation，用来保存每个时间片段的数据，包括两个 token 的 priceCumulative 和记录的时间点 timestamp。还定义了 pairObservations 用来存储每个 pair 的 Observation 数组，而数组实际的长度取决于将整个时间窗口划分为多少个时间片段。

windowSize 表示时间窗口大小，比如 24 小时，granularity 是划分的时间片段数量，比如 24 段，periodSize 则是每时间片段的大小，比如 1 小时，是由 windowSize / granularity 计算所得。这几个值都在构造函数中进行了初始化。

触发 update() 函数则更新存储最新时间片段的 observation，如时间片段大小为 1 小时，即每隔 1 小时就要触发 update() 函数一次。因为这个示例中是支持多个 pair 的，所以 update() 时需要指定所要更新的两个 token。

而查询当前 TWAP 价格的计算就在 consult() 函数里实现了。首先，先获取到当前时间窗口里的第一个时间片段的 observation，也算出当前时间与第一个 observation 时间的时间差，且读取出当前最新的 priceCumulative，之后就在 computeAmountOut() 函数里计算得到最新的 TWAP 价格 priceAverage，且根据 amountIn 算出了 amountOut 并返回。

## 安全性

由上面的步骤可以看出：每个交易对在区块中任何交易发生之前都要测量记录市场价格。

这个价格的操纵成本很高，因为它是由上一个区块中的最后一笔交易设定的。为了将测量的价格设置为与全球市场价格不同步的价格，攻击者必须在前一个区块的末尾做一笔赔本的交易，通常不能保证他们会在下一个区块中套利回来。这种类型的攻击带来了一些挑战，迄今为止还 [没有被观察到](https://arxiv.org/abs/1912.01798)。

那么能否只用上一个块中的价格，而不使用时间加权呢？不幸的是，仅仅这样做是不够的。如果特别重要的价值交易根据这种机制产生的价格进行结算，攻击者的利润很可能会超过损失。

一些注意事项：

- 对于 10 分钟的 TWAP，每 10 分钟采样一次。对于 1 周的 TWAP，每周取样一次。
- 对于一个简单的 TWAP，操纵的成本随着 Uniswap 的流动性而增加（大约是线性的），也随着平均的时间长度而增加（大约是线性的）。
- 攻击成本的估算相对简单。在 1 小时的 TWAP 上移动 5% 的价格，大约等于在 1 小时内每个区块移动 5%的价格所损失的套利和费用。

而使用使用时间加权的累计价格，在一个特定的时间段内，操纵价格的成本可以粗略估计为整个时期内每个区块的套利和费用损失。对于较大的流动性池和较长的时间段，这种攻击是不切实际的，因为操纵的成本通常超过了风险的价值。

其他因素，如网络拥堵，可以减少攻击的成本。关于 Uniswap V2 Price Oracle 安全性的更深入审查，请阅读 [Oracle Integrity 的安全审计部分](https://uniswap.org/audit.html#org87c8b91)。

## 总结

本文主要介绍了被广泛使用的一种链上预言机 TWAP（时间加权平均价格），且介绍了固定时间窗口和滑点时间窗口两种算法的 TWAP。虽然，TWAP 是由 Uniswap 推出的，但因为很多其他 DEX 也采用了和 Uniswap 一样的底层实现，如 SushiSwap、PancakeSwap 等，所以这些 DEX 也可以用同样的算法计算出对应的 TWAP。

## 参考

[^1]: [DeFi:Uniswap v2 协议原理解析](https://juejin.cn/post/7178857641421045820)

[^2]: [价格预言机的使用总结（二）：UniswapV2 篇](https://mirror.xyz/keeganlee.eth/_4Frr-yjzTnxw80CSSLM5_NYsLDuF1_pSccWYD7ckkc)
