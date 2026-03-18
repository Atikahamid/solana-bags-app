import { SERVER_URL } from "@env";

export interface BackendTradePayload {
  transaction_id: string;
  type: "BUY" | "SELL";

  // price_sol: string | null;
  // marketcapAtTrade: string | null;
  total_usd: string;
  trade_size_usd: string;
  token_current_price_usd: string;

  created_at: string;

  username: string;
  profile_image_url: string | null;

  token_mint: string | null;
  token_name: string;
  token_symbol: string;
  token_image: string | null;
  token_decimal: number | null;
  token_market_cap: string | null;
  token_amount: string; // 1.3M BP
  // avg_buy_price: string | null;
  // pnl_usd: string;
  // pnl_percent: string;
}

export interface Trade {
  transactionId: string;
  type: "BUY" | "SELL";

  // priceSol: number | null;
  // marketcapAtTrade: number | null;
  totalUsd: number;
  tradeSizeUsd: number;
  tokenCurrentPriceUsd: number;
  tokenAmount: number;

  createdAt: string;

  username: string;
  userProfilePic: string | null;

  mint: string | null;
  tokenName: string;
  tokenSymbol: string;
  tokenImage: string | null;
  tokenDecimal: number | null;
  currentMarketCap: number | null;
  // Raw token qty; UI can format with `tokenSymbol` + `tokenDecimal`
  tokenAmountRaw: string;

  // avgBuyPrice: number | null;
  // pnlUsd: number;
  // pnlPercent: number;
}


interface RecentTradeApiRow {
  transaction_id: string;
  type: "BUY" | "SELL";

  // price_sol: string | null;
  // marketcapAtTrade: string | null;
  total_usd: string;
  trade_size_usd: string;
  token_current_price_usd: string;

  created_at: string;

  username: string;
  profile_image_url: string | null;
  token_mint: string | null;
  token_name: string;
  token_symbol: string;
  token_image: string | null;
  token_decimal: number | null;
  token_market_cap: string | null;
  token_amount: string; // 1.3M BP
  // avg_buy_price: string | null;

  // pnl_usd: string;
  // pnl_percent: string;
}
export function mapBackendTrade(row: BackendTradePayload): Trade {
  return {
    transactionId: row.transaction_id,
    type: row.type,

    // priceSol: row.price_sol ? Number(row.price_sol) : null, //priceInDollars
    // marketcapAtTrade: row.marketcapAtTrade
    //   ? Number(row.marketcapAtTrade)
    //   : null,
    totalUsd: Number(row.total_usd),
    tradeSizeUsd: Number(row.trade_size_usd ?? row.total_usd),
    tokenCurrentPriceUsd: Number(row.token_current_price_usd),
    tokenAmount: Number(row.token_amount),
    tokenAmountRaw: row.token_amount,

    createdAt: row.created_at,

    username: row.username,
    userProfilePic: row.profile_image_url,

    mint: row.token_mint,
    tokenName: row.token_name,
    tokenSymbol: row.token_symbol,
    tokenImage: row.token_image,
    tokenDecimal: row.token_decimal,
    currentMarketCap: row.token_market_cap
      ? Number(row.token_market_cap)
      : null,
    // avgBuyPrice: row.avg_buy_price
    //   ? Number(row.avg_buy_price)
    //   : null,

    // pnlUsd: Number(row.pnl_usd),
    // pnlPercent: Number(row.pnl_percent),
  };
}



export async function fetchPastTrades(): Promise<Trade[]> {
  const res = await fetch(`${SERVER_URL}/api/userRoutess/feed/recent`);
  const json = await res.json();

  return json.data
    .map(mapBackendTrade)
    .sort(
      (a: Trade, b: Trade) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
    );
}

