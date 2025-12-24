// src/screens/LeaderBoardScreen.tsx
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Animated from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icons from '@/assets/svgs';
import COLORS from '@/assets/colors';
import {headerStyles} from '../profile-screen/ProfileScreennew';
import {useNavigation} from '@react-navigation/native';
import {LinearGradient} from 'expo-linear-gradient';
import {IPFSAwareImage} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import {useAuth} from '@/modules/wallet-providers';
import {SERVER_URL} from '@env';
import {Share} from 'react-native';
import GoldMedal from '@/assets/images/gold-medal.png';
import SilverMedal from '@/assets/images/silver-medal.png';
import BronzeMedal from '@/assets/images/brownze-medal.png';
import {useReferrals} from './useReferrals';

export type LeaderboardUser = {
  userPrivyId: string;
  username: string;
  profileImage: string;
  totalPnl: string;
  pnlPercent: string;
  tokenImages: string[];
};

const timeFilters = ['24h', '7d', '30d', 'All'];
type LeaderboardByTime = Record<'24h' | '7d' | '30d', LeaderboardUser[]>;

export default function LeaderBoardScreen() {
  const navigation = useNavigation();

  // 🔹 NEW TAB STATE
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rewards'>(
    'leaderboard',
  );

  const [selected, setSelected] = useState('24h');
  const [pnlUsd, setPnlUsd] = useState<string>('0.00');
  const [pnlLoading, setPnlLoading] = useState<boolean>(false);
  const {user, profile, fetchProfile} = useAuth();
  const privyId = user?.id;

  const [leaderboardByTime, setLeaderboardByTime] =
    useState<LeaderboardByTime | null>(null);
  const normalizedSelected = selected === 'All' ? '30d' : selected;

  const users =
    leaderboardByTime?.[normalizedSelected as '24h' | '7d' | '30d'] ?? [];

  const [loading, setLoading] = useState<boolean>(false);
  const {stats, referrals, loading: referralsLoading} = useReferrals(privyId);
  const pnlColor =
    Number(pnlUsd) > 0
      ? '#00FF77'
      : Number(pnlUsd) < 0
      ? '#FF4D4F'
      : '#f5f2f2ff';

  // ---------------- FETCH USER PNL ----------------
  const fetchUserPnl = useCallback(async () => {
    if (!privyId) return;

    try {
      setPnlLoading(true);
      const res = await fetch(
        `${SERVER_URL}/api/jupiter/ultra/get-pnl/${encodeURIComponent(
          privyId,
        )}`,
      );
      const data = await res.json();
      if (data.success) {
        setPnlUsd(data.totalPnl);
      }
    } catch (err) {
      console.error('Error fetching PnL:', err);
    } finally {
      setPnlLoading(false);
    }
  }, [privyId]);

  // ---------------- FETCH LEADERBOARD ----------------
  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${SERVER_URL}/api/jupiter/ultra/get-all-userpnl-by-time-metrics`,
      );
      const data = await res.json();

      if (data.success) {
        setLeaderboardByTime(data.data);
      }
    } catch (e) {
      console.error('Leaderboard fetch failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserPnl();
  }, [fetchUserPnl]);

  useEffect(() => {
    fetchLeaderboard();
    fetchProfile();
  }, [fetchLeaderboard, fetchProfile]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchUserPnl(), fetchLeaderboard(), fetchProfile()]);
  }, [fetchUserPnl, fetchLeaderboard, fetchProfile]);

  const formatPnl = (value: string) => {
    const num = Number(value);
    const sign = num > 0 ? '+' : '';
    return `${sign}$${num.toFixed(5)}`;
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.container}>
        {/* ---------------- HEADER (UNCHANGED) ---------------- */}
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, {padding: 16, height: 40}]}>
            <View style={headerStyles.container}>
              <TouchableOpacity
                onPress={() => navigation.navigate('FiltersScreen' as never)}
                style={headerStyles.profileContainer}>
                <Icons.SettingsIcon width={28} height={28} />
              </TouchableOpacity>

              <View style={headerStyles.iconsContainer}>
                <TouchableOpacity
                  onPress={handleRefresh}
                  disabled={loading || pnlLoading}
                  style={headerStyles.profileContainer}>
                  <Icons.RefreshIcon width={28} height={28} />
                </TouchableOpacity>
              </View>

              <View style={headerStyles.absoluteLogoContainer}>
                <Icons.AppLogo width={28} height={28} />
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>

        <View style={styles.container2}>
          {/* ---------------- NEW TABS ---------------- */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              onPress={() => setActiveTab('leaderboard')}
              style={[
                styles.tab,
                activeTab === 'leaderboard' && styles.activeTab,
              ]}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'leaderboard' && styles.activeTabText,
                ]}>
                Leaderboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('rewards')}
              style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}>
              <Icons.GiftIcon
                width={18}
                height={18}
                color={activeTab === 'rewards' ? '#fff' : '#7C7D8A'}
              />
            </TouchableOpacity>
          </View>

          {/* ================= LEADERBOARD TAB ================= */}
          {activeTab === 'leaderboard' && (
            <>
              {/* Header Card */}
              <View style={styles.headerCard}>
                <View style={styles.headerTopRow}>
                  <IPFSAwareImage
                    source={profile?.profile_image_url}
                    style={styles.myAvatar}
                    defaultSource={DEFAULT_IMAGES.user}
                    key={
                      Platform.OS === 'android'
                        ? `profile-${Date.now()}`
                        : 'profile'
                    }
                  />
                  <View>
                    <Text style={styles.rankText}>Your rank</Text>
                    <Text style={styles.rankNumber}># —</Text>
                  </View>
                </View>

                <Text style={[styles.balance, {color: pnlColor}]}>
                  {pnlLoading
                    ? 'Calculating PnL...'
                    : `$${Number(pnlUsd).toFixed(5)}`}
                </Text>
              </View>

              {/* Time Filters */}
              <View style={styles.segmentContainer}>
                {timeFilters.map(item => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setSelected(item)}
                    style={[
                      styles.segmentButton,
                      selected === item && styles.segmentButtonActive,
                    ]}>
                    <Text
                      style={[
                        styles.segmentText,
                        selected === item && styles.segmentTextActive,
                      ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Leaderboard List */}
              {loading ? (
                <ActivityIndicator size="medium" color={COLORS.brandPrimary} />
              ) : (
                <FlatList
                  data={users}
                  keyExtractor={item => item.userPrivyId}
                  contentContainerStyle={{paddingBottom: 80}}
                  renderItem={({item, index}) => {
                    const pnlColor =
                      Number(item.totalPnl) > 0
                        ? '#00FF70'
                        : Number(item.totalPnl) < 0
                        ? '#FF4D4F'
                        : '#FFFFFF';

                    const visibleImages = item.tokenImages.slice(0, 3);
                    const remaining = item.tokenImages.length - 3;

                    return (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate(
                            'LeaderBoardUserDetailScreen' as never,
                            {user: item} as never,
                          )
                        }
                        style={styles.row}>
                        <View style={styles.positionContainer}>
                          {index === 0 && (
                            <Image source={GoldMedal} style={styles.medal} />
                          )}
                          {index === 1 && (
                            <Image source={SilverMedal} style={styles.medal} />
                          )}
                          {index === 2 && (
                            <Image source={BronzeMedal} style={styles.medal} />
                          )}

                          {index > 2 && (
                            <Text style={styles.positionText}>{index + 1}</Text>
                          )}
                        </View>

                        <IPFSAwareImage
                          source={item.profileImage}
                          style={styles.avatar}
                          defaultSource={DEFAULT_IMAGES.user}
                        />

                        <View style={styles.userBlock}>
                          <Text style={styles.name}>{item.username}</Text>
                        </View>

                        <View style={styles.rightBlock}>
                          <Text style={[styles.profit, {color: pnlColor}]}>
                            {formatPnl(item.totalPnl)}
                          </Text>

                          <View style={styles.badgeRow}>
                            {visibleImages.map((img, i) => (
                              <Image
                                key={i}
                                source={{uri: img}}
                                style={[
                                  styles.tokenBadge,
                                  {marginLeft: i ? -6 : 0},
                                ]}
                              />
                            ))}

                            {remaining > 0 && (
                              <View
                                style={[styles.tokenBadge, styles.moreBadge]}>
                                <Text style={styles.moreText}>
                                  +{remaining}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </>
          )}

          {/* ================= REWARDS TAB ================= */}
          {activeTab === 'rewards' && (
            <View style={styles.rewardsWrapper}>
              <Text style={styles.rewardsHeader}>Referrals</Text>

              {/* 🔹 MODIFICATION: dynamic total rewards */}
              <Text style={styles.rewardsAmount}>
                ${stats?.totalRewards ?? '0.00'}
              </Text>
              <Text style={styles.rewardsSub}>Total earned rewards</Text>

              <LinearGradient
                colors={['#5B6CFF', '#7A5CFF']}
                style={styles.earnBanner}>
                <Icons.GiftIcon width={18} height={18} color="#fff" />
                <Text style={styles.earnBannerText}>
                  Earn 40% of your friends’ fees
                </Text>
              </LinearGradient>

              {/* 🔹 MODIFICATION: stats from API */}
              <View style={styles.statsRow}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    ${stats?.earnedLast7d ?? '0.00'}
                  </Text>
                  <Text style={styles.statLabel}>Earned last 7d</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    {stats?.friendsReferred ?? 0}
                  </Text>
                  <Text style={styles.statLabel}>Friends referred</Text>
                </View>
              </View>

              {/* 🔹 MODIFICATION: referral list OR footer */}
              {referralsLoading ? (
                <ActivityIndicator />
              ) : referrals.length > 0 ? (
                <FlatList
                  data={referrals}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={({item}) => (
                    <View style={styles.referralRow}>
                      <Image
                        source={
                          item.profile_image_url
                            ? {uri: item.profile_image_url}
                            : DEFAULT_IMAGES.user
                        }
                        style={styles.avatar}
                      />
                      <View style={{flex: 1}}>
                        <Text style={styles.name}>{item.username}</Text>
                        <Text style={styles.rewardsSub}>Fees earned</Text>
                      </View>
                      <Text style={styles.statValue}>${item.fees_earned}</Text>
                    </View>
                  )}
                />
              ) : (
                // 🔹 MODIFICATION: footer preserved when empty
                <View style={styles.rewardsFooter}>
                  <Icons.GiftIcon width={36} height={36} opacity={0.3} />
                  <Text style={styles.footerText}>
                    Invite your friends to start earning{'\n'}
                    25% of their trading fees.
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

// ---------------- STYLES ----------------
const styles = StyleSheet.create({
  container: {flex: 1},
  container2: {flex: 1, padding: 16},
  header: {width: '100%', backgroundColor: COLORS.background},

  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingVertical: 15,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    // height: 65,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  tab: {
    paddingHorizontal: 16,
    // marginRight: 12,
    borderRadius: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#1C2233',
    borderWidth: 1,
    borderColor: '#2F3848',
  },
  tabText: {color: '#7A8495', fontSize: 12.75, fontWeight: '600'},
  activeTabText: {color: '#FFFFFF', fontWeight: '700'},

  // Rewards
  rewardsContainer: {flex: 1, alignItems: 'center', marginTop: 60},
  rewardsTitle: {color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12},
  rewardsSubtitle: {
    color: '#7C7D8A',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },

  // Existing styles (unchanged)
  headerCard: {
    backgroundColor: '#0c0c1279',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    height: 100,
  },
  headerTopRow: {flexDirection: 'row', alignItems: 'center'},
  myAvatar: {width: 48, height: 48, borderRadius: 24, marginRight: 12},
  rankText: {color: '#7C7D8A', fontSize: 12},
  rankNumber: {color: '#FFFFFF', fontSize: 18, fontWeight: '600'},
  balance: {marginTop: 12, fontSize: 24, fontWeight: '700'},
  segmentContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c1279',
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  segmentButton: {paddingVertical: 6, paddingHorizontal: 14, borderRadius: 10},
  segmentButtonActive: {backgroundColor: '#1A1A22'},
  segmentText: {color: '#7C7D8A', fontSize: 13, fontWeight: '500'},
  segmentTextActive: {color: '#FFFFFF'},
  row: {
    flexDirection: 'row',
    backgroundColor: '#0c0c1281',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  positionContainer: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },

  positionText: {
    color: '#7C7D8A',
    fontSize: 15,
    fontWeight: '600',
  },

  medal: {
    width: 45,
    height: 40,
    resizeMode: 'contain',
  },

  avatar: {width: 40, height: 40, borderRadius: 20, marginRight: 12},
  userBlock: {flex: 1},
  name: {color: '#FFFFFF', fontSize: 15, fontWeight: '600'},
  rightBlock: {alignItems: 'flex-end'},
  profit: {fontSize: 15, fontWeight: '700'},
  badgeRow: {flexDirection: 'row', marginTop: 6},
  tokenBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#000',
  },
  moreBadge: {
    backgroundColor: '#1A1A22',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  moreText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  rewardsWrapper: {
    flex: 1,
    paddingTop: 12,
  },

  rewardsHeader: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  rewardsAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },

  rewardsSub: {
    color: '#7C7D8A',
    fontSize: 13,
    marginBottom: 20,
  },

  earnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
  },

  earnBannerText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 8,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#0c0c1281',
    borderRadius: 16,
    paddingVertical: 18,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
  },

  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
  },

  statLabel: {
    color: '#7C7D8A',
    fontSize: 12,
    marginTop: 4,
  },

  statDivider: {
    width: 1,
    backgroundColor: '#1F2433',
  },

  referralBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c1281',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 40,
  },

  referralText: {
    color: '#7C7D8A',
    fontSize: 13,
  },

  rewardsFooter: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 55,
  },

  footerText: {
    color: '#7C7D8A',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
  },
});
