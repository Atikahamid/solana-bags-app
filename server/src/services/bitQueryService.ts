// File: src/services/bitQueryService.ts
// File: src/services/bitQueryService.ts

import WebSocket from "ws";
import knex from "../db/knex";
import fetch from "node-fetch";
import {
  GET_SUB_ALMOST_BONDED,
  NEWLY_CREATED_TOKENS_SUB,
} from "../queries/allQueryFile";
import { fetchLaunchpadDetailBatch, saveLaunchpadTokens } from "../workers/blueChipWorker";
import PQueue from "p-queue";

const BITQUERY_WS_URL = "wss://streaming.bitquery.io/eap";
const AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN!;

/**
 * Decode token metadata (IPFS / Arweave)
 */
async function decodeMetadata(uri: string) {
  try {
    let url = uri;

    if (uri.startsWith("ipfs://")) {
      url = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
    } else if (uri.startsWith("ar://")) {
      url = uri.replace("ar://", "https://arweave.net/");
    }

    const res = await fetch(url);
    if (!res.ok) return null;

    const type = res.headers.get("content-type") || "";
    if (!type.includes("application/json")) return null;

    return await res.json();
  } catch {
    return null;
  }
}

const launchpadQueue = new PQueue({
  concurrency: 1, // 🚨 prevents Postgres deadlocks
});


export class BitqueryService {
  private ws: WebSocket | null = null;

  async start() {
    this.connect();
  }

  private connect() {
    if (this.ws) return;

    const ws = new WebSocket(
      `${BITQUERY_WS_URL}?token=${AUTH_TOKEN}`,
      ["graphql-ws"]
    );

    this.ws = ws;

    ws.on("open", () => {
      console.log("✅ Connected to Bitquery");
      ws.send(JSON.stringify({ type: "connection_init" }));
    });

    ws.on("message", async (raw) => {
      const msg = JSON.parse(raw.toString());

      switch (msg.type) {
        case "connection_ack":
          ws.send(JSON.stringify({
            id: "new_token_created",
            type: "start",
            payload: { query: NEWLY_CREATED_TOKENS_SUB },
          }));

          ws.send(JSON.stringify({
            id: "almost_bonded_tokens",
            type: "start",
            payload: { query: GET_SUB_ALMOST_BONDED },
          }));
          break;

        case "data":
          if (msg.id === "new_token_created") {
            await this.handleNewTokens(msg.payload.data);
          }

          if (msg.id === "almost_bonded_tokens") {
            await this.handleAlmostBondedTokens(msg.payload.data);
          }
          break;


        case "error":
          console.error("❌ Bitquery error:", msg.payload);
          break;
      }
    });

    ws.on("close", () => {
      console.warn("⚠️ Bitquery WS closed, reconnecting...");
      this.ws = null;
      setTimeout(() => this.connect(), 5000);
    });
  }

  /**
   * Handle newly created tokens
   * ✅ Stores into DB
   * ❌ No frontend websocket emit
   */
  private async handleNewTokens(payload: any) {
    const instructions = payload?.Solana?.Instructions ?? [];
    const tokens: any[] = [];

    for (const inst of instructions) {
      const accounts = inst?.Instruction?.Accounts ?? [];
      const accountNames = inst?.Instruction?.Program?.AccountNames ?? [];

      const accountMap: Record<string, any> = {};
      accountNames.forEach((name: string, idx: number) => {
        accountMap[name] = accounts[idx];
      });

      const mint = accountMap["mint"]?.Token?.Mint;
      if (!mint) continue;

      // ---------- Metadata args ----------
      let name: string | null = null;
      let symbol: string | null = null;
      let uri: string | null = null;

      const args = inst?.Instruction?.Program?.Arguments ?? [];
      const createArgs = args.find(
        (a: any) => a.Name === "createMetadataAccountArgsV3"
      );

      if (createArgs?.Value?.json) {
        try {
          const parsed = JSON.parse(createArgs.Value.json);
          name = parsed?.data?.name ?? null;
          symbol = parsed?.data?.symbol ?? null;
          uri = parsed?.data?.uri ?? null;
        } catch (err) {
          console.warn("⚠️ Failed to parse metadata args:", err);
        }
      }

      tokens.push({
        mint,
        name,
        symbol,
        uri,
      });
    }

    if (!tokens.length) return;

    console.log(`🆕 Bitquery WS → ${tokens.length} new tokens`);

    // --------------------------------------------------
    // 🔥 FULL ENRICHMENT PIPELINE (same as worker)
    // --------------------------------------------------
    try {
      await fetchLaunchpadDetailBatch(tokens);

      await launchpadQueue.add(() =>
        saveLaunchpadTokens(
          tokens,
          "newly_created",
          "launchpad-new"
        )
      );

      console.log(`✅ Stored ${tokens.length} new launchpad tokens`);
    } catch (err) {
      console.error("❌ handleNewTokens failed:", err);
    }
  }

