import express, { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { decodeMetadata, getTokenAnalytics } from '../../utils/tokenRelatedUtils';
import { AI_TOKENS_QUERY, ALMOST_BONDED_QUERY, blacklist, BLUECHIP_MEMES_QUERY, GET_LATEST_TRADES_QUERY, GET_MIGRATED_TOKENS_QUERY, GET_TOKEN_OHLC_QUERY, GET_TOP_HOLDERS_QUERY, metadataQuery, NEWLY_CREATED_TOKENS_QUERY, POPULAR_TOKENS_QUERY, TOKEN_DETAIL, TRENDING_TOKENS_QUERY, VERIFIED_LSTS_QUERY, xSTOCK_TOKENS_QUERY } from '../../queries/allQueryFile';
import { redisClient } from "../../redis/redisClient";
// import { fetchBluechipMemesNow } from '../../workers/blueChipWorker';
import knex from "../../db/knex";
const tokenRelatedRouter = express.Router();


// async function decodeMetadata(uri: string | undefined) {
//     if (!uri) return null;
//     try {
//         let url = uri;
//         if (uri.startsWith("ipfs://")) {
//             url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
//         } else if (uri.startsWith("ar://")) {
//             url = uri.replace("ar://", "https://arweave.net/");
//         }
//         const res = await fetch(url);
//         if (!res.ok) return null;
//         const data = await res.json();
//         return data.image ?? null;
//     } catch {
//         return null;
//     }
// }
tokenRelatedRouter.get("/almost-bonded-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: ALMOST_BONDED_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );


    const pools = response.data?.data?.Solana?.DEXPools ?? [];

    // console.log("pools: ", pools);
    const mapped = await Promise.all(
      pools.map(async (p: any) => {
        const pool = p.Pool ?? {};
        const market = pool.Market ?? {};
        const baseCurrency = market.BaseCurrency ?? {};


        const rawBalance = pool.Base?.Balance ?? pool.Base?.PostAmount ?? null;
        const bondingProgress = p.Bonding_Curve_Progress_Percentage;
        const protocolFamily = pool.Dex.ProtocolFamily;
        const mint = baseCurrency.MintAddress ?? null;


        // Decode token metadata (Uri -> JSON -> image)
        let imageUrl: string | null = null;
        let createdOn: string | null = null;
        let twitterX: string | null = null;
        let telegramX: string | null = null;
        let website: string | null = null;
        // let createdOn, telegramX, twitterX, website;
        if (baseCurrency.Uri) {
          const meta = await decodeMetadata(baseCurrency.Uri);
          if (meta) {
            imageUrl = meta.image || null;
            createdOn = meta.createdOn || null;
            telegramX = meta.telegram || null;
            twitterX = meta.twitter || null;
            website = meta.website || null;
          }
        }


        // Analytics for token
        const analytics = await getTokenAnalytics(mint);


        return {
          mint,
          name: baseCurrency.Name ?? null,
          symbol: baseCurrency.Symbol ?? null,
          uri: baseCurrency.Uri ?? null,
          image: imageUrl,
          createdOn: createdOn, // placeholder if available in metadata
          twitterX: twitterX,
          telegramX: telegramX,
          website: website, // placeholder if available in metadata
          blockTime: p.Block?.Time ?? null,
          slot: p.Block?.Slot ?? null,
          // feePayer: p.Transaction?.Signer ?? null,
          bondingProgress,
          analytics,
          protocolFamily: protocolFamily
        };
      })
    );


    // ✅ Apply filter (only 65%–97%)
    const filtered = mapped.filter(
      (t) => t.bondingProgress >= 65 && t.bondingProgress <= 97
    );

    // ✅ Sort remaining by bondingProgress descending
    filtered.sort((a, b) => (b.bondingProgress ?? 0) - (a.bondingProgress ?? 0));
    console.log("filtered token data 1: ", filtered[0]);
    res.json(filtered);
  } catch (err: any) {
    console.error("❌ Error fetching almost bonded tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch almost bonded tokens" });
  }
});

