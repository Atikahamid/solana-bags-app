// file: src/services/walletAssetService.ts

import axios from "axios";
import { SERVER_URL } from "@env";

export interface GetTokenAccountsParams {
  mint?: string;
  ownerAddress?: string;
  limit?: number;
  page?: number;
  cursor?: string;
  before?: string;
  after?: string;
  showZeroBalance?: boolean;
}

export interface TokenAccount {
  address: string;
  mint: string;
  amount: number;
  owner: string;
  frozen: boolean;
  delegate: string | null;
  delegated_amount: number;
  close_authority: string | null;
  extensions: any;
  // From combined API (extra fields)
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  image?: string | null;
  json_uri?: string | null;
}

export interface CombinedTokenAccountsResponse {
  total: number;
  limit: number;
  page: number;
  token_accounts: TokenAccount[];
}

/**
 * Fetches token accounts with metadata combined
 * @param params Request body for /token/accounts/with-assets
 */
export const getWalletAssets = async (
  params: GetTokenAccountsParams
): Promise<CombinedTokenAccountsResponse> => {
  try {
    const { data } = await axios.post<CombinedTokenAccountsResponse>(
      `${SERVER_URL}/api/aura/token/accounts/with-assets`,
      params
    );
    console.log("data of wallet assets: ", data);
    return data;
  } catch (error: any) {
    console.error("Failed to fetch wallet assets:", error.response?.data || error.message);
    throw new Error(
      error.response?.data?.error || "Failed to fetch wallet assets. Please try again."
    );
  }
};
