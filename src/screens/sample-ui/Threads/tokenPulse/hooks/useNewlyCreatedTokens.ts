// ==== File: src/hooks/useNewlyCreatedTokens.ts ====

import { useEffect, useState, useCallback } from "react";
import socketService from "@/shared/services/socketService";
import {
  BackendToken,
  fetchNewlyCreatedTokens,
} from "../tokenServicefile";

type Filters = Record<string, unknown> | null;

export function useNewlyCreatedTokens(filters: Filters) {
  const [tokens, setTokens] = useState<BackendToken[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * Fetch tokens from backend using current filters
   */
  const fetchTokens = useCallback(async () => {
    if (!filters) return; // 🛑 wait until filters are loaded

    try {
      setIsLoading(true);

      const data = await fetchNewlyCreatedTokens(filters);

      // Deduplicate by mint
      const uniqueTokens = Array.from(
        new Map(data.map(t => [t.mint, t])).values()
      );

      setTokens(uniqueTokens);
    } catch (err) {
      console.error("[useNewlyCreatedTokens] fetch failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  /**
   * Refetch when filters change
   */
  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  /**
   * Socket subscription (lifecycle-only, NOT filter-driven)
   */
  useEffect(() => {
    const handleNewToken = (event: any) => {
      const events = Array.isArray(event) ? event : [event];

      setTokens(prev => {
        const next = [...prev];

        for (const token of events) {
          if (!token?.mint) continue;

          const exists = next.some(t => t.mint === token.mint);
          if (!exists) {
            next.unshift(token);
          }
        }

        return next;
      });
    };

    socketService.subscribeToEvent("launchpad:new", handleNewToken);

    return () => {
      socketService.unsubscribeFromEvent("launchpad:new", handleNewToken);
    };
  }, []);

  return {
    tokens,
    isLoading,
    refetch: fetchTokens,
  };
}