  private async handleAlmostBondedTokens(payload: any) {
    const pools = payload?.Solana?.DEXPools ?? [];
    if (!pools.length) return;

    const tokens = pools.map((p: any) => ({
      mint: p.Pool.Market.BaseCurrency.MintAddress,
      name: p.Pool.Market.BaseCurrency.Name,
      symbol: p.Pool.Market.BaseCurrency.Symbol,
      uri: p.Pool.Market.BaseCurrency.Uri,
      marketAddress: p.Pool.Market.MarketAddress,
      bondingProgress: p.Bonding_Curve_Progress_Percentage,
      program: p.Pool.Dex.ProgramAddress,
    }));

    console.log(`🔥 Bitquery WS → ${tokens.length} almost bonded tokens`);

    try {
      await fetchLaunchpadDetailBatch(tokens);

      // 🔒 QUEUED (THIS IS THE FIX)
      await launchpadQueue.add(() =>
        saveLaunchpadTokens(
          tokens,
          "almost_bonded",
          "launchpad-almost-bonded"
        )
      );

      console.log(`✅ Stored ${tokens.length} almost bonded tokens`);
    } catch (err) {
      console.error("❌ handleAlmostBondedTokens failed:", err);
    }
  }


}




//   // restart subscription when new mint list comes in
//   private restartMarketcapSubscription() {
//     if (!this.ws) return;
//     console.log("🔄 Restarting marketcap subscription with mints:", this.subscribedMints);

//     this.ws.send(
//       JSON.stringify({
//         id: "live-marketcap-sub",
//         type: "stop",
//       })
//     );

//     setTimeout(() => {
//       this.subscribeMarketcap(this.subscribedMints);
//     }, 500);
//   }

//   private subscribeMarketcap(mintAddresses: string[]) {
//     if (!this.ws) return;
//     console.log("📡 Subscribing LIVE_MARKETCAP for:", mintAddresses);

//     this.ws.send(
//       JSON.stringify({
//         id: "live-marketcap-sub",
//         type: "start",
//         payload: { query: LIVE_MARKETCAP, variables: { mintAddresses } },
//       })
//     );
//   }

//   // --- Trades handler ---
//   private handleTrades(payload: any, walletMap: Record<string, any>) {
//     const trades = payload?.Solana?.DEXTradeByTokens ?? [];
//     trades.forEach((trade: any) => {
//       const walletAddr = trade.Trade.Account.Address;
//       const userMeta = walletMap[walletAddr] || { username: "unknown", profileUrl: "" };
//       const formatted = {
//         walletAddress: walletAddr,
//         username: userMeta.username,
//         userProfilePic: userMeta.profileUrl,
//         action: trade.Trade.Side.Type?.toLowerCase(),
//         token: {
//           name: trade.Trade.Side.Currency.Name,
//           symbol: trade.Trade.Side.Currency.Symbol,
//           mintAddress: trade.Trade.Side.Currency.MintAddress,
//         },
//         time: trade.Block.Time,
//       };
//       this.webSocketService.io.emit("token_transfer", formatted);
//       console.log("🚀 New trade:", formatted);
//     });
//   }

//   private async handleNewTokens(payload: any) {
//     const instructions = payload?.Solana?.Instructions ?? [];
//     for (const inst of instructions) {
//       const accounts = inst?.Instruction?.Accounts ?? [];
//       const accountNames = inst?.Instruction?.Program?.AccountNames ?? [];

//       const accountMap: Record<string, any> = {};
//       accountNames.forEach((name: string, idx: number) => {
//         accountMap[name] = accounts[idx];
//       });

//       const mint = accountMap["mint"]?.Token?.Mint || null;
//       const owner = accountMap["mint"]?.Token?.Owner || null;
//       if (!mint) continue;

//       const feePayer = inst?.Transaction?.FeePayer || null;

//       let name: string | null = null;
//       let symbol: string | null = null;
//       let uri: string | null = null;

//       const args = inst?.Instruction?.Program?.Arguments ?? [];
//       const createArgs = args.find((a: any) => a.Name === "createMetadataAccountArgsV3");
//       if (createArgs?.Value?.json) {
//         try {
//           const parsed = JSON.parse(createArgs.Value.json);
//           name = parsed.data?.name ?? null;
//           symbol = parsed.data?.symbol ?? null;
//           uri = parsed.data?.uri ?? null;
//         } catch (err) {
//           console.error("Failed to parse metadata args JSON:", err);
//         }
//       }

