// ==== File: src/screens/TokenDetailScreen.tsx ====
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Chart from './Chart';
import Icons from '@/assets/svgs';
import {getValidImageSource, IPFSAwareImage} from '@/shared/utils/IPFSImage';
import COLORS from '@/assets/colors';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import {useAppSelector} from '@/shared/hooks/useReduxHooks';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@/shared/navigation/RootNavigator';
import {headerStyles} from '../tokenPulse/TokenScreen';
import {LinearGradient} from 'expo-linear-gradient';
import TokenStats from './TokenStats';
import TokenStats2 from './TokenStats2';
import TokenStats3 from './TokenStats3';
import {fetchTokenStats, fetchTokenVideos, TokenStatsApiResponse, TokenVideo} from './tokenDetailService';

type TokenDetailParams = {
  TokenDetailScreen: {
    token: {
      name: string;
      symbol: string;
      logo?: string;
      mc: string;
      tokenDecimal: number;
      mint: string;
      change: number;
    };
  };
};

const TokenDetailScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<TokenDetailParams, 'TokenDetailScreen'>>();
  const {token} = route.params;
  const [stats, setStats] = useState<TokenStatsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  console.log('tpoken mint address: ', token);
  console.log('++++++++++++++++++__________________________');
  const [activeTab, setActiveTab] = useState<'videos' | 'holders' | 'about' | 'stats'>(
    'videos',
  );
  const [videos, setVideos] = useState<TokenVideo[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  //   console.log("token: ", token.tokenDecimal);
  // const onBackPress = () => { undefined}; // You can define a custom back press handler if needed
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    let mounted = true;

    fetchTokenStats(token.mint)
      .then(data => {
        if (mounted) setStats(data);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    fetchTokenVideos(token.mint)
      .then(data => {
        if (mounted) setVideos(data);
      })
      .finally(() => {
        if (mounted) setVideosLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [token.mint]);
  // const handleBackPress = () => {
  //     if (handleBack) {
  //         handleBack();
  //     } else if (navigation.canGoBack()) {
  //         navigation.goBack();
  //     }
  // };
  const handleProfilePress = () => {
    navigation.navigate('ProfileScreen');
  };

  const isPositive = Number(stats?.tokenStats.price_change_24h) >= 0;
  const changeColor = isPositive ? '#4CAF50' : '#FF4C4C';
  const arrow = isPositive ? (
    <Icons.FillArrowUp width={13} height={13} />
  ) : (
    <Icons.FillArrowDown width={13} height={13} />
  );
  const formattedChange = `${isPositive ? '+' : ''}${Number(
    stats?.tokenStats.price_change_24h,
  )?.toFixed(2)}%`;

  if (loading) return null; // or loader

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient as any}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <SafeAreaView
        style={[
          styles.container,
          Platform.OS === 'android' && styles.androidSafeArea,
        ]}>
        {/* Header */}
        {/* <Animated.View
          style={[styles.header, {padding: 16, height: 60, marginTop: 20}]}>
          <View style={headerStyles.container}>
            <TouchableOpacity onPress={handleBack} style={styles.leftButton}>
              <Icons.ArrowLeft width={24} height={24} color={COLORS.white} />
            </TouchableOpacity>
           
          </View>
        </Animated.View> */}

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Token Info */}
          <View style={styles.tokenContainer}>
            <View style={styles.insideTokenContainer}>
              {token.logo ? (
                <Image source={{uri: token.logo}} style={styles.tokenImage} />
              ) : (
                <View
                  style={[
                    styles.tokenImage,
                    {
                      backgroundColor: '#2c2c2c',
                      justifyContent: 'center',
                      alignItems: 'center',
                    },
                  ]}>
                  <Text style={{color: '#fff', fontWeight: 'bold'}}>
                    {token.symbol[0]}
                  </Text>
                  {/* <Text>{token.mint}</Text> */}
                </View>
              )}
              <View style={styles.topDiv}>
                <Text style={styles.tokenName}>{token.symbol}</Text>
                {/* <Text style={styles.tokenSymbol} numberOfLines={2}>
                  {token.name}
                </Text> */}
                <Text style={styles.tokenSymbol}>20.3k MC</Text>
              </View>
            </View>

            <View style={styles.mcpcdiv}>
              <Text style={styles.marketCap}>${0.00293}</Text>
              {/* <Text style={[styles.priceChange, {color: changeColor}]}>
                {arrow} {formattedChange}
              </Text> */}
              <View style={styles.changeRow}>
                {arrow}
                <Text style={[styles.priceChange, {color: changeColor}]}>
                  {formattedChange}
                </Text>
              </View>
            </View>
          </View>

          {/* ✅ Show liquidity & volume */}
          {/* <View style={styles.extraStats}>
                        <Text style={styles.extraText}>Liquidity: {token.liq}</Text>
                        <Text style={styles.extraText}>Volume: {token.vol}</Text>
                    </View> */}

          {/* Chart Component */}
          {/* <Chart mintAddress={token.mint} /> */}
          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'videos' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('videos')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'videos' && styles.activeTabText,
                ]}>
                Videos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'holders' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('holders')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'holders' && styles.activeTabText,
                ]}>
                Holders ({stats?.tokenStats?.holders_count ?? 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'about' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('about')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'about' && styles.activeTabText,
                ]}>
                About
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                activeTab === 'stats' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('stats')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'stats' && styles.activeTabText,
                ]}>
                Stats
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          {activeTab === 'videos' && (
            <View style={styles.tabContent}>
              {videosLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : videos.length === 0 ? (
                <Text style={styles.emptyText}>No videos available for this token.</Text>
              ) : (
                <View style={styles.videoGrid}>
                  {videos.map((video, index) => (
                    <TouchableOpacity
                      key={video.id}
                      style={styles.videoCard}
                      onPress={() =>
                        navigation.navigate('VideoDetail', {
                          id: video.id,
                        })
                      }>
                      <Image
                        source={{ uri: video.thumbnail_url || video.video_url }}
                        style={styles.videoCardImage}
                      />
                      <View style={styles.videoCardOverlay}>
                        {index === 0 ? (
                          <View style={styles.pinnedBadge}>
                            {/* <Text style={styles.pinnedText}>Pinned</Text> */}
                          </View>
                        ) : null}
                        <View style={styles.videoMetaRow}>
                          <Text style={styles.videoViewsText}>
                            ▶ {video.views_count ?? 0}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {activeTab === 'holders' && (
            <View style={styles.tabContent}>
              <TokenStats3 mint={token.mint} />
            </View>
          )}

          {activeTab === 'about' && (
            <View style={styles.tabContent}>
              <TokenStats2 stats={stats} />
            </View>
          )}
          {activeTab === 'stats' && (
            <View style={styles.tabContent}>
              <TokenStats stats={stats} />
            </View>
          )}
          {/* <TokenStats stats={stats} /> */}
          {/* <TokenStats2 stats={stats} /> */}
          {/* <Text>{token.mint}</Text> */}
          {/* <TokenStats3 mintAddress={token.mintAddress}/> */}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomBar}>
          {/* <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>⚡ Buy 1.00 Ξ</Text>
          </TouchableOpacity> */}

          <LinearGradient
            colors={['#427abbff', '#164780ff']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.actionButtonGradient}>
            <TouchableOpacity
              onPress={() =>
                (navigation as any).navigate('TradeScreen', {
                  mode: 'buy', // or "sell"
                  token: {
                    mintaddress: token.mint,
                    tokendecimal: token.tokenDecimal || 6,
                    symbol: token.symbol,
                    name: token.name,
                    logoURI: token.logo,
                    marketcapAtTrade: stats?.tokenStats.market_cap,
                  },
                })
              }>
              <Text style={styles.primaryText}>BUY</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  scrollContent: {paddingBottom: 120},
  androidSafeArea: {paddingTop: 0},
  header: {
    width: '100%',
    backgroundColor: COLORS.darkerBackground,
    alignItems: 'center',
  },
  mcpcdiv: {
    flexDirection: 'column',
    gap: 2,
    alignItems: 'flex-end',
    // justifyContent: 'space-between',
    // marginLeft: 10,
    // borderWidth: 1,
    // marginTop: 0,
  },
  leftButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
   changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 4,
    gap: 4,
  },
  topDiv: {
    flexDirection: 'column',
    gap: 2
  },
  actionButtonGradient: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  tokenContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingHorizontal: 16,
  },
  insideTokenContainer: {
    flexDirection: 'row',
  },
  tokenImage: {width: 50, height: 50, borderRadius: 25, marginRight: 12},
  tokenName: {color: '#fff', fontSize: 22, fontWeight: 'bold'},
  tokenSymbol: {color: '#808485', fontSize: 18, flexShrink: 1, width: 150},
  marketCap: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    // marginTop: 12,
    textAlign: 'center',
  },
  priceChange: {
    fontSize: 16,
    textAlign: 'center',
    // marginTop: 10,
  },
  extraStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    marginHorizontal: 20,
  },
  extraText: {
    color: '#ccc',
    fontSize: 14,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 17,
    // marginHorizontal: 16,
    marginTop: 20,
    borderBottomWidth: 1,
    // gap: 5,
    borderBottomColor: '#2c2e37ff',
  },
  tabButton: {
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 600,
    // marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#ffffff',
  },
  tabText: {
    color: '#8b8e9e',
    fontSize: 15,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tabContent: {
    padding: 16,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  videoCard: {
    width: '40%',
    height: 200,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#161a22',
  },
  videoCardImage: {
    width: '100%',
    height: '100%',
    aspectRatio: 1,
  },
  videoCardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 8,
    justifyContent: 'space-between',
  },
  pinnedBadge: {
    // backgroundColor: 'rgba(255, 0, 255, 0.9)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  pinnedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  videoMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoViewsText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: '#ccc',
    textAlign: 'center',
    paddingVertical: 24,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#2c2e37ff',
    marginRight: 8,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryText: {color: '#fff', fontWeight: 'bold'},
  primaryText: {color: '#fff', fontWeight: 'bold', fontSize: 16},
});

export default TokenDetailScreen;
