// ==== File: server/src/workers/discoveryWorker.ts ====

// TL;DR above. See plan in the assistant message.

import cron from "node-cron";
import axios from "axios";
import knex from "../db/knex";
import { redisClient } from "../redis/redisClient";
import {
  BLUECHIP_MEMES_QUERY,
  xSTOCK_TOKENS_QUERY,
  VERIFIED_LSTS_QUERY,
  AI_TOKENS_QUERY,
  TRENDING_TOKENS_QUERY,
  POPULAR_TOKENS_QUERY,
  COMBINED_TOKEN_METRICS,
  ALMOST_BONDED_QUERY,
  GET_MIGRATED_TOKENS_QUERY,
  NEWLY_CREATED_TOKENS_QUERY,
} from "../queries/allQueryFile";
import { sanitizeString } from "../services/bitQueryService";
import { computeLiquidityUSD } from "../utils/tokenRelatedUtils";
import {
  decodeMetadataBatch,
  Metadata,
  getCreationTimeAndSupplyBatch,
} from "../utils/tokenRelatedUtils"; // assume both exports exist here

// ====================== Config ======================
const BITQUERY_URL = process.env.BITQUERY_URL || "https://streaming.bitquery.io/eap";
const BITQUERY_AUTH_TOKEN = process.env.BITQUERY_AUTH_TOKEN || "ory_at_GVB4S_JW4KylmKz9phcNf8Lfw-nAvnIldmu9y_rbERA.UwC3hBBwTFKIONUHtTZQum1WiAMsP8VCYZFkRD-sXxU";
const REDIS_TTL = Number(process.env.DISCOVERY_CACHE_TTL ?? 120);
const DETAIL_BATCH_SIZE = Number(process.env.DETAIL_BATCH_SIZE ?? 5);
const DB_BATCH_SIZE = Number(process.env.DB_BATCH_SIZE ?? 100); // amount per batch insert
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ------------------------
   Helpers
------------------------ */
function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function nowISO() {
  return new Date().toISOString();
}

/* ========================
   fetchTokenDetailBatch
   (unchanged, keeps analytics enrichment)
   ======================== */
export async function fetchTokenDetailBatch(tokens: any[]): Promise<any[]> {
  for (let i = 0; i < tokens.length; i += DETAIL_BATCH_SIZE) {
    const batch = tokens.slice(i, i + DETAIL_BATCH_SIZE);
    const mintAddresses = batch.map((t) => t.mint);

    try {
      const res = await axios.post(
        BITQUERY_URL,
        {
          query: COMBINED_TOKEN_METRICS,
          variables: { mintAddresses },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
          },
          timeout: 60_000,
        }
      );

      const solanaData = res.data?.data?.Solana;
      if (!solanaData) {
        await sleep(250);
        continue;
      }

      for (const tok of batch) {
        const mint = tok.mint;

        const supplyUpdate = solanaData.TokenSupplyUpdates?.find(
          (u: any) => u.TokenSupplyUpdate?.Currency?.MintAddress === mint
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

        const priceChangeEntry = solanaData.PriceChange24h?.find(
          (pc: any) => pc.Trade?.Currency?.MintAddress === mint
        );
        const priceChange24h = priceChangeEntry?.PriceChange24hPercent ?? null;

        const volumeEntry = solanaData.VolumeMetrics?.find(
          (v: any) => v.Trade?.Currency?.MintAddress === mint
        );
        const volume1h = volumeEntry?.volume_usd_1h ? Number(volumeEntry.volume_usd_1h) : null;

        const liquidityEntry = solanaData.LiquidityMetrics?.find(
          (l: any) => l.Pool?.Market?.BaseCurrency?.MintAddress === mint
        );
        const liquidityUSD = liquidityEntry ? computeLiquidityUSD(liquidityEntry.Pool) : null;

        tok.marketcap = marketcap;
        tok.price_change_24h = priceChange24h;
        tok.volume_24h = volume1h;
        tok.liquidity = liquidityUSD;
      }
    } catch (err: any) {
      console.warn("⚠️ fetchTokenDetailBatch failed:", err.message);
    }

    // small pause between batches
    await sleep(500);
  }

  return tokens;
}

