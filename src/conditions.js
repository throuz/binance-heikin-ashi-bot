import { getDynamicConfig } from "../configs/dynamic-config.js";
import { LONG_TERM_KLINE_INTERVAL } from "../configs/trade-config.js";
import { getKlineData, getHeikinAshiKlineData } from "./helpers.js";

// Open conditions

const getIsPrevKlineUpward = async () => {
  const { open, close } = await getHeikinAshiKlineData();
  return close[close.length - 2] > open[open.length - 2];
};

const getIsPrevVolumeBelowAverage = async () => {
  const { avgVolPeriod, entryAvgVolFactor } = getDynamicConfig();
  const klineData = await getKlineData();
  const volumeArray = klineData.map((kline) => Number(kline[5]));
  const previousVolume = volumeArray[volumeArray.length - 2];
  const recentVolumeArray = volumeArray.slice(-avgVolPeriod - 1, -1);
  const sumVolume = recentVolumeArray.reduce((acc, volume) => volume + acc, 0);
  const averageVolume = sumVolume / avgVolPeriod;
  return previousVolume < averageVolume * entryAvgVolFactor;
};

const getIsPrevLongTermKlineUpward = async () => {
  const { open, close } = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
  return close[close.length - 2] > open[open.length - 2];
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsPrevKlineUpward(),
    getIsPrevVolumeBelowAverage(),
    getIsPrevLongTermKlineUpward()
  ]);
  return results.every((result) => result);
};

// Close conditions

const getIsPrevKlineDownward = async () => {
  const { open, close } = await getHeikinAshiKlineData();
  return close[close.length - 2] < open[open.length - 2];
};

const getIsPrevVolumeAboveAverage = async () => {
  const { avgVolPeriod, exitAvgVolFactor } = getDynamicConfig();
  const klineData = await getKlineData();
  const volumeArray = klineData.map((kline) => Number(kline[5]));
  const previousVolume = volumeArray[volumeArray.length - 2];
  const recentVolumeArray = volumeArray.slice(-avgVolPeriod - 1, -1);
  const sumVolume = recentVolumeArray.reduce((acc, volume) => volume + acc, 0);
  const averageVolume = sumVolume / avgVolPeriod;
  return previousVolume > averageVolume * exitAvgVolFactor;
};

const getIsPrevLongTermKlineDownward = async () => {
  const { open, close } = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
  return close[close.length - 2] < open[open.length - 2];
};

export const getIsCloseConditionsMet = async () => {
  const [
    isPrevKlineDownward,
    isPrevVolumeAboveAverage,
    isPrevLongTermKlineDownward
  ] = await Promise.all([
    getIsPrevKlineDownward(),
    getIsPrevVolumeAboveAverage(),
    getIsPrevLongTermKlineDownward()
  ]);
  return (
    (isPrevKlineDownward && isPrevVolumeAboveAverage) ||
    isPrevLongTermKlineDownward
  );
};