//       let image: string | null = null;
//       let createdOn: string | null = null;
//       let twitterX: string | null = null;

//       if (uri) {
//         const meta = await decodeMetadata(uri);
//         if (meta) {
//           image = meta.image || null;
//           name = meta.name || name;
//           symbol = meta.symbol || symbol;
//           createdOn = meta.createdOn || null;
//           twitterX = meta.twitter || null;
//         }
//       }

//       const event = {
//         mint,
//         owner,
//         name,
//         symbol,
//         uri,
//         image,
//         createdOn,
//         twitterX,
//         blockTime: inst?.Block?.Time,
//         slot: inst?.Block?.Slot,
//         feePayer,
//       };
//       console.log("🚀 New token created:", event);
//       this.webSocketService.io.emit("new_token_created", event);
//     }
//   }

//   private async handleAlmostBonded(payload: any) {
//     const pools = payload?.Solana?.DEXPools ?? [];
//     if (!Array.isArray(pools)) return;

//     const mapped = await Promise.all(
//       pools.map(async (p: any) => {
//         const pool = p.Pool ?? {};
//         const market = pool.Market ?? {};
//         const baseCurrency = market.BaseCurrency ?? {};

//         const bondingProgress = p.Bonding_Curve_Progress_Percentage;
//         const protocolFamily = pool.Dex?.ProtocolFamily ?? null;
//         const mint = baseCurrency.MintAddress ?? null;

//         let imageUrl: string | null = null;
//         let createdOn: string | null = null;
//         let twitterX: string | null = null;
//         let telegramX: string | null = null;
//         let website: string | null = null;

//         if (baseCurrency.Uri) {
//           const meta = await decodeMetadata(baseCurrency.Uri);
//           if (meta) {
//             imageUrl = meta.image || baseCurrency.Uri;
//             createdOn = meta.createdOn || null;
//             telegramX = meta.telegram || null;
//             twitterX = meta.twitter || null;
//             website = meta.website || null;
//           }
//         }

//         const analytics = await this.getTokenAnalytics(mint);

//         return {
//           mint,
//           name: baseCurrency.Name ?? null,
//           symbol: baseCurrency.Symbol ?? null,
//           uri: baseCurrency.Uri ?? null,
//           image: imageUrl,
//           createdOn,
//           twitterX,
//           telegramX,
//           website,
//           blockTime: p.Block?.Time ?? null,
//           slot: p.Block?.Slot ?? null,
//           bondingProgress,
//           analytics,
//           protocolFamily,
//         };
//       })
//     );

//     const filtered = mapped.filter((t) => t.bondingProgress >= 65 && t.bondingProgress <= 97);
//     filtered.sort((a, b) => (b.bondingProgress ?? 0) - (a.bondingProgress ?? 0));
//     console.log("🚀 Almost bonded tokens:", filtered);
//     this.webSocketService.io.emit("almost_bonded_token", filtered);
//   }

//   private async handleMigratedTokens(payload: any) {
//     const instructions = payload?.Solana?.Instructions ?? [];
//     const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
//     const migratedTokens: any[] = [];

//     for (const instr of instructions) {
//       const method = instr?.Instruction?.Program?.Method ?? "";
//       const accounts = instr?.Instruction?.Accounts ?? [];

//       const candidates = accounts.filter(
//         (acc: any) =>
//           acc?.Token?.Mint &&
//           acc?.Token?.Owner === TOKEN_PROGRAM_ID &&
//           acc?.Token?.ProgramId === TOKEN_PROGRAM_ID
//       );
//       if (candidates.length === 0) continue;

//       let chosenMint = "";
//       if (method === "migrate_meteora_damm") {
//         chosenMint = candidates[1]?.Token?.Mint || candidates[0]?.Token?.Mint;
//       } else {
//         chosenMint = candidates[0]?.Token?.Mint;
//       }
//       if (!chosenMint) continue;