/* =========================
   saveTokens - new behavior
   - always upsert to discovery_tokens
   - upsert to tokens ONLY when created_on && total_supply exist
   - B3 semantics: on update, only non-null incoming values overwrite existing
   ========================= */
async function saveTokens(tokens: any[], category: string, redisKey: string) {
  if (!tokens || tokens.length === 0) return;

  // Step 1: Basic normalization
  tokens = tokens.map((t) => ({
    mint: t.mint,
    name: t.name ?? null,
    symbol: t.symbol ?? null,
    uri: t.uri ?? null,
    image: t.image ?? null,
    marketcap: t.marketcap ?? null,
    price_change_24h: t.price_change_24h ?? null,
    volume_24h: t.volume_24h ?? null,
    liquidity: t.liquidity ?? null,
    updated_at: new Date(),
  }));

  // Step 2: Decode metadata in batch
  const uris = tokens.map((t) => t.uri);
  let metadatas: (Metadata | null)[] = [];
  try {
    metadatas = await decodeMetadataBatch(uris);
  } catch (err: any) {
    console.warn("⚠️ decodeMetadataBatch error:", err.message);
    metadatas = tokens.map(() => null);
  }

  tokens.forEach((t, i) => {
    const meta = metadatas[i] ?? null;
    if (meta) {
      if (meta.image) t.image = meta.image;
      t.description = meta.description ?? null;

      const socials: Record<string, string> = {};
      if (meta.twitter) socials.twitter = meta.twitter;
      if (meta.telegram) socials.telegram = meta.telegram;
      if (meta.website) socials.website = meta.website;

      t.socials = Object.keys(socials).length ? socials : null;
      t.metadata_created_on = meta.createdOn ?? null;
    } else {
      t.description = null;
      t.socials = null;
      t.metadata_created_on = null;
    }
  });

  // Step 3: Fetch creation time + supply in batch
  const mintAddresses = tokens.map((t) => t.mint);
  let creationSupplyMap: Record<string, { created_on: string | null; total_supply: number | null }> = {};

  try {
    creationSupplyMap = await getCreationTimeAndSupplyBatch(mintAddresses);
  } catch (err: any) {
    console.error("❌ getCreationTimeAndSupplyBatch error:", err.message);
  }

  // Step 4: Build DB rows
  const discoveryRows: any[] = [];
  const tokensRows: any[] = [];

  for (const t of tokens) {
    const cs = creationSupplyMap[t.mint] ?? { created_on: null, total_supply: null };

    // Always push discovery row
    discoveryRows.push({
      mint: t.mint,
      category,
      name: t.name,
      symbol: t.symbol,
      uri: t.uri,
      image: t.image,
      marketcap: t.marketcap,
      price_change_24h: t.price_change_24h,
      volume_24h: t.volume_24h,
      liquidity: t.liquidity,
      updated_at: new Date(),
    });

    // NEW LOGIC: Always push token row
    tokensRows.push({
      mint_address: t.mint,
      name: t.name ?? "Unknown",
      symbol: t.symbol ?? "UNKNOWN",
      image: t.image ?? null,
      uri: t.uri ?? null,
      description: t.description ?? null,
      socials: t.socials ?? {},
      total_supply: cs.total_supply ?? null,          // allow null
      created_on: cs.created_on ?? null,              // allow null
      last_updated: new Date(),
    });
  }

  // Step 5: DB writes in transaction
  const trx = await knex.transaction();
  try {
    // discovery_tokens upserts
    const discoveryChunks = chunkArray(discoveryRows, DB_BATCH_SIZE);
    for (const chunk of discoveryChunks) {
      await trx("discovery_tokens")
        .insert(chunk)
        .onConflict(["mint", "category"])
        .merge({
          name: trx.raw("EXCLUDED.name"),
          symbol: trx.raw("EXCLUDED.symbol"),
          uri: trx.raw("EXCLUDED.uri"),
          image: trx.raw("EXCLUDED.image"),
          marketcap: trx.raw("EXCLUDED.marketcap"),
          price_change_24h: trx.raw("EXCLUDED.price_change_24h"),
          volume_24h: trx.raw("EXCLUDED.volume_24h"),
          liquidity: trx.raw("EXCLUDED.liquidity"),
          updated_at: trx.raw("EXCLUDED.updated_at"),
        });
    }

    // tokens upsert (now includes ALL tokens)
    if (tokensRows.length) {
      const tokenChunks = chunkArray(tokensRows, DB_BATCH_SIZE);

      for (const chunk of tokenChunks) {
        const columns = [
          "mint_address",
          "name",
          "symbol",
          "image",
          "uri",
          "description",
          "socials",
          "total_supply",
          "created_on",
          "last_updated",
        ];

        const valuesSql: string[] = [];
        const bindings: any[] = [];

        for (const row of chunk) {
          valuesSql.push(`(${columns.map(() => "?").join(",")})`);
          bindings.push(
            row.mint_address,
            row.name,
            row.symbol,
            row.image,
            row.uri,
            row.description,
            JSON.stringify(row.socials ?? {}),
            row.total_supply,
            row.created_on,
            row.last_updated
          );
        }

        const insertSql = `
          INSERT INTO tokens (${columns.join(",")})
          VALUES ${valuesSql.join(",")}
          ON CONFLICT (mint_address) DO UPDATE SET
            name = EXCLUDED.name,
            symbol = EXCLUDED.symbol,
            image = COALESCE(EXCLUDED.image, tokens.image),
            uri = COALESCE(EXCLUDED.uri, tokens.uri),
            description = COALESCE(EXCLUDED.description, tokens.description),
            socials = CASE
              WHEN COALESCE(EXCLUDED.socials::text, '') <> '{}' THEN EXCLUDED.socials
              ELSE tokens.socials
            END,
            total_supply = EXCLUDED.total_supply,
            created_on = EXCLUDED.created_on,
            last_updated = NOW()
        `;

        await trx.raw(insertSql, bindings);
      }
    }

    await trx.commit();
  } catch (err: any) {
    await trx.rollback();
    console.error("❌ DB save error:", category, err.message);
  }

  // Step 6: Cache
  try {
    await redisClient.set(redisKey, JSON.stringify(tokens), { EX: REDIS_TTL });
  } catch (err: any) {
    console.error("❌ Redis error:", err.message);
  }
}



