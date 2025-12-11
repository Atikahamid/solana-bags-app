const AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN!;
import { BATCH_CREATION_TIME_OF_TOKEN, BATCH_GET_TOTAL_SUPPLY_OF_TOKEN, COMBINED_TOKEN_METRICS, GET_TOKEN_ANALYTICS_QUERY, GET_TOKEN_HOLDERS_COUNT } from "../queries/allQueryFile";
// import PQueue from "p-queue"; // lightweight concurrency limiter
import PQueue from "p-queue";
const BITQUERY_AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN || "ory_at_GVB4S_JW4KylmKz9phcNf8Lfw-nAvnIldmu9y_rbERA.UwC3hBBwTFKIONUHtTZQum1WiAMsP8VCYZFkRD-sXxU";
// Define cache at module level (shared across calls)
const analyticsCache = new Map<string, any>();

// utils/tokenRelatedUtils.ts
import axios from "axios";

// export async function decodeMetadata(uri: string) {
//   try {
//     let url = uri;
//     if (uri.startsWith("ipfs://")) url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
//     if (uri.startsWith("ar://")) url = uri.replace("ar://", "https://arweave.net/");

//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.statusText}`);
//     return await res.json();
//   } catch (err) {
//     console.error("decodeMetadata error:", err);
//     return null;
//   }
// }

export async function getTokenAnalytics(mint: string) {
  if (analyticsCache.has(mint)) {
    return analyticsCache.get(mint);
  }

  try {
    const res = await fetch("https://streaming.bitquery.io/eap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify({
        query: GET_TOKEN_ANALYTICS_QUERY,
        variables: { tokenMint: mint },
      }),
    });

    const json = await res.json();
    // console.log("analytics response:", JSON.stringify(json, null, 2));

    const analytics = json.data?.Solana || {};

    // Safely extract values with fallbacks
    const allTimeStats = analytics.all_time_trading_stats?.[0] ?? {};
    const currentStats = analytics.current_trading_stats?.[0] ?? {};
    const holderStats = analytics.holder_count?.[0] ?? {};

    const analyticsData = {
      totalBuys: allTimeStats.total_buys ?? 0,
      totalSells: allTimeStats.total_sells ?? 0,
      totalTrades: allTimeStats.total_trades ?? 0,
      allTimeVolumeUSD: allTimeStats.current_volume_usd ?? 0,

      currentVolumeUSD: currentStats.current_volume_usd ?? 0,
      holderCount: holderStats.total_holders ?? 0,
    };

    analyticsCache.set(mint, analyticsData);

    // Auto-expire after 5 minutes
    setTimeout(() => analyticsCache.delete(mint), 5 * 60 * 1000);

    return analyticsData;
  } catch (err) {
    console.error("getTokenAnalytics error:", err);
    return {
      totalBuys: 0,
      totalSells: 0,
      totalTrades: 0,
      allTimeVolumeUSD: 0,
      currentVolumeUSD: 0,
      holderCount: 0,
    };
  }
}
const DETAIL_BATCH_SIZE = 10;

// src/fetchTokenDetailBatch.ts
export function computeLiquidityUSD(pool: any): number | null {
  if (!pool?.Base || !pool?.Quote) return null;

  const baseAmount = Number(pool.Base.PostAmount || 0);
  const baseUSD = Number(pool.Base.PostAmountInUSD || 0);
  const quoteAmount = Number(pool.Quote.PostAmount || 0);
  const quoteUSD = Number(pool.Quote.PostAmountInUSD || 0);

  if (baseUSD > 0 && quoteUSD > 0) {
    return baseUSD + quoteUSD;
  }

  if (quoteUSD > 0 && baseAmount > 0) {
    const priceBase = quoteUSD / baseAmount;
    return baseAmount * priceBase + quoteUSD;
  }

  if (baseUSD > 0 && quoteAmount > 0) {
    const priceQuote = baseUSD / quoteAmount;
    return baseUSD + quoteAmount * priceQuote;
  }

  return null;
}

