import { useEffect, useState } from "react";
import { Trade, fetchPastTrades } from "@/shared/services/tradeService";
import socketService from "@/shared/services/socketService";

export function useTrades() {
    const [trades, setTrades] = useState<Trade[]>([]);

    useEffect(() => {
        // 1. Fetch past trades
        fetchPastTrades()
            .then(setTrades)
            .catch((err) => console.error("Failed to fetch past trades", err));

        // 2. Subscribe to live trade events
        const handleNewTrade = (trade: Trade) => {
            console.log("New trade received", trade);
            setTrades((prev) => {
                const exists = prev.find(
                    (t) =>
                        t.walletAddress === trade.walletAddress &&
                        t.time === trade.time &&
                        t.token.mintAddress === trade.token.mintAddress
                );
                if (exists) return prev;
                return [trade, ...prev];
            });
        };

        socketService.subscribeToEvent("token_transfer", handleNewTrade);

        // 3. Cleanup
        return () => {
            socketService.unsubscribeFromEvent("token_transfer", handleNewTrade);
        };
    }, []);

    return trades;
}