// ======================================================
// MAIN UPSERT FOR LAUNCHPAD + TOKENS
// ======================================================
async function saveLaunchpadTokens(tokens: any[], category: string, redisKey: string) {
  if (!tokens || !tokens.length) return;

  tokens = tokens.map(t => ({
    mint: t.mint,
    category,
    name: t.name ?? null,
    symbol: t.symbol ?? null,
    uri: t.uri ?? null,
    image: t.image ?? null,
    marketcap: t.marketcap ?? null,
    volume: t.volume ?? null,
    fees: t.fees ?? null,
    holders: t.holders ?? null,
    txns: t.txns ?? null,
    // bondingProgress: t.bondingProgress ?? null,
    // protocolFamily: t.protocolFamily ?? null,
    analytics: t.analytics ?? null,
    createdOn: t.createdOn ?? null,
    twitterX: t.twitterX ?? null,
    telegramX: t.telegramX ?? null,
    website: t.website ?? null,
    time: new Date(),
    updated_at: new Date()
  }));

  // -------------------------------
  // Metadata decode (batch)
  // -------------------------------
  const uris = tokens.map(t => t.uri);
  let metas: any[] = [];

  try {
    metas = await decodeMetadataBatch(uris);
  } catch {
    metas = tokens.map(() => null);
  }

  tokens.forEach((t, i) => {
    const m = metas[i];
    if (!m) return;

    if (m.image) t.image = m.image;
    t.social_twitter = m.twitter ?? null;
    t.social_telegram = m.telegram ?? null;
    t.social_website = m.website ?? null;
  });

  // -------------------------------
  // Creation time / supply batch
  // -------------------------------
  let supplyData = {};
  try {
    const mints = tokens.map(t => t.mint);
    supplyData = await getCreationTimeAndSupplyBatch(mints);
  } catch {
    supplyData = {};
  }

  // -------------------------------
  // Build DB rows
  // -------------------------------
  const launchpadRows: any[] = [];
  const tokensRows: any[] = [];

  for (const t of tokens) {
    const cs = (supplyData as Record<string, any>)[t.mint] ?? {};

    launchpadRows.push({
      mint: t.mint,
      category,
      name: t.name,
      symbol: t.symbol,
      uri: t.uri,
      image: t.image,
      time: t.time,
      social_twitter: t.social_twitter,
      social_telegram: t.social_telegram,
      social_website: t.social_website,
      marketcap: t.marketcap,
      volume: t.volume,
      fees: t.fees,
      holders: t.holders,
      txns: t.txns,
      // bondingProgress: t.bondingProgress,
      // protocolFamily: t.protocolFamily,
      updated_at: new Date()
    });

    tokensRows.push({
      mint_address: t.mint,
      name: t.name,
      symbol: t.symbol,
      uri: t.uri,
      image: t.image,
      description: null,
      socials: {
        twitter: t.social_twitter,
        telegram: t.social_telegram,
        website: t.social_website
      },
      total_supply: cs.total_supply ?? null,
      created_on: cs.created_on ?? null,
      last_updated: new Date()
    });
  }

  // -------------------------------
  // DB UPSERTS
  // -------------------------------
  const trx = await knex.transaction();
  try {
    // launchpad_tokens upsert
    const chunk1 = chunkArray(launchpadRows, 100);
    for (const ch of chunk1) {
      await trx("launchpad_tokens")
        .insert(ch)
        .onConflict(["mint", "category"])
        .merge();
    }

    // tokens upsert (same as in saveTokens)
    const chunk2 = chunkArray(tokensRows, 100);
    for (const ch of chunk2) {
      const cols = [
        "mint_address",
        "name",
        "symbol",
        "image",
        "uri",
        "description",
        "socials",
        "total_supply",
        "created_on",
        "last_updated"
      ];

      const valuesSql: string[] = [];
      const bindings: any[] = [];

      for (const r of ch) {
        valuesSql.push(`(${cols.map(() => "?").join(",")})`);
        bindings.push(
          r.mint_address,
          r.name,
          r.symbol,
          r.image,
          r.uri,
          r.description,
          JSON.stringify(r.socials),
          r.total_supply,
          r.created_on,
          r.last_updated
        );
      }

      const sql = `
        INSERT INTO tokens (${cols.join(",")})
        VALUES ${valuesSql.join(",")}
        ON CONFLICT (mint_address) DO UPDATE SET
          name = EXCLUDED.name,
          symbol = EXCLUDED.symbol,
          image = COALESCE(EXCLUDED.image, tokens.image),
          uri = COALESCE(EXCLUDED.uri, tokens.uri),
          description = COALESCE(EXCLUDED.description, tokens.description),
          socials = EXCLUDED.socials,
          total_supply = EXCLUDED.total_supply,
          created_on = EXCLUDED.created_on,
          last_updated = NOW()
      `;

      await trx.raw(sql, bindings);
    }

    await trx.commit();
  } catch (err) {
    console.log("error: ", err);
    await trx.rollback();
  }

  // Redis update
  try {
    await redisClient.set(redisKey, JSON.stringify(tokens), { EX: 120 });
  } catch { }
}


