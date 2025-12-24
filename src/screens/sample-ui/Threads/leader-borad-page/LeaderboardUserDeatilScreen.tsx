// src/screens/LeaderBoardUserDetailScreen.tsx

import React, {useEffect, useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {headerStyles} from '../profile-screen/ProfileScreennew';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import Icons from '@/assets/svgs';
import {useNavigation} from '@react-navigation/native';
import COLORS from '@/assets/colors';
import {LinearGradient} from 'expo-linear-gradient';
import {IPFSAwareImage} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import {useAuth} from '@/modules/wallet-providers';
import {RouteProp, useRoute} from '@react-navigation/native';
import {LeaderboardUser} from './LeaderBoardScreen';
import {SERVER_URL} from '@env';
import Svg, {Circle, Path} from 'react-native-svg';

// -----------------------------------------------------
// Mock static data
// -----------------------------------------------------
const MOCK_USER = {
  name: 'jg',
  handle: '@jotagezin',
  bio1: 'everything will be ok in the end',
  bio2: 'if its not ok then its not the end',
  following: 60,
  followers: '14.1K',
  mutuals: 2,
  portfolio: '$806,586.11',
  change24h: '+$208,190.93',
  cashBalance: '$267.86',
};

// const OPEN_POSITIONS = [
//   {
//     id: '1',
//     name: 'TROLL',
//     icon: 'https://i.pravatar.cc/100?img=66',
//     price: '$429,326.13',
//     percent: '-19.49%',
//   },
// ];

// const CLOSED_POSITIONS = [
//   {
//     id: '1',
//     name: 'META',
//     icon: 'https://i.pravatar.cc/100?img=33',
//     profit: '+$189,149.55',
//   },
//   {
//     id: '2',
//     name: 'PFP',
//     icon: 'https://i.pravatar.cc/100?img=22',
//     profit: '+$44,838.26',
//   },
//   {
//     id: '3',
//     name: 'CLANKER',
//     icon: 'https://i.pravatar.cc/100?img=73',
//     profit: '+$21,010.73',
//   },
// ];
type OpenPosition = {
  tokenMint: string;
  tokenName: string;
  symbol: string;
  image: string;
  remainingQty: string;
  pnlUsd: string;
  pnlPercent: string;
};

type ClosedPosition = {
  tokenMint: string;
  tokenName: string;
  symbol: string;
  image: string;
  pnlUsd: string;
  pnlPercent: string;
  closedAt: string | null;
};

type LeaderboardDetailRouteParams = {
  LeaderBoardUserDetailScreen: {
    user: LeaderboardUser;
  };
};

// -----------------------------------------------------
// Component: User Header
// -----------------------------------------------------
const UserHeaderSection = ({user}: {user: LeaderboardUser}) => {
  // const {profile} = useAuth();
  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTopRow}>
        <IPFSAwareImage
          source={user?.profileImage}
          style={styles.userAvatar}
          defaultSource={DEFAULT_IMAGES.user}
          key={Platform.OS === 'android' ? `profile-${Date.now()}` : 'profile'}
        />
        <Text style={styles.userName}>{user?.username}</Text>
        {/* <Image
          source={{uri: 'https://i.pravatar.cc/100?img=1'}}
          style={styles.userAvatar}
        /> */}

        {/* <TouchableOpacity style={styles.followButton}>
          <Text style={styles.followText}>Follow</Text>
        </TouchableOpacity> */}
      </View>

      {/* <Text style={styles.userHandle}>{MOCK_USER.handle}</Text> */}

      {/* <View style={styles.bioContainer}>
        <Text style={styles.bioLine}>{MOCK_USER.bio1}</Text>
        <Text style={styles.bioLine}>{MOCK_USER.bio2}</Text>
      </View> */}

      {/* <View style={styles.userStatsRow}>
        <Text style={styles.statsText}>{MOCK_USER.following} Following</Text>
        <Text style={styles.statsText}>{MOCK_USER.followers} Followers</Text>
        <Text style={styles.statsText}>
          {MOCK_USER.mutuals} mutuals following
        </Text>
      </View> */}
    </View>
  );
};
type Props = {
  userPrivyId: string;
};

type ApiResponse = {
  success: boolean;
  window: '24h' | '7d' | '30d';
  points: {timestamp: string; equity: string}[];
};

const WIDTH = 320;
const HEIGHT = 140;
const PADDING = 12;

