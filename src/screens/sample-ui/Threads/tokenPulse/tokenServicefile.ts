// ==== File: src/services/tokenService.ts ====
import { SERVER_URL } from "@env";

const ALMOST_BONDED_RELATIVE = "/api/tokenRelatedData/almost-bonded-tokens";
const MIGRATED_RELATIVE = "/api/tokenRelatedData/migrated-tokens";
const NEWLY_CREATED_RELATIVE = "/api/tokenRelatedData/newly-created-tokens"; // ✅ new
// const XSTOCK_RELATIVE = "/api/tokenRelatedData/xstock-tokens"; // <-- new
// const LSTS_RELATIVE = "/api/tokenRelatedData/lsts-tokens"; // <--- new
// ==== Add below existing imports/consts ====
// const BLUECHIP_RELATIVE = "/api/tokenRelatedData/bluechip-memes";
// const AI_RELATIVE = "/api/tokenRelatedData/ai-tokens";
const TRENDING_RELATIVE = "/api/tokenRelatedData/trending-tokens";
// const POPULAR_RELATIVE = "/api/tokenRelatedData/popular-tokens";
 const B100_RELATIVE = "/api/tokenRelatedData/b100-tokens";
export const B100_ENDPOINT = `${SERVER_URL}${B100_RELATIVE}`;
// export const BLUECHIP_ENDPOINT = `${SERVER_URL}${BLUECHIP_RELATIVE}`;
// export const AI_ENDPOINT = `${SERVER_URL}${AI_RELATIVE}`;
export const ALMOST_BONDED_ENDPOINT = `${SERVER_URL}${ALMOST_BONDED_RELATIVE}`;
export const MIGRATED_ENDPOINT = `${SERVER_URL}${MIGRATED_RELATIVE}`;
export const NEWLY_CREATED_ENDPOINT = `${SERVER_URL}${NEWLY_CREATED_RELATIVE}`; // ✅ new
// export const XSTOCK_ENDPOINT = `${SERVER_URL}${XSTOCK_RELATIVE}`; // <-- new
// export const LSTS_ENDPOINT = `${SERVER_URL}${LSTS_RELATIVE}`; // <--- new
export const TRENDING_ENDPOINT = `${SERVER_URL}${TRENDING_RELATIVE}`; // ✅
// export const POPULAR_ENDPOINT = `${SERVER_URL}${POPULAR_RELATIVE}`;   // ✅

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

  marketcap: number | null;
  volume: number | null;
  txns: number | null;
  holders: number | null;

  holding_top_10: number | null;
  holding_snipers: number | null;

  bonding_curve_progress: number | null;
  protocol_family: string | null;

  social_twitter: string | null;
  social_telegram: string | null;
  social_website: string | null;
  social_tiktok?: string | null;

  decimals: number | null;
  time: string | null;
  updated_at: string;
};


export type SearchToken = {
  mint: string;
  name: string | null; 
  symbol: string | null;
  image: string | null;
  marketcap: number | null;
  priceUsd: number | null;  
  // volume: number | null;
  // liquidity: number | null;
  decimals: number | null;
  priceChange24h: number | null;
};
export type LaunchpadResponse = {
  count: number;
  tokens: BackendToken[];
};

 
export async function fetchJson(
  url: string,
  options?: RequestInit
) {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}


export async function fetchAlmostBondedTokens(
  filters?: any
): Promise<BackendToken[]> {
  try {
      const res: LaunchpadResponse = await fetchJson(
      ALMOST_BONDED_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify({ filters }),
      }
    );

    return Array.isArray(res.tokens) ? res.tokens : [];
  } catch (err: any) {
    console.error("[tokenService] fetchAlmostBondedTokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchMigratedTokens(
  filters?: any
): Promise<BackendToken[]> {
  try {
   const res: LaunchpadResponse = await fetchJson(
      MIGRATED_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify({ filters }),
      }
    );

    return Array.isArray(res.tokens) ? res.tokens : [];
  } catch (err: any) {
    console.error("[tokenService] fetchMigratedTokens error:", err?.message ?? err);
    return [];
  }
}

// ✅ New function for newly created tokens
export async function fetchNewlyCreatedTokens(
  filters?: any
): Promise<BackendToken[]> {
  try {
    const res: LaunchpadResponse = await fetchJson(
      NEWLY_CREATED_ENDPOINT,
      {
        method: "POST",
        body: JSON.stringify({ filters }),
      }
    );

    return Array.isArray(res.tokens) ? res.tokens : [];
  } catch (err: any) {
    console.error("[tokenService] fetchNewlyCreatedTokens error:", err);
    return [];
  }
}


// ---- Fetchers with new return type ----
// export async function fetchBlueChipMemes(): Promise<SearchToken[]> {
//   try {
//     const res = await fetchJson(BLUECHIP_ENDPOINT);
//     const data = res.tokens;
//     return Array.isArray(data) ? (data as SearchToken[]) : [];
//   } catch (err: any) {
//     console.error("[tokenService] fetchBlueChipMemes error:", err?.message ?? err);
//     return [];
//   }
// }

