// ==== File: src/screens/SearchScreen.tsx ====

import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import TokenCard from './TokenCardComponent';
import {SafeAreaView} from 'react-native-safe-area-context';
import {AppHeader} from '@/core/shared-ui';
import {useNavigation} from '@react-navigation/native';
import COLORS from '@/assets/colors';
import {LinearGradient} from 'expo-linear-gradient';
import socketService from '@/shared/services/socketService';

import {
  fetchB100Tokens,
  fetchMigratedTokens,
  fetchNewlyCreatedTokens,
  // fetchXstockTokens,
  // fetchLSTsTokens,
  // fetchBlueChipMemes,
  // fetchAITokens, 
  fetchTrendingTokens,
  // fetchPopularTokens,
} from './tokenPulse/tokenServicefile';

import {ensureCompleteTokenInfo} from '@/modules/data-module';
import Icons from '../../../assets/svgs';
import SearchBoxButton from './SearchBox';
import NewTokenCard from './NewTokenCard';
import GraduatedTokenCard from './GraduatedTokenCard';

const TABS = [
  {
    key: 'Trending',
    label: 'Trending',
    icon: Icons.TrendingIcon,
    darkIcon: Icons.TrendingDark,
  },
  {
    key: 'New',
    label: 'New',
    icon: Icons.PopularIcon,
    darkIcon: Icons.Populardark,
  },
  // {
  //   key: 'Featured',
  //   label: 'Featured',
  //   icon: Icons.featuredicon,
  //   darkIcon: Icons.FeaturedDark,
  // },
  {
    key: 'Graduated',
    label: 'Graduated',
    icon: Icons.StocksIcon,
    darkIcon: Icons.StocksDark,
  },
  {key: 'B100', label: 'B100', icon: Icons.AiIcon, darkIcon: Icons.Aidark},
  // {key: 'LSTs', label: 'LSTs', icon: Icons.LstsIcon, darkIcon: Icons.lstDark},
  // {
  //   key: 'BlueChip',
  //   label: 'Blue Chip Memes',
  //   icon: Icons.Bluechipicon,
  //   darkIcon: Icons.BlueChipDark,
  // },
  // {
  //   key: 'Holding',
  //   label: 'Holding',
  //   icon: Icons.StocksIcon,
  //   darkIcon: Icons.StocksDark,
  // },
];

const TAB_DATA: Record<string, any[]> = {
  Trending: [],
  Popular: [],
  // Featured: [
  //   {
  //     name: 'JUMBA',
  //     symbol: 'JUMBA',
  //     mc: '$8.3K',
  //     liq: '$11.53K',
  //     vol: '$2.56M',
  //     change: 133.31,
  //   },
  // ],
  stocks: [],
  AI: [],
  BlueChip: [],
  // Holding: [],
};

