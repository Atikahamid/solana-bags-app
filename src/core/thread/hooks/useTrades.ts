import { useEffect, useState, useCallback } from "react";
import { BackendTradePayload, Trade, fetchPastTrades, mapBackendTrade } from "@/shared/services/tradeService";
import socketService from "@/shared/services/socketService";
 

export function useTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchPastTrades();
      setTrades(data);
    } catch (err) {
      console.error("Failed to fetch past trades", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrades();

    const handleNewTrade = (event: any) => {
      const events = Array.isArray(event) ? event : [event];

      setTrades(prev => {
        const next = [...prev];

        for (const e of events) {
          if (!e?.payload) continue;

          const trade = mapBackendTrade(e.payload);

          const exists = next.some(
            t => t.transactionId === trade.transactionId
          );

          if (!exists) {
            next.unshift(trade);
          }
        }

        return next;
      });
    };



    socketService.subscribeToEvent("transaction:new", handleNewTrade);

    return () => {
      socketService.unsubscribeFromEvent("transaction:new", handleNewTrade);
    };
  }, [fetchTrades]);

  return {
    trades,
    isLoading,
    refetch: fetchTrades,
  };
}

 