tokenRelatedRouter.get("/migrated-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: GET_MIGRATED_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const instructions = response.data?.data?.Solana?.Instructions ?? [];
    const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

    // Collect results
    const migratedTokens: any[] = [];

    for (const instr of instructions) {
      const method = instr?.Instruction?.Program?.Method ?? "";
      const accounts = instr?.Instruction?.Accounts ?? [];

      // filter candidates: Mint present and Owner+ProgramId = TOKEN_PROGRAM_ID
      const candidates = accounts.filter(
        (acc: any) =>
          acc?.Token?.Mint &&
          acc?.Token?.Owner === TOKEN_PROGRAM_ID &&
          acc?.Token?.ProgramId === TOKEN_PROGRAM_ID
      );

      if (candidates.length === 0) continue;

      let chosenMint = "";
      if (method === "migrate_meteora_damm") {
        // Special rule: take the *second* candidate if available
        chosenMint = candidates[1]?.Token?.Mint || candidates[0]?.Token?.Mint;
      } else {
        chosenMint = candidates[0]?.Token?.Mint;
      }

      if (!chosenMint) continue;

      const metaResponse = await axios.post(
        process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
        {
          query: metadataQuery,
          variables: { mintAddress: chosenMint },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
          },
        }
      );

      const poolMeta = metaResponse.data?.data?.Solana?.DEXPools?.[0] ?? null;
      const baseCurrency = poolMeta?.Pool?.Market?.BaseCurrency ?? {};

      // 🔹 Decode metadata (image + social links)
      let imageUrl: string | null = null;
      let createdOn: string | null = null;
      let twitterX: string | null = null;
      let telegramX: string | null = null;
      let website: string | null = null;

      if (baseCurrency?.Uri) {
        const meta = await decodeMetadata(baseCurrency.Uri);
        if (meta) {
          imageUrl = meta.image || null;
          createdOn = meta.createdOn || null;
          telegramX = meta.telegram || null;
          twitterX = meta.twitter || null;
          website = meta.website || null;
        }
      }

      // 🔹 Analytics
      const analytics = await getTokenAnalytics(chosenMint);

      // 🔹 Build result object (same structure as almost-bonded)
      migratedTokens.push({
        mint: chosenMint,
        name: baseCurrency?.Name ?? null,
        symbol: baseCurrency?.Symbol ?? null,
        uri: baseCurrency?.Uri ?? null,
        image: imageUrl,
        createdOn,
        twitterX,
        telegramX,
        website,
        blockTime: poolMeta?.Block?.Time ?? null,
        analytics,
        protocolFamily: poolMeta?.Pool?.Dex?.ProtocolFamily ?? null,
        method,
      });
    }

    res.json({
      count: migratedTokens.length,
      tokens: migratedTokens,
    });
  } catch (err: any) {
    console.error("❌ Error fetching migrated tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch migrated tokens" });
  }
});

tokenRelatedRouter.get("/newly-created-tokens", async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: NEWLY_CREATED_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const instructions = response.data?.data?.Solana?.Instructions ?? [];

    const tokens = await Promise.all(
      instructions.map(async (instr: any) => {
        const block = instr.Block ?? {};
        const tx = instr.Transaction ?? {};
        const accounts = instr?.Instruction?.Accounts ?? [];

        // Find the mint address from accounts
        const mintAccount = accounts.find((acc: any) => acc?.Token?.Mint);
        const mint = mintAccount?.Token?.Mint ?? null;
        if (!mint) return null;

        // Extract metadata JSON string
        const arg = instr.Instruction?.Program?.Arguments?.find(
          (a: any) => a.Name === "createMetadataAccountArgsV3"
        );
        let metaJson: any = null;
        try {
          metaJson = arg?.Value?.json ? JSON.parse(arg.Value.json) : null;
        } catch {
          metaJson = null;
        }

        const data = metaJson?.data ?? {};
        const uri = data?.uri ?? null;

        // Decode metadata (fetch from IPFS/Arweave JSON → image + socials)
        let imageUrl: string | null = null;
        let createdOn: string | null = null;
        let twitterX: string | null = null;
        let telegramX: string | null = null;
        let website: string | null = null;

        if (uri) {
          const meta = await decodeMetadata(uri);
          if (meta) {
            imageUrl = meta.image || null;
            createdOn = meta.createdOn || null;
            telegramX = meta.telegram || null;
            twitterX = meta.twitter || null;
            website = meta.website || null;
          }
        }

        // Analytics
        const analytics = await getTokenAnalytics(mint);

        return {
          mint,
          name: data?.name ?? null,
          symbol: data?.symbol ?? null,
          uri,
          image: imageUrl,
          createdOn,
          twitterX,
          telegramX,
          website,
          blockTime: block.Time ?? null,
          slot: block.Slot ?? null,
          feePayer: tx.FeePayer ?? null,
          fee: tx.Fee ?? null,
          feeInUSD: tx.FeeInUSD ?? null,
          analytics,
        };
      })
    );

    // filter out nulls
    const filtered = tokens.filter(Boolean);

    res.json({
      count: filtered.length,
      tokens: filtered,
    });
  } catch (err: any) {
    console.error("❌ Error fetching newly created tokens:", err.message);
    res.status(500).json({ error: "Failed to fetch newly created tokens" });
  }
});


// -------------------------------------
// Helper: Fetch market cap, volume, price change, liquidity
// -------------------------------------
async function fetchTokenDetail(mint: string) {
  try {
    const marketRes = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      { query: TOKEN_DETAIL, variables: { mintAddress: mint } },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const solanaData = marketRes.data?.data?.Solana;
    if (!solanaData) return {};

    let marketcap: number | null = null;
    let priceChange24h: number | null = null;
    let volume: number | null = null;
    let liquidity: number | null = null;

    const supplyUpdate = solanaData?.TokenSupplyUpdates?.[0]?.TokenSupplyUpdate;
    const latestPrice = solanaData?.DEXTradeByTokens?.[0]?.Trade?.PriceInUSD;

    if (supplyUpdate) {
      if (supplyUpdate.PostBalanceInUSD && supplyUpdate.PostBalanceInUSD > 0) {
        marketcap = supplyUpdate.PostBalanceInUSD;
      } else if (latestPrice) {
        marketcap = (supplyUpdate.PostBalance || 0) * latestPrice;
      }
    }

    const priceChangeEntry = solanaData?.PriceChange24h?.[0];
    if (priceChangeEntry && priceChangeEntry.PriceChange24h !== undefined) {
      priceChange24h = Number(priceChangeEntry.PriceChange24h);
    }

    volume = solanaData?.Volume24h?.[0]?.volume ?? null;
    liquidity = solanaData?.Liquidity?.[0]?.liquidity ?? null;

    return { marketcap, priceChange24h, volume, liquidity };
  } catch (err: any) {
    console.error(`❌ Error fetching TOKEN_DETAIL for ${mint}:`, err.message);
    return {};
  }
}

// Shared function to serve tokens
async function serveTokens(
  req: Request,
  res: Response,
  category: string,
  redisKey: string,
  cacheTTL: number = 120
) {
  try {
    // 1) Try Redis
    try {
      const cached = await redisClient.get(redisKey);
      if (cached) {
        const tokens = JSON.parse(cached);
        console.log(`✅ Serving ${category} from Redis`);
        return res.json({ source: "cache", count: tokens.length, tokens });
      }
    } catch (err: any) {
      console.warn(`⚠️ Redis get failed for ${category}:`, err.message);
    }

    // 2) Fallback: Postgres
    const rows = await knex("discovery_tokens")
      .select(
        "mint",
        "name",
        "symbol",
        "uri",
        "image",
        "marketcap",
        "price_change_24h",
        "volume_24h",
        "liquidity",
        "updated_at"
      )
      .where({ category })
      .orderBy("marketcap", "desc")
      .limit(200);

    if (rows.length > 0) {
      // Update Redis for next time
      try {
        await redisClient.set(redisKey, JSON.stringify(rows), { EX: cacheTTL });
      } catch (err: any) {
        console.warn(`⚠️ Redis set failed for ${category}:`, err.message);
      }
      console.log(`✅ Serving ${category} from Postgres`);
      return res.json({ source: "db", count: rows.length, tokens: rows });
    }

    // 3) Nothing in cache or DB → fallback
    console.log(`⚠️ No data found for ${category}, returning fallback`);
    return res.json({ source: "fallback", count: 0, tokens: [] });
  } catch (err: any) {
    console.error(`❌ Error fetching ${category}:`, err.message);
    res.status(500).json({ error: `Failed to fetch ${category}` });
  }
}

// ================== Routes ==================
tokenRelatedRouter.get("/bluechip-memes", (req: Request, res: Response): Promise<any> =>
  serveTokens(req, res, "bluechip_meme", "bluechip-memes", Number(process.env.BLUECHIP_CACHE_TTL ?? 120))
);

tokenRelatedRouter.get("/xstock-tokens",  (req: Request, res: Response): Promise<any> =>
  serveTokens(req, res, "xstock", "xstock-tokens", Number(process.env.XSTOCK_CACHE_TTL ?? 120))
);

tokenRelatedRouter.get("/lsts-tokens",  (req: Request, res: Response): Promise<any> =>
  serveTokens(req, res, "lsts", "lsts-tokens", Number(process.env.LSTS_CACHE_TTL ?? 120))
);

