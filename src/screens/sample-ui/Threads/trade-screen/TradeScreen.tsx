// File: src/screens/TradeScreen.tsx

import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import Animated from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';
import COLORS from '@/assets/colors';
import Icons from '@/assets/svgs';
import BonkImg from '@/assets/images/bonk-logo.png';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {SwapRouteParams, useSwapLogic} from '@/modules/swap'; // ✅ import your main hook
import {useWallet} from '@/modules/wallet-providers';
import {RootStackParamList} from '@/shared/navigation/RootNavigator';
import {DEFAULT_SOL_TOKEN} from '@/modules/data-module';
import SwapSettingsModal from './SwapSettingsModal';

type TokenAndModeParams = {
  TradeScreen: {
    mode: string; // or "sell"
    token: {
      mintaddress: string;
      tokendecimal: number;
      symbol: string;
      name: string;
      logoURI: string;
    };
  };
};
type SwapScreenRouteProp = RouteProp<TokenAndModeParams, 'TradeScreen'>;

export default function TradeScreen() {
  const navigation = useNavigation();
  const {wallet} = useWallet();
  const route = useRoute<SwapScreenRouteProp>();
  const [showSettings, setShowSettings] = useState(false);

  const {mode, token} = route.params || {};
  console.log('{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{{');
  console.log('token in trade screen: ', token);
  // console.log("mode: ", mode);
  // console.log("token: ", token);
  // Get parameters from route if they exist
  const routeParams = route.params || {};
  const {
    publicKey: userPublicKey,
    connected,
    sendTransaction,
    sendBase64Transaction,
  } = useWallet();
  // 💡 Local UI toggles for Buy/Sell mode
  const [isBuy, setIsBuy] = useState(true);

  /**
   * ✅ Import everything we need from useSwapLogic
   * These functions/states are enough to make the TradeScreen fully interactive.
   */
  const {
    inputValue,
    setInputValue,
    estimatedOutputAmount,
    outputTokenUsdValue,
    handleSwap,
    handleTokenSelected,
    setActiveProvider,
    loading,
    setSlippage,
    resultMsg,
    errorMsg,
  } = useSwapLogic(
    routeParams as SwapRouteParams,
    userPublicKey,
    connected,
    isBuy,
    {sendTransaction, sendBase64Transaction},
    navigation,
  );

  // 💡 Set default swap provider on mount
  // useEffect(() => {
  //   setActiveProvider('JupiterUltra');
  // }, []);

  // 💰 The current token label based on mode
  const tokenLabel = isBuy ? 'SOL' : 'TREND';

  // 🔢 Number pad handler for entering swap amount
  const handleNumPress = (num: string) => {
    if (num === '⌫') {
      setInputValue(prev => prev.slice(0, -1));
    } else if (num === '.' && inputValue.includes('.')) {
      return;
    } else {
      setInputValue(prev => prev + num);
    }
  };

  // 🧾 Display formatting for USD + token conversion
  const displayValue =
    inputValue === ''
      ? isBuy
        ? '$0.00'
        : '0 SOL ≈ $0.00'
      : isBuy
      ? `${inputValue} SOL`
      : `${inputValue} TREND`;

  // 🪙 Pressing the Secure button triggers the swap
  const handleSecurePress = async () => {
    if (!wallet?.publicKey) {
      alert('Please connect your wallet first.');
      return;
    }
    await handleSwap();
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.container}>
        {/* HEADER */}
        <SafeAreaView edges={['top']}>
          <Animated.View style={[styles.header, {padding: 16, height: 70}]}>
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                style={styles.headerIcon}>
                <Icons.profileSettingsIcon
                  width={28}
                  height={28}
                  color={COLORS.white}
                />
              </TouchableOpacity>
              <View style={styles.headerRightIcons}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FiltersScreen' as never)}
                  style={styles.headerIcon}>
                  <Icons.RefreshIcon
                    width={21}
                    height={21}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>

        {/* BUY / SELL TOGGLE */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.tabButton, isBuy && {backgroundColor: '#00C851'}]}
            onPress={() => setIsBuy(true)}>
            <Text style={[styles.tabText, isBuy && styles.tabTextActive]}>
              BUY
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, !isBuy && {backgroundColor: '#ff0057'}]}
            onPress={() => setIsBuy(false)}>
            <Text style={[styles.tabText, !isBuy && styles.tabTextActive]}>
              SELL
            </Text>
          </TouchableOpacity>
        </View>

        {/* MAIN BODY */}
        <ScrollView contentContainerStyle={styles.content}>
          {/* AMOUNT + TOKENS */}
          {/* AMOUNT + TOKENS */}
          <Text style={styles.amountText}>
            {inputValue || '0'}{' '}
            {isBuy ? DEFAULT_SOL_TOKEN.symbol : token.symbol}
          </Text>

          <View style={styles.tokenView}>
            <Image
              source={{
                uri: isBuy ? token.logoURI : DEFAULT_SOL_TOKEN.logoURI,
              }}
              style={styles.tokenimg}
            />
            <Text style={styles.priceText}>
              <Text style={{color: isBuy ? '#00C851' : '#00C851'}}>
                {isBuy ? '+' : '+'}
                {Number(estimatedOutputAmount).toFixed(2) || '0.00'}
              </Text>
              <Text style={{color: '#FFFFFF'}}>
                {' '}
                {isBuy ? token.symbol : DEFAULT_SOL_TOKEN.symbol}
              </Text>
            </Text>
            {isBuy && (
              <Icons.WhiteArrowDown
                width={20}
                height={20}
                color={COLORS.white}
              />
            )}
          </View>

          {/* LIVE USD VALUE */}
          <Text style={styles.usdValue}>
            {outputTokenUsdValue}
            {/* {outputTokenUsdValue
              ? `≈ $${Number(outputTokenUsdValue).toFixed(2)}`
              : displayValue} */}
          </Text>

          {/* PERCENTAGE SHORTCUT BUTTONS */}
          <View style={styles.percentRow}>
            {['25%', '50%', '75%', 'MAX'].map(label => (
              <TouchableOpacity key={label} style={styles.percentButton}>
                <Text style={styles.percentText}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* NUMBER PAD */}
          <View style={styles.numPad}>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'].map(
              (num, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.numButton}
                  onPress={() => handleNumPress(num)}>
                  <Text style={styles.numText}>{num}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>

          {/* SWAP / SECURE BUTTON */}
          <LinearGradient
            colors={['#427abbff', '#05375fff']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.secureButton}>
            <TouchableOpacity
              onPress={handleSecurePress}
              disabled={loading}
              style={{width: '100%', alignItems: 'center'}}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.secureText}>SECURE</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          {/* STATUS MESSAGES */}
          {resultMsg && <Text style={styles.successText}>{resultMsg}</Text>}
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}

          {/* BALANCE INFO */}
          <Text style={styles.balanceText}>
            Wallet: {wallet?.publicKey?.slice(0, 4)}...
            {wallet?.publicKey?.slice(-4)} | Balance: TBD {tokenLabel}
          </Text>
        </ScrollView>
      </View>
      <SwapSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        setSlippage={setSlippage} // ✅ pass directly from hook
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {},
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerIcon: {padding: 6},
  headerRightIcons: {flexDirection: 'row'},
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    backgroundColor: '#363738ff',
    borderRadius: 30,
    marginHorizontal: 8,
  },
  tabText: {color: '#8a8585ff', fontWeight: '700', fontSize: 16},
  tabTextActive: {color: '#fff'},
  content: {alignItems: 'center', paddingBottom: 60},
  amountText: {
    color: 'white',
    fontSize: 60,
    fontWeight: '700',
    marginVertical: 10,
  },
  tokenView: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#05375fff',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 19,
  },
  tokenimg: {width: 25, height: 25, marginTop: 1},
  priceText: {fontSize: 16, fontWeight: '600'},
  usdValue: {color: '#777', marginTop: 6, fontSize: 18},
  percentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginVertical: 15,
  },
  percentButton: {
    backgroundColor: '#363738ff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  percentText: {color: '#fff', fontSize: 14, fontWeight: '500'},
  numPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '80%',
    marginTop: 15,
  },
  numButton: {
    width: '30%',
    margin: '1.5%',
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#05375fff',
  },
  numText: {color: '#fff', fontSize: 22, fontWeight: '600'},
  secureButton: {
    marginTop: 25,
    width: '90%',
    borderRadius: 40,
    paddingVertical: 15,
    alignItems: 'center',
  },
  secureText: {color: 'white', fontSize: 18, fontWeight: '800'},
  successText: {color: '#00C851', marginTop: 10, fontSize: 14},
  errorText: {color: '#ff4444', marginTop: 10, fontSize: 14},
  balanceText: {color: '#777', fontSize: 12, marginTop: 16},
});