// ======================================================
// WORKER FETCHERS (3 new ones)
// ======================================================

// ---------- ALMOST BONDED ----------
// ---------- ALMOST BONDED ----------
async function fetchAlmostBondedNow() {
  console.log("🔄 Fetching Almost Bonded Tokens...");

  try {
    const res = await axios.post(
      BITQUERY_URL,
      { query: ALMOST_BONDED_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 120_000,
      }
    );

    const pools = res.data?.data?.Solana?.DEXPools ?? [];
    const tokens: any[] = [];

    for (const p of pools) {
      const base = p?.Pool?.Market?.BaseCurrency ?? {};
      const mint = base.MintAddress;
      if (!mint) continue;

      tokens.push({
        mint,
        name: base.Name ?? null,
        symbol: base.Symbol ?? null,
        uri: base.Uri ?? null,
        bondingProgress: p.Bonding_Curve_Progress_Percentage ?? null,
        protocolFamily: p?.Pool?.Dex?.ProtocolFamily ?? null,
      });
    }

    // Apply bonding filter (65%–97%)
    const filtered = tokens.filter(
      (t) => t.bondingProgress >= 65 && t.bondingProgress <= 97
    );

    await fetchTokenDetailBatch(filtered);
    await saveLaunchpadTokens(filtered, "almost_bonded", "launchpad-almost-bonded");

    console.log(`✅ Saved ${filtered.length} almost bonded tokens`);

  } catch (err: any) {
    console.error("❌ fetchAlmostBondedNow error:", err.message);
  }
}


