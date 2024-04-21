import { Presets, SingleBar } from "cli-progress";
import {
  AVG_VOL_PERIOD_SETTING,
  CLOSE_AVG_VOL_FACTOR_SETTING,
  FEE,
  FUNDING_RATE,
  INITIAL_FUNDING,
  OPEN_AVG_VOL_FACTOR_SETTING,
  ORDER_AMOUNT_PERCENT
} from "../configs/trade-config.js";
import { getCachedKlineData } from "./cached-data.js";
import { getSignal } from "./signal.js";

const getReadableTime = (timestamp) => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const logTradeResult = ({
  fund,
  openPrice,
  closePrice,
  openTimestamp,
  closeTimestamp
}) => {
  const logRedColor = "\x1b[31m";
  const logGreenColor = "\x1b[32m";
  const logResetColor = "\x1b[0m";
  const logColor = closePrice > openPrice ? logGreenColor : logRedColor;
  const formatedFund = fund.toFixed(2);
  const startTime = getReadableTime(openTimestamp);
  const endTime = getReadableTime(closeTimestamp);
  console.log(
    `${logColor}Fund: ${formatedFund} [${openPrice} ~ ${closePrice}] [${startTime} ~ ${endTime}]${logResetColor}`
  );
};

const getFundingFee = ({ positionFund, openTimestamp, closeTimestamp }) => {
  const timeDifference = closeTimestamp - openTimestamp;
  const hours = timeDifference / (1000 * 60 * 60);
  const times = Math.floor(hours / 8);
  const fundingFee = positionFund * FUNDING_RATE * times;
  return fundingFee;
};

export const getBacktestResult = async ({
  shouldLogResults,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor,
  leverage
}) => {
  let fund = INITIAL_FUNDING;
  let positionFund = null;
  let openTimestamp = null;
  let openPrice = null;
  let liquidationPrice = null;
  let valueOfEachPoint = null;
  const cachedKlineData = await getCachedKlineData();
  for (let i = AVG_VOL_PERIOD_SETTING.max; i < cachedKlineData.length; i++) {
    const curKline = cachedKlineData[i];
    const hasPosition = !!positionFund;
    const signal = await getSignal({
      hasPosition,
      index: i,
      avgVolPeriod,
      openAvgVolFactor,
      closeAvgVolFactor
    });
    // Buy
    if (signal === "OPEN") {
      positionFund = fund * ((ORDER_AMOUNT_PERCENT - 1) / 100); // Actual tests have found that typically 1% less
      const fee = positionFund * leverage * FEE;
      fund = fund - fee;
      openTimestamp = curKline.openTime;
      openPrice = curKline.openPrice;
      liquidationPrice = openPrice * ((leverage - 1) / leverage + 0.01); // Actual tests have found that typically 1% more
      valueOfEachPoint = (positionFund * leverage) / openPrice;
    }
    // Liquidation
    if (hasPosition && curKline.lowPrice < liquidationPrice) {
      return null;
    }
    // Sell
    if (signal === "CLOSE" || i === cachedKlineData.length - 1) {
      const closePrice = curKline.openPrice;
      const priceDifference = closePrice - openPrice;
      const pnl = valueOfEachPoint * priceDifference;
      positionFund += pnl;
      const fee = positionFund * leverage * FEE;
      const closeTimestamp = curKline.openTime;
      const fundingFee = getFundingFee({
        positionFund,
        openTimestamp,
        closeTimestamp
      });
      fund = fund + pnl - fee - fundingFee;
      if (shouldLogResults) {
        logTradeResult({
          fund,
          openPrice,
          closePrice,
          openTimestamp,
          closeTimestamp
        });
      }
      positionFund = null;
      openTimestamp = null;
      openPrice = null;
      liquidationPrice = null;
      valueOfEachPoint = null;
    }
  }
  return {
    fund,
    avgVolPeriod,
    openAvgVolFactor,
    closeAvgVolFactor,
    leverage
  };
};

const getTotalRuns = () => {
  const avgVolPeriodRuns =
    (AVG_VOL_PERIOD_SETTING.max - AVG_VOL_PERIOD_SETTING.min) /
      AVG_VOL_PERIOD_SETTING.step +
    1;
  const openAvgVolFactorRuns =
    (OPEN_AVG_VOL_FACTOR_SETTING.max - OPEN_AVG_VOL_FACTOR_SETTING.min) /
      OPEN_AVG_VOL_FACTOR_SETTING.step +
    1;
  const closeAvgVolFactorRuns =
    (CLOSE_AVG_VOL_FACTOR_SETTING.max - CLOSE_AVG_VOL_FACTOR_SETTING.min) /
      CLOSE_AVG_VOL_FACTOR_SETTING.step +
    1;
  return avgVolPeriodRuns * openAvgVolFactorRuns * closeAvgVolFactorRuns;
};

const getAddedNumber = ({ number, addNumber, digit }) => {
  return Number((number + addNumber).toFixed(digit));
};

export const getBestResult = async () => {
  const progressBar = new SingleBar({}, Presets.shades_classic);
  progressBar.start(getTotalRuns(), 0);

  let bestResult = { fund: 0 };

  for (
    let avgVolPeriod = AVG_VOL_PERIOD_SETTING.min;
    avgVolPeriod <= AVG_VOL_PERIOD_SETTING.max;
    avgVolPeriod = getAddedNumber({
      number: avgVolPeriod,
      addNumber: AVG_VOL_PERIOD_SETTING.step,
      digit: 0
    })
  ) {
    for (
      let openAvgVolFactor = OPEN_AVG_VOL_FACTOR_SETTING.min;
      openAvgVolFactor <= OPEN_AVG_VOL_FACTOR_SETTING.max;
      openAvgVolFactor = getAddedNumber({
        number: openAvgVolFactor,
        addNumber: OPEN_AVG_VOL_FACTOR_SETTING.step,
        digit: 2
      })
    ) {
      for (
        let closeAvgVolFactor = CLOSE_AVG_VOL_FACTOR_SETTING.min;
        closeAvgVolFactor <= CLOSE_AVG_VOL_FACTOR_SETTING.max;
        closeAvgVolFactor = getAddedNumber({
          number: closeAvgVolFactor,
          addNumber: CLOSE_AVG_VOL_FACTOR_SETTING.step,
          digit: 2
        })
      ) {
        const backtestResult = await getBacktestResult({
          shouldLogResults: false,
          avgVolPeriod,
          openAvgVolFactor,
          closeAvgVolFactor,
          leverage: 1
        });
        if (backtestResult && backtestResult.fund > bestResult.fund) {
          bestResult = backtestResult;
        }
        progressBar.increment();
      }
    }
  }

  for (let i = 1; i < 100; i++) {
    const backtestResult = await getBacktestResult({
      shouldLogResults: false,
      avgVolPeriod: bestResult.avgVolPeriod,
      openAvgVolFactor: bestResult.openAvgVolFactor,
      closeAvgVolFactor: bestResult.closeAvgVolFactor,
      leverage: i
    });
    if (backtestResult) {
      bestResult = backtestResult;
    } else {
      break;
    }
  }

  progressBar.stop();

  return bestResult;
};