tokenRelatedRouter.get("/ai-tokens",  (req: Request, res: Response): Promise<any> =>
  serveTokens(req, res, "ai", "ai-tokens", Number(process.env.AI_CACHE_TTL ?? 120))
);

tokenRelatedRouter.get("/trending-tokens",  (req: Request, res: Response): Promise<any> =>
  serveTokens(req, res, "trending", "trending-tokens", Number(process.env.TRENDING_CACHE_TTL ?? 120))
);

tokenRelatedRouter.get("/popular-tokens",  (req: Request, res: Response): Promise<any> =>
  serveTokens(req, res, "popular", "popular-tokens", Number(process.env.POPULAR_CACHE_TTL ?? 120))
);

// ---------------------------------------------------------------------------------------------------------

// tokenRelatedRouter.get("/xstock-tokens", async (req: Request, res: Response) => {
//   try {
//     const response = await axios.post(
//       process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//       { query: xSTOCK_TOKENS_QUERY },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//         },
//       }
//     );

//     const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];

//     if (!trades.length) {
//       return res.json({ count: 0, tokens: [] });
//     }

//     // Deduplicate by MintAddress (Bitquery may repeat entries for same token on multiple markets)
//     const seen = new Map<string, any>();

//     for (const entry of trades) {
//       const currency = entry.Trade?.Currency ?? {};
//       const mint = currency.MintAddress;
//       if (!mint) continue;

//       // If already seen, skip (or aggregate further if needed)
//       if (seen.has(mint)) continue;

//       // Decode metadata for image & socials
//       let imageUrl: string | null = null;
//       // let createdOn: string | null = null;
//       // let twitterX: string | null = null;
//       // let telegramX: string | null = null;
//       // let website: string | null = null;

//       if (currency.Uri) {
//         const meta = await decodeMetadata(currency.Uri);
//         if (meta) {
//           imageUrl = meta.image || null;
//           // createdOn = meta.createdOn || null;
//           // telegramX = meta.telegram || null;
//           // twitterX = meta.twitter || null;
//           // website = meta.website || null;
//         }
//       }

//       seen.set(mint, {
//         mint,
//         name: currency.Name ?? null,
//         symbol: currency.Symbol ?? null,
//         uri: currency.Uri ?? null,
//         image: imageUrl,
//         // createdOn,
//         // twitterX,
//         // telegramX,
//         // website,
//         latestPrice: entry.Trade?.latest_price ?? null,
//         totalVolume: entry.total_volume ?? "0",
//         totalTrades: entry.total_trades ?? "0",
//         uniqueTraders: entry.unique_traders ?? "0",
//         uniqueDexs: entry.unique_dexs ?? "0",
//         // TODO: MarketCap & Liquidity → you’ll need extra query (DEXPools) or analytics helper
//         marketCap: null,
//         liquidity: null,
//       });
//     }

//     const tokens = Array.from(seen.values());

//     res.json({
//       count: tokens.length,
//       tokens,
//     });
//   } catch (err: any) {
//     console.error("❌ Error fetching xStock tokens:", err.message);
//     res.status(500).json({ error: "Failed to fetch xStock tokens" });
//   }
// });


// // ✅ New route for fetching LSTs tokens
// tokenRelatedRouter.get("/lsts-tokens", async (req: Request, res: Response) => {
//   try {
//     const response = await axios.post(
//       process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//       { query: VERIFIED_LSTS_QUERY },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//         },
//       }
//     );

//     const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];

//     if (!trades.length) {
//       return res.json({ count: 0, tokens: [] });
//     }

//     // Deduplicate by MintAddress
//     const seen = new Map<string, any>();

//     for (const entry of trades) {
//       const currency = entry.Trade?.Currency ?? {};
//       const mint = currency.MintAddress;
//       if (!mint) continue;

//       // If already seen, skip (to avoid duplicates across markets)
//       if (seen.has(mint)) continue;

//       // Decode metadata for image
//       let imageUrl: string | null = null;
//       if (currency.Uri) {
//         const meta = await decodeMetadata(currency.Uri);
//         if (meta) {
//           imageUrl = meta.image || null;
//         }
//       }

