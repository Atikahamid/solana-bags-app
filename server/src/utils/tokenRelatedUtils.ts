const AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN!;
import { COMBINED_TOKEN_METRICS, GET_TOKEN_ANALYTICS_QUERY } from "../queries/allQueryFile";
// import PQueue from "p-queue"; // lightweight concurrency limiter
import PQueue from "p-queue";
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


// limit concurrency
const queue = new PQueue({ concurrency: 10 });

// in-memory cache to prevent re-fetching the same URI
// const cache = new Map<string, string | null>();
const cache = new Map<string, Metadata | null>();

// multiple IPFS gateways
const IPFS_GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://cloudflare-ipfs.com/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://cf-ipfs.com/ipfs/",
  "https://dweb.link/ipfs/",
];

export interface Metadata {
  image?: string | null;
  createdOn?: string | null;
  telegram?: string | null;
  twitter?: string | null;
  website?: string | null;
}

export async function decodeMetadata(uri?: string | null): Promise<Metadata | null> {
  if (!uri) return null;
  if (cache.has(uri)) return cache.get(uri)!;

  return queue.add(async () => {
    try {
      let url = uri;

      // IPFS
      if (uri.startsWith("ipfs://")) {
        const cid = uri.replace("ipfs://", "");
        const shuffled = [...IPFS_GATEWAYS].sort(() => Math.random() - 0.5);

        for (const gateway of shuffled) {
          try {
            const res = await axios.get(`${gateway}${cid}`, { timeout: 15000 });
            if (res.data) {
              const meta: Metadata = {
                image: res.data.image ?? null,
                createdOn: res.data.createdOn ?? null,
                telegram: res.data.telegram ?? null,
                twitter: res.data.twitter ?? null,
                website: res.data.website ?? null
              };

              cache.set(uri, meta);
              return meta;
            }
          } catch (err: any) {
            console.warn(`⚠️ IPFS fail @ ${gateway}`, cid, err.message);
          }
        }

        cache.set(uri, null);
        return null;
      }

      // Arweave
      if (uri.startsWith("ar://")) {
        url = uri.replace("ar://", "https://arweave.net/");
      }

      // Default HTTP
      const res = await axios.get(url, { timeout: 15000 });

      const meta: Metadata = {
        image: res.data?.image ?? null,
        createdOn: res.data?.createdOn ?? null,
        telegram: res.data?.telegram ?? null,
        twitter: res.data?.twitter ?? null,
        website: res.data?.website ?? null
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


// batch decoder
export async function decodeMetadataBatch(
  uris: (string | null | undefined)[]
): Promise<(Metadata | null)[]> {
  return Promise.all(uris.map((uri) => decodeMetadata(uri)));
}