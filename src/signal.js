import { getHAKlineData, getLTHAKlineData } from "./helpers.js";

let cachedHAKlineData = [];
let cachedLTHAKlineData = [];

const setCachedKlineDatas = async () => {
  const HAKlineData = await getHAKlineData();
  const LTHAKlineData = await getLTHAKlineData();
  cachedHAKlineData = HAKlineData;
  cachedLTHAKlineData = LTHAKlineData;
};

const getPreHAKlineTrend = (index) => {
  const { openPrice, closePrice } = cachedHAKlineData[index - 1];
  return closePrice > openPrice ? "UP" : "DOWN";
};

const getPreLTHAKlineTrend = (index) => {
  const timestamp = cachedHAKlineData[index].openTime;
  const foundIndex = cachedLTHAKlineData.findIndex(
    (kline) => timestamp >= kline.openTime && timestamp <= kline.closeTime
  );
  const { openPrice, closePrice } = cachedLTHAKlineData[foundIndex - 1];
  return closePrice > openPrice ? "UP" : "DOWN";
};

const getPreVolume = (index) => {
  return cachedHAKlineData[index - 1].volume;
};

const getWeightedPrePeriodAvgVol = ({
  index,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor
}) => {
  const preHAKlineTrend = getPreHAKlineTrend(index);
  const volumeArray = cachedHAKlineData.map((kline) => kline.volume);
  const prePeriodSumVolume = volumeArray
    .slice(index - avgVolPeriod, index)
    .reduce((acc, volume) => acc + volume, 0);
  const prePeriodAvgVol = prePeriodSumVolume / avgVolPeriod;
  if (preHAKlineTrend === "UP") {
    return prePeriodAvgVol * openAvgVolFactor;
  }
  if (preHAKlineTrend === "DOWN") {
    return prePeriodAvgVol * closeAvgVolFactor;
  }
  return prePeriodAvgVol;
};

export const getSignal = async ({
  hasPosition,
  index,
  avgVolPeriod,
  openAvgVolFactor,
  closeAvgVolFactor
}) => {
  const noCachedKlineDatas =
    cachedHAKlineData.length === 0 || cachedLTHAKlineData.length === 0;
  const isCachedKlineDatasExpired =
    cachedHAKlineData.length > 0 &&
    Date.now() > cachedHAKlineData[cachedHAKlineData.length - 1].closeTime;
  if (noCachedKlineDatas || isCachedKlineDatasExpired) {
    await setCachedKlineDatas();
  }
  const preHAKlineTrend = getPreHAKlineTrend(index);
  const preLTHAKlineTrend = getPreLTHAKlineTrend(index);
  const preVolume = getPreVolume(index);
  const weightedPrePeriodAvgVol = getWeightedPrePeriodAvgVol({
    index,
    avgVolPeriod,
    openAvgVolFactor,
    closeAvgVolFactor
  });
  if (!hasPosition) {
    if (
      preHAKlineTrend === "UP" &&
      preVolume < weightedPrePeriodAvgVol &&
      preLTHAKlineTrend === "UP"
    ) {
      return "OPEN";
    }
  }
  if (hasPosition) {
    if (
      (preHAKlineTrend === "DOWN" && preVolume > weightedPrePeriodAvgVol) ||
      preLTHAKlineTrend === "DOWN"
    ) {
      return "CLOSE";
    }
  }
  return "NONE";
};