const UserChartSection = ({
  user,
  refreshKey,
  totalPnl,
}: {
  user: LeaderboardUser;
  refreshKey: number;
  totalPnl: string;
}) => {
  console.log('user: ', user);
  const [selected, setSelected] = useState<'24h' | '7d' | '30d'>('24h');
  const [points, setPoints] = useState<number[]>([]);
  const [latest, setLatest] = useState<number>(0);
  const [chartLoading, setChartLoading] = useState(true);
  const pnl = Number(totalPnl);
  const isPositive = pnl >= 0;
  const sign = isPositive ? '+' : '-';
  const color = isPositive ? '#16a34a' : '#dc2626'; // green / red
  useEffect(() => {
    let mounted = true;
    setChartLoading(true);

    const fetchChart = async () => {
      try {
        console.log('selected: ', selected);
        const res = await fetch(
          `${SERVER_URL}/api/jupiter/ultra/user-chart/${user.userPrivyId}?window=${selected}`,
        );
        const json: ApiResponse = await res.json();
        // console.log("chart response: ", json);
        if (!mounted || !json.success) return;

        const values = json.points.map(p => Number(p.equity));
        setPoints(values);
        setLatest(values.at(-1) ?? 0);
      } catch (e) {
        console.error('chart fetch failed', e);
      } finally {
        mounted && setChartLoading(false);
      }
    };

    fetchChart();
    return () => {
      mounted = false;
    };
  }, [selected, user.userPrivyId, refreshKey]);

  const path = useMemo(() => {
    if (points.length < 2) return '';

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    return points
      .map((v, i) => {
        const x = PADDING + (i / (points.length - 1)) * (WIDTH - PADDING * 2);
        const y =
          HEIGHT - PADDING - ((v - min) / range) * (HEIGHT - PADDING * 2);

        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points]);
  const lastPoint = useMemo(() => {
    if (points.length === 0) return null;

    const min = Math.min(...points);
    const max = Math.max(...points);
    const range = max - min || 1;

    const x =
      PADDING +
      ((points.length - 1) / (points.length - 1)) * (WIDTH - PADDING * 2);

    const y =
      HEIGHT -
      PADDING -
      ((points.at(-1)! - min) / range) * (HEIGHT - PADDING * 2);

    return {x, y};
  }, [points]);

  const timeOptions: ('24h' | '7d' | '30d')[] = ['24h', '7d', '30d'];

  return (
    <View style={styles.chartCard}>
      {/* ===== TOP ROW (UNCHANGED UI) ===== */}
      <View style={styles.chartTopRow}>
        <View>
          <Text style={styles.portfolioAmount}>
            ${Math.floor(latest).toLocaleString()}
            <Text style={styles.portfolioDecimal}>
              .{((latest % 1) * 100).toFixed(0).padStart(2, '0')}
            </Text>
          </Text>

          <Text style={styles.change24h}>
            <Text style={{color}}>
              {sign}${Math.abs(pnl).toFixed(5)}
            </Text>{' '}
            <Text style={styles.changeLabel}>{selected}</Text>
          </Text>
        </View>

        <View style={styles.timeFilterRow}>
          {timeOptions.map(t => (
            <TouchableOpacity
              key={t}
              onPress={() => setSelected(t)}
              style={[
                styles.timeFilterBtn,
                selected === t && styles.timeFilterActive,
              ]}>
              <Text
                style={[
                  styles.timeFilterText,
                  selected === t && styles.timeFilterTextActive,
                ]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ===== CHART (REAL DATA) ===== */}
      <View style={styles.chartContainer}>
        {chartLoading ? (
          <ActivityIndicator size="small" color="#00FF7F" />
        ) : (
          <Svg width={WIDTH} height={HEIGHT}>
            <Path d={path} stroke="#00FF7F" strokeWidth={2.5} fill="none" />
            {lastPoint && (
              <Circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill="#00FF7F" />
            )}
          </Svg>
        )}
      </View>
    </View>
  );
};

// -----------------------------------------------------
// Component: Open Positions
// -----------------------------------------------------
const OpenPositionsSection = ({
  data,
  loading,
}: {
  data: OpenPosition[];
  loading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(v => !v)}>
        <Text style={styles.sectionTitle}>Open positions</Text>
        {expanded ? (
          <Icons.ArrowUp width={20} height={20} color={COLORS.white} />
        ) : (
          <Icons.DownArrowKey width={20} height={20} color={COLORS.white} />
        )}
      </TouchableOpacity>

      {expanded &&
        (loading ? (
          <ActivityIndicator size="small" color={COLORS.brandPrimary} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={i => i.tokenMint}
            renderItem={({item}) => {
              const pnlPercent = Number(item.pnlPercent);
              const isPositive = pnlPercent >= 0;

              return (
                <View style={styles.positionRow}>
                  <Image
                    source={{uri: item.image}}
                    style={styles.positionIcon}
                  />

                  <View style={{flex: 1}}>
                    <Text style={styles.positionName}>{item.symbol}</Text>
                    <Text style={{color: '#6B7280', fontSize: 12}}>
                      {item.remainingQty} {item.symbol}
                    </Text>
                  </View>

                  <View style={{alignItems: 'flex-end'}}>
                    <Text style={styles.positionPrice}>${item.pnlUsd}</Text>

                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      {isPositive ? (
                        <Icons.GreenArrowUp
                          width={18}
                          height={18}
                          color="#00FF7F"
                        />
                      ) : (
                        <Icons.RedArrowDown
                          width={18}
                          height={18}
                          color="#FF3B5C"
                        />
                      )}

                      <Text
                        style={[
                          styles.positionPercentRed,
                          {
                            color: isPositive ? '#00FF7F' : '#FF3B5C',
                            marginLeft: 4,
                          },
                        ]}>
                        {Math.abs(pnlPercent).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        ))}
    </View>
  );
};

/* ---------------- CLOSED POSITIONS ---------------- */

const ClosedPositionsSection = ({
  data,
  loading,
}: {
  data: ClosedPosition[];
  loading: boolean;
}) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(v => !v)}>
        <Text style={styles.sectionTitle}>Closed positions</Text>
        {expanded ? (
          <Icons.ArrowUp width={20} height={20} color={COLORS.white} />
        ) : (
          <Icons.DownArrowKey width={20} height={20} color={COLORS.white} />
        )}
      </TouchableOpacity>

      {expanded &&
        (loading ? (
          <ActivityIndicator size="small" color={COLORS.brandPrimary} />
        ) : (
          <FlatList
            data={data}
            keyExtractor={i => i.tokenMint}
            renderItem={({item}) => {
              const pnl = Number(item.pnlUsd);
              const pnlPct = Number(item.pnlPercent);
              const isProfit = pnl >= 0;

              return (
                <View style={styles.positionRow}>
                  <Image
                    source={{uri: item.image}}
                    style={styles.positionIcon}
                  />

                  {/* LEFT */}
                  <View style={{flex: 1}}>
                    <Text style={styles.positionName}>{item.symbol}</Text>
                    <Text style={styles.positionSubText}>
                      {item.closedAt ? formatClosedAt(item.closedAt) : '--'}
                    </Text>
                  </View>

                  {/* RIGHT */}
                  <View style={{alignItems: 'flex-end'}}>
                    <Text
                      style={[
                        styles.positionPnlValue,
                        {color: isProfit ? '#00FF7F' : '#FF3B5C'},
                      ]}>
                      {isProfit ? '+' : '-'}${Math.abs(pnl).toFixed(5)}
                    </Text>

                    <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      {pnlPct >= 0 ? (
                        <Icons.GreenArrowUp
                          width={14}
                          height={14}
                          color={COLORS.white}
                        />
                      ) : (
                        <Icons.RedArrowDown
                          width={14}
                          height={14}
                          color={COLORS.white}
                        />
                      )}

                      <Text
                        style={[
                          styles.positionPnlPercent,
                          {color: COLORS.white, marginLeft: 4},
                        ]}>
                        {Math.abs(pnlPct).toFixed(2)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        ))}
    </View>
  );
};

const useUserPositions = (userPrivyId: string, refreshKey: number) => {
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  // console.log('open positions: ', openPositions);
  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>([]);
  // console.log('closed positions: ', closedPositions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchPositions = async () => {
      try {
        const res = await fetch(
          `${SERVER_URL}/api/jupiter/ultra/users/${userPrivyId}/positions`,
        );
        const json = await res.json();

        if (!mounted) return;

        setOpenPositions(json.openPositions ?? []);
        setClosedPositions(json.closedPositions ?? []);
      } catch (e) {
        console.error('positions fetch failed', e);
      } finally {
        mounted && setLoading(false);
      }
    };

    fetchPositions();
    return () => {
      mounted = false;
    };
  }, [userPrivyId, refreshKey]);

  return {openPositions, closedPositions, loading};
};

const formatClosedAt = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// -----------------------------------------------------
// MAIN SCREEN COMPONENT
// -----------------------------------------------------
export default function LeaderBoardUserDetailScreen() {
  const navigation = useNavigation();
  const route =
    useRoute<
      RouteProp<LeaderboardDetailRouteParams, 'LeaderBoardUserDetailScreen'>
    >();
  const [refreshKey, setRefreshKey] = useState(0);

  const {user} = route.params;
  console.log('user: ', user);
  const handleRefresh = () => {
    setRefreshKey(v => v + 1);
  };
  const {openPositions, closedPositions, loading} = useUserPositions(
    user.userPrivyId,
  );

  console.log('open positions: ', openPositions);
  console.log('closed  positions: ', closedPositions);

  // if (loading) {
  //   return (
  //     <LinearGradient
  //       colors={COLORS.backgroundGradient}
  //       start={{x: 0, y: 0}}
  //       end={{x: 0, y: 1}}
  //       style={styles.container}>
  //       <ActivityIndicator
  //         size="large"
  //         color={COLORS.brandPrimary}
  //         style={{marginTop: 100}}
  //       />
  //     </LinearGradient>
  //   );
  // }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <ScrollView style={styles.container}>
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, {padding: 16, height: 80}]}>
            <View style={headerStyles.container}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={headerStyles.profileContainer}>
                <Icons.ArrowLeft width={28} height={28} color={COLORS.white} />
              </TouchableOpacity>

              <View style={headerStyles.iconsContainer}>
                <TouchableOpacity
                  onPress={handleRefresh}
                  style={headerStyles.profileContainer}>
                  <Icons.RefreshIcon
                    width={28}
                    height={28}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>

              {/* <View style={headerStyles.absoluteLogoContainer}>
              <Icons.AppLogo width={28} height={28} />
            </View> */}
            </View>
          </Animated.View>
        </SafeAreaView>
        <UserHeaderSection user={user} />

        <UserChartSection
          user={user}
          refreshKey={refreshKey}
          totalPnl={user.totalPnl}
        />

        {/* Cash Balance */}
        <View style={styles.cashBalanceCard}>
          <Text style={styles.cashLabel}>Cash balance</Text>
          <Text style={styles.cashValue}>{MOCK_USER.cashBalance}</Text>
        </View>
        <View
          style={{
            height: 2,
            backgroundColor: '#2A2A2A',
            marginVertical: 5,
            marginHorizontal: 16,
          }}
        />

        <OpenPositionsSection data={openPositions} loading={loading} />
        <ClosedPositionsSection data={closedPositions} loading={loading} />

        <View style={{height: 60}} />
      </ScrollView>
    </LinearGradient>
  );
}

// -----------------------------------------------------
// Styles
// -----------------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: '#05050A',
  },

  headerContainer: {
    padding: 16,
    // backgroundColor: '#0b0b1352',
  },
  header: {
    width: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  // ==============================
  chartCard: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  chartTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  portfolioAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: 'white',
    lineHeight: 38,
  },

  portfolioDecimal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#A1A1AA',
  },

  change24h: {
    marginTop: 4,
    fontSize: 14,
    color: '#00FF7F',
    fontWeight: '600',
  },

  changeLabel: {
    color: '#9092A0',
    fontWeight: '500',
  },

  timeFilterRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 35,
  },

  timeFilterBtn: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#0F0F17',
  },

  timeFilterActive: {
    backgroundColor: '#1C1C26',
  },

  timeFilterText: {
    fontSize: 12,
    color: '#6B7280',
  },

  timeFilterTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  chartContainer: {
    marginTop: 15,
    height: 150,
    backgroundColor: '#0b0b137c',
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
  },

  chartLine: {
    position: 'absolute',
    left: 0,
    right: 20,
    top: '45%',
    height: 2.5,
    backgroundColor: '#00FF7F',
    borderRadius: 50,
  },

  chartDrop: {
    position: 'absolute',
    right: 20,
    top: '45%',
    height: 45,
    width: 2.5,
    backgroundColor: '#00FF7F',
    borderRadius: 50,
  },

  chartDot: {
    position: 'absolute',
    right: 16,
    top: '45%',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF7F',
  },
  // =========================

  headerTopRow: {
    flexDirection: 'row',
    gap: 35,
    // justifyContent: 'space-between',
  },

  userAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },

  followButton: {
    backgroundColor: '#3B3EFE',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
  },

  followText: {
    color: 'white',
    fontWeight: '600',
  },

  userName: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },

  userHandle: {
    color: '#9092A0',
    fontSize: 13,
    marginBottom: 8,
  },

  bioContainer: {
    marginVertical: 6,
  },

  bioLine: {
    color: 'white',
    fontSize: 13,
  },

  userStatsRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 14,
  },

  statsText: {
    color: '#9092A0',
    fontSize: 13,
  },

  fakeChart: {
    backgroundColor: '#0D0D15',
    height: 140,
    borderRadius: 14,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  cashBalanceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },

  cashLabel: {
    color: '#9092A0',
    fontSize: 16,
  },

  cashValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 6,
  },

  sectionCard: {
    padding: 16,
  },

  sectionTitle: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },

  positionRow: {
    flexDirection: 'row',
    backgroundColor: '#0c0c1273',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },

  positionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },

  positionName: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },

  positionPrice: {
    color: 'white',
    fontSize: 14,
  },

  positionPercentRed: {
    color: '#FF3B5C',
    fontSize: 13,
  },

  positionProfitGreen: {
    color: '#00FF7F',
    fontSize: 14,
    fontWeight: '700',
  },
  positionSubText: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
  },

  positionPnlValue: {
    fontSize: 15,
    fontWeight: '700',
  },

  positionPnlPercent: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
});
