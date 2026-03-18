import { SERVER_URL } from "@env";

export interface SearchTokenResult {
  mint_address: string;
  name: string;
  symbol: string;
  image: string | null;
  market_cap: string | null;
  liquidity: string | null;
  volume_24h: string | null;
  price_change_24h: string | null;
}
export interface SearchUserResult {
  userPrivyId: string;
  username: string;
  profileImage: string | null;
  totalPnl: string;
  pnlPercent: string;
  tokenImages: string[];
}

export async function searchUsers(
  search: string,
  limit = 20,
  offset = 0
): Promise<SearchUserResult[]> {
  const res = await fetch(
    `${SERVER_URL}/api/userRoutess/search-user?search=${encodeURIComponent(
      search
    )}&limit=${limit}&offset=${offset}`
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error("User search failed");
  }

  return json.data;
}

export async function searchTokens(
  search: string,
  limit = 20,
  offset = 0
): Promise<SearchTokenResult[]> {
  const res = await fetch(
    `${SERVER_URL}/api/tokenRelatedData/search-tokens?search=${encodeURIComponent(search)}&limit=${limit}&offset=${offset}`
  );

  const json = await res.json();

  if (!json.success) {
    throw new Error("Search failed");
  }

  return json.data;
}
