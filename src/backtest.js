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

const getLogColor = ({ positionType, openPrice, closePrice }) => {
  const logRedColor = "\x1b[31m";
  const logGreenColor = "\x1b[32m";
  if (positionType === "LONG") {
    return closePrice > openPrice ? logGreenColor : logRedColor;
  }
  if (positionType === "SHORT") {
    return openPrice > closePrice ? logGreenColor : logRedColor;
  }
  return "";
};

const logTradeResult = ({
  fund,
  positionType,
  openPrice,
  closePrice,
  openTimestamp,
  closeTimestamp
}) => {
  const logResetColor = "\x1b[0m";
  const logColor = getLogColor({
    positionType,
    openPrice,
    closePrice
  });
  const formatedFund = fund.toFixed(2);
  const startTime = getReadableTime(openTimestamp);
  const endTime = getReadableTime(closeTimestamp);
  console.log(
    `${logColor}Fund: ${formatedFund} ${positionType} [${openPrice} ~ ${closePrice}] [${startTime} ~ ${endTime}]${logResetColor}`
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
  let positionType = "NONE";
  let positionFund = null;
  let openTimestamp = null;
  let openPrice = null;
  let liquidationPrice = null;
  let quantity = null;
  const cachedKlineData = await getCachedKlineData();
  for (let i = AVG_VOL_PERIOD_SETTING.max; i < cachedKlineData.length; i++) {
    const curKline = cachedKlineData[i];
    const signal = await getSignal({
      positionType,
      index: i,
      avgVolPeriod,
      openAvgVolFactor,
      closeAvgVolFactor
    });
    if (signal === "OPEN_LONG") {
      positionFund = fund * ((ORDER_AMOUNT_PERCENT - 1) / 100) * leverage; // Actual tests have found that typically 1% less
      const fee = positionFund * FEE;
      fund = fund - fee;
      positionType = "LONG";
      openTimestamp = curKline.openTime;
      openPrice = curKline.openPrice;
      liquidationPrice = openPrice * (1 - 1 / leverage + 0.01); // Actual tests have found that typically 1% deviation
      quantity = positionFund / openPrice;
    }
    if (signal === "CLOSE_LONG") {
      const closePrice = curKline.openPrice;
      const pnl = (closePrice - openPrice) * quantity;
      positionFund += pnl;
      const fee = positionFund * FEE;
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
          positionType,
          openPrice,
          closePrice,
          openTimestamp,
          closeTimestamp
        });
      }
      positionType = "NONE";
      positionFund = null;
      openTimestamp = null;
      openPrice = null;
      liquidationPrice = null;
      quantity = null;
    }
    if (signal === "OPEN_SHORT") {
      positionFund = fund * ((ORDER_AMOUNT_PERCENT - 1) / 100) * leverage; // Actual tests have found that typically 1% less
      const fee = positionFund * FEE;
      fund = fund - fee;
      positionType = "SHORT";
      openTimestamp = curKline.openTime;
      openPrice = curKline.openPrice;
      liquidationPrice = openPrice * (1 + 1 / leverage - 0.01); // Actual tests have found that typically 1% deviation
      quantity = positionFund / openPrice;
    }
    if (signal === "CLOSE_SHORT") {
      const closePrice = curKline.openPrice;
      const pnl = (openPrice - closePrice) * quantity;
      positionFund += pnl;
      const fee = positionFund * FEE;
      const closeTimestamp = curKline.openTime;
      const fundingFee = getFundingFee({
        positionFund,
        openTimestamp,
        closeTimestamp
      });
      fund = fund + pnl - fee + fundingFee;
      if (shouldLogResults) {
        logTradeResult({
          fund,
          positionType,
          openPrice,
          closePrice,
          openTimestamp,
          closeTimestamp
        });
      }
      positionType = "NONE";
      positionFund = null;
      openTimestamp = null;
      openPrice = null;
      liquidationPrice = null;
      quantity = null;
    }
    // Liquidation
    if (
      (positionType === "LONG" && curKline.lowPrice < liquidationPrice) ||
      (positionType === "SHORT" && curKline.highPrice > liquidationPrice)
    ) {
      return null;
    }
  }
  return {
    isStillHasPosition: !!positionFund,
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
