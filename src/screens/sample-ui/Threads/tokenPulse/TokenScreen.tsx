// ==== File: src/screens/TokensScreen.tsx ====

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
import {BackendToken, getRelativeTime} from './tokenServicefile';
import {LinearGradient} from 'expo-linear-gradient';
import {useAppSelector} from '@/shared/hooks/useReduxHooks';
import {useNewlyCreatedTokens} from './hooks/useNewlyCreatedTokens';
import {useAlmostBondedTokens} from './hooks/useAlmostBondedTokens';
import {useMigratedTokens} from './hooks/useMigratedTokens';

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

export const TokensScreen: React.FC = () => {
  const navigation = useNavigation();
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);

  // ====== TAB STATE ======
  const [activeTab, setActiveTab] = useState<
    'newPairs' | 'finalStretch' | 'migrated'
  >('newPairs');

  // ====== FETCH HOOKS (ASYNC) ======
  const hookNew = useNewlyCreatedTokens();
  const hookFinal = useAlmostBondedTokens();
  const hookMigrated = useMigratedTokens();

  // ====== LOCAL STORED DATA (FETCHED ONCE) ======
  const [newPairs, setNewPairs] = useState<BackendToken[]>([]);
  const [finalStretch, setFinalStretch] = useState<BackendToken[]>([]);
  const [migrated, setMigrated] = useState<BackendToken[]>([]);

  // ====== TAB-SPECIFIC LOADERS ======
  const [loadingNew, setLoadingNew] = useState(true);
  const [loadingFinal, setLoadingFinal] = useState(true);
  const [loadingMigrated, setLoadingMigrated] = useState(true);

  const [displayTokens, setDisplayTokens] = useState<BackendToken[]>([]);

  // ====== CAPTURE HOOK RESULTS WHEN READY ======
  useEffect(() => {
    if (hookNew && hookNew.length > 0) {
      setNewPairs(hookNew);
      setLoadingNew(false);
    }
  }, [hookNew]);

  useEffect(() => {
    if (hookFinal && hookFinal.length > 0) {
      setFinalStretch(hookFinal);
      setLoadingFinal(false);
    }
  }, [hookFinal]);

  useEffect(() => {
    if (hookMigrated && hookMigrated.length > 0) {
      setMigrated(hookMigrated);
      setLoadingMigrated(false);
    }
  }, [hookMigrated]);

  // ====== UPDATE UI WHEN TAB CHANGES (INSTANT SWITCH) ======
  useEffect(() => {
    if (activeTab === 'newPairs') {
      setDisplayTokens(newPairs);
    } else if (activeTab === 'finalStretch') {
      setDisplayTokens(finalStretch);
    } else if (activeTab === 'migrated') {
      setDisplayTokens(migrated);
    }
  }, [activeTab, newPairs, finalStretch, migrated]);

  // Determine loading for current tab
  const tabLoading =
    activeTab === 'newPairs'
      ? loadingNew
      : activeTab === 'finalStretch'
      ? loadingFinal
      : loadingMigrated;

  // ====== MAP TOKENS TO UI PROPS ======
  const mappedTokens = displayTokens.map(t => ({
    mint: t.mint,
    logo: t.image ?? 'https://dummyimage.com/42x42/666/fff.png&text=?',
    name: t.name ?? 'Unknown',
    symbol: t.symbol ?? '',
    mc: `$${Number(t.analytics?.allTimeVolumeUSD ?? 0).toLocaleString()}`,
    twitterX: t.twitterX,
    telegramX: t.telegramX,
    website: t.website,
    protocolFamily: t.protocolFamily,
    holdersCount: Number(t.analytics?.holderCount ?? 0),
    volume: Number(t.analytics?.currentVolumeUSD ?? 0),
    fee: Number(t.fee ?? 0),
    txCount: Number(t.analytics?.totalTrades ?? 0),
    createdAgo: t.blockTime ? getRelativeTime(t.blockTime) : '0s',
    stats: {
      starUser: '-0%',
      cloud: '0%',
      target: '-0%',
      ghost: '0%',
      blocks: '-0%',
    },
  }));

  const handleProfilePress = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.container}>
        {/* ================= HEADER (UNCHANGED) ================= */}
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, {padding: 16, height: 80}]}>
            <View style={headerStyles.container}>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('FiltersScreen' as never)
                }
                style={headerStyles.profileContainer}>
                <Icons.SettingsIcon width={28} height={28} color={COLORS.white} />
              </TouchableOpacity>

              <View style={headerStyles.iconsContainer}>
                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={headerStyles.profileContainer}>
                  <Icons.RefreshIcon width={28} height={28} color={COLORS.white} />
                </TouchableOpacity>
              </View>

              <View style={headerStyles.absoluteLogoContainer}>
                <Icons.AppLogo width={28} height={28} />
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>

        {/* ================= TABS (UNCHANGED UI) ================= */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => {
            const IconComp = activeTab === tab.key ? tab.icon : tab.darkIcon;

            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.activeTab]}
                onPress={() => setActiveTab(tab.key as typeof activeTab)}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
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

        {/* ================= TOKEN LIST ================= */}
        {tabLoading ? (
          <ActivityIndicator
            style={{marginTop: 20}}
            size="large"
            color={COLORS.white}
          />
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

        {/* ================= FLOATING BUTTON (UNCHANGED) ================= */}
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
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 4,
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