export function formatCompactNumber(
  value: number | string | undefined,
): string {
  const num = Number(value ?? 0);
  if (isNaN(num)) return '0';
  if (num >= 1e12) return `${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toString();
}

export const fmt1 = (v: any) => {
  const n = Number(v);
  if (isNaN(n)) return '-';
  return `$${formatCompactNumber(Number(n.toFixed(1)))}`;
};
function mapTokenToUi(t: any) {
  return {
    mint: t.mint,
    name: t.name ?? 'Unknown',
    symbol: t.symbol ?? '',
    logo: t.image,
    decimals: t.decimals,
    mc: fmt1(t.marketcap),
    liq: fmt1(t.liquidity),
    vol: fmt1(t.volume),
    change: t.priceChange24h ?? 0,
  };
}

export default function SearchScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('Trending');
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  //  console.log("toekns image: ", tokens[1]);
  // const handleBack = useCallback(() => {
  //   navigation.goBack();
  // }, [navigation]);

  // ------------------------- SOCKET ----------------------------
  // useEffect(() => {
  //   const connect = async () => {
  //     const connected = await socketService.initSocket(
  //       '53ff585f-ba68-4b5f-8477-10b59dbca6f0',
  //     );
  //     if (connected) {
  //       socketService.subscribeToEvent(
  //         'live_marketcap_update',
  //         (update: {mint: string; marketcap: number}) => {
  //           setTokens(prev =>
  //             prev.map(t =>
  //               t.mint === update.mint
  //                 ? {...t, mc: `$${formatCompactNumber(update.marketcap)}`}
  //                 : t,
  //             ),
  //           );
  //         },
  //       );
  //     }
  //   };
  //   connect();
  // }, []);

  // ------------------------- LOAD TOKENS ----------------------------
  useEffect(() => {
    ensureCompleteTokenInfo;
    let mounted = true;

    async function load() {
      setLoading(true);
      setTokens([]);

      try {
        let res: any[] = [];

        if (activeTab === 'Trending') res = await fetchTrendingTokens();
        else if (activeTab === 'Graduated') res = await fetchMigratedTokens();
        else if (activeTab === 'New') res = await fetchNewlyCreatedTokens();
        else if (activeTab === 'B100') res = await fetchB100Tokens();
        // else if (activeTab === 'BlueChip') res = await fetchBlueChipMemes();
        // else if (activeTab === 'AI') res = await fetchAITokens();
        else {
          setTokens(TAB_DATA[activeTab] || []);
          setLoading(false);
          return;
        }

        if (!mounted) return;

        setTokens(
          res.map((t: any) => ({
            mint: t.mint,
            name: t.name ?? 'Unknown',
            symbol: t.symbol ?? '',
            logo: t.image,
            decimals: t.decimals,
            mc: fmt1(t.marketcap),
            priceUsd: t.priceUsd,
            // liq: fmt1(t.liquidity),
            // vol: fmt1(t.volume),
            change: t.priceChange24h ?? 0,
          })),
        );
      } catch (err) {
        console.error('[SearchScreen] Error loading tokens:', err);
        setTokens([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [activeTab]);

  // ------------------------- PULL TO REFRESH ----------------------------
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      let res: any[] = [];

      if (activeTab === 'Trending') res = await fetchTrendingTokens();
      else if (activeTab === 'Graduated') res = await fetchMigratedTokens();
      else if (activeTab === 'New') res = await fetchNewlyCreatedTokens();
      else if (activeTab === 'B100') res = await fetchB100Tokens();
      // else if (activeTab === 'BlueChip') res = await fetchBlueChipMemes();
      // else if (activeTab === 'AI') res = await fetchAITokens();
      else res = TAB_DATA[activeTab] || [];

      setTokens(
        res.map((t: any) => ({
          mint: t.mint,
          name: t.name ?? 'Unknown',
          symbol: t.symbol ?? '',
          logo: t.image,
          progressPercent: Number(t.marketcap),
          mc: fmt1(t.marketcap),
          priceUsd: t.priceUsd,
          // liq: fmt1(t.liquidity),
          // vol: fmt1(t.volume),
          change: t.priceChange24h ?? 0,
        })),
      );
    } catch (e) {
      console.error('Refresh failed:', e);
    }
    setRefreshing(false);
  };

  // ------------------------- FILTER ----------------------------
  const filteredTokens = tokens.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ------------------------- UI ----------------------------
  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <SafeAreaView
        style={[
          styles.container,
          Platform.OS === 'android' && styles.androidSafeArea,
        ]}>
        {/* <AppHeader title="App" showBackButton={true} onBackPress={handleBack} /> */}

        <View style={styles.subcontainer}>
          {/* TABS */}
          <View style={styles.tabBar}>
            {TABS.map(tab => {
              const IconComp = activeTab === tab.key ? tab.icon : tab.darkIcon;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    activeTab === tab.key && styles.activeTab,
                  ]}
                  onPress={() => setActiveTab(tab.key)}>
                  <View style={styles.tabContent}>
                    {/* <IconComp width={16} height={16} /> */}
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === tab.key && styles.activeTabText,
                      ]}>
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* TOKEN LIST */}
          {loading ? (
            <View style={{padding: 24, alignItems: 'center'}}>
              <ActivityIndicator size="small" color={COLORS.brandPrimary} />
              <Text style={{color: COLORS.greyMid, marginTop: 10}}>
                Loading {activeTab}...
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTokens}
              keyExtractor={(item, idx) =>
                (item.mint ?? item.symbol ?? item.name ?? idx.toString()) +
                '-' +
                idx
              }
              // renderItem={({item}) => (
              //   <TokenCard
              //     {...item}
              //     onPress={() =>
              //       navigation.navigate(
              //         'TokenDetailScreen' as never,
              //         {token: item} as any,
              //       )
              //     }
              //   />
              // )}
              renderItem={({item}) => {
                const onPress = () =>
                  navigation.navigate(
                    'TokenDetailScreen' as never,
                    {token: item} as any,
                  );

                // ✅ TAB-BASED CARD SWITCH
                // if (activeTab === 'New') {
                //   return <NewTokenCard {...item} onPress={onPress} />;
                // }
                if (
                  activeTab === 'Graduated' ||
                  activeTab === 'B100' ||
                  activeTab === 'Trending'
                ) {
                  return <GraduatedTokenCard {...item} onPress={onPress} />;
                }
                return <NewTokenCard {...item} onPress={onPress} />;
              }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{paddingBottom: 40}}
              // ⭐ ENABLE BOUNCE + OVERSCROLL STRETCH
              bounces={true}
              alwaysBounceVertical={true}
              overScrollMode="always"
              // ⭐ PULL-TO-REFRESH ADDED HERE
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={COLORS.brandPrimary}
                  colors={[COLORS.brandPrimary]}
                />
              }
              ListFooterComponent={<View style={{height: 220}} />}
              ListEmptyComponent={
                <Text
                  style={{
                    color: COLORS.greyMid,
                    textAlign: 'center',
                    marginTop: 20,
                  }}>
                  No tokens found.
                </Text>
              }
            />
          )}
        </View>

        {/* SEARCH BAR (STICKY) */}
        <View style={styles.fixedSearch}>
          <SearchBoxButton
            placeholder="Search tokens..."
            onPress={() => navigation.navigate('GlobalSearchScreen' as never)}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ------------------------- STYLES ----------------------------
const styles = StyleSheet.create({
  container: {flex: 1, marginTop: 4},
  androidSafeArea: {paddingTop: 0},
  subcontainer: {marginTop: 5},
  tabBar: {
    flexDirection: 'row',
    // paddingHorizontal: 12,
    // paddingTop: 6,
    // paddingBottom: 2,
    height: 44,
    width: '80%',
    alignSelf: 'center',
    // alignItems: 'center',
    // gap: 10,
    justifyContent: 'space-evenly',
    borderRadius: 9,
    // borderWidth: 1,
    // borderColor: '#58595a',
    backgroundColor: '#3a598665',
    marginBottom: 25,
    marginTop: 10,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 6,

    // Android shadow
    elevation: 5,
  },

  tab: {
    // marginRight: 22,
    paddingVertical: 8,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#22C55E', // green underline
  },

  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    // justifyContent: 'space-evenly',
    gap: 6,
  },

  tabText: {
    color: '#8B93A7',
    fontSize: 14,
    fontWeight: '500',
  },

  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  fixedSearch: {
    position: 'absolute',
    bottom: 63,
    left: 0,
    right: 0,
  },
});
