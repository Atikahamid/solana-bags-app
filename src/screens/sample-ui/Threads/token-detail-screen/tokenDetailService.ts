import { SERVER_URL } from "@env";

/* ----------------------------- API Types (RAW) ----------------------------- */

/** Chart candle as returned by API */
export interface ChartCandleApi {
  time: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

/** Normalized candle for UI */
export interface ChartCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Token stats API response */
export interface TokenStatsApi {
  id: number;
  token_mint: string;
  market_cap: string;
  volume_24h: string | null;
  liquidity: string | null;
  holders_count: number | null;
  total_supply: string;
  created_on: string;
  all_time_high: string | null;
  active_traders: number | null;
  price_change_24h: string | null;
  tx_count: number | null;
  buy_volume: string | null;
  sell_volume: string | null;
  num_buys: number | null;
  num_sells: number | null;
  description?: string | null;
  socials?: {
    website?: string | null;
    twitter?: string | null;
    telegram?: string | null;
  };
  'top_10_holders_%': string | null;
  holding_top_10: string | null;
  holding_dev: string | null;
  holding_snipers: string | null;
  holding_insiders: string | null;
  holding_bundle: string | null;
  fetched_at: string;
}


/** Token holder row */
export interface TokenHolderApi {
  id: number;
  token_mint: string;
  holder_address: string;
  tokens_holdings: string;
  value_of_tokens_holdings: string;
  fetched_at: string;
  holding_percent: string;
}

/** Token holders response */
export interface TokenHoldersResponse {
  token_mint: string;
  holders: TokenHolderApi[];
}

/** Transaction activity row */
export interface TransactionActivityApi {
  id: string;
  type: "BUY" | "SELL";
  quantity: string;
  price_usd: string;
  price_sol: string | null;
  total_usd: string;
  marketcap_at_trade: string | null;
  tx_hash: string;
  slot: number | null;
  created_at: string;
  username: string;
  profile_image_url: string | null;
}

/** Activity response */
export interface TransactionActivityResponse {
  data: TransactionActivityApi[];
}

/* ----------------------------- Helpers ----------------------------- */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

/* ----------------------------- Routes ----------------------------- */

const BASE = `${SERVER_URL}/api/tokenRelatedData`;

/* ----------------------------- API Calls ----------------------------- */

// 1️⃣ Chart
export async function fetchTokenChart(
  mint: string,
  range: "1h" | "6h" | "1d" | "30d" = "1h"
): Promise<{ candles: ChartCandle[] }> {
  try {
    const data = await fetchJson<ChartCandleApi[]>(
      `${BASE}/api/chart/${mint}?range=${range}`
    );
    // console.log("chart data: ", data[1]);
    return {
      candles: data.map((c) => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close),
        volume: Number(c.volume),
      })),
    };
  } catch (err) {
    console.error("[tokenService] fetchTokenChart error:", err);
    return { candles: [] };
  }
}

// 2️⃣ Token stats
export async function fetchTokenStats(
  mint: string
): Promise<TokenStatsApi | null> {
  try {
    const data = await fetchJson<TokenStatsApi>(
      `${BASE}/tokenstats/${mint}`
    );
    console.log("stats data: ", data);
    return data;
  } catch (err) {
    console.error("[tokenService] fetchTokenStats error:", err);
    return null;
  }
}

// 3️⃣ Token holders
export async function fetchTokenHolders(
  mint: string
): Promise<TokenHoldersResponse> {
  try {
    const data = await fetchJson<TokenHoldersResponse>(
      `${BASE}/tokenholders/${mint}`
    );
    console.log("tokens holders: ", data);
    return data;
  } catch (err) {
    console.error("[tokenService] fetchTokenHolders error:", err);
    return { token_mint: mint, holders: [] };
  }
}

// 4️⃣ Activity
export async function fetchTokenActivity(
  mint: string
): Promise<TransactionActivityApi[]> {
  try {
    const res = await fetchJson<TransactionActivityResponse>(
      `${BASE}/activity/${mint}`
    );
    console.log("res.data", res.data);
    return res.data;
  } catch (err) {
    console.error("[tokenService] fetchTokenActivity error:", err);
    return [];
  }
}