//       seen.set(mint, {
//         mint,
//         name: currency.Name ?? null,
//         symbol: currency.Symbol ?? null,
//         uri: currency.Uri ?? null,
//         image: imageUrl,
//         latestPriceUSD: entry.Trade?.latest_price_usd ?? null,
//         latestPriceSOL: entry.Trade?.latest_price_sol ?? null,
//         volume7dUSD: entry.volume_7d_usd ?? "0",
//         trades7d: entry.trades_7d ?? "0",
//         uniqueTraders7d: entry.unique_traders_7d ?? "0",
//         protocolName: entry.Trade?.Dex?.ProtocolName ?? null,
//       });
//     }

//     const tokens = Array.from(seen.values());

//     res.json({
//       count: tokens.length,
//       tokens,
//     });
//   } catch (err: any) {
//     console.error("❌ Error fetching LSTs tokens:", err.message);
//     res.status(500).json({ error: "Failed to fetch LSTs tokens" });
//   }
// });


// // ✅ New route for fetching BlueChip Meme tokens



// tokenRelatedRouter.get("/bluechip-memes", async (req: Request, res: Response) => {
//   try {
//     // step 1: fetch bluechip tokens
//     const response = await axios.post(
//       process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//       { query: BLUECHIP_MEMES_QUERY },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//         },
//       }
//     );

//     const updates = response.data?.data?.Solana?.TokenSupplyUpdates ?? [];
//     if (!updates.length) return res.json({ count: 0, tokens: [] });

//     const seen = new Map<string, any>();

//     for (const entry of updates) {
//       const update = entry.TokenSupplyUpdate ?? {};
//       const currency = update.Currency ?? {};
//       const mint = currency.MintAddress;
//       if (!mint) continue;

//       // blacklist
//       if (blacklist.includes(currency.Symbol) || blacklist.includes(currency.Name)) continue;
//       if (seen.has(mint)) continue;

//       let imageUrl: string | null = null;
//       if (currency.Uri) {
//         const meta = await decodeMetadata(currency.Uri);
//         if (meta) imageUrl = meta.image || null;
//       }

//       // step 2: fetch market cap + price change for this token
//       const marketRes = await axios.post(
//         process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//         { query: TOKEN_DETAIL, variables: { mintAddress: mint } },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//           },
//         }
//       );

//       const solanaData = marketRes.data?.data?.Solana;
//       let marketcap: number | null = null;
//       let priceChange24h: number | null = null;
//       let volume: number | null = null;
//       let liquidity: number | null = null;

//       const supplyUpdate = solanaData?.TokenSupplyUpdates?.[0]?.TokenSupplyUpdate;
//       const latestPrice = solanaData?.DEXTradeByTokens?.[0]?.Trade?.PriceInUSD;

//       if (supplyUpdate) {
//         if (supplyUpdate.PostBalanceInUSD && supplyUpdate.PostBalanceInUSD > 0) {
//           marketcap = supplyUpdate.PostBalanceInUSD;
//         } else if (latestPrice) {
//           marketcap = (supplyUpdate.PostBalance || 0) * latestPrice;
//         }
//       }

//       const priceChangeEntry = solanaData?.PriceChange24h?.[0];
//       if (priceChangeEntry && priceChangeEntry.PriceChange24h !== undefined) {
//         priceChange24h = Number(priceChangeEntry.PriceChange24h);
//       }

//       seen.set(mint, {
//         mint,
//         name: currency.Name ?? null,
//         symbol: currency.Symbol ?? null,
//         uri: currency.Uri ?? null,
//         volume,
//         liquidity,
//         image: imageUrl,
//         marketcap,
//         priceChange24h,
//       });
//     }

//     const tokens = Array.from(seen.values());
//     res.json({ count: tokens.length, tokens });
//   } catch (err: any) {
//     console.error("❌ Error fetching BlueChip Meme tokens:", err.message);
//     res.status(500).json({ error: "Failed to fetch BlueChip Meme tokens" });
//   }
// });

// // ✅ New route for fetching AI tokens
// tokenRelatedRouter.get("/ai-tokens", async (req: Request, res: Response) => {
//   try {
//     const response = await axios.post(
//       process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//       { query: AI_TOKENS_QUERY }, // <-- define your GraphQL query string here
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//         },
//       }
//     );

//     const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];

//     if (!trades.length) {
//       return res.json({ count: 0, tokens: [] });
//     }

//     // Deduplicate by MintAddress
//     const seen = new Map<string, any>();

//     for (const entry of trades) {
//       const currency = entry.Trade?.Currency ?? {};
//       const mint = currency.MintAddress;
//       if (!mint) continue;

//       // Skip duplicates
//       if (seen.has(mint)) continue;

