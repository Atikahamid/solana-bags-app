// ==== File: src/screens/GlobalSearchScreen.tsx ====

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import COLORS from "@/assets/colors";
import { AppHeader } from "@/core/shared-ui";
import SearchBox from "./SearchBox";
import TokenCard from "./TokenCardComponent";

import { fetchTrendingTokens } from "./tokenPulse/tokenServicefile";
import { formatCompactNumber } from "./SearchScreen";

const TABS = [
  { key: "Coins", label: "Coins" },
  { key: "People", label: "People" },
];

export default function GlobalSearchScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Coins");
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ✅ Load trending tokens initially
  useEffect(() => {
    let mounted = true;
    async function loadTrending() {
      setLoading(true);
      try {
        const res = await fetchTrendingTokens();
        if (!mounted) return;
        setTokens(
          res.map((t: any) => ({
            mint: t.mint,
            name: t.name ?? "Unknown",
            symbol: t.symbol ?? "",
            logo: t.image,
            mc: t.marketcap ? `$${formatCompactNumber(t.marketcap)}` : "-",
            liq: t.liquidity ? `$${formatCompactNumber(t.liquidity)}` : "-",
            vol: t.volume7dUSD
              ? `$${formatCompactNumber(t.volume7dUSD)}`
              : t.totalVolume
              ? `$${formatCompactNumber(t.totalVolume)}`
              : "-",
            change: t.priceChange24h ?? 0,
          }))
        );
      } catch (err) {
        console.error("[GlobalSearch] Error fetching trending:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadTrending();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Detect if search query looks like an address → auto switch to Coins
  useEffect(() => {
    if (searchQuery && searchQuery.length > 20) {
      setActiveTab("Coins");
    }
  }, [searchQuery]);

  const filteredTokens =
    activeTab === "Coins"
      ? tokens.filter(
          (t) =>
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.mint && t.mint.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : [];

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView
        style={[styles.container, Platform.OS === "android" && styles.androidSafeArea]}
      >
        {/* <AppHeader title="Search" showBackButton={true} onBackPress={handleBack} /> */}

        {/* ✅ Search Bar */}
        <View style={styles.searchContainer}>
          <SearchBox
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search coins or people..."
            showClear={!!searchQuery}
            onClear={() => setSearchQuery("")}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results */}
        {loading ? (
          <View style={{ padding: 24, alignItems: "center" }}>
            <ActivityIndicator size="small" color={COLORS.brandPrimary} />
            <Text style={{ color: COLORS.greyMid, marginTop: 10 }}>Loading...</Text>
          </View>
        ) : activeTab === "Coins" ? (
          <FlatList
            data={filteredTokens}
            keyExtractor={(item, idx) => (item.mint ?? item.symbol ?? idx.toString())}
            renderItem={({ item }) => (
              <TokenCard
                {...item}
                onPress={() =>
                  navigation.navigate("TokenDetailScreen" as never, { token: item } as any)
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={{ color: COLORS.greyMid, textAlign: "center", marginTop: 20 }}>
                No results found.
              </Text>
            }
          />
        ) : (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: COLORS.greyMid }}>People search coming soon...</Text>
          </View>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  androidSafeArea: { paddingTop: 0 },
  searchContainer: {
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#2F3848",
    marginTop: 10,
    marginHorizontal: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brandPrimary,
  },
  tabText: {
    color: "#7A8495",
    fontSize: 14,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
});
