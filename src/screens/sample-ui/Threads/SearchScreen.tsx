// ==== File: src/screens/SearchScreen.tsx ====
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from "react-native";
import TokenCard from "./TokenCardComponent";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "@/core/shared-ui";
import { useNavigation } from "@react-navigation/native";
import COLORS from "@/assets/colors";
import { LinearGradient } from "expo-linear-gradient";
import socketService from "@/shared/services/socketService";

import {
  fetchXstockTokens,
  fetchLSTsTokens,
  fetchBlueChipMemes,
  fetchAITokens,
  fetchTrendingTokens,
  fetchPopularTokens,
} from "./tokenPulse/tokenServicefile";

import { ensureCompleteTokenInfo } from "@/modules/data-module";
import Icons from "../../../assets/svgs";
import SearchBox from "./SearchBox";

const TABS = [
  { key: "Trending", label: "Trending", icon: Icons.TrendingIcon, darkIcon: Icons.TrendingDark },
  { key: "Popular", label: "Popular", icon: Icons.PopularIcon, darkIcon: Icons.Populardark },
  { key: "Featured", label: "Featured", icon: Icons.featuredicon, darkIcon: Icons.FeaturedDark },
  { key: "Stocks", label: "Stocks", icon: Icons.StocksIcon, darkIcon: Icons.StocksDark },
  { key: "AI", label: "AI", icon: Icons.AiIcon, darkIcon: Icons.Aidark },
  { key: "LSTs", label: "LSTs", icon: Icons.LstsIcon, darkIcon: Icons.lstDark },
  { key: "BlueChip", label: "Blue Chip Memes", icon: Icons.Bluechipicon, darkIcon: Icons.BlueChipDark },
  { key: "Holding", label: "Holding", icon: Icons.StocksIcon, darkIcon: Icons.StocksDark },
];

const TAB_DATA: Record<string, any[]> = {
  Featured: [
    { name: "JUMBA", symbol: "JUMBA", mc: "$8.3K", liq: "$11.53K", vol: "$2.56M", change: 133.31 },
  ],
  AI: [],
  BlueChip: [],
  Holding: [],
};

export function formatCompactNumber(value: number | string | undefined): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return "0";
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}
 
export default function SearchScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Trending");
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ✅ Socket connection & listener
  useEffect(() => {
    const connect = async () => {
      const connected = await socketService.initSocket("53ff585f-ba68-4b5f-8477-10b59dbca6f0");
      if (connected) {
        console.log("✅ Socket connected in SearchScreen");

        socketService.subscribeToEvent("live_marketcap_update", (update: { mint: string; marketcap: number }) => {
          console.log("📈 Marketcap update:", update);

          // ✅ Update state with new marketcap
          setTokens((prev) =>
            prev.map((t) =>
              t.mint === update.mint
                ? { ...t, mc: `$${formatCompactNumber(update.marketcap)}` }
                : t
            )
          );
        });
      }
    };

    connect();
  }, []);

  // ✅ Load tokens on tab change
  useEffect(() => {
    ensureCompleteTokenInfo;
    let mounted = true;

    async function load() {
      setLoading(true);
      setTokens([]);

      try {
        let res: any[] = [];

        if (activeTab === "Trending") res = await fetchTrendingTokens();
        else if (activeTab === "Popular") res = await fetchPopularTokens();
        else if (activeTab === "Stocks") res = await fetchXstockTokens();
        else if (activeTab === "LSTs") res = await fetchLSTsTokens();
        else if (activeTab === "BlueChip") res = await fetchBlueChipMemes();
        else if (activeTab === "AI") res = await fetchAITokens();
        else {
          setTokens(TAB_DATA[activeTab] || []);
          setLoading(false);
          return;
        }

        if (!mounted) return;

        // ✅ Normalize token object to always use `mint`
        setTokens(
          res.map((t: any) => ({
            mint: t.mint,
            name: t.name ?? "Unknown",
            symbol: t.symbol ?? "",
            logo: t.image,
            mc: t.marketcap ? `$${formatCompactNumber(t.marketcap)}` : "-",
            liq: t.liquidity ? `$${formatCompactNumber(t.liquidity)}` : "-",
            vol: t.volume
              ? `$${formatCompactNumber(t.volume7dUSD)}`
              : t.totalVolume
                ? `$${formatCompactNumber(t.totalVolume)}`
                : "-",
            change: t.priceChange24h ?? 0,
          }))
        );

        // ✅ Send subscribe list to backend
        if (activeTab === "Trending" && res.length > 0) {
          const mintAddresses = res.map((t: any) => t.mint).filter(Boolean);
          // console.log("📤 Sending subscribe_marketcap with:", mintAddresses);
          // socketService.emit("subscribe_marketcap", mintAddresses);
        }
      } catch (err) {
        console.error("[SearchScreen] Error loading tokens:", err);
        if (mounted) setTokens([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // ✅ Filter tokens by search query
  const filteredTokens = tokens.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <SafeAreaView style={[styles.container, Platform.OS === "android" && styles.androidSafeArea]}>
        <AppHeader title="App" showBackButton={true} onBackPress={handleBack} />

        <View style={styles.subcontainer}>
          {/* Tabs */}
          <ScrollView
            nestedScrollEnabled
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={{ paddingHorizontal: 10 }}
          >
            {TABS.map((tab) => {
              const IconComp = activeTab === tab.key ? tab.icon : tab.darkIcon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <View style={styles.tabContent}>
                    <IconComp width={16} height={16} />
                    <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Token list */}
          {loading ? (
            <View style={{ padding: 24, alignItems: "center" }}>
              <ActivityIndicator size="small" color={COLORS.brandPrimary} />
              <Text style={{ color: COLORS.greyMid, marginTop: 10 }}>
                Loading {activeTab}...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTokens}
              keyExtractor={(item, idx) =>
                (item.mint ?? item.symbol ?? item.name ?? idx.toString()) + "-" + idx
              }
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
                  No tokens found.
                </Text>
              }
            />
          )}
        </View>

        {/* ✅ Fixed search bar */} 
        <View style={styles.fixedSearch}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("GlobalSearchScreen" as never)}
          >
            <SearchBox
              searchQuery=""
              setSearchQuery={() => { }}
              placeholder="Search tokens..."
            />
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  androidSafeArea: { paddingTop: 0 },
  subcontainer: {},
  tabBar: {
    flexDirection: "row",
    paddingVertical: 15,
    height: 65,
  },
  tab: {
    paddingHorizontal: 16,
    marginRight: 12,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 14,
  },
  activeTab: {
    backgroundColor: "#1C2233",
    borderWidth: 1,
    borderColor: "#2F3848",
  },
  tabContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tabText: {
    color: "#7A8495",
    fontSize: 12.75,
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  fixedSearch: {
    position: "absolute",
    bottom: 63,
    left: 0,
    right: 0,
  },
});
