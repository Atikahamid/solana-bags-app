import { SERVER_URL } from "@env";

export interface Trade {
    walletAddress: string;
    username: string;
    userProfilePic: string;
    action: "buy" | "sell";
    token: {
        name: string;
        symbol: string;
        mintAddress: string;
        tokenDecimal: number;
        imageUrl: string;
    }; 
    time: string; // ISO string
    pnl: number;
    solPrice: number;
    marketCapAtTrade: number;
    currentMarketCap: number; 
    // priceChange24h: number;
}


export async function fetchPastTrades(): Promise<Trade[]> {
    try {
        const res = await fetch(`${SERVER_URL}/api/pastTrades/past-trades`);
        if (!res.ok) throw new Error("Failed to fetch trades");
        const data: Trade[] = await res.json();
        console.log("trade data: ", data[0]);
        return data;
    } catch (err) {
        console.error("Error fetching trades:", err);
        return [];
    }
}