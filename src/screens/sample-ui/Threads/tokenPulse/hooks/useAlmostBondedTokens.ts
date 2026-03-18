// ==== File: src/hooks/useAlmostBondedTokens.ts ====
import { useEffect, useState, useCallback } from "react";
import socketService from "@/shared/services/socketService";
import {
  BackendToken,
  fetchAlmostBondedTokens,
} from "../tokenServicefile";
import { useAuth } from "@/modules/wallet-providers";

type Filters = Record<string, unknown> | null;

export function useAlmostBondedTokens(
  filters: Filters
) {
  // const { user, profile } = useAuth();
  // const settings = profile?.settings;
  // console.log("settings:", settisngs);

  //  const  filters  = profile?.settings?.filters;

  const [tokens, setTokens] = useState<BackendToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchAlmostBondedTokens(filters);

      const unique = Array.from(
        new Map(data.map((t) => [t.mint, t])).values()
      );

      setTokens(unique);
    } catch (err) {
      console.error("Failed to fetch almost bonded tokens", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
      fetchTokens();
    }, [fetchTokens]);

  useEffect(() => {


    const handleAlmostBonded = (event: any) => {
      const events = Array.isArray(event) ? event : [event];

      setTokens((prev) => {
        const next = [...prev];

        for (const token of events) {
          if (!token?.mint) continue;

          const exists = next.some(
            (t) => t.mint === token.mint
          );

          if (!exists) {
            next.unshift(token);
          }
        }

        return next;
      });
    };

    socketService.subscribeToEvent(
      "launchpad:almost_bonded:new",
      handleAlmostBonded
    );

    return () => {
      socketService.unsubscribeFromEvent(
        "launchpad:almost_bonded:new",
        handleAlmostBonded
      );
    };
  }, []);

  return {
    tokens,
    isLoading,
    refetch: fetchTokens,
  };
}