export async function fetchB100Tokens(): Promise<SearchToken[]> {
  try {
    const res = await fetchJson(B100_ENDPOINT);
    const data = res.tokens;
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchB100Tokens error:", err?.message ?? err);
    return [];
  }
}

export async function fetchTrendingTokens(): Promise<SearchToken[]> {
  try {
    const res = await fetchJson(TRENDING_ENDPOINT);
    // console.log("data 1: ", data[1]);
    const data = res.tokens;
    console.log("data1: ", data[1]);
    return Array.isArray(data) ? (data as SearchToken[]) : [];
  } catch (err: any) {
    console.error("[tokenService] fetchTrendingTokens error:", err?.message ?? err);
    return [];
  }
}

// export async function fetchPopularTokens(): Promise<SearchToken[]> {
//   try {
//     const res = await fetchJson(POPULAR_ENDPOINT);
//     const data = res.tokens;
//     return Array.isArray(data) ? (data as SearchToken[]) : [];
//   } catch (err: any) {
//     console.error("[tokenService] fetchPopularTokens error:", err?.message ?? err);
//     return [];
//   }
// }

// export async function fetchAITokens(): Promise<SearchToken[]> {
//   try {
//     const res = await fetchJson(AI_ENDPOINT);
//     const data = res.tokens;
//     return Array.isArray(data) ? (data as SearchToken[]) : [];
//   } catch (err: any) {
//     console.error("[tokenService] fetchAITokens error:", err?.message ?? err);
//     return [];
//   }
// }

// export async function fetchXstockTokens(): Promise<SearchToken[]> {
//   try {
//     const res = await fetchJson(XSTOCK_ENDPOINT);
//     const data = res.tokens;
//     return Array.isArray(data) ? (data as SearchToken[]) : [];
//   } catch (err: any) {
//     console.error("[tokenService] fetchXstockTokens error:", err?.message ?? err);
//     return [];
//   }
// }

// export async function fetchLSTsTokens(): Promise<SearchToken[]> {
//   try {
//     const res = await fetchJson(LSTS_ENDPOINT);
//     const data = res.tokens;
//     return Array.isArray(data) ? (data as SearchToken[]) : [];
//   } catch (err: any) {
//     console.error("[tokenService] fetchLSTsTokens error:", err?.message ?? err);
//     return [];
//   }
// }



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


export type Range = {
  min?: number;
  max?: number;
};

export type UserFilters = {
  selectedProtocols?: string[];
  includeKeywords?: string;
  excludeKeywords?: string;

  dexPaid?: boolean;
  caEndsPump?: boolean;

  curve?: Range;
  age?: Range;
  top10Holders?: Range;
  devHolding?: Range;
  snipers?: Range;
  insiders?: Range;
  bundles?: Range;
  holders?: Range;

  liquidity?: Range;
  volume?: Range;
  marketCap?: Range;
  txns?: Range;
  numBuys?: Range;
  numSells?: Range;

  hasTwitter?: boolean;
  hasWebsite?: boolean;
  hasTelegram?: boolean;
  hasAtLeastOneSocial?: boolean;
};

type SaveFiltersPayload = {
  privy_id: string;
  filters: UserFilters;
};

export async function saveUserFilters(payload: SaveFiltersPayload) {
  try {
    const res = await fetch(
      `${SERVER_URL}/api/tokenRelatedData/api/user/filters`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    // console.log("res: ", res);
    // Handle non-2xx responses
    if (!res.ok) {
      let errorMessage = "Failed to save filters";

      try {
        const err = await res.json();
        if (err?.error) {
          errorMessage = err.error;
        }
      } catch {
        // response body was not JSON
      }

      throw new Error(errorMessage);
    }

    return await res.json();
  } catch (error) {
    // Network errors, JSON parsing errors, or thrown errors above
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Something went wrong while saving filters");
  }
}

export async function getUserFilters(privy_id: string) {
  try {
    const res = await fetch(
      `${SERVER_URL}/api/tokenRelatedData/user/filters`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ privy_id }),
      }
    );

    if (!res.ok) {
      let msg = "Failed to fetch filters";
      try {
        const err = await res.json();
        msg = err?.error ?? msg;
      } catch {}
      throw new Error(msg);
    }

    return await res.json();
  } catch (err) {
    console.error("getUserFilters error:", err);
    throw err;
  }
}


// =====================
// Discovery socket helpers
// =====================

type DiscoveryHandler = (token: any) => void;

const DISCOVERY_EVENTS: Record<string, string> = {
  Trending: "discovery:trending:new",
  Popular: "discovery:popular:new",
  Stocks: "discovery:xstock:new",
  AI: "discovery:ai:new",
  LSTs: "discovery:lsts:new",
  BlueChip: "discovery:bluechip_meme:new",
};



