import React, {useState, useRef, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {getThreadBaseStyles, headerStyles} from './Thread.styles';
import {mergeStyles} from '../../utils';
import Icons from '../../../../assets/svgs';
import {ThreadProps} from '../../types';
import {IPFSAwareImage, getValidImageSource} from '@/shared/utils/IPFSImage';
import {useAppSelector} from '@/shared/hooks/useReduxHooks';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import COLORS from '@/assets/colors';
import {useTrades} from '../../hooks/useTrades';
import {formatTimeAgo} from '../../utils';
import {formatCompactNumber} from '@/screens/sample-ui/Threads/SearchScreen';
import SearchBox from '@/screens/sample-ui/Threads/SearchBox';
import {SafeAreaView} from 'react-native-safe-area-context';

export const Thread: React.FC<ThreadProps> = ({
  // rootPosts,
  // currentUser,
  showHeader = true,
  // themeOverrides,
  styleOverrides,
  userStyleSheet,
}) => {
  // loading state
  // const trades = [ 
  //   {
  //     walletAddress: 'So11111111111111111111111111111111111111112',
  //     username: 'whale123',
  //     userProfilePic:
  //       'https://arweave.net/beGAyeIzjV_UkyjFtxbkZyi_YqfOBWayiQ0B6wqWygY',
  //     action: 'buy',
  //     solPrice: 5.23,
  //     marketCapAtTrade: 1500000,
  //     time: Date.now() - 1000 * 60 * 5,
  //     pnl: 120,
  //     // priceChange24h: 12.5,
  //     currentMarketCap: 1700000,
  //     // liquidity: 450000,
  //     // volume: 220000,
  //     token: {
  //       mint: 'TOKENMINT111',
  //       symbol: 'MEME',
  //       name: 'Meme Token',
  //       tokendecimal: 6,
  //       imageUrl:
  //         'https://raw.githubusercontent.com/worldliberty/usd1-metadata/refs/heads/main/logo.png',
  //     },
  //   },
  //   {
  //     walletAddress: 'So11111111111111111111111111111111111111113',
  //     username: 'solanaFan',
  //     userProfilePic:
  //       'https://gateway.irys.xyz/TccS3HWiMB0hylmkRHL--4IIQzS-w-UMQ5bL39oFdMY',
  //     action: 'sell',
  //     solPrice: 3.87,
  //     marketCapAtTrade: 2000000,
  //     time: Date.now() - 1000 * 60 * 30,
  //     pnl: -75,
  //     priceChange24h: -8.2,
  //     currentMarketCap: 1850000,
  //     liquidity: 380000,
  //     volume: 190000,
  //     token: {
  //       mint: 'HYHiYPLg8wD4qpGxV54jELRkUon8hDFsvuCfszZApump',
  //       symbol: 'AI',
  //       name: 'AI Token',
  //       tokendecimal: 6,
  //       imageUrl:
  //         'https://gateway.irys.xyz/CGPj5pQGCPBr291pmpiQdxeYZJKH48po7VKNG9hKttn9',
  //     },
  //   },
  //   {
  //     walletAddress: 'So11111111111111111111111111111111111111114',
  //     username: 'traderJoe',
  //     userProfilePic: 'https://cdn.kamino.finance/kamino.svg',
  //     action: 'buy',
  //     solPrice: 1.12,
  //     marketCapAtTrade: 500000,
  //     time: Date.now() - 1000 * 60 * 60,
  //     pnl: 300,
  //     priceChange24h: 20.1,
  //     currentMarketCap: 650000,
  //     liquidity: 200000,
  //     volume: 80000,
  //     token: {
  //       mint: 'TOKENMINT333',
  //       symbol: 'LST',
  //       name: 'Liquid Staking Token',
  //       tokendecimal: 6,
  //       imageUrl:
  //         'https://gateway.irys.xyz/TJRvvcIhEfQHL8L8dWo0ZZW3UvEtXTJg88KyTsFRG74',
  //     },
  //   },
  // ];
  const trades = useTrades(); 
  // console.log('trades: ', trades);
  const isLoading = !trades || trades.length === 0;

  // spinner animation
  const spinAnim = useRef(new Animated.Value(0)).current;

  // useEffect(() => {
  //   const loop = Animated.loop(
  //     Animated.timing(spinAnim, {
  //       toValue: 1,
  //       duration: 800,
  //       useNativeDriver: true,
  //     }),
  //   );
  //   loop.start();
  //   return () => loop.stop();
  // }, []);

  // const spin = spinAnim.interpolate({
  //   inputRange: [0, 1],
  //   outputRange: ['0deg', '360deg'],
  // });

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
    navigation.navigate('TokenDetailScreen' as never);
  };

  // show loader first
  if (isLoading) {
    return (
      <View style={styles.threadRootContainer}>
        {showHeader && (
          <SafeAreaView edges={['top']}>
            <Animated.View style={[styles.header, {padding: 16, height: 40}]}>
              <View style={headerStyles.container}>
                <TouchableOpacity
                  onPress={handleProfilePress}
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
          <Text style={{color: COLORS.greyMid, marginTop: 10}}>
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
          <Animated.View style={[styles.header, {padding: 16, height: 40}]}>
            <View style={headerStyles.container}>
              {/* Left */}
              <TouchableOpacity
                onPress={handleProfilePress}
                style={headerStyles.profileContainer}>
                <Icons.SettingsIcon
                  width={28}
                  height={28}
                  color={COLORS.white}
                />
              </TouchableOpacity>

              {/* Right */}
              <View style={headerStyles.iconsContainer}>
                <TouchableOpacity
                  onPress={handleProfilePress}
                  style={headerStyles.profileContainer}>
                  <Icons.RefreshIcon
                    width={28}
                    height={28}
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
      <View style={{flex: 1, paddingTop: showHeader ? 20 : 40}}>
        <FlatList
          data={trades}
          keyExtractor={(item, index) =>
            `${item.walletAddress}-${item.time}-${
              item.token.mint || index
            }`
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              {/* Top row */}
              <View style={styles.topRow}>
                <View style={styles.userInfo}>
                  <IPFSAwareImage
                    source={getValidImageSource(item.userProfilePic)}
                    style={styles.userIcon}
                    defaultSource={DEFAULT_IMAGES.user}
                    key={
                      Platform.OS === 'android'
                        ? `user-${item.token.mint}`
                        : 'user'
                    }
                  />
                  <View style={styles.userDetails}>
                    <View style={styles.walletAndTag}>
                      <Text style={styles.wallet}>{item.username}</Text>
                      <View
                        style={[
                          styles.tag,
                          item.action === 'buy'
                            ? styles.buyTag
                            : styles.sellTag,
                        ]}>
                        <Text style={styles.tagText}>{item.action}</Text>
                      </View>
                    </View>
                    <Text style={styles.sol}>
                      {Number(item.solPrice).toFixed(2)} SOL at $
                      {formatCompactNumber(item.marketCapAtTrade)} market cap
                    </Text>
                  </View>
                </View>
                <Text style={styles.time}>{formatTimeAgo(item.time)}</Text>
              </View>

              {/* Token row */}
              <View style={styles.upperMiddleRow}>
                <View style={styles.middleRow}>
                  <TouchableOpacity
                    style={styles.tokenInfo}
                    onPress={() =>
                      navigation.navigate(
                        'TokenDetailScreen' as never,
                        {
                          token: {
                            mint: item.token.mint,
                            name: item.token.name,
                            symbol: item.token.symbol,
                            tokenDecimal: item.token.tokendecimal || 6,
                            logo: item.token.imageUrl,
                            mc: item.currentMarketCap
                              ? `$${formatCompactNumber(item.currentMarketCap)}`
                              : '-',
                            change: item.priceChange24h,
                          },
                        } as never,
                      )
                    }>
                    <IPFSAwareImage
                      source={getValidImageSource(item.token.imageUrl)}
                      style={styles.tokenIcon}
                      defaultSource={DEFAULT_IMAGES.token}
                      key={
                        Platform.OS === 'android'
                          ? `token-${item.token.mint}`
                          : 'token'
                      }
                    />
                    <View style={{gap: 4}}>
                      <Text style={styles.token}>{item.token.symbol}</Text>
                      <Text
                        style={styles.description}
                        numberOfLines={1}
                        ellipsizeMode="tail">
                        {item.token.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <View style={styles.pnlBoxOuter}>
                    <View style={styles.pnlBox}>
                      <Text
                        style={[
                          styles.pnl,
                          {
                            color:
                              item.priceChange24h < 0 ? '#FF4C4C' : '#4CAF50',
                          },
                        ]}>
                        {item.pnl < 0
                          ? `-$${Math.abs(item.pnl)}`
                          : `+$${item.pnl}`}{' '}
                        PNL
                      </Text>

                      <Text
                        style={[
                          styles.pnlPercent,
                          {
                            color:
                              item.priceChange24h < 0 ? '#FF4C4C' : '#4CAF50',
                          },
                        ]}>
                        {item.priceChange24h < 0 ? (
                          <Icons.DownArrowIcon width={13} height={10} />
                        ) : (
                          <Icons.UpArrowIcon width={13} height={10} />
                        )}
                        {item.priceChange24h < 0
                          ? `-${Math.abs(item.priceChange24h).toFixed()}`
                          : `+${Math.abs(item.priceChange24h).toFixed()}`}
                        %
                      </Text>
                    </View>

                    <Text style={styles.marketCap}>
                      ${formatCompactNumber(item.currentMarketCap)} MC
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => console.log('hi')}>
                  <View style={styles.content}>
                    <Icons.ThunderBtn width={15} height={15} />
                    <Text style={styles.text}>1.00</Text>
                    <Icons.BarsBTN width={20} height={20} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
        <View style={styles.fixedSearch}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('GlobalSearchScreen' as never)}>
            <SearchBox
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder="Search tokens..."
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Thread;
