import React, {useCallback, useState, useEffect} from 'react';
import {
  View,
  StatusBar,
  useWindowDimensions,
  Text,
  ScrollView,
  Animated,
  Easing,
  SafeAreaView,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {useWallet} from '@/modules/wallet-providers/hooks/useWallet';

import AppHeader from '@/core/shared-ui/AppHeader';
import MoonPayWidget from '@/modules/moonpay/components/MoonPayWidget';
import COLORS from '@/assets/colors';
import {MOONPAY_API_KEY} from '@env';

import {styles} from './styles';
import {
  formatWalletAddress,
  getDefaultParameters,
  getEnvironmentFromConfig,
} from '../../utils/moonpayUtils';
import {MoonPayParameters} from '../../types';
import { LinearGradient } from 'expo-linear-gradient';

// Use your real API key in production
const API_KEY = MOONPAY_API_KEY || 'pk_test_Pe3k41cRXJNfPvYN7iQDYQtafGRasCx';

/**
 * OnrampScreen component for adding funds via MoonPay
 */
function OnrampScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const {width, height} = useWindowDimensions();
  const {address} = useWallet();
  const [widgetOpened, setWidgetOpened] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [widgetError, setWidgetError] = useState<Error | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  // Calculate widget height (60% of screen height on portrait, 80% on landscape)
  const isPortrait = height > width;
  const widgetHeight = Math.round(height * (isPortrait ? 0.9 : 0.7));

  // Determine environment from API key
  const environment = getEnvironmentFromConfig(API_KEY);
  console.log("environemnt: ", environment);
  // Configure MoonPay parameters optimized for Solana
  const moonpayParameters: Partial<MoonPayParameters> = {
    ...getDefaultParameters('solana'),
    // Override with specific configuration
    baseCurrencyAmount: '50',
    baseCurrencyCode: 'usd',
    colorCode: COLORS.brandBlue,
    theme: 'dark',
    showWalletAddressForm: false,
    // Include wallet address if available
    ...(address && {walletAddress: address}),
    // Add app-specific identifiers for tracking
    externalCustomerId: address
      ? `solana-app-kit-${address.slice(-8)}`
      : undefined,
    // Set up redirect handling
    redirectURL: 'solana-app-kit://onramp-success',
  };

  // Fade in animation for the content
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handleWidgetOpen = useCallback(() => {
    console.log('MoonPay widget opened');
    setWidgetOpened(true);
  }, []);

  const handleWidgetError = useCallback((error: Error) => {
    console.log('MoonPay widget error:', error);
    setWidgetError(error);
  }, []);

  const handleTransactionCompleted = useCallback(
    (transactionId: string, status: string) => {
      console.log('MoonPay transaction completed:', {transactionId, status});
      // You can handle successful transactions here
      // For example, refresh wallet balance, show success message, etc.
    },
    [],
  );

  const handleRetry = useCallback(() => {
    setWidgetError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  // Format wallet address for display
  const formattedAddress = formatWalletAddress(address);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={[styles.container, {paddingTop: insets.top}]}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
        <AppHeader
          title="Add Funds"
          onBackPress={() => navigation.goBack()}
          showDefaultRightIcons={false}
        />

        <Animated.View
          style={[
            styles.contentContainer,
            {
              opacity: fadeAnim,
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}>
          {/* MoonPay Widget */}
          <View style={styles.widgetWrapper}>
            <MoonPayWidget
              key={`moonpay-widget-${retryCount}`}
              apiKey={API_KEY}
              environment={environment}
              parameters={moonpayParameters}
              onOpen={handleWidgetOpen}
              onError={handleWidgetError}
              onTransactionCompleted={handleTransactionCompleted}
              onRetry={handleRetry}
              height={widgetHeight}
            />
          </View>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

export default OnrampScreen;
