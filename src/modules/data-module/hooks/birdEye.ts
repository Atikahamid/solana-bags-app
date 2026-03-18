// Basic Birdeye REST client for recent trades (V3)
const BASE = process.env.EXPO_PUBLIC_BIRDEYE_BASE ?? 'https://public-api.birdeye.so';
const API_KEY = process.env.EXPO_PUBLIC_BIRDEYE_API_KEY!;

// Types are simplified to what's rendered. Adjust as you need.
export type TradeV3 = {
  tx_hash: string;                 // tx hash
  block_time: number;              // unix seconds
  dex?: string;                    // e.g. "Raydium"
  price_usd?: number;              // unit price if provided
  volume_usd?: number;             // total USD volume (may be named price*amount on some items)
  // Birdeye includes token info; names vary by DEX. We'll normalize below.
  from?: { symbol?: string; address?: string; uiAmount?: number; };
  to?:   { symbol?: string; address?: string; uiAmount?: number; };
  token_in?:  { symbol?: string; address?: string; ui_amount?: number; };
  token_out?: { symbol?: string; address?: string; ui_amount?: number; };
  platform?: string;
};

export type TradesResponse = {
  data: { items: TradeV3[]; page?: number; limit?: number; total?: number };
  success: boolean;
};

// Recent trades across all tokens on a chain. Supports pagination.
export async function fetchRecentTrades(params: { chain?: 'solana'; page?: number; limit?: number; dex?: string } = {}) {
  const { chain = 'solana', page = 1, limit = 50, dex } = params;
  const qs = new URLSearchParams({ chain, page: String(page), limit: String(limit) });
  if (dex) qs.set('dex', dex);

  const res = await fetch(`${BASE}/defi/v3/txs/recent?${qs.toString()}`, {
    headers: { 'accept': 'application/json', 'X-API-KEY': API_KEY },
  });
  if (!res.ok) throw new Error(`Birdeye ${res.status}`);
  return res.json() as Promise<TradesResponse>;
}

// Small helper to normalize symbol/amount for UI
export function normalizeSides(trade: TradeV3) {
  const fromSym = trade.from?.symbol ?? trade.token_in?.symbol ?? '???';
  const toSym   = trade.to?.symbol   ?? trade.token_out?.symbol ?? '???';
  const fromAmt = trade.from?.uiAmount ?? trade.token_in?.ui_amount;
  const toAmt   = trade.to?.uiAmount   ?? trade.token_out?.ui_amount;
  return { fromSym, toSym, fromAmt, toAmt };
}

export function timeAgo(unixSec: number) {
  const diff = Math.max(0, Date.now() - unixSec * 1000);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
