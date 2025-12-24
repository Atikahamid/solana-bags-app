// ==== File: src/screens/TokenDetailScreen.tsx ====
import React, {useCallback} from 'react';
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
} from 'react-native';
import Chart from './Chart';
import Icons from '@/assets/svgs';
import {getValidImageSource, IPFSAwareImage} from '@/shared/utils/IPFSImage';
import COLORS from '@/assets/colors';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import {useAppSelector} from '@/shared/hooks/useReduxHooks';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {headerStyles} from '../tokenPulse/TokenScreen';
import {LinearGradient} from 'expo-linear-gradient'; 
import TokenStats from './TokenStats';
import TokenStats2 from './TokenStats2';
import TokenStats3 from './TokenStats3';

type TokenDetailParams = {
  TokenDetailScreen: {
    token: {
      name: string;
      symbol: string;
      logo?: string;
      mc: string;
      tokenDecimal: number,
      mint: string;
      change: number;
    };
  };
}; 

const TokenDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<TokenDetailParams, 'TokenDetailScreen'>>();
  const {token} = route.params;
  console.log('tpoken mint address: ', token);
  console.log("++++++++++++++++++__________________________");
//   console.log("token: ", token.tokenDecimal);
  // const onBackPress = () => { undefined}; // You can define a custom back press handler if needed
  const storedProfilePic = useAppSelector(state => state.auth.profilePicUrl);
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // const handleBackPress = () => {
  //     if (handleBack) {
  //         handleBack();
  //     } else if (navigation.canGoBack()) {
  //         navigation.goBack();
  //     }
  // };
  const handleProfilePress = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  const isPositive = token.change >= 0;
  const changeColor = isPositive ? '#4CAF50' : '#FF4C4C';
  const arrow = isPositive ? (
    <Icons.UpArrowIcon width={11} height={10} />
  ) : (
    <Icons.DownArrowIcon width={11} height={10} />
  );
  const formattedChange = `${isPositive ? '+' : ''}${token.change.toFixed(2)}%`;

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
        {/* Header */}
        <Animated.View
          style={[styles.header, {padding: 16, height: 60, marginTop: 20}]}>
          <View style={headerStyles.container}>
            <TouchableOpacity onPress={handleBack} style={styles.leftButton}>
              <Icons.ArrowLeft width={24} height={24} color={COLORS.white} />
            </TouchableOpacity>
            {/* <View style={headerStyles.iconsContainer}>
              <TouchableOpacity
                onPress={handleProfilePress}
                style={headerStyles.profileContainer}>
                <IPFSAwareImage
                  source={
                    storedProfilePic
                      ? getValidImageSource(storedProfilePic)
                      : DEFAULT_IMAGES.user
                  }
                  style={headerStyles.profileImage}
                  defaultSource={DEFAULT_IMAGES.user}
                  key={
                    Platform.OS === 'android'
                      ? `profile-${Date.now()}`
                      : 'profile'
                  }
                />
              </TouchableOpacity>
            </View>
            <View style={headerStyles.absoluteLogoContainer}>
              <Icons.AppLogo width={28} height={28} />
            </View> */}
          </View>
        </Animated.View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Token Info */}
          <View style={styles.tokenContainer}>
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
            <View>
              <Text style={styles.tokenName}>{token.symbol}</Text>
              <Text style={styles.tokenSymbol}>{token.name}</Text>
            </View>
          </View>

          <View style={styles.mcpcdiv}>
            <Text style={styles.marketCap}>{token.mc}</Text>
            <Text style={[styles.priceChange, {color: changeColor}]}>
              {arrow} {formattedChange}
            </Text>
          </View>

          {/* ✅ Show liquidity & volume */}
          {/* <View style={styles.extraStats}>
                        <Text style={styles.extraText}>Liquidity: {token.liq}</Text>
                        <Text style={styles.extraText}>Volume: {token.vol}</Text>
                    </View> */}

          {/* Chart Component */}
          <Chart mintAddress={token.mint}/>
          {/* <TokenStats /> */}
          {/* <TokenStats2 /> */}
          {/* <Text>{token.mint}</Text> */}
          {/* <TokenStats3 mintAddress={token.mintAddress}/> */}
          {/* <TokenStats3 mintAddress={token.mint} /> */}
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryText}>⚡ Buy 1.00 Ξ</Text>
          </TouchableOpacity>

          <LinearGradient
            colors={['#427abbff', '#164780ff']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.actionButtonGradient}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate(
                  'TradeScreen' as never,
                  {
                    mode: 'buy', // or "sell"
                    token: {
                      mintaddress: token.mint,
                      tokendecimal: token.tokenDecimal || 6,
                      symbol: token.symbol,
                      name: token.name,
                      logoURI: token.logo,
                    },
                  } as never,
                )
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
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  mcpcdiv: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    marginLeft: 18,
    marginTop: 5,
  },
  leftButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
    marginTop: 16,
    paddingHorizontal: 16,
  },
  tokenImage: {width: 50, height: 50, borderRadius: 25, marginRight: 12},
  tokenName: {color: '#fff', fontSize: 22, fontWeight: 'bold'},
  tokenSymbol: {color: '#aaa', fontSize: 14},
  marketCap: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  priceChange: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
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