// ---------- MIGRATED ----------
async function fetchMigratedNow() {
  console.log("🔄 Fetching Migrated Tokens...");

  try {
    const res = await axios.post(
      BITQUERY_URL,
      { query: GET_MIGRATED_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 120_000,
      }
    );

    const instr = res.data?.data?.Solana?.Instructions ?? [];
    const list: any[] = [];

    for (const i of instr) {
      const accounts = i.Instruction?.Accounts ?? [];
      const mintAcc = accounts.find((a: any) => a?.Token?.Mint);
      const mint = mintAcc?.Token?.Mint;
      if (!mint) continue;

      list.push({
        mint,
        name: null,
        symbol: null,
        uri: null,
      });
    }

    await fetchTokenDetailBatch(list);
    await saveLaunchpadTokens(list, "migrated", "launchpad-migrated");

    console.log(`✅ Saved ${list.length} migrated tokens`);

  } catch (err: any) {
    console.error("❌ fetchMigratedNow error:", err.message);
  }
}


// ---------- NEWLY CREATED ----------
async function fetchNewlyCreatedNow() {
  console.log("🔄 Fetching Newly Created Tokens...");

  try {
    const res = await axios.post(
      BITQUERY_URL,
      { query: NEWLY_CREATED_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 120_000,
      }
    );

    const instr = res.data?.data?.Solana?.Instructions ?? [];
    const list: any[] = [];

    for (const i of instr) {
      const accounts = i.Instruction?.Accounts ?? [];
      const mintAcc = accounts.find((a: any) => a?.Token?.Mint);
      const mint = mintAcc?.Token?.Mint;
      if (!mint) continue;

      const arg = i.Instruction?.Program?.Arguments?.find(
        (a: any) => a.Name === "createMetadataAccountArgsV3"
      );

      let metaData = null;
      try {
        metaData = arg?.Value?.json ? JSON.parse(arg.Value.json) : null;
      } catch {}

      const data = metaData?.data ?? {};

      list.push({
        mint,
        name: data?.name ?? null,
        symbol: data?.symbol ?? null,
        uri: data?.uri ?? null,
      });
    }

    console.log("list of newly created tokens: ", list);
    await fetchTokenDetailBatch(list);
    await saveLaunchpadTokens(list, "newly_created", "launchpad-newly-created");

    console.log(`✅ Saved ${list.length} newly created tokens`);

  } catch (err: any) {
    console.error("❌ fetchNewlyCreatedNow error:", err.message);
  }
}



/* =========================
   Category Fetchers
   (minor changes: remove local decodeMetadata usage; rely on saveTokens)
   ========================= */

// ----------------------
// Bluechip Memes
// ----------------------
async function fetchBluechipMemesNow() {
  console.log("🔄 Fetching Bluechip Memes...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: BLUECHIP_MEMES_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
        timeout: 120_000,
      }
    );

    const updates = response.data?.data?.Solana?.TokenSupplyUpdates ?? [];
    const tokens: any[] = [];

    for (const entry of updates) {
      const update = entry.TokenSupplyUpdate ?? {};
      const currency = update.Currency ?? {};
      const mint = currency.MintAddress;
      if (!mint) continue;

      tokens.push({
        mint,
        name: sanitizeString(currency.Name),
        symbol: sanitizeString(currency.Symbol),
        uri: sanitizeString(currency.Uri),
        image: null,
        marketcap: update.Marketcap ?? null,
        price_change_24h: null,
        volume_24h: null,
        liquidity: null,
        updated_at: new Date(),
      });
    }

    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "bluechip_meme", "bluechip-memes");
    console.log(`✅ Saved ${tokens.length} bluechip memes`);
  } catch (err: any) {
    console.error("❌ fetchBluechipMemesNow error:", err.message);
  }
}

