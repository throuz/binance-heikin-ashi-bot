import { getKlineData, getHeikinAshiKlineData } from "../src/helpers.js";
import { LONG_TERM_KLINE_INTERVAL } from "../config/config.js";

let klineData = [];
let heikinAshiKlineData = [];
let longTermHeikinAshiKlineData = [];

export const setHistoryData = async () => {
  klineData = await getKlineData();
  heikinAshiKlineData = await getHeikinAshiKlineData();
  longTermHeikinAshiKlineData = await getHeikinAshiKlineData(
    LONG_TERM_KLINE_INTERVAL
  );
};

export const getHistoryData = () => {
  return { klineData, heikinAshiKlineData, longTermHeikinAshiKlineData };
};