//       // Decode metadata for image & socials
//       let imageUrl: string | null = null;
//       // let createdOn: string | null = null;
//       // let twitterX: string | null = null;
//       // let telegramX: string | null = null;
//       // let website: string | null = null;

//       if (currency.Uri) {
//         const meta = await decodeMetadata(currency.Uri);
//         if (meta) {
//           imageUrl = meta.image || null;
//           // createdOn = meta.createdOn || null;
//           // twitterX = meta.twitter || null;
//           // telegramX = meta.telegram || null;
//           // website = meta.website || null;
//         }
//       }

//       seen.set(mint, {
//         mint,
//         name: currency.Name ?? null,
//         symbol: currency.Symbol ?? null,
//         uri: currency.Uri ?? null,
//         image: imageUrl,
//         // createdOn,
//         // twitterX,
//         // telegramX,
//         // website,
//         latestPrice: entry.Trade?.latest_price ?? null,
//         // totalVolume: entry.volume_7d ?? "0", // using 7d volume from query
//         // totalTrades: entry.total_trades_7d ?? "0", // using 7d trades from query
//         // uniqueTraders: entry.unique_traders_7d ?? "0", // using 7d unique traders from query
//         // uniqueDexs: entry.unique_dexs ?? "0",
//         marketCap: null, // can extend later with pool/liquidity data
//         liquidity: null,
//       });
//     }

//     const tokens = Array.from(seen.values());

//     res.json({
//       count: tokens.length,
//       tokens,
//     });
//   } catch (err: any) {
//     console.error("❌ Error fetching AI tokens:", err.message);
//     res.status(500).json({ error: "Failed to fetch AI tokens" });
//   }
// });

// // ✅ New route for fetching trending tokens
// tokenRelatedRouter.get("/trending-tokens", async (req: Request, res: Response) => {
//   try {
//     const response = await axios.post(
//       process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//       { query: TRENDING_TOKENS_QUERY },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//         },
//       }
//     );

//     const solana = response.data?.data?.Solana;
//     if (!solana) return res.json({ count: 0, tokens: [] });

//     const frames = [
//       solana.trending_1min || [],
//       solana.trending_5min || [],
//       solana.trending_30min || [],
//       solana.trending_1hour || [],
//     ];

//     const tokenMap = new Map<string, any[]>();

//     // Collect metrics per token per frame
//     frames.forEach((frame, idx) => {
//       frame.forEach((entry: any) => {
//         const currency = entry.Trade?.Currency;
//         if (!currency?.MintAddress) return;

//         if (!tokenMap.has(currency.MintAddress)) {
//           tokenMap.set(currency.MintAddress, []);
//         }

//         tokenMap.get(currency.MintAddress)?.push({
//           frameIndex: idx,
//           uniqueTraders: Number(entry.tradesCountWithUniqueTraders || 0),
//           volume: Number(entry.traded_volume || 0),
//           trades: Number(entry.trades || 0),
//           currency,
//         });
//       });
//     });

//     const trending: any[] = [];
//     const seenMints = new Set<string>();

//     for (const [mint, metrics] of tokenMap) {
//       // Sort by frame index to compare in order
//       metrics.sort((a, b) => a.frameIndex - b.frameIndex);

//       let isTrending = false;
//       for (let i = 1; i < metrics.length; i++) {
//         const prev = metrics[i - 1];
//         const curr = metrics[i];
//         if (
//           curr.uniqueTraders > prev.uniqueTraders ||
//           curr.volume > prev.volume ||
//           curr.trades > prev.trades
//         ) {
//           isTrending = true;
//           break;
//         }
//       }

//       if (isTrending && !seenMints.has(mint)) {
//         seenMints.add(mint);
//         const currency = metrics[0].currency;

//         // Decode metadata if available
//         let imageUrl: string | null = null;
//         if (currency.Uri) {
//           const meta = await decodeMetadata(currency.Uri);
//           if (meta) imageUrl = meta.image || null;
//         }

//         trending.push({
//           mint,
//           name: currency.Name ?? null,
//           symbol: currency.Symbol ?? null,
//           uri: currency.Uri ?? null,
//           image: imageUrl,
//           latestPrice: null,
//           marketCap: null,
//           liquidity: null,
//         });
//       }
//     }

//     res.json({
//       count: trending.length,
//       tokens: trending,
//     });
//   } catch (err: any) {
//     console.error("❌ Error fetching trending tokens:", err.message);
//     res.status(500).json({ error: "Failed to fetch trending tokens" });
//   }
// });