// ----------------------
// xStock
// ----------------------
async function fetchXStockNow() {
  console.log("🔄 Fetching xStock tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: xSTOCK_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];
    const seen = new Map<string, any>();
    for (const entry of trades) {
      const c = entry.Trade?.Currency ?? {};
      const mint = c.MintAddress;
      if (!mint || seen.has(mint)) continue;
      seen.set(mint, {
        mint,
        name: sanitizeString(c.Name),
        symbol: sanitizeString(c.Symbol),
        uri: sanitizeString(c.Uri),
        image: null,
        marketcap: null,
        price_change_24h: null,
        volume_24h: null,
        liquidity: null,
        updated_at: new Date(),
      });
    }

    const tokens = Array.from(seen.values());
    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "xstock", "xstock-tokens");
    console.log(`✅ Saved ${tokens.length} xStock tokens`);
  } catch (err: any) {
    console.error("❌ fetchXStockNow error:", err.message);
  }
}

// ----------------------
// LSTs
// ----------------------
async function fetchLstsNow() {
  console.log("🔄 Fetching Verified LSTs...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: VERIFIED_LSTS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];
    const seen = new Map<string, any>();
    for (const entry of trades) {
      const c = entry.Trade?.Currency ?? {};
      const mint = c.MintAddress;
      if (!mint || seen.has(mint)) continue;
      seen.set(mint, {
        mint,
        name: sanitizeString(c.Name),
        symbol: sanitizeString(c.Symbol),
        uri: sanitizeString(c.Uri),
        image: null,
        marketcap: null,
        price_change_24h: null,
        volume_24h: null,
        liquidity: null,
        updated_at: new Date(),
      });
    }

    const tokens = Array.from(seen.values());
    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "lsts", "lsts-tokens");
    console.log(`✅ Saved ${tokens.length} LST tokens`);
  } catch (err: any) {
    console.error("❌ fetchLstsNow error:", err.message);
  }
}

// ----------------------
// AI Tokens
// ----------------------
async function fetchAiNow() {
  console.log("🔄 Fetching AI tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: AI_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const trades = response.data?.data?.Solana?.DEXTradeByTokens ?? [];
    const seen = new Map<string, any>();
    for (const entry of trades) {
      const c = entry.Trade?.Currency ?? {};
      const mint = c.MintAddress;
      if (!mint || seen.has(mint)) continue;
      seen.set(mint, {
        mint,
        name: sanitizeString(c.Name),
        symbol: sanitizeString(c.Symbol),
        uri: sanitizeString(c.Uri),
        image: null,
        marketcap: null,
        price_change_24h: null,
        volume_24h: null,
        liquidity: null,
        updated_at: new Date(),
      });
    }

    const tokens = Array.from(seen.values());
    await fetchTokenDetailBatch(tokens);
    await saveTokens(tokens, "ai", "ai-tokens");
    console.log(`✅ Saved ${tokens.length} AI tokens`);
  } catch (err: any) {
    console.error("❌ fetchAiNow error:", err.message);
  }
}

