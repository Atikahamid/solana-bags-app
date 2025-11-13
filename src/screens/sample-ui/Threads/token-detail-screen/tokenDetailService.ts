import axios from "axios";
import { SERVER_URL } from "@env";

const HOLDERS_RELATIVE = "/api/tokenRelatedData/token-holders";
const ACTIVITY_RELATIVE = "/api/tokenRelatedData/token-activity";
const CHART_RELATIVE = "/api/tokenRelatedData/chart";

async function fetchJson(url: string) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tokens)) return data.tokens;
  return data?.data ?? data;
}

export async function fetchTokenHolders(mintAddress: string) {
  try {
    const data = await fetchJson(`${SERVER_URL}${HOLDERS_RELATIVE}/${mintAddress}`);
    return data;
  } catch (err: any) {
    console.error("[tokenService] fetchTokenHolders error:", err?.message ?? err);
    return { holders: [] };
  }
}

export async function fetchTokenActivity(mintAddress: string) {
  try {
    const data = await fetchJson(`${SERVER_URL}${ACTIVITY_RELATIVE}/${mintAddress}`);
    return data;
  } catch (err: any) {
    console.error("[tokenService] fetchTokenActivity error:", err?.message ?? err);
    return { activities: [] };
  }
}

// ✅ FIXED: expects { candles: [...] } now
export async function fetchTokenChart(mintAddress: string) {
  try {
    const data = await fetchJson(`${SERVER_URL}${CHART_RELATIVE}/${mintAddress}`);
    // console.log("Fetched chart data:", data);

    if (Array.isArray(data?.candles)) {
      return {
        candles: data.candles.map((candle: any) => ({
          time: Number(candle.time),   // epoch seconds
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
          volume: Number(candle.volume),
          count: Number(candle.count),
        })),
      };
    }

    // legacy support for older responses
    if (Array.isArray(data?.ohlc)) {
      return {
        candles: data.ohlc.map((candle: any) => ({
          time: Number(candle.time),
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
        })),
      };
    }

    return { candles: [] };
  } catch (err: any) {
    console.error("[tokenService] fetchTokenChart error:", err?.message ?? err);
    return { candles: [] };
  }
}