// tokenRelatedRouter.get("/popular-tokens", async (req: Request, res: Response) => {
//   try {
//     const response = await axios.post(
//       process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//       { query: POPULAR_TOKENS_QUERY },
//       {
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//         },
//       }
//     );

//     const solana = response.data?.data?.Solana;
//     if (!solana) return res.json({ count: 0, tokens: [] });

//     const frames = [
//       solana.popular_24h || [],
//       solana.popular_7d || [],
//     ];

//     const tokenMap = new Map<string, any[]>();

//     // Collect metrics per token per frame
//     frames.forEach((frame, idx) => {
//       frame.forEach((entry: any) => {
//         const currency = entry.Trade?.Currency;
//         if (!currency?.MintAddress) return;

//         if (!tokenMap.has(currency.MintAddress)) {
//           tokenMap.set(currency.MintAddress, []);
//         }

//         tokenMap.get(currency.MintAddress)?.push({
//           frameIndex: idx,
//           uniqueTraders: Number(entry.tradesCountWithUniqueTraders || 0),
//           volume: Number(entry.traded_volume || 0),
//           trades: Number(entry.trades || 0),
//           currency,
//         });
//       });
//     });

//     const popular: any[] = [];
//     const seenMints = new Set<string>();

//     for (const [mint, metrics] of tokenMap) {
//       metrics.sort((a, b) => a.frameIndex - b.frameIndex);

//       if (!seenMints.has(mint)) {
//         seenMints.add(mint);
//         const currency = metrics[0].currency;

//         // Decode metadata if available
//         let imageUrl: string | null = null;
//         if (currency.Uri) {
//           const meta = await decodeMetadata(currency.Uri);
//           if (meta) imageUrl = meta.image || null;
//         }

//         popular.push({
//           mint,
//           name: currency.Name ?? null,
//           symbol: currency.Symbol ?? null,
//           uri: currency.Uri ?? null,
//           image: imageUrl,
//           latestPrice: null,
//           marketCap: null,
//           liquidity: null,
//         });
//       }
//     }

//     res.json({
//       count: popular.length,
//       tokens: popular,
//     });
//   } catch (err: any) {
//     console.error("❌ Error fetching popular tokens:", err.message);
//     res.status(500).json({ error: "Failed to fetch popular tokens" });
//   }
// });

// GET /token-holders/:mintAddress
tokenRelatedRouter.get(
  "/token-holders/:mintAddress",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { mintAddress } = req.params;

      if (!mintAddress) {
        return res.status(400).json({ error: "Missing mintAddress param" });
      }

      const response = await axios.post(
        process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
        {
          query: GET_TOP_HOLDERS_QUERY,
          variables: { mintAddress },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
          },
        }
      );

      const updates =
        response.data?.data?.Solana?.BalanceUpdates || [];

      const holders = updates.map((entry: any) => ({
        address: entry.BalanceUpdate?.Account?.Address || null,
        holding: entry.BalanceUpdate?.Holding
          ? Number(entry.BalanceUpdate.Holding)
          : 0,
      }));

      res.json({
        count: holders.length,
        holders,
      });
    } catch (err: any) {
      console.error("❌ Error fetching token holders:", err.message);
      res.status(500).json({ error: "Failed to fetch token holders" });
    }
  }
);

