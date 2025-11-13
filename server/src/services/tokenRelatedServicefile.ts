import { Connection, PublicKey } from "@solana/web3.js";
import { Metadata } from "@metaplex-foundation/mpl-token-metadata";

const connection = new Connection(process.env.SOLANA_RPC!);

export async function fetchOnChainMetadata(mint: string) {
  try {
    const mintKey = new PublicKey(mint);
    const metadataPda = await Metadata.getPDA(mintKey);
    const metadataAccount = await Metadata.load(connection, metadataPda);
    const data = metadataAccount.data.data;

    return {
      name: data.name.trim(),
      symbol: data.symbol.trim(),
      uri: data.uri,
    };
  } catch (e) {
    console.error(`❌ Failed to fetch on-chain metadata for ${mint}:`, e);
    return { name: null, symbol: null, uri: null };
  }
}
