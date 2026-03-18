import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";

const API_KEY = "5d6cec881d44422894f3a6ffe2c0a06d"; // replace with your Birdeye key
const API_URL = "https://public-api.birdeye.so/defi/v3/txs/recent?offset=0&limit=100&tx_type=swap&ui_amount_mode=scaled"; 

export default function TradeFeedScreen() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const res = await fetch(API_URL, {
          headers: {
            "X-API-KEY": API_KEY,
          },
        });
        const data = await res.json();
        console.log("--------------------------------------------------------");
        console.log("Fetched trades:", data);
        setTrades(data?.data?.items || []);
      } catch (err) {
        console.error("Error fetching trades:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTrades();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8e44ad" />
      </View>
    );
  }

  return (
    <FlatList
      data={trades}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item }) => (
        <View style={styles.tradeCard}>
          <Text style={styles.token}>
            {item.symbol} ({item.mint})
          </Text>
          <Text>Price: ${item.priceUsd?.toFixed(4)}</Text>
          <Text>Amount: {item.amount}</Text>
          <Text>Side: {item.side}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tradeCard: {
    backgroundColor: "#1e1e1e",
    padding: 12,
    margin: 8,
    borderRadius: 8,
  },
  token: { fontWeight: "bold", fontSize: 16, color: "#fff" },
});