// ----------------------
// Trending
// ----------------------
async function fetchTrendingNow() {
  console.log("🔄 Fetching Trending tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: TRENDING_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const solana = response.data?.data?.Solana;
    if (!solana) return;

    const frames = [solana.trending_1min, solana.trending_5min, solana.trending_30min, solana.trending_1hour].filter(Boolean);
    const tokenMap = new Map<string, any[]>();

    frames.forEach((frame: any[], idx: number) => {
      frame.forEach((entry: any) => {
        const c = entry.Trade?.Currency;
        if (!c?.MintAddress) return;
        if (!tokenMap.has(c.MintAddress)) tokenMap.set(c.MintAddress, []);
        tokenMap.get(c.MintAddress)!.push({ frameIndex: idx, uniqueTraders: entry.tradesCountWithUniqueTraders, volume: entry.traded_volume, trades: entry.trades, currency: c });
      });
    });

    const trending: any[] = [];
    const seenMints = new Set<string>();

    for (const [mint, metrics] of tokenMap) {
      metrics.sort((a, b) => a.frameIndex - b.frameIndex);
      let isTrending = false;
      for (let i = 1; i < metrics.length; i++) {
        if (metrics[i].uniqueTraders > metrics[i - 1].uniqueTraders || metrics[i].volume > metrics[i - 1].volume || metrics[i].trades > metrics[i - 1].trades) {
          isTrending = true;
          break;
        }
      }
      if (isTrending && !seenMints.has(mint)) {
        seenMints.add(mint);
        const c = metrics[0].currency;
        trending.push({
          mint,
          name: sanitizeString(c.Name),
          symbol: sanitizeString(c.Symbol),
          uri: sanitizeString(c.Uri),
          image: null,
          marketcap: null,
          price_change_24h: null,
          volume_24h: null,
          liquidity: null,
          updated_at: new Date(),
        });
      }
    }

    await fetchTokenDetailBatch(trending);
    await saveTokens(trending, "trending", "trending-tokens");
    console.log(`✅ Saved ${trending.length} trending tokens`);
  } catch (err: any) {
    console.error("❌ fetchTrendingNow error:", err.message);
  }
}

