// ==== File: src/hooks/useMigratedTokens.ts ====
import { useEffect, useState, useCallback } from "react";
import socketService from "@/shared/services/socketService";
import {
  BackendToken,
  fetchMigratedTokens,
} from "../tokenServicefile";
import { useAuth } from "@/modules/wallet-providers";

type Filters = Record<string, unknown> | null;

export function useMigratedTokens(
  filters: Filters
) {
  // const { user, profile } = useAuth();
  // const settings = profile?.settings;
  // console.log("settings:", settings);

  //  const  filters  = profile?.settings?.filters;

  const [tokens, setTokens] = useState<BackendToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTokens = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await fetchMigratedTokens(filters);

      const unique = Array.from(
        new Map(data.map((t) => [t.mint, t])).values()
      );

      setTokens(unique);
    } catch (err) {
      console.error("Failed to fetch migrated tokens", err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
      fetchTokens();
    }, [fetchTokens]);

  useEffect(() => {

    const handleMigrated = (event: any) => {
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
      "launchpad:migrated:new",
      handleMigrated
    );

    return () => {
      socketService.unsubscribeFromEvent(
        "launchpad:migrated:new",
        handleMigrated
      );
    };
  }, []);

  return {
    tokens,
    isLoading,
    refetch: fetchTokens,
  };
}
