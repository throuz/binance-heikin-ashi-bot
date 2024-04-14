import crypto from "node:crypto";
import querystring from "node:querystring";
import { nodeCache } from "./cache.js";
import { binanceFuturesAPI } from "./web-services.js";

const getSignature = (params) => {
  const queryString = querystring.stringify(params);
  const signature = crypto
    .createHmac("sha256", "3?}1b_0~W:y?")
    .update(queryString)
    .digest("hex");
  return signature;
};

const getBinanceFuturesAPI = async (path, params) => {
  const signature = getSignature(params);
  const key = path + "/" + signature;
  if (nodeCache.has(key)) {
    return nodeCache.get(key);
  }
  const response = await binanceFuturesAPI.get(path, { params });
  nodeCache.set(key, response.data);
  return response.data;
};

export const klineDataAPI = async (params) => {
  const responseData = await getBinanceFuturesAPI("/fapi/v1/klines", params);
  return responseData;
};

export const markPriceKlineDataAPI = async (params) => {
  const responseData = await getBinanceFuturesAPI(
    "/fapi/v1/markPriceKlines",
    params
  );
  return responseData;
};
