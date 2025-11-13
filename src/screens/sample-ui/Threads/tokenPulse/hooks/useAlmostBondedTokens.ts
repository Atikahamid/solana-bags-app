import { useEffect, useState } from "react";
import socketService from "@/shared/services/socketService";
import { BackendToken, fetchAlmostBondedTokens } from "../tokenServicefile";

export function useAlmostBondedTokens() {
  const [tokens, setTokens] = useState<BackendToken[]>([]);

  useEffect(() => {
    // 1. Fetch initial list
    fetchAlmostBondedTokens()
      .then(setTokens)
      .catch((err) => console.error("Failed to fetch almost bonded tokens", err));

    // 2. Subscribe to live socket events
    const handleNewToken = (token: BackendToken) => {
      setTokens((prev) => {
        const exists = prev.find((t) => t.mint === token.mint);
        console.log("exists: --------------", exists);
        if (exists) return prev; // skip duplicates
        return [token, ...prev]; // prepend new
      });
    };

    socketService.subscribeToEvent("almost_bonded_token", handleNewToken);

    // 3. Cleanup
    return () => {
      socketService.unsubscribeFromEvent("almost_bonded_token", handleNewToken);
    };
  }, []);

  return tokens;
}
