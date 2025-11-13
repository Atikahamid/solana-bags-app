import { useEffect, useState } from "react";
import socketService from "@/shared/services/socketService";
import { BackendToken, fetchMigratedTokens } from "../tokenServicefile";

export function useMigratedTokens() {
  const [tokens, setTokens] = useState<BackendToken[]>([]);

  useEffect(() => {
    // 1. Fetch initial list
    fetchMigratedTokens()
      .then(setTokens)
      .catch((err) => console.error("Failed to fetch migrated tokens", err));

    // 2. Subscribe to live socket events
    const handleNewToken = (token: BackendToken) => {
      setTokens((prev) => {
        const exists = prev.find((t) => t.mint === token.mint);
        if (exists) return prev;
        return [token, ...prev];
      });
    };

    socketService.subscribeToEvent("migrated_token", handleNewToken);

    // 3. Cleanup
    return () => {
      socketService.unsubscribeFromEvent("migrated_token", handleNewToken);
    };
  }, []);

  return tokens;
}
