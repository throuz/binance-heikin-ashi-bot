import {
  LONG_TERM_KLINE_INTERVAL,
  AVERAGE_VOLUME_PERIOD,
  AVERAGE_VOLUME_THRESHOLD_FACTOR
} from "../configs/trade-config.js";
import { getKlineData, getHeikinAshiKlineData } from "./helpers.js";

// Open conditions

const getIsPreviousKlineUpward = async () => {
  const { open, close } = await getHeikinAshiKlineData();
  return close[close.length - 2] > open[open.length - 2];
};

const getIsPreviousVolumeBelowAverage = async () => {
  const klineData = await getKlineData();
  const volumeArray = klineData.map((kline) => Number(kline[5]));
  const previousVolume = volumeArray[volumeArray.length - 2];
  const recentVolumeArray = volumeArray.slice(-AVERAGE_VOLUME_PERIOD - 1, -1);
  const sumVolume = recentVolumeArray.reduce((acc, volume) => volume + acc, 0);
  const averageVolume = sumVolume / AVERAGE_VOLUME_PERIOD;
  return previousVolume < averageVolume * (1 - AVERAGE_VOLUME_THRESHOLD_FACTOR);
};

const getIsPreviousLongTermKlineUpward = async () => {
  const { open, close } = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
  return close[close.length - 2] > open[open.length - 2];
};

export const getIsOpenConditionsMet = async () => {
  const results = await Promise.all([
    getIsPreviousKlineUpward(),
    getIsPreviousVolumeBelowAverage(),
    getIsPreviousLongTermKlineUpward()
  ]);
  return results.every((result) => result);
};

// Close conditions

const getIsPreviousKlineDownward = async () => {
  const { open, close } = await getHeikinAshiKlineData();
  return close[close.length - 2] < open[open.length - 2];
};

const getIsPreviousVolumeAboveAverage = async () => {
  const klineData = await getKlineData();
  const volumeArray = klineData.map((kline) => Number(kline[5]));
  const previousVolume = volumeArray[volumeArray.length - 2];
  const recentVolumeArray = volumeArray.slice(-AVERAGE_VOLUME_PERIOD - 1, -1);
  const sumVolume = recentVolumeArray.reduce((acc, volume) => volume + acc, 0);
  const averageVolume = sumVolume / AVERAGE_VOLUME_PERIOD;
  return previousVolume > averageVolume * (1 + AVERAGE_VOLUME_THRESHOLD_FACTOR);
};

const getIsPreviousLongTermKlineDownward = async () => {
  const { open, close } = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
  return close[close.length - 2] < open[open.length - 2];
};

export const getIsCloseConditionsMet = async () => {
  const [
    isPreviousKlineDownward,
    isPreviousVolumeAboveAverage,
    isPreviousLongTermKlineDownward
  ] = await Promise.all([
    getIsPreviousKlineDownward(),
    getIsPreviousVolumeAboveAverage(),
    getIsPreviousLongTermKlineDownward()
  ]);
  return (
    (isPreviousKlineDownward && isPreviousVolumeAboveAverage) ||
    isPreviousLongTermKlineDownward
  );
};