//       const metaResponse = await axios.post(
//         process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap",
//         { query: metadataQuery, variables: { mintAddress: chosenMint } },
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${process.env.BITQUERY_AUTH_TOKEN}`,
//           },
//         }
//       );

//       const poolMeta = metaResponse.data?.data?.Solana?.DEXPools?.[0] ?? null;
//       const baseCurrency = poolMeta?.Pool?.Market?.BaseCurrency ?? {};

//       let imageUrl: string | null = null;
//       let createdOn: string | null = null;
//       let twitterX: string | null = null;
//       let telegramX: string | null = null;
//       let website: string | null = null;

//       if (baseCurrency?.Uri) {
//         const meta = await decodeMetadata(baseCurrency.Uri);
//         if (meta) {
//           imageUrl = meta.image || null;
//           createdOn = meta.createdOn || null;
//           telegramX = meta.telegram || null;
//           twitterX = meta.twitter || null;
//           website = meta.website || null;
//         }
//       }

//       const analytics = await this.getTokenAnalytics(chosenMint);

//       migratedTokens.push({
//         mint: chosenMint,
//         name: baseCurrency?.Name ?? null,
//         symbol: baseCurrency?.Symbol ?? null,
//         uri: baseCurrency?.Uri ?? null,
//         image: imageUrl,
//         createdOn,
//         twitterX,
//         telegramX,
//         website,
//         blockTime: poolMeta?.Block?.Time ?? null,
//         analytics,
//         protocolFamily: poolMeta?.Pool?.Dex?.ProtocolFamily ?? null,
//         method,
//       });
//     }
//     console.log("🚀 Migrated tokens:", migratedTokens);
//     this.webSocketService.io.emit("migrated_token", {
//       count: migratedTokens.length,
//       tokens: migratedTokens,
//     });
//   }

//   // --- Live Marketcap Handler ---
//   private async handleLiveMarketCap(payload: any) {
//     const updates = payload?.Solana?.TokenSupplyUpdates ?? [];
//     if (!updates.length) return;

//     for (const update of updates) {
//       const supplyUpdate = update?.TokenSupplyUpdate;
//       const mint = supplyUpdate?.Currency?.MintAddress;
//       if (!mint) continue;

//       let marketcap: number | null = null;

//       try {
//         if ((supplyUpdate?.PostBalanceInUSD ?? 0) > 0) {
//           marketcap = Number(supplyUpdate.PostBalanceInUSD);
//         } else if (supplyUpdate?.PostBalance) {
//           const res = await fetch("https://streaming.bitquery.io/eap", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               "Authorization": `Bearer ${AUTH_TOKEN}`,
//             },
//             body: JSON.stringify({
//               query: CURRENT_PRICE_OF_TOKEN,
//               variables: { mintAddress: mint },
//             }),
//           });

//           const json = await res.json();
//           const latestPrice =
//             json?.data?.Solana?.DEXTradeByTokens?.[0]?.Trade?.PriceInUSD || null;

//           if (latestPrice) {
//             marketcap = Number(supplyUpdate.PostBalance) * Number(latestPrice);
//           }
//         }
//       } catch (err) {
//         console.error("handleLiveMarketCap error:", err);
//       }

//       const event = { mint, marketcap };
//       console.log("🚀 Live Marketcap Update:", event);
//       this.webSocketService.io.emit("live_marketcap_update", event);
//     }
//   }

//   private async getTokenAnalytics(mint: string) {
//     if (this.analyticsCache.has(mint)) {
//       return this.analyticsCache.get(mint);
//     }

//     try {
//       const res = await fetch("https://streaming.bitquery.io/eap", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           "Authorization": `Bearer ${AUTH_TOKEN}`,
//         },
//         body: JSON.stringify({
//           query: GET_TOKEN_ANALYTICS_QUERY,
//           variables: { tokenMint: mint },
//         }),
//       });

//       const json = await res.json();
//       const analytics = json.data?.Solana || {};

//       const allTimeStats = analytics.all_time_trading_stats?.[0] ?? {};
//       const currentStats = analytics.current_trading_stats?.[0] ?? {};
//       const holderStats = analytics.holder_count?.[0] ?? {};

//       const analyticsData = {
//         totalBuys: allTimeStats.total_buys ?? 0,
//         totalSells: allTimeStats.total_sells ?? 0,
//         totalTrades: allTimeStats.total_trades ?? 0,
//         allTimeVolumeUSD: allTimeStats.current_volume_usd ?? 0,
//         currentVolumeUSD: currentStats.current_volume_usd ?? 0,
//         holderCount: holderStats.total_holders ?? 0,
//       };

//       this.analyticsCache.set(mint, analyticsData);
//       setTimeout(() => this.analyticsCache.delete(mint), 5 * 60 * 1000);

//       return analyticsData;
//     } catch (err) {
//       console.error("getTokenAnalytics error:", err);
//       return {
//         totalBuys: 0,
//         totalSells: 0,
//         totalTrades: 0,
//         allTimeVolumeUSD: 0,
//         currentVolumeUSD: 0,
//         holderCount: 0,
//       };
//     }
//   }
// }

export function sanitizeString(value?: string | null): string | null {
  if (!value) return null;
  return value.replace(/\u0000/g, "");
}
