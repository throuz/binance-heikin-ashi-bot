import axios from "axios";

export const binanceFuturesAPI = axios.create({
  baseURL: "https://fapi.binance.com",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  }
});