export async function fetchTokenDetailBatch(tokens: any[]): Promise<any[]> {
  for (let i = 0; i < tokens.length; i += DETAIL_BATCH_SIZE) {
    const batch = tokens.slice(i, i + DETAIL_BATCH_SIZE);
    const mintAddresses = batch.map((t) => t.mint);

    try {
      const res = await axios.post(
        process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
        {
          query: COMBINED_TOKEN_METRICS,
          variables: { mintAddresses },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
          },
          timeout: 60_000,
        }
      );

      const solanaData = res.data?.data?.Solana;
      if (!solanaData) continue;

      for (const tok of batch) {
        const mint = tok.mint;

        // --- Marketcap ---
        const supplyUpdate = solanaData.TokenSupplyUpdates?.find(
          (u: any) =>
            u.TokenSupplyUpdate?.Currency?.MintAddress === mint
        )?.TokenSupplyUpdate;

        const latestPrice = solanaData.PriceMetrics?.find(
          (p: any) => p.Trade?.Currency?.MintAddress === mint
        )?.Trade?.PriceInUSD;

        let marketcap: number | null = null;
        if ((supplyUpdate?.PostBalanceInUSD ?? 0) > 0) {
          marketcap = supplyUpdate.PostBalanceInUSD;
        } else if (supplyUpdate?.PostBalance && latestPrice) {
          marketcap = Number(supplyUpdate.PostBalance) * Number(latestPrice);
        }

        // --- Price Change 24h ---
        const priceChangeEntry = solanaData.PriceChange24h?.find(
          (pc: any) => pc.Trade?.Currency?.MintAddress === mint
        );
        const priceChange24h = priceChangeEntry?.PriceChange24hPercent ?? null;

        // --- Volume 1h ---
        const volumeEntry = solanaData.VolumeMetrics?.find(
          (v: any) => v.Trade?.Currency?.MintAddress === mint
        );
        const volume1h = volumeEntry?.volume_usd_1h
          ? Number(volumeEntry.volume_usd_1h)
          : null;

        // --- Liquidity (by mint, not market) ---
        const liquidityEntry = solanaData.LiquidityMetrics?.find(
          (l: any) =>
            l.Pool?.Market?.BaseCurrency?.MintAddress === mint
        );
        const liquidityUSD = liquidityEntry
          ? computeLiquidityUSD(liquidityEntry.Pool)
          : null;

        // --- Assign to token ---
        tok.marketcap = marketcap;
        tok.price_change_24h = priceChange24h;
        tok.volume_usd_1h = volume1h;
        tok.liquidity_usd = liquidityUSD;
      }
    } catch (err: any) {
      console.warn("⚠️ fetchTokenDetailBatch failed:", err.message);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return tokens;
}

/* -----------------------------
   STRONG RATE-LIMIT CONTROL
------------------------------*/
const queue = new PQueue({
  concurrency: 5,      // Max 5 active requests at the same time
  intervalCap: 10,     // Max 10 requests per second
  interval: 1000       // 1-second rate window
});

/* -----------------------------
   SIMPLE RETRY WRAPPER
------------------------------*/
async function httpGetWithRetry(url: string, retries = 3, delayMs = 500) {
  let lastErr;

  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 15000 });
    } catch (err: any) {
      lastErr = err;
      if (i < retries - 1) {
        const wait = delayMs * (i + 1);
        await new Promise((resolve) => setTimeout(resolve, wait));
      }
    }
  }

  throw lastErr;
}

/* -----------------------------
   IN-MEMORY CACHE
------------------------------*/
const cache = new Map<string, Metadata | null>();

/* -----------------------------
   IPFS GATEWAYS
------------------------------*/
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cf-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/"
];

/* -----------------------------
   METADATA INTERFACE
------------------------------*/
export interface Metadata {
  image?: string | null;
  createdOn?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  website?: string | null;
  description?: string | null;
  [key: string]: any;        // allows additional metadata fields
}