// GET /token-activity/:mintAddress
tokenRelatedRouter.get(
  "/token-activity/:mintAddress",
  async (req: Request, res: Response): Promise<any> => {
    try {
      const { mintAddress } = req.params;

      if (!mintAddress) {
        return res.status(400).json({ error: "Missing mintAddress param" });
      }

      const response = await axios.post(
        process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
        {
          query: GET_LATEST_TRADES_QUERY,
          variables: { mintAddress },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
          },
        }
      );

      const trades = response.data?.data?.Solana?.DEXTrades || [];

      const activities = trades.map((trade: any) => {
        const signer = trade.Transaction?.Signer || null;
        const blockTime = trade.Block?.Time || null;

        const buy = trade.Trade?.Buy;
        const sell = trade.Trade?.Sell;

        let activity: "BUY" | "SELL" | "UNKNOWN" = "UNKNOWN";
        if (buy?.Currency?.MintAddress === mintAddress) activity = "BUY";
        if (sell?.Currency?.MintAddress === mintAddress) activity = "SELL";

        let amountSOL = 0;
        if (activity === "BUY" && sell?.Currency?.Symbol?.toUpperCase().includes("SOL")) {
          amountSOL = -(Number(sell.Amount) || 0);
        }
        if (activity === "SELL" && buy?.Currency?.Symbol?.toUpperCase().includes("SOL")) {
          amountSOL = +(Number(buy.Amount) || 0);
        }

        let priceUSD: number | null = null;
        if (activity === "BUY" && sell?.AmountInUSD && sell.Amount) {
          priceUSD = Number(sell.AmountInUSD) / Number(sell.Amount);
        }
        if (activity === "SELL" && buy?.AmountInUSD && buy.Amount) {
          priceUSD = Number(buy.AmountInUSD) / Number(buy.Amount);
        }

        return {
          trader: signer,
          time: blockTime,
          activity,
          amountSOL,
          priceUSD,
        };
      });

      // calculate priceChange %
      for (let i = 0; i < activities.length; i++) {
        const current = activities[i];
        const prev = activities[i + 1]; // next in list = earlier trade

        if (current.priceUSD && prev?.priceUSD) {
          current.priceChange = ((current.priceUSD - prev.priceUSD) / prev.priceUSD) * 100;
        } else {
          current.priceChange = null;
        }
      }

      res.json({
        count: activities.length,
        activities,
      });
    } catch (err: any) {
      console.error("❌ Error fetching token activity:", err.message);
      res.status(500).json({ error: "Failed to fetch token activity" });
    }
  }
);

tokenRelatedRouter.get("/chart/:mintAddress", async (req: Request, res: Response): Promise<any> => {
  try {
    const { mintAddress } = req.params;

    if (!mintAddress) {
      return res.status(400).json({ error: "Missing mintAddress param" });
    }

    const variables = {
      mintAddress,
      solMint: "So11111111111111111111111111111111111111112",
      intervalInMinutes: 1, // per your query
      limit: 100,
    };

    const response = await axios.post(
      process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
      {
        query: GET_TOKEN_OHLC_QUERY,
        variables,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const data = response.data?.data?.Solana?.DEXTradeByTokens || [];
    if (!data.length) {
      return res.json({ candles: [] });
    }

    const candles = data.map((item: any) => ({
      time: Math.floor(new Date(item.Block.Timefield).getTime() / 1000),
      open: Number(item.Trade.open),
      high: Number(item.Trade.high),
      low: Number(item.Trade.low),
      close: Number(item.Trade.close),
      volume: Number(item.volume),
      count: Number(item.count),
    }));

    res.json({ candles });
  } catch (err: any) {
    console.error("❌ Error fetching chart data:", err.message);
    res.status(500).json({ error: "Failed to fetch chart data" });
  }
});


// ==== File: server/src/routes/tokenRelated.ts ====
// tokenRelatedRouter.get("/bluechip-memes", async (req: Request, res: Response) => {
//   try {
//     // 1) Redis
//     try {
//       const cached = await redisClient.get("bluechip-memes");
//       if (cached) {
//         const tokens = JSON.parse(cached);
//         console.log("serving from redis");
//         return res.json({ source: "cache", count: tokens.length, tokens });
//       }
//     } catch (rErr) {
//       console.warn("⚠️ Redis get failed:", rErr?.message ?? rErr);
//     }

//     // 2) Postgres
//     const rows = await knex("discovery_tokens")
//       .select(
//         "mint",
//         "name",
//         "symbol",
//         "uri",
//         "image",
//         "marketcap",
//         "price_change_24h",
//         "volume_24h",
//         "liquidity",
//         "updated_at"
//       )
//       .where({ category: "bluechip_meme" })
//       .orderBy("marketcap", "desc")
//       .limit(200);

//     if (rows.length > 0) {
//       try {
//         await redisClient.set("bluechip-memes", JSON.stringify(rows), {
//           EX: Number(process.env.BLUECHIP_CACHE_TTL ?? 60),
//         });
//       } catch (rErr) {
//         console.warn("⚠️ Redis set failed:", rErr?.message ?? rErr);
//       }
//       return res.json({ source: "db", count: rows.length, tokens: rows });
//     }

//     // 3) Trigger background fetch
//     fetchBluechipMemesNow().catch((e) =>
//       console.error("🔥 manual refresh error:", e)
//     );
//     return res.json({ source: "fallback", count: 0, tokens: [] });
//   } catch (err: any) {
//     console.error("❌ Error fetching BlueChip Meme tokens:", err.message ?? err);
//     res.status(500).json({ error: "Failed to fetch BlueChip Meme tokens" });
//   }
// });



export default tokenRelatedRouter;