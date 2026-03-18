// ==== File: src/screens/TokensScreen.tsx ====
// ✅ MODIFICATION: Data normalization added
// ❌ UI / JSX / STYLES UNCHANGED

import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  ActivityIndicator,
} from 'react-native';
import Icons from '@/assets/svgs';
import {TokenCard} from './TokenCard';
import COLORS from '@/assets/colors';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  BackendToken,
  getRelativeTime,
  getSortableTimestamp,
  getUserFilters,
} from './tokenServicefile';
import {LinearGradient} from 'expo-linear-gradient';
import {useNewlyCreatedTokens} from './hooks/useNewlyCreatedTokens';
import {useAlmostBondedTokens} from './hooks/useAlmostBondedTokens';
import {useMigratedTokens} from './hooks/useMigratedTokens';
import {fmt1} from '../SearchScreen';
import {useAuth} from '@/modules/wallet-providers';

// ======================
// ✅ NEW: NORMALIZED TYPE
// ====================== 
type NormalizedToken = {
  mint: string;
  name: string;
  symbol: string;
  image?: string | null;
  decimals?: number;
  marketcap?: number;
  liquidity?: number;
  volume?: number;
  priceChange24h?: number;
  time?: number;
  bonding_curve_progress?: number;
  txns?: number;
  holders?: number;
  protocol_family?: string;
  social_twitter?: string;
  social_telegram?: string;
  social_website?: string;
  social_tiktok?: string;
  holding_top_10?: number;
  holding_snipers?: number;
};

const TABS = [
  {
    key: 'newPairs',
    label: 'New Pairs',
    icon: Icons.NewTokensIcon,
    darkIcon: Icons.NewTokensDark,
  },
  {
    key: 'finalStretch',
    label: 'Final Stretch',
    icon: Icons.FinalStretchicon,
    darkIcon: Icons.FinalStretchDark,
  },
  {
    key: 'migrated',
    label: 'Migrated',
    icon: Icons.MigratedIcon,
    darkIcon: Icons.MigratedDark,
  },
];

const TAB_DATA: Record<string, any[]> = {
  newPairs: [],
  finalStretch: [],
  migrated: [],
};