function normalizeIpfsUri(uri: string): string {
  if (!uri) return uri;

  // Matches ANY form of "https://xxx/ipfs/<cid>"
  const match = uri.match(/https?:\/\/[^/]+\/ipfs\/([^/?#]+)/);
  if (match && match[1]) {
    return `ipfs://${match[1]}`;
  }

  return uri; // keep as is
}


/* -----------------------------
   MAIN DECODER
------------------------------*/
export async function decodeMetadata(uri?: string | null): Promise<Metadata | null> {
  if (!uri) return null;

  // NEW — normalize all http ipfs links → ipfs://CID
  uri = normalizeIpfsUri(uri);

  if (cache.has(uri)) return cache.get(uri)!;
  return queue.add(async () => {
    try {
      let url = uri;

      /* ---------- IPFS HANDLING ----------*/
      if (uri.startsWith("ipfs://")) {
        const cid = uri.replace("ipfs://", "");
        const shuffled = [...IPFS_GATEWAYS].sort(() => Math.random() - 0.5);

        for (const gateway of shuffled) {
          try {
            const res = await httpGetWithRetry(`${gateway}${cid}`);

            const raw = res.data || {};
            const meta: Metadata = {
              image: raw.image ?? null,
              description: raw.description ?? null,
              createdOn: raw.createdOn ?? null,
              telegram: raw.telegram ?? null,
              twitter: raw.twitter ?? null,
              website: raw.website ?? null,
              ...raw
            };

            cache.set(uri, meta);
            return meta;
          } catch (err: any) {
            console.warn(`⚠️ IPFS fail @ ${gateway} —`, cid, err.message);
          }
        }

        cache.set(uri, null);
        return null;
      }

      /* ---------- ARWEAVE HANDLING ----------*/
      if (uri.startsWith("ar://")) {
        url = uri.replace("ar://", "https://arweave.net/");
      }

      /* ---------- HTTP METADATA ----------*/
      const res = await httpGetWithRetry(url);
      const raw = res.data || {};

      const meta: Metadata = {
        image: raw.image ?? null,
        description: raw.description ?? null,
        createdOn: raw.createdOn ?? null,
        telegram: raw.telegram ?? null,
        twitter: raw.twitter ?? null,
        website: raw.website ?? null,
        ...raw
      };

      cache.set(uri, meta);
      return meta;
    } catch (err: any) {
      console.warn("⚠️ decodeMetadata final fail:", uri, err.message);
      cache.set(uri, null);
      return null;
    }
  });
}

/* -----------------------------
   BATCH DECODER
------------------------------*/
export async function decodeMetadataBatch(
  uris: (string | null | undefined)[]
): Promise<(Metadata | null)[]> {
  return Promise.all(uris.map((uri) => decodeMetadata(uri)));
}

export function timeAgo(timestamp: string): string {
  const now = new Date().getTime();
  const past = new Date(timestamp).getTime();

  const diffMs = now - past;

  // If the time is in the future
  if (diffMs < 0) {
    return "just now";
  }

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  if (months < 12) return `${months}mo ago`;
  return `${years}y ago`;
}


export async function getCreationTimeAndSupplyBatch(
  mintAddresses: string[]
): Promise<Record<string, { created_on: string | null; total_supply: number | null }>> {
  if (!mintAddresses.length) return {};

  const result: Record<string, { created_on: string | null; total_supply: number | null }> = {};

  mintAddresses.forEach((mint) => {
    result[mint] = {
      created_on: null,
      total_supply: null
    };
  });

  try {
    // ----------- Fetch Creation Times -----------
    const creationRes = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      {
        query: BATCH_CREATION_TIME_OF_TOKEN,
        variables: { mintAddresses }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 120_000,
      }
    );

    const creationRows = creationRes.data?.data?.Solana?.DEXTradeByTokens ?? [];
    // console.log("creation Result: ", creationRows);

    for (const row of creationRows) {
      const mint = row?.Trade?.Currency?.MintAddress;
      const time = row?.Block?.Time;
      if (mint && result[mint]) {
        result[mint].created_on = time ?? null;
      }
    }

    // ----------- Fetch Total Supply -----------
    const supplyRes = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      {
        query: BATCH_GET_TOTAL_SUPPLY_OF_TOKEN,
        variables: { mintAddresses }
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 120_000,
      }
    );

    const supplyRows = supplyRes.data?.data?.Solana?.TokenSupplyUpdates ?? [];
    // console.log("supply rows: ", supplyRows);
    for (const row of supplyRows) {
      const update = row?.TokenSupplyUpdate;
      if (!update) continue;

      const mint = update.Currency?.MintAddress;
      const supply = Number(update.PostBalance ?? "0");

      if (mint && result[mint]) {
        result[mint].total_supply = isNaN(supply) ? null : supply;
      }
    }

    return result;
  } catch (err: any) {
    console.error("❌ Error in getCreationTimeAndSupplyBatch:", err.message);
    return result;
  }
}
type Holder = {
  address: string;
  balance: number;
  owner: string;
};

type HoldingsResult = {
  holding_top_10: number;
  holding_dev: number;
  holding_snipers: number;
  holding_insiders: number;
  holding_bundle: number;
};

export function calculateHoldingsPercent(
  response: any,
  totalSupply: number
): HoldingsResult {
  if (!response?.Solana?.BalanceUpdates) {
    return {
      holding_top_10: 0,
      holding_dev: 0,
      holding_snipers: 0,
      holding_insiders: 0,
      holding_bundle: 0,
    };
  }

  const rows = response.Solana.BalanceUpdates;

  const holders: Holder[] = rows.map((row: any) => ({
    address: row.BalanceUpdate.Account.Address,
    balance: Number(row.BalanceUpdate.PostBalance) || 0,
    owner: row.BalanceUpdate.Account.Token?.Owner || "",
  }));

  // guard: avoid NaN division if totalSupply is 0
  if (!totalSupply || totalSupply <= 0) {
    return {
      holding_top_10: 0,
      holding_dev: 0,
      holding_snipers: 0,
      holding_insiders: 0,
      holding_bundle: 0,
    };
  }

  const sorted = [...holders].sort((a, b) => b.balance - a.balance);

  const top10 = sorted.slice(0, 10);
  const holding_top_10 =
    (top10.reduce((sum, h) => sum + h.balance, 0) / totalSupply) * 100;

  const devWallets: string[] = [];
  const sniperWallets: string[] = [];
  const insiderWallets: string[] = [];
  const bundleWallets: string[] = [];

  function sumHoldingPercent(walletAddresses: string[]) {
    const sum = holders
      .filter((h) => walletAddresses.includes(h.address))
      .reduce((s, h) => s + h.balance, 0);

    return (sum / totalSupply) * 100;
  }

  const holding_dev = sumHoldingPercent(devWallets);
  const holding_snipers = sumHoldingPercent(sniperWallets);
  const holding_insiders = sumHoldingPercent(insiderWallets);
  const holding_bundle = sumHoldingPercent(bundleWallets);

  return {
    holding_top_10: Number(holding_top_10.toFixed(4)),
    holding_dev: Number(holding_dev.toFixed(4)),
    holding_snipers: Number(holding_snipers.toFixed(4)),
    holding_insiders: Number(holding_insiders.toFixed(4)),
    holding_bundle: Number(holding_bundle.toFixed(4)),
  };
}

// ---------------------------------------------------------------------------
// getTokenHolderCount — now fetches correct TokenSupplyUpdates and passes it in
// ---------------------------------------------------------------------------
export async function getTokenHolderCount(
  mintAddress: string
): Promise<number> {
  if (!mintAddress) throw new Error("mintAddress is required");

  const url = process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
  };

  // 1️⃣ Fetch true total supply first
  const supplyRes = await axios.post(
    url,
    {
      query: BATCH_GET_TOTAL_SUPPLY_OF_TOKEN,
      variables: { mintAddresses: [mintAddress] },
    },
    { headers, timeout: 60000 }
  );

  const supplyRows =
    supplyRes.data?.data?.Solana?.TokenSupplyUpdates ?? [];

  const totalSupply = Number(
    supplyRows[0]?.TokenSupplyUpdate?.PostBalance || 0
  );

  // 2️⃣ Fetch holders (your existing query)
  const holdersRes = await axios.post(
    url,
    {
      query: GET_TOKEN_HOLDERS_COUNT,
      variables: { mintAddress },
    },
    { headers, timeout: 60000 }
  );

  // 3️⃣ Calculate % using correct supply
  const holdingResponse = calculateHoldingsPercent(
    holdersRes.data.data,
    totalSupply
  );

  console.log("TOTAL SUPPLY:", totalSupply);
  console.log("holding Response:", holdingResponse);

  // 4️⃣ Return holder count
  const data =
    holdersRes.data?.data?.Solana?.BalanceUpdates ?? [];

  const holders = data.filter((entry: any) => {
    const raw = entry?.BalanceUpdate?.Holding;
    const n = Number(raw);
    return !isNaN(n) && n > 0;
  });

  return holders.length;
}
