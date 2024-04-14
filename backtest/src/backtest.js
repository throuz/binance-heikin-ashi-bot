import {
  INITIAL_FUNDING,
  EACH_TIME_INVEST_FUND_PERCENTAGE,
  FEE
} from "../config/config.js";
import {
  getFundingFee,
  getPreLongTermTrend,
  getPrePeriodAvgVol
} from "./helpers.js";
import { getHistoryData } from "../history/history.js";

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
  startTimestamp,
  endTimestamp
}) => {
  const logRedColor = "\x1b[31m";
  const logGreenColor = "\x1b[32m";
  const logResetColor = "\x1b[0m";
  const logColor = closePrice > openPrice ? logGreenColor : logRedColor;
  const formatedFund = fund.toFixed(2);
  const startTime = getReadableTime(startTimestamp);
  const endTime = getReadableTime(endTimestamp);
  console.log(
    `${logColor}Fund: ${formatedFund} [${openPrice} ~ ${closePrice}] [${startTime} ~ ${endTime}]${logResetColor}`
  );
};

export const getBacktestResult = ({
  shouldLogResults,
  startIndex,
  avgVolPeriod,
  entryAvgVolFactor,
  exitAvgVolFactor,
  leverage
}) => {
  let fund = INITIAL_FUNDING;
  let positionFund = null;
  let startPositionTimestamp = null;
  let openPrice = null;
  let liquidationPrice = null;
  let valueOfEachPoint = null;
  let highestFund = fund;
  const { klineData, heikinAshiKlineData } = getHistoryData();
  for (let i = startIndex; i < klineData.length; i++) {
    const preKline = klineData[i - 1];
    const curKline = klineData[i];
    const preHeikinAshiKline = heikinAshiKlineData[i - 1];
    const preLongTermTrend = getPreLongTermTrend(curKline.openTime);
    const prePeriodAvgVol = getPrePeriodAvgVol(i, avgVolPeriod);
    // Buy
    if (
      positionFund === null &&
      preHeikinAshiKline.closePrice > preHeikinAshiKline.openPrice &&
      preLongTermTrend === "up" &&
      preKline.volume < prePeriodAvgVol * entryAvgVolFactor
    ) {
      positionFund = fund * ((EACH_TIME_INVEST_FUND_PERCENTAGE - 1) / 100); // Actual tests have found that typically 1% less
      const fee = positionFund * leverage * FEE;
      fund = fund - fee;
      startPositionTimestamp = curKline.openTime;
      openPrice = curKline.openPrice;
      liquidationPrice = openPrice * ((leverage - 1) / leverage + 0.01); // Actual tests have found that typically 1% more
      valueOfEachPoint = (positionFund * leverage) / openPrice;
    }
    // Liquidation
    if (positionFund && curKline.lowPrice < liquidationPrice) {
      return null;
    }
    // Sell
    if (
      (positionFund &&
        preHeikinAshiKline.closePrice < preHeikinAshiKline.openPrice &&
        preKline.volume > prePeriodAvgVol * exitAvgVolFactor) ||
      (positionFund && preLongTermTrend === "down") ||
      (positionFund && i === klineData.length - 1)
    ) {
      const closePrice = curKline.openPrice;
      const priceDifference = closePrice - openPrice;
      const pnl = valueOfEachPoint * priceDifference;
      positionFund += pnl;
      const fee = positionFund * leverage * FEE;
      const endPositionTimestamp = curKline.openTime;
      const fundingFee = getFundingFee(
        positionFund,
        startPositionTimestamp,
        endPositionTimestamp
      );
      fund = fund + pnl - fee - fundingFee;
      if (shouldLogResults) {
        logTradeResult({
          fund,
          openPrice,
          closePrice,
          startTimestamp: startPositionTimestamp,
          endTimestamp: endPositionTimestamp
        });
      }
      positionFund = null;
      startPositionTimestamp = null;
      openPrice = null;
      liquidationPrice = null;
      valueOfEachPoint = null;
      if (fund > highestFund) {
        highestFund = fund;
      }
    }
  }
  return {
    fund,
    highestFund,
    avgVolPeriod,
    entryAvgVolFactor,
    exitAvgVolFactor,
    leverage
  };
};
