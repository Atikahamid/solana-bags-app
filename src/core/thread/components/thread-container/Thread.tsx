import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getThreadBaseStyles, headerStyles } from './Thread.styles';
import { mergeStyles } from '../../utils';
import Icons from '../../../../assets/svgs';
import { ThreadProps } from '../../types';
import { IPFSAwareImage, getValidImageSource } from '@/shared/utils/IPFSImage';
import { useAppSelector } from '@/shared/hooks/useReduxHooks';
import { DEFAULT_IMAGES } from '@/shared/config/constants';
import COLORS from '@/assets/colors';
import { useTrades } from '../../hooks/useTrades';
import { formatTimeAgo } from '../../utils';
import { formatCompactNumber } from '@/screens/sample-ui/Threads/SearchScreen';
import SearchBox from '@/screens/sample-ui/Threads/SearchBox';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/modules/wallet-providers';
import { Trade } from '@/shared/services/tradeService';
import SearchBoxButton from '@/screens/sample-ui/Threads/SearchBox';

export const Thread: React.FC<ThreadProps> = ({
  // rootPosts,
  // currentUser,
  showHeader = true,
  // themeOverrides,
  styleOverrides,
  userStyleSheet,
}) => {
  const { trades, isLoading, refetch } = useTrades();
  const { profile } = useAuth();
  const listRef = useRef<FlatList<Trade>>(null);
  // console.log('trades: ', trades);
  // const isLoading = !trades || trades.length === 0;
  const [refreshing, setRefreshing] = useState(false);
  // const [headerRefreshing, setHeaderRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);
  useEffect(() => {
    if (trades.length > 0) {
      listRef.current?.scrollToOffset({
        offset: 0,
        animated: true,
      });
    }
  }, [trades[0]?.transactionId]);
  const handleOpenChats = () => {
    navigation.navigate('ChatListScreen' as never);
  };
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);

  const baseComponentStyles = getThreadBaseStyles();
  const styles = mergeStyles(
    baseComponentStyles,
    styleOverrides,
    userStyleSheet,
  );

  // animations (header only now)
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  const handleProfilePress = () => {
    navigation.navigate('ProfileScreenNew' as never);
  };

  // show loader first
  if (isLoading) {
    return (
      <View style={styles.threadRootContainer}>
        {showHeader && (
          <SafeAreaView edges={['top']}>
            <Animated.View style={[styles.header, { padding: 16, height: 40 }]}>
              <View style={headerStyles.container}>
                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={headerStyles.profileContainer}>
                  <IPFSAwareImage
                    source={profile?.profile_image_url}
                    defaultSource={DEFAULT_IMAGES.user}
                    style={styles.userIcon}
                    key={
                      Platform.OS === 'android'
                        ? `profile-${Date.now()}`
                        : 'profile'
                    }
                  />
                </TouchableOpacity>

                <View style={headerStyles.iconsContainer}>
                  <TouchableOpacity
                    onPress={handleOpenChats}
                    style={headerStyles.profileContainer}>
                    <Icons.EmailIcon
                      width={21}
                      height={21}
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
        )}

        <View
          style={{
            padding: 24,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 100,
            width: '100%',
            height: '70%',
          }}>
          <ActivityIndicator size="large" color={COLORS.brandPrimary} />
          <Text style={{ color: COLORS.greyMid, marginTop: 10 }}>
            Loading Trades...
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.threadRootContainer}>
      {showHeader && (
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, { padding: 16, height: 40 }]}>
            <View style={headerStyles.container}>
              {/* Left */}
              <TouchableOpacity
                onPress={handleProfilePress}
                style={headerStyles.profileContainer}>
                <IPFSAwareImage
                  source={profile?.profile_image_url}
                  defaultSource={DEFAULT_IMAGES.user}
                  style={styles.userIcon}
                  key={
                    Platform.OS === 'android'
                      ? `profile-${Date.now()}`
                      : 'profile'
                  }
                />
              </TouchableOpacity>

              {/* Right */}
              <View style={headerStyles.iconsContainer}>
                <TouchableOpacity
                  onPress={handleOpenChats}
                  style={headerStyles.profileContainer}>
                  <Icons.EmailIcon
                    width={21}
                    height={21}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>

              {/* Center Logo */}
              <View style={headerStyles.absoluteLogoContainer}>
                <Icons.AppLogo width={28} height={28} />
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      )}

      {/* Feed only */}
      <View
        style={{ flex: 1, paddingTop: showHeader ? 20 : 40, paddingBottom: 100 }}>
        <FlatList
          ref={listRef}
          data={trades}
          refreshing={refreshing}
          onRefresh={onRefresh}
          keyExtractor={(item, index) =>
            `${item.username}-${item.createdAt}-${item.mint || index}`
          }
          ListEmptyComponent={
            <Text
              style={{
                color: COLORS.greyMid,
                textAlign: 'center',
                marginTop: 80,
              }}>
              No Trades found.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              {/* Top row */}
              {/* <View style={styles.topRow}>
                <View style={styles.userInfo}>
                  <IPFSAwareImage
                    source={getValidImageSource(item.userProfilePic)}
                    style={styles.userIcon}
                    defaultSource={DEFAULT_IMAGES.user}
                    key={
                      Platform.OS === 'android' ? `user-${item.mint}` : 'user'
                    }
                  />
                  <View style={styles.userDetails}>
                    <View style={styles.walletAndTag}>
                      <Text style={styles.wallet}>{item.username}</Text>
                      <View
                        style={[
                          styles.tag,
                          item.type === 'BUY' ? styles.buyTag : styles.sellTag,
                        ]}>
                        <Text style={styles.tagText}>{item.type}</Text>
                      </View>
                    </View>
                    <Text style={styles.sol}>
                      {Number(item.priceSol ?? 0).toFixed(2)} SOL at $
                      {formatCompactNumber(Number(item.marketcapAtTrade))}{' '}
                      market cap
                    </Text>
                  </View>
                </View>
                <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
              </View> */}

              <View style={styles.topRow}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      'LeaderBoardUserDetailScreen' as never,
                      { user: item } as never,
                    )
                  }
                  style={styles.row}>
                  <View style={styles.userInfo}>
                    <IPFSAwareImage
                      source={getValidImageSource(item.userProfilePic)}
                      style={styles.userIcon}
                      defaultSource={DEFAULT_IMAGES.user}
                      key={
                        Platform.OS === 'android' ? `user-${item.mint}` : 'user'
                      }
                    />
                    <View style={styles.actionRow}>
                      <Text style={styles.actionText}>
                        <Text style={styles.wallet}>{item.username}</Text>{' '}
                        <Text
                          style={
                            item.type === 'BUY' ? styles.buyTag : styles.sellTag
                          }>
                          {item.type === 'BUY' ? 'bought' : 'sold'}
                        </Text>{' '}
                        ${formatCompactNumber(item.tradeSizeUsd ?? 0)}
                      </Text>

                      {/* Token chip */}
                      <View style={styles.tokenChip}>
                        <IPFSAwareImage
                          source={getValidImageSource(item.tokenImage)}
                          defaultSource={DEFAULT_IMAGES.token}
                          style={styles.tokenChipImage}
                        />
                        <Text style={styles.tokenChipText}>
                          {item.tokenSymbol}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={styles.time}>{formatTimeAgo(item.createdAt)}</Text>
              </View>

              {/* Token row */}
              {/* <View style={styles.upperMiddleRow}>
                <View style={styles.middleRow}>
                  <TouchableOpacity
                    style={styles.tokenInfo}
                    onPress={() =>
                      navigation.navigate(
                        'TokenDetailScreen' as never,
                        {
                          token: {
                            mint: item.mint,
                            name: item.tokenName,
                            symbol: item.tokenSymbol,
                            tokenDecimal: item.tokenDecimal,
                            logo: item.tokenImage,
                            mc: item.currentMarketCap
                              ? `$${formatCompactNumber(
                                  Number(item.currentMarketCap),
                                )}`
                              : '-',
                            // change: item.priceChange24h,
                          },
                        } as never,
                      )
                    }>
                    <IPFSAwareImage
                      source={getValidImageSource(item.tokenImage)}
                      style={styles.tokenIcon}
                      defaultSource={DEFAULT_IMAGES.token}
                      key={
                        Platform.OS === 'android'
                          ? `token-${item.mint}`
                          : 'token'
                      }
                    />
                    <View style={{gap: 4}}>
                      <Text style={styles.token}>{item.tokenSymbol}</Text>
                      <Text
                        style={styles.description}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {item.tokenName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.pnlBoxOuter}>
                    <View style={styles.pnlBox}>
                      <Text
                        style={[
                          styles.pnl,
                          {
                            color: item.pnlUsd < 0 ? '#FF4C4C' : '#4CAF50',
                          },
                        ]}>
                        {item.pnlUsd < 0
                          ? `-$${Math.abs(item.pnlUsd ?? 0).toFixed(2)}`
                          : `+$${item.pnlUsd?.toFixed(2)}`}{' '}
                        PNL
                      </Text>

                      <Text
                        style={[
                          styles.pnlPercent,
                          {
                            color: item.pnlPercent < 0 ? '#FF4C4C' : '#4CAF50',
                          },
                        ]}>
                        {item.pnlPercent < 0 ? (
                          <Icons.DownArrowIcon width={13} height={10} />
                        ) : (
                          <Icons.UpArrowIcon width={13} height={10} />
                        )}
                        {item.pnlPercent < 0
                          ? `-${Math.abs(item.pnlPercent ?? 0).toFixed(2)}`
                          : `+${Math.abs(item.pnlPercent ?? 0).toFixed(2)}`}
                        %
                      </Text>
                    </View>

                    <Text style={styles.marketCap}>
                      ${formatCompactNumber(Number(item.currentMarketCap))} MC
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() =>
                    navigation.navigate(
                      'TradeScreen' as never,
                      {
                        mode: 'buy', // or "sell"
                        token: {
                          mintaddress: item.mint,
                          tokendecimal: item.tokenDecimal,
                          symbol: item.tokenSymbol,
                          name: item.tokenName,
                          logoURI: item.tokenImage,
                          marketcapAtTrade: item.currentMarketCap,
                        },
                      } as never,
                    )
                  }>
                  <View style={styles.content}>
                    <Icons.ThunderBtn width={15} height={15} />
                    <Text style={styles.text}>1.00</Text>
                    <Icons.BarsBTN width={20} height={20} />
                  </View>
                </TouchableOpacity>
              </View> */}

              <View style={styles.tokenRowOne}>
                <View style={styles.tokenRow}>
                  <TouchableOpacity
                    style={styles.tokenInfo}
                    onPress={() =>
                      navigation.navigate(
                        'TokenDetailScreen' as never,
                        {
                          token: {
                            mint: item.mint,
                            name: item.tokenName,
                            symbol: item.tokenSymbol,
                            tokenDecimal: item.tokenDecimal,
                            logo: item.tokenImage,
                            mc: `$${formatCompactNumber(
                              Number(item.currentMarketCap),
                            )}`,
                          },
                        } as never,
                      )
                    }>
                    <IPFSAwareImage
                      source={getValidImageSource(item.tokenImage)}
                      style={styles.tokenIcon}
                      defaultSource={DEFAULT_IMAGES.token}
                      key={
                        Platform.OS === 'android'
                          ? `token-${item.mint}`
                          : 'token'
                      }
                    />
                    <View>
                      <Text style={styles.token}>{item.tokenSymbol}</Text>
                      <Text style={styles.description}>
                        ${formatCompactNumber(Number(item.currentMarketCap))} MC
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.rightTokenInfo}>
                    {/* <View style={styles.pnlRow}>
                    <Text
                      style={[
                        styles.pnl,
                        {color: item.pnlUsd < 0 ? '#FF4C4C' : '#4CAF50'},
                      ]}>
                      {item.pnlUsd < 0 ? '-' : '+'}$
                      {Math.abs(item.pnlUsd ?? 0).toFixed(2)}
                    </Text>

                    <Text
                      style={[
                        styles.pnlPercent,
                        {color: item.pnlPercent < 0 ? '#FF4C4C' : '#4CAF50'},
                      ]}>
                      {item.pnlPercent < 0 ? '↓' : '↑'}
                      {Math.abs(item.pnlPercent ?? 0).toFixed(2)}%
                    </Text>
                  </View> */}
                    {/* <View style={styles.pnlBoxOuter}>
                      <View style={styles.pnlBox}>
                        <Text
                          style={[
                            styles.pnl,
                            {
                              color: item.pnlUsd < 0 ? '#FF4C4C' : '#4CAF50',
                            },
                          ]}>
                          {item.pnlUsd < 0
                            ? `-$${Math.abs(item.pnlUsd ?? 0).toFixed(2)}`
                            : `+$${item.pnlUsd?.toFixed(2)}`}{' '}
                          PNL
                        </Text>

                        <Text
                          style={[
                            styles.pnlPercent,
                            {
                              color:
                                item.pnlPercent < 0 ? '#FF4C4C' : '#4CAF50',
                            },
                          ]}>
                          {item.pnlPercent < 0 ? (
                            <Icons.DownArrowIcon width={13} height={10} />
                          ) : (
                            <Icons.UpArrowIcon width={13} height={10} />
                          )}
                          {item.pnlPercent < 0
                            ? `-${Math.abs(item.pnlPercent ?? 0).toFixed(2)}`
                            : `+${Math.abs(item.pnlPercent ?? 0).toFixed(2)}`}
                          %
                        </Text>
                      </View>
                    </View> */}
                    <Text style={styles.tokenRight}>${item.tokenCurrentPriceUsd}</Text>
                    <Text style={styles.tokenRight}>
                      {item.tokenAmount} {item.tokenSymbol}
                    </Text>
                  </View>
                </View>

                {/* Quick Buy */}
                <TouchableOpacity
                  style={styles.quickBuy}
                  onPress={() =>
                    navigation.navigate(
                      'TradeScreen' as never,
                      {
                        mode: 'buy',
                        token: {
                          mintaddress: item.mint,
                          tokendecimal: item.tokenDecimal,
                          symbol: item.tokenSymbol,
                          name: item.tokenName,
                          logoURI: item.tokenImage,
                          marketcapAtTrade: item.currentMarketCap,
                        },
                      } as never,
                    )
                  }>
                  <Icons.ThunderBtn width={14} height={14} />
                  <Text style={styles.quickBuyText}>1.00</Text>
                </TouchableOpacity>
                {/* PNL */}
              </View>

              <View
                style={{ height: 1, backgroundColor: '#3f433bf8', marginTop: 10 }}
              />
            </View>
          )}
        />
      </View>

      <View style={styles.fixedSearch}>
        <SearchBoxButton
          placeholder="Search tokens..."
          onPress={() => navigation.navigate('GlobalSearchScreen' as never)}
        />
      </View>
    </View>
  );
};

export default Thread;
