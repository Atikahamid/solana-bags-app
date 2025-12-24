// ==== File: src/screens/TokensScreen.tsx ====
// ✅ MODIFICATION: Active tab handling logic updated to match SearchScreen
// ❌ UI / CSS / JSX / styles are UNCHANGED

import React, {useState, useEffect} from 'react';
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
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {
  BackendToken,
  getRelativeTime,
  getSortableTimestamp,
} from './tokenServicefile';
import {LinearGradient} from 'expo-linear-gradient';
import {useNewlyCreatedTokens} from './hooks/useNewlyCreatedTokens';
import {useAlmostBondedTokens} from './hooks/useAlmostBondedTokens';
import {useMigratedTokens} from './hooks/useMigratedTokens';
import {fmt1} from '../SearchScreen';

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

  // 🔌 DATA HOOKS (UNCHANGED)
  const hookNew = useNewlyCreatedTokens();
  const hookFinal = useAlmostBondedTokens();
  const hookMigrated = useMigratedTokens();

  // ======================================================
  // ✅ MODIFICATION START
  // Single tokens + loading state (like SearchScreen)
  // ======================================================
  const [tokens, setTokens] = useState<BackendToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadTokens() {
      setLoading(true);
      setTokens([]); // clear previous tab data immediately

      try {
        let res: BackendToken[] = [];

        if (activeTab === 'newPairs') {
          res = [...hookNew].sort((a, b) => {
            const t1 = getSortableTimestamp(a.time);
            const t2 = getSortableTimestamp(b.time);
            return t2 - t1;
          });
        } else if (activeTab === 'finalStretch') {
          res = [...hookFinal].sort((a, b) => {
            const p1 = Number(a.bonding_curve_progress ?? 0);
            const p2 = Number(b.bonding_curve_progress ?? 0);
            return p2 - p1; // DESCENDING (higher first)
          });
        } else if (activeTab === 'migrated') {
          res = hookMigrated;
        } else {
          setTokens(TAB_DATA[activeTab] || []);
          setLoading(false);
          return;
        }

        if (!mounted) return;
        setTokens(res);
      } catch (e) {
        console.error('[TokensScreen] Load error:', e);
        setTokens([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadTokens();
    return () => {
      mounted = false;
    };
  }, [activeTab, hookNew, hookFinal, hookMigrated]);

  // ======================================================
  // UI MAPPING (UNCHANGED)
  // ======================================================
  const mappedTokens = tokens.map(t => ({
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
    createdAgo: t.time ? getRelativeTime(t.time) : '0s',
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
                <TouchableOpacity style={headerStyles.profileContainer}>
                  <Icons.RefreshIcon
                    width={28}
                    height={28}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>

              <View style={headerStyles.absoluteLogoContainer}>
                <Icons.AppLogo width={28} height={28} />
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>

        {/* TABS (UNCHANGED) */}
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

        {/* LIST / LOADER */}
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
            renderItem={({item}) => <TokenCard {...item} />}
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
