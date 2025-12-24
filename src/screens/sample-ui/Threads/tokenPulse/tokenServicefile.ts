// ==== File: src/services/tokenService.ts ====
import { SERVER_URL } from "@env";

const ALMOST_BONDED_RELATIVE = "/api/tokenRelatedData/almost-bonded-tokens";
const MIGRATED_RELATIVE = "/api/tokenRelatedData/migrated-tokens";
const NEWLY_CREATED_RELATIVE = "/api/tokenRelatedData/newly-created-tokens"; // ✅ new
const XSTOCK_RELATIVE = "/api/tokenRelatedData/xstock-tokens"; // <-- new
const LSTS_RELATIVE = "/api/tokenRelatedData/lsts-tokens"; // <--- new
// ==== Add below existing imports/consts ====
const BLUECHIP_RELATIVE = "/api/tokenRelatedData/bluechip-memes";
const AI_RELATIVE = "/api/tokenRelatedData/ai-tokens";
const TRENDING_RELATIVE = "/api/tokenRelatedData/trending-tokens";
const POPULAR_RELATIVE = "/api/tokenRelatedData/popular-tokens";

export const BLUECHIP_ENDPOINT = `${SERVER_URL}${BLUECHIP_RELATIVE}`;
export const AI_ENDPOINT = `${SERVER_URL}${AI_RELATIVE}`;
export const ALMOST_BONDED_ENDPOINT = `${SERVER_URL}${ALMOST_BONDED_RELATIVE}`;
export const MIGRATED_ENDPOINT = `${SERVER_URL}${MIGRATED_RELATIVE}`;
export const NEWLY_CREATED_ENDPOINT = `${SERVER_URL}${NEWLY_CREATED_RELATIVE}`; // ✅ new
export const XSTOCK_ENDPOINT = `${SERVER_URL}${XSTOCK_RELATIVE}`; // <-- new
export const LSTS_ENDPOINT = `${SERVER_URL}${LSTS_RELATIVE}`; // <--- new
export const TRENDING_ENDPOINT = `${SERVER_URL}${TRENDING_RELATIVE}`; // ✅
export const POPULAR_ENDPOINT = `${SERVER_URL}${POPULAR_RELATIVE}`;   // ✅

// export type BackendAnalytics = {
//   totalBuys?: string | number;
//   totalSells?: string | number;
//   totalTrades?: string | number;
//   allTimeVolumeUSD?: number | string;
//   currentVolumeUSD?: number | string;
//   holderCount?: string | number;
// };

export type BackendToken = {
  mint: string;
  category: string;

  name: string | null;
  symbol: string | null;
  uri: string | null;
  image: string | null;

  marketcap: string | number | null;
  volume: string | number | null;
  txns: string | number | null;
  holders: string | number | null;

  holding_top_10: string | number | null;
  holding_snipers: string | number | null;
  // holding_dev: string | number | null;
  // holding_insiders: string | number | null;
  // holding_bundle: string | number | null;

  bonding_curve_progress: number | null;
  protocol_family: string | null;

  social_twitter: string | null;
  social_telegram: string | null;
  social_website: string | null;
  social_tiktok?: string | null;

  time: string | null;
  updated_at: string;
};

export type SearchToken = {
  mint: string;
  name: string | null; 
  symbol: string | null;
  image: string | null;
  marketcap: number | null;
  volume: number | null;
  liquidity: number | null;
  priceChange24h: number | null;
};
 
async function fetchJson(url: string) {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.tokens)) return data.tokens;
  return data?.data ?? data;
}

export async function fetchAlmostBondedTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(ALMOST_BONDED_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchAlmostBondedTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchMigratedTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(MIGRATED_ENDPOINT);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchMigratedTokens error:", err?.message ?? err);
    return [];
  }
}

// ✅ New function for newly created tokens
export async function fetchNewlyCreatedTokens(): Promise<BackendToken[]> {
  try {
    const data = await fetchJson(NEWLY_CREATED_ENDPOINT);
    // console.log("data: ", data[1]);
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error("[tokenService] fetchNewlyCreatedTokens error:", err?.message ?? err);
    return [];
  }
}

// ---- Fetchers with new return type ----
export async function fetchBlueChipMemes(): Promise<SearchToken[]> {
  try {
    const data = await fetchJson(BLUECHIP_ENDPOINT);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchBlueChipMemes error:", err?.message ?? err);
    return [];
  }
}

export async function fetchTrendingTokens(): Promise<SearchToken[]> {
  try {
    const data = await fetchJson(TRENDING_ENDPOINT);
    // console.log("data 1: ", data[1]);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchTrendingTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchPopularTokens(): Promise<SearchToken[]> {
  try {
    const data = await fetchJson(POPULAR_ENDPOINT);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchPopularTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchAITokens(): Promise<SearchToken[]> {
  try {
    const data = await fetchJson(AI_ENDPOINT);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchAITokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchXstockTokens(): Promise<SearchToken[]> {
  try {
    const data = await fetchJson(XSTOCK_ENDPOINT);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchXstockTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchLSTsTokens(): Promise<SearchToken[]> {
  try {
    const data = await fetchJson(LSTS_ENDPOINT);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchLSTsTokens error:", err?.message ?? err);
    return [];
  }
}
/** getRelativeTime: accepts ISO string or unix seconds/ms number */
export function getRelativeTime(
  input?: string | number,
): string {
  if (!input) return '0s';

  let ts: number;

  if (typeof input === 'string') {
    ts = new Date(input).getTime();
    if (Number.isNaN(ts)) return 'invalid';
  } else {
    ts = input < 1e12 ? input * 1000 : input;
  }

  const now = Date.now();
  const diffMs = now - ts;

  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return `${seconds}s`;
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 30) return `${days}d`;
  if (months < 12) return `${months}mo`;
  return `${years}y`;
}

export function getSortableTimestamp(time: string | null | undefined): number {
  if (!time) return Number.MAX_SAFE_INTEGER;

  const ts = new Date(time).getTime();
  return Number.isNaN(ts) ? Number.MAX_SAFE_INTEGER : ts;
}

// src/utils/resolveProtocol.ts

type Protocol = {
  name: string;
  image: any;
  color: string;
};

type ProtocolRule = {
  suffix: string;          // keyword at end of mint
  protocolName: string;    // must match PROTOCOLS.name
};

export const PROTOCOL_RULES: ProtocolRule[] = [
  { suffix: "pump", protocolName: "Pump" },
  { suffix: "bonk", protocolName: "Bonk" },
  { suffix: "BAGS", protocolName: "Bags" },
  { suffix: "moon", protocolName: "Moonshot" },
  { suffix: "BLV", protocolName: "Believe" },
  { suffix: "boop", protocolName: "Boop" },
  { suffix: "jupx", protocolName: "Jupiter Studio" },
  { suffix: "ray", protocolName: "LaunchLab" },
];


// src/utils/resolveProtocol.ts

export function resolveProtocolFromMint(
  mint: string,
  protocols: Protocol[]
): Protocol | null {
  const mintLower = mint.toLowerCase();

  const rule = PROTOCOL_RULES.find(r =>
    mintLower.endsWith(r.suffix)
  );

  if (!rule) return null;

  return (
    protocols.find(p => p.name === rule.protocolName) ?? null
  );
}