export const TokensScreen: React.FC = () => {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState<
    'newPairs' | 'finalStretch' | 'migrated'
  >('newPairs');
   const [screenTokens, setScreenTokens] = useState<BackendToken[]>([]);
  const [loading, setLoading] = useState(true);
  const {user} = useAuth();
  const [filters, setFilters] = useState<any>(null);
  const stableFilters = useMemo(() => {
    return filters;
  }, [JSON.stringify(filters)]);

  // 🔌 DATA HOOKS (UNCHANGED)
  const hookNew = useNewlyCreatedTokens(stableFilters);
  const hookFinal = useAlmostBondedTokens(stableFilters);
  const hookMigrated = useMigratedTokens(stableFilters);

  // ==========================
  // ✅ SINGLE TOKEN STATE
  // ==========================
  // const [tokens, setTokens] = useState<NormalizedToken[]>([]);
  // const [loading, setLoading] = useState(true);

 

  useFocusEffect(
    useCallback(() => {
      if (!user?.id) return;

      (async () => {
        const res = await getUserFilters(user.id);
        console.log("filters in token: ", res);
        setFilters(res.filters);
      })();
    }, [user?.id]),
  );
  // ==========================
  // ✅ DATA LOADING (MODIFIED)
  // ==========================
  useEffect(() => {
    let mounted = true;

    // ✅ FORCE LOADER ON TAB SWITCH
    setLoading(true);
    setScreenTokens([]);

    // ⏱️ allow loader to render for at least 1 frame
    const timeout = setTimeout(() => {
      if (!mounted) return;

      let sourceTokens: BackendToken[] = [];
      let sourceLoading = true;

      if (activeTab === 'newPairs') {
        sourceTokens = hookNew.tokens;
        sourceLoading = hookNew.isLoading;
      } else if (activeTab === 'finalStretch') {
        sourceTokens = hookFinal.tokens;
        sourceLoading = hookFinal.isLoading;
      } else {
        sourceTokens = hookMigrated.tokens;
        sourceLoading = hookMigrated.isLoading;
      }

      // ⏳ wait until hook finishes loading
      if (!sourceLoading) {
        setScreenTokens(sourceTokens);
        setLoading(false);
      }
    }, 0); // 👈 critical

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, [
    activeTab,
    hookNew.tokens,
    hookNew.isLoading,
    hookFinal.tokens,
    hookFinal.isLoading,
    hookMigrated.tokens,
    hookMigrated.isLoading,
  ]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setScreenTokens([]);

      if (activeTab === 'newPairs') {
        hookNew.refetch();
      } else if (activeTab === 'finalStretch') {
        hookFinal.refetch();
      } else {
        hookMigrated.refetch();
      }
    }, [activeTab]),
  );
  // ==========================
  // UI MAPPING (UNCHANGED)
  // ==========================
  const mappedTokens = screenTokens.map(t => ({
    mint: t.mint,
    logo: t.image ?? 'https://dummyimage.com/42x42/666/fff.png&text=?',
    name: t.name ?? 'Unknown',
    symbol: t.symbol ?? '',
    mc: fmt1(t.marketcap),
    twitterX: t.social_twitter,
    telegramX: t.social_telegram,
    website: t.social_website,
    tiktok: t.social_tiktok,
    protocolFamily: t.protocol_family,
    holdersCount: Number(t.holders ?? 0),
    volume: fmt1(t.volume),
    fee: 0,
    txCount: Number(t.txns ?? 0),
    createdAgo: getRelativeTime(t.time ?? 0),
    bondingProgress: t.bonding_curve_progress ?? 0,
    isMigrated: activeTab === 'migrated',
    stats: {
      starUser: Number(t.holding_top_10).toFixed(1),
      cloud: Number(t.holding_snipers).toFixed(1),
      target: '-0%',
      ghost: '0%',
      blocks: '-0%',
    },
  }));

  const onRefresh = async () => {
    setLoading(true);
    setScreenTokens([]);

    try {
      if (activeTab === 'newPairs') {
        await hookNew.refetch();
      } else if (activeTab === 'finalStretch') {
        await hookFinal.refetch();
      } else {
        await hookMigrated.refetch();
      }
    } finally {
      // loader will stop automatically via useEffect when hook loading becomes false
    }
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.container}>
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, {padding: 16, height: 80}]}>
            <View style={headerStyles.container}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FiltersScreen' as never)}
                style={headerStyles.profileContainer}>
                <Icons.SettingsIcon
                  width={28}
                  height={28}
                  color={COLORS.white}
                />
              </TouchableOpacity>

              <View style={headerStyles.iconsContainer}>
                <TouchableOpacity
                  style={headerStyles.profileContainer}
                  onPress={onRefresh}>
                  <Icons.RefreshIcon
                    width={28}
                    height={28}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>

        <View style={styles.tabsContainer}>
          {TABS.map(tab => {
            const IconComp = activeTab === tab.key ? tab.icon : tab.darkIcon;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key as any)}>
                <View
                  style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                  <IconComp width={15} height={15} />
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

        {loading ? (
          <View style={{padding: 24, alignItems: 'center'}}>
            <ActivityIndicator size="small" color={COLORS.brandPrimary} />
            <Text style={{color: COLORS.greyMid, marginTop: 10}}>
              Loading {activeTab}...
            </Text>
          </View>
        ) : (
          <FlatList
            data={mappedTokens}
            keyExtractor={(item, idx) => item.mint ?? `${activeTab}-${idx}`}
            renderItem={({item}) => (
              <TokenCard
                {...item}
                onPress={() =>
                  navigation.navigate(
                    'TokenDetailScreen' as never,
                    {token: item} as any,
                  )
                }
              />
            )}
            contentContainerStyle={{padding: 12, paddingBottom: 80}}
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

        <TouchableOpacity
          style={styles.launchButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('MeteoraScreen' as never)}>
          <Text style={styles.launchButtonText}>Launch a Coin</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// ================== STYLES (UNCHANGED) ==================

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    width: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tab: {
    paddingHorizontal: 12,
    marginLeft: 2,
    marginRight: 3,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#1C2233',
    borderWidth: 1,
    borderColor: '#2F3848',
    paddingBottom: 3,
    paddingTop: 3,
    marginTop: -3,
  },
  tabText: {
    fontWeight: '600',
    color: COLORS.greyMid,
    fontSize: 12.75,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  launchButton: {
    position: 'absolute',
    bottom: 63,
    left: 70,
    right: 70,
    backgroundColor: '#1e4476ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  launchButtonText: {color: COLORS.white, fontSize: 16, fontWeight: '600'},
});

export const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    position: 'relative',
  },
  profileContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
  },
  iconsContainer: {flexDirection: 'row', alignItems: 'center'},
  absoluteLogoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
});
