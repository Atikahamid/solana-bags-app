import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Clipboard,
  TouchableOpacity,
  Easing,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Icons from '@/assets/svgs';
import {LinearGradient} from 'expo-linear-gradient';
import COLORS from '@/assets/colors';
import {useNavigation} from '@react-navigation/native';
import SearchBox from '../SearchBox';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAppSelector} from '@/shared/hooks/useReduxHooks';
import {useAuth, useWallet} from '@/modules/wallet-providers';
import {SERVER_URL} from '@env';
import {usePrivy} from '@privy-io/expo';
import {IPFSAwareImage} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import {clusterApiUrl, Connection, PublicKey} from '@solana/web3.js';
import {getWalletAssets, TokenAccount} from './getWalletAssetsService'; // ✅ import service
import {FlatList} from 'react-native-gesture-handler';
import {formatCompactNumber} from '../SearchScreen';
import {fetchTokenPrice} from '@/modules/data-module';
import {fetchprice} from '@/modules/data-module/services/tokenService';
const GET_USER_RELATIVE = '/api/userRoutess/user';

export default function ProfileScreenNew() {
  const navigation = useNavigation();
  const showHeader = true;
  const {user, profile, fetchProfile} = useAuth();
  const privyId = user?.id;
  const [copied, setCopied] = useState(false);
  // console.log("userID: ", userId);
  const {address} = useWallet();
  const walletAddress = address;
  const [isWalletAsset, setIsWalletAsset] = useState(false);
  const [walletAssets, setWalletAssets] = useState<TokenAccount[]>([]); // ✅ store wallet assets
  const [price, setprice] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  // State for balance and loading
  const [nativeBalance, setNativeBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const storedUsername = useAppSelector(state => state.auth.username);
  // const privyId = useAppSelector(state => state.auth);
  console.log('privy id: ', privyId);

  // Animation values
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const checkmarkOpacityAnim = useRef(new Animated.Value(0)).current;
  // ✅ Local state for user data
  // const [profile, setProfile] = useState<any>(null);
  // const [loading, setLoading] = useState(true);

  // ✅ Fetch user profile API
  // const fetchProfile = useCallback(async () => {
  //   if (!privyId) return;

  //   try {
  //     // setLoading(true);
  //     const res = await fetch(
  //       `${SERVER_URL}${GET_USER_RELATIVE}/${encodeURIComponent(privyId)}`,
  //     );

  //     const data = await res.json();
  //     console.log('data: ', data);
  //     if (data.success) {
  //       setProfile(data.user);
  //     } else {
  //       console.warn('Profile fetch failed:', data);
  //     }
  //   } catch (err) {
  //     console.error('Error fetching profile:', err);
  //   } finally {
  //     // setLoading(false);
  //   }
  // }, [privyId]);
  // ✅ Fetch wallet assets (with SOL)
  const fetchWalletAssets = useCallback(async () => {
    if (!walletAddress) return;
    try {
      setLoading(true);
      const connection = new Connection(
        clusterApiUrl('mainnet-beta'),
        'confirmed',
      );
      const publicKey = new PublicKey(walletAddress);

      // ✅ Fetch native SOL balance (lamports → SOL)
      const solBalanceLamports = await connection.getBalance(publicKey);
      const solBalance = solBalanceLamports / 1_000_000_000;
      console.log('sol balance: ', solBalance);
      setNativeBalance(solBalance);
      // ✅ Fetch SPL token assets
      const result = await getWalletAssets({
        ownerAddress: walletAddress,
        limit: 20,
      });

      const tokens = result.token_accounts || [];

      // ✅ Add synthetic SOL asset
      const solAsset = {
        address: walletAddress,
        mint: 'So11111111111111111111111111111111111111112', // pseudo mint
        name: 'Solana',
        symbol: 'SOL',
        amount: solBalance,
        image:
          'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/solana/info/logo.png',
        json_uri: null,
      };

      const combined = [solAsset, ...tokens]; // show SOL first
      setWalletAssets(combined);

      setIsWalletAsset(combined.length === 0);
    } catch (err) {
      console.error('Error fetching wallet assets:', err);
    } finally {
      setLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    fetchWalletAssets();
  }, [fetchWalletAssets]);

  const fetchPricee = async address => {
    const price = await fetchprice(address);
    setprice(price);
    console.log('price: ', price);
    return price;
  };

  if (walletAddress) {
    fetchPricee('So11111111111111111111111111111111111111112');
  }

  // Handle copy animation
  useEffect(() => {
    if (copied) {
      // Animate copy icon out
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        }),
      ]).start(() => {
        // Animate checkmark in
        Animated.parallel([
          Animated.timing(checkmarkOpacityAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
            easing: Easing.elastic(1.2),
          }),
        ]).start();

        // After a delay, revert back to copy icon
        setTimeout(() => {
          // Animate checkmark out
          Animated.parallel([
            Animated.timing(checkmarkOpacityAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.5,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Reset rotation
            rotateAnim.setValue(0);

            // Animate copy icon back in
            Animated.parallel([
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.elastic(1.2),
              }),
            ]).start(() => {
              setCopied(false);
            });
          });
        }, 1500);
      });
    }
  }, [copied, opacityAnim, scaleAnim, rotateAnim, checkmarkOpacityAnim]);

  const handleOpenSettings = () => {
    navigation.navigate('SettingsScreen' as never, {profile} as never);
  };
  // ✅ Render each wallet asset
  const renderAssetItem = ({item}: {item: TokenAccount}) => (
    <View style={styles.assetCard}>
      {item.mint === 'So11111111111111111111111111111111111111112' ? (
        <Image
          source={{uri: item.image || DEFAULT_IMAGES.token}}
          style={styles.assetImage}
        />
      ) : (
        <IPFSAwareImage
          source={item?.image}
          style={styles.assetImage}
          defaultSource={DEFAULT_IMAGES.user}
          key={Platform.OS === 'android' ? `profile-${Date.now()}` : 'profile'}
        />
      )}

      <View style={styles.assetInfo}>
        <Text style={styles.assetName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.assetSymbol}>
          {` ${formatCompactNumber(item.amount)}  ${
            item.symbol || item.mint.slice(0, 4)
          }`}
        </Text>
      </View>
      <View style={styles.assetValueContainer}>
        <Text style={styles.assetValue}>
          ${(Number(price) * Number(nativeBalance)).toFixed(2)}
        </Text>
        <Text style={styles.assetChange}>
          +${(Math.random() * 1).toFixed(2)}
        </Text>
      </View>
    </View>
  );
  // Interpolate rotation value
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const copyToClipboard = () => {
    if (!copied && walletAddress) {
      Clipboard.setString(walletAddress);
      setCopied(true);
    }
  };

  const handleQRPress = () => {
    if (walletAddress) {
      setQrModalVisible(true);
    }
  };
  const fetchBalance = async () => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a connection to the Solana cluster
      const connection = new Connection(
        clusterApiUrl('mainnet-beta'),
        'confirmed',
      );

      // Get the wallet public key
      const publicKey = new PublicKey(walletAddress);

      // Fetch the balance
      const balance = await connection.getBalance(publicKey);
      console.log('balance', balance);
      console.log('[WalletScreen] SOL balance in lamports:', balance);

      // Update state with the balance
      setNativeBalance(balance);
      setLoading(false);
    } catch (err: any) {
      console.error('[WalletScreen] Error fetching balance:', err);
      setError('Failed to fetch wallet balance. Please try again.');
      setLoading(false);
    }
  };
  const handleRefresh = async () => {
    if (onRefresh) {
      onRefresh();
    }
    await fetchBalance();
  };

  // if (loading) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <ActivityIndicator size="large" color="#fff" />
  //       {/* <Text style={{color: '#aaa', marginTop: 10}}>Loading profile...</Text> */}
  //     </View>
  //   );
  // }

  // if (!profile) {
  //   return (
  //     <View style={styles.loaderContainer}>
  //       <Text style={{color: '#fff'}}>No profile found.</Text>
  //     </View>
  //   );
  // }

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.container}>
        {/* Header */}
        {showHeader && (
          <SafeAreaView edges={['top']}>
            <Animated.View style={[styles.header, {padding: 16, height: 70}]}>
              <View style={headerStyles.container}>
                <TouchableOpacity
                  onPress={handleOpenSettings}
                  style={headerStyles.profileContainer}>
                  <Icons.profileSettingsIcon
                    width={28}
                    height={28}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
                <View style={headerStyles.iconsContainer}>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('FiltersScreen' as never)
                    }
                    style={headerStyles.profileContainer}>
                    <Icons.RefreshIcon
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

        {/* Main Scroll Area */}
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Profile Card */}
          <LinearGradient
            colors={COLORS.walletCardGradient}
            start={{x: 0, y: 0}}
            end={{x: 0, y: 1}}
            style={styles.card}>
            <View>
              <View style={styles.headerRow}>
                <View style={styles.userRow}>
                  {/* <Image
                    source={{
                      uri:
                        profile.profile_image_url ||
                        'https://i.pravatar.cc/100?u=default',
                    }}
                    style={styles.profileImage}
                  /> */}
                  <IPFSAwareImage
                    source={profile?.profile_image_url}
                    style={headerStyles.profileImage}
                    defaultSource={DEFAULT_IMAGES.user}
                    key={
                      Platform.OS === 'android'
                        ? `profile-${Date.now()}`
                        : 'profile'
                    }
                  />
                  <Text style={[styles.handle, {textTransform: 'uppercase'}]}>
                    {profile?.username || storedUsername}
                  </Text>
                </View>
                <View style={styles.iconRight}>
                  <Icons.CreateCoinIcon
                    width={30}
                    height={30}
                    color="#00FF77"
                  />
                </View>
              </View>

              {/* ✅ Balance + PNL */}
              <View style={styles.balanceSection}>
                <Text style={styles.balanceText}>
                  {`$ ${(Number(price) * Number(nativeBalance)).toFixed(2)}`}
                </Text>
                <Text style={styles.pnlText}>
                  {profile?.pnl_percent
                    ? `${profile?.pnl_percent}% $0.00 PNL`
                    : '0.00% $0.00 PNL'}
                </Text>
              </View>

              <View style={styles.footerRow}>
                <View style={styles.walletAndCopy}>
                  <Text style={styles.walletAddress}>
                    {address
                      ? `${address.slice(0, 4)}...${address.slice(-6)}`
                      : 'No wallet'}
                  </Text>
                  <TouchableOpacity
                    onPress={copyToClipboard}
                    style={styles.copyIconButton}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
                    activeOpacity={0.7}
                    disabled={copied}>
                    <View style={styles.iconContainer}>
                      {/* Copy Icon (animated) */}
                      <Animated.View
                        style={{
                          opacity: opacityAnim,
                          transform: [{scale: scaleAnim}, {rotate}],
                          position: 'absolute',
                        }}>
                        <Icons.copyIcon
                          width={20}
                          height={20}
                          color={COLORS.white}
                        />
                      </Animated.View>

                      {/* Checkmark (animated) */}
                      <Animated.View
                        style={{
                          opacity: checkmarkOpacityAnim,
                          transform: [{scale: scaleAnim}],
                          position: 'absolute',
                        }}>
                        <View style={styles.checkmarkContainer}>
                          <Text style={styles.checkmarkText}>✓</Text>
                        </View>
                      </Animated.View>
                    </View>
                  </TouchableOpacity>
                </View>
                <View style = {{flexDirection: 'row', gap: 7}}>
                  <Text style = {{color: '#fff', fontSize: 14}}>{nativeBalance}</Text>
                  <Icons.CreateCoinIcon width={18} height={18} />
                </View>
              </View>
            </View>
          </LinearGradient>

          {!isWalletAsset && nativeBalance === 0 && (
            <View style={styles.addcashView}>
              <Text style={styles.addCashText}>Add Cash to Start Trading</Text>
              <Text style={styles.subText}>
                Use Apple Pay, MoonPay, Coinbase, or Phantom.
              </Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('AddCashScreen') as never}>
              <View style={styles.iconCircle}>
                <Icons.DepositeIcon width={28} height={28} />
              </View>
              <Text style={styles.label}>Deposit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <View style={styles.iconCircle}>
                <Icons.SendIcon width={28} height={28} />
              </View>
              <Text style={styles.label}>Send</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <View style={styles.iconCircle}>
                <Icons.WithdrawIcon width={28} height={28} />
              </View>
              <Text style={styles.label}>Withdraw</Text>
            </TouchableOpacity>
          </View>

          {!isWalletAsset && nativeBalance === 0 && (
            <Text style={styles.infoText}>
              Cash is converted to Solana and stored on your Bags Card. You can
              export your wallet anytime in settings.
            </Text>
          )}
          {/* Info */}

          {/* Status */}
          {!isWalletAsset && nativeBalance !== 0 ? (
            <FlatList
              data={walletAssets}
              keyExtractor={(item, index) => item.address || index.toString()}
              renderItem={renderAssetItem}
              contentContainerStyle={{marginTop: 20, width: '100%'}}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.statusText}>No open positions yet.</Text>
          )}
        </ScrollView>

        {/* Search Bar */}
        <View style={styles.fixedSearch}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('GlobalSearchScreen' as never)}>
            <SearchBox
              searchQuery=""
              setSearchQuery={() => {}}
              placeholder="Search tokens..."
            />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  loaderContainer: {
    flex: 1,
    // backgroundColor: '#0b0616',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {padding: 16, alignItems: 'center'},
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b4879c5',
    padding: 10,
    width: '100%',
    borderRadius: 12,
    marginBottom: 8,
    justifyContent: 'space-between',
  },
  assetImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  assetInfo: {flex: 1},
  assetName: {color: '#fff', fontWeight: '600', fontSize: 16},
  assetSymbol: {color: '#888', fontSize: 13},
  assetValueContainer: {alignItems: 'flex-end'},
  assetValue: {color: '#fff', fontSize: 16, fontWeight: '600'},
  assetChange: {color: '#00FF77', fontSize: 13, marginTop: 2},
  addcashView: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.lighterBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletAndCopy: {
    flexDirection: 'row',
    gap: 4,
  },
  iconContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: COLORS.brandGreen,
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: '#444343ff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userRow: {flexDirection: 'row', alignItems: 'center'},
  // profileImage: {
  //   width: 30,
  //   height: 30,
  //   borderRadius: 14,
  //   marginRight: 8,
  // },
  handle: {color: '#ccc', fontWeight: '600', fontSize: 15},
  balanceSection: {marginTop: 5, marginLeft: 3},
  balanceText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: '700',
    marginTop: 5,
  },
  pnlText: {color: '#f5f2f2ff', fontSize: 15, marginTop: 4},
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  walletAddress: {
    color: '#fff',
    fontSize: 13,
    letterSpacing: 0.5,
    marginLeft: 3,
    marginTop: 8,
  },
  addCashText: {
    color: '#f5f6faff',
    fontSize: 17,
    marginBottom: 8,
    marginTop: 15,
  },
  subText: {color: '#aaa', marginBottom: 20},
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    marginTop: 20,
  },
  button: {alignItems: 'center'},
  iconCircle: {
    backgroundColor: '#27375eff',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginTop: 6,
    fontWeight: '500',
  },
  infoText: {
    color: '#888',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  iconRight: {
    // backgroundColor: '#0F0',
    // // borderRadius: 10,
    padding: 4,
  },
  statusText: {color: '#666', marginBottom: 40},
  fixedSearch: {
    position: 'absolute',
    bottom: 63,
    left: 0,
    right: 0,
  },
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
    width: 28,
    height: 28,
    borderRadius: 9,
    overflow: 'hidden',
  },

  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 18,
    marginRight: 8,
  },
  absoluteLogoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  iconsContainer: {flexDirection: 'row', alignItems: 'center'},
});
