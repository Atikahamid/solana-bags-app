// ==== File: src/hooks/useNewlyCreatedTokens.ts ====
import { useEffect, useState } from "react";
import socketService from "@/shared/services/socketService";
import { BackendToken, fetchNewlyCreatedTokens } from "../tokenServicefile";

export function useNewlyCreatedTokens() {
  const [tokens, setTokens] = useState<BackendToken[]>([]);

  useEffect(() => {
    // 1. Fetch past tokens
    fetchNewlyCreatedTokens()
      .then(setTokens)
      .catch((err) => console.error("Failed to fetch newly created tokens", err));

    // 2. Subscribe to live new token events
    const handleNewToken = (token: BackendToken) => {
      console.log("🆕 New token received", token);
      setTokens((prev) => {
        const exists = prev.find((t) => t.mint === token.mint);
        if (exists) return prev;
        return [token, ...prev];
      });
    };

    socketService.subscribeToEvent("new_token_created", handleNewToken);

    // 3. Cleanup
    return () => {
      socketService.unsubscribeFromEvent("new_token_created", handleNewToken);
    };
  }, []);

  return tokens;
}