// ----------------------
// Popular
// ----------------------
async function fetchPopularNow() {
  console.log("🔄 Fetching Popular tokens...");
  try {
    const response = await axios.post(
      BITQUERY_URL,
      { query: POPULAR_TOKENS_QUERY },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${BITQUERY_AUTH_TOKEN}`,
        },
      }
    );

    const solana = response.data?.data?.Solana;
    if (!solana) return;

    const frames = [solana.popular_24h, solana.popular_7d].filter(Boolean);
    const tokenMap = new Map<string, any[]>();

    frames.forEach((frame: any[], idx: number) => {
      frame.forEach((entry: any) => {
        const c = entry.Trade?.Currency;
        if (!c?.MintAddress) return;
        if (!tokenMap.has(c.MintAddress)) tokenMap.set(c.MintAddress, []);
        tokenMap.get(c.MintAddress)!.push({ frameIndex: idx, currency: c });
      });
    });

    const popular: any[] = [];
    const seenMints = new Set<string>();

    for (const [mint, metrics] of tokenMap) {
      metrics.sort((a, b) => a.frameIndex - b.frameIndex);
      if (!seenMints.has(mint)) {
        seenMints.add(mint);
        const c = metrics[0].currency;
        popular.push({
          mint,
          name: sanitizeString(c.Name),
          symbol: sanitizeString(c.Symbol),
          uri: sanitizeString(c.Uri),
          image: null,
          marketcap: null,
          price_change_24h: null,
          volume_24h: null,
          liquidity: null,
          updated_at: new Date(),
        });
      }
    }

    await fetchTokenDetailBatch(popular);
    await saveTokens(popular, "popular", "popular-tokens");
    console.log(`✅ Saved ${popular.length} popular tokens`);
  } catch (err: any) {
    console.error("❌ fetchPopularNow error:", err.message);
  }
}


async function repairMissingMetadata(): Promise<void> {
  console.log("🛠️ Starting metadata repair job...");

  const BATCH_SIZE = 25;

  /* ======================================================
   * STEP 1A — FIX TOKENS TABLE (decode + update)
   * ====================================================== */
  console.log("🔍 Checking tokens table for missing image/description/socials...");

  const tokensMissing = await knex("tokens")
    .select("mint_address as mint", "uri")
    .where(function () {
      this.whereNull("image")
        .orWhere("image", "")
        .orWhereNull("description")
        .orWhere("description", "");
    });

  console.log("➡️ Missing tokens count:", tokensMissing.length);

  const tokenJobs = tokensMissing.filter((row) => row.uri);

  for (let i = 0; i < tokenJobs.length; i += BATCH_SIZE) {
    const batch = tokenJobs.slice(i, i + BATCH_SIZE);
    const uris = batch.map((b) => b.uri);

    console.log(
      `🟢 Token decode batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`
    );

    const decoded = await decodeMetadataBatch(uris);

    for (let j = 0; j < batch.length; j++) {
      const req = batch[j];
      const meta = decoded[j];
      if (!meta) continue;

      const socials = {
        telegram: meta.telegram ?? null,
        twitter: meta.twitter ?? null,
        website: meta.website ?? null,
      };

      try {
        await knex("tokens")
          .update({
            image: meta.image ?? null,
            description: meta.description ?? null,
            socials: JSON.stringify(socials),
            last_updated: knex.fn.now(),
          })
          .where({ mint_address: req.mint });
      } catch (err: any) {
        console.error("❌ Failed to update token:", req.mint, err.message);
      }
    }
  }

  console.log("✅ Step 1A complete — Metadata decoded & stored.");


  /* ======================================================
   * STEP 1B — FETCH creation_time + total_supply FOR MISSING TOKENS
   * ====================================================== */
  console.log("⏳ Checking tokens missing created_on or total_supply...");

  const tokensMissingCTS = await knex("tokens")
    .select("mint_address as mint")
    .where(function () {
      this.whereNull("created_on")
        .orWhereNull("total_supply");
    });

  console.log("➡️ Tokens missing creation time / supply:", tokensMissingCTS.length);

  const mintList = tokensMissingCTS.map((t) => t.mint);

  for (let i = 0; i < mintList.length; i += BATCH_SIZE) {
    const batch = mintList.slice(i, i + BATCH_SIZE);

    console.log(
      `🟣 Creation/Supply batch ${i / BATCH_SIZE + 1} (${batch.length} items)...`
    );

    try {
      const result = await getCreationTimeAndSupplyBatch(batch);

      for (const mint of batch) {
        const row = result[mint];
        if (!row) continue;

        await knex("tokens")
          .update({
            created_on: row.created_on,
            total_supply: row.total_supply,
            last_updated: knex.fn.now(),
          })
          .where({ mint_address: mint });
      }
    } catch (err: any) {
      console.error("❌ Error updating creation/supply batch:", err.message);
    }
  }

  console.log("✅ Step 1B complete — Created_on & total_supply updated.");


  /* ======================================================
   * STEP 2 — SYNC discovery_tokens USING tokens TABLE (NO DECODING)
   * ====================================================== */
  console.log("🔍 Checking discovery_tokens with missing images...");

  const discoveryMissing = await knex("discovery_tokens")
    .select("mint", "category")
    .where(function () {
      this.whereNull("image").orWhere("image", "");
    });

  console.log("➡️ discovery missing count:", discoveryMissing.length);

  for (const row of discoveryMissing) {
    try {
      const tokenData = await knex("tokens")
        .select("image")
        .where({ mint_address: row.mint })
        .first();

      if (!tokenData || !tokenData.image) continue;

      await knex("discovery_tokens")
        .update({
          image: tokenData.image,
          updated_at: knex.fn.now(),
        })
        .where({
          mint: row.mint,
          category: row.category,
        });
    } catch (err: any) {
      console.error(
        "❌ Failed updating discovery token:",
        row.mint,
        err.message
      );
    }
  }

  console.log("🎉 ALL metadata repaired successfully.");
}


/* ====================== Worker Scheduler ====================== */
export function startDiscoveryWorker() {
  cron.schedule("*/5 * * * *", async () => {
    console.log("🔄 Discovery worker tick...");
    try {
      // await fetchBluechipMemesNow();
      await fetchXStockNow();
      await fetchLstsNow();
      await fetchAiNow();
      await fetchTrendingNow();
      await fetchPopularNow();
      // await repairMissingMetadata();
      // await fetchNewlyCreatedNow();
      // await fetchAlmostBondedNow();
      // await fetchMigratedNow();
    } catch (err: any) {
      console.error("❌ discovery worker tick failed:", err.message);
    }
  });
  console.log("⏱️ Discovery worker scheduled: every 3 minutes");
}

if (require.main === module) {
  (async () => {
    if (!redisClient.isOpen) await redisClient.connect();
    startDiscoveryWorker();
  })();
}
