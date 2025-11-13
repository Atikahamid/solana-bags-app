// path: src/screens/Common/login-screen/EmbeddedWalletAuth.tsx
'use client';
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  Image,
  Button,
} from 'react-native';
import Icons from '@/assets/svgs';
import {
  syncUserToBackend,
  useAuth,
} from '@/modules/wallet-providers/hooks/useAuth';
import styles from '@/screens/Common/login-screen/LoginScreen.styles';
import {useCustomization} from '@/shared/config/CustomizationProvider';
import {useAppNavigation} from '@/shared/hooks/useAppNavigation';
import {useAppDispatch} from '@/shared/hooks/useReduxHooks';
import {loginSuccess} from '@/shared/state/auth/reducer';
import COLORS from '@/assets/colors';

import type {Web3MobileWallet} from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import type {Cluster, PublicKey as SolanaPublicKey} from '@solana/web3.js';
import SolanaMobileImage from '@/assets/images/solana-mobile.jpg';
import {hasError, useLoginWithOAuth, usePrivy} from '@privy-io/expo';
import {usePrivyWalletLogic} from '../../services/walletProviders';
import LoadingScreen from '@/shared/navigation/LoadingScreen';

let transact: any;
let PublicKey: any;
let Buffer: any;

if (Platform.OS === 'android') {
  try {
    const mwaModule = require('@solana-mobile/mobile-wallet-adapter-protocol-web3js');
    transact = mwaModule.transact;
  } catch (error) {
    console.warn('Mobile Wallet Adapter not available:', error);
  }

  try {
    const web3Module = require('@solana/web3.js');
    PublicKey = web3Module.PublicKey;
  } catch (error) {
    console.warn('Solana Web3 module not available:', error);
  }

  try {
    const bufferModule = require('buffer');
    Buffer = bufferModule.Buffer;
  } catch (error) {
    console.warn('Buffer module not available:', error);
  }
}

export interface EmbeddedWalletAuthProps {
  onWalletConnected: (info: {
    provider: 'privy' | 'dynamic' | 'turnkey' | 'mwa';
    address: string;
  }) => void;
  authMode?: 'login' | 'signup';
}

const EmbeddedWalletAuth: React.FC<EmbeddedWalletAuthProps> = ({
  onWalletConnected,
  authMode = 'login',
}) => {
  const {
    status,
    loginWithGoogle,
    loginWithApple,
    loginWithEmail,
    loginWithTikTok,
    loginWithGitHub,
    loginWithTwitter,
    user,
    solanaWallet,
  } = useAuth();

  const {state} = useLoginWithOAuth();
  const {isReady} = usePrivy();
  console.log('isReady: ', isReady);
  console.log("user: ", user);
  const {monitorSolanaWallet} = usePrivyWalletLogic();
  // const {user} = usePrivy();
  const {auth: authConfig} = useCustomization();
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();

  const [isLoading, setIsLoading] = useState(false);
  console.log('isLoadin state: ', isLoading);

  useEffect(() => {
    if (user && isReady) {
      handleMonitorWallet();
    }
  }, [user, isReady]);

  const handleMonitorWallet = async () => {
    console.log('[useAuth] Privy user became available:', user);
    setIsLoading(true);
    // once the user becomes available, now safely handle wallet setup or backend sync
    await monitorSolanaWallet({
      selectedProvider: 'privy',
      setStatusMessage: msg => console.log(msg),
      onWalletConnected: async walletInfo => {
        console.log('Wallet connected after user available:', walletInfo);
        if (user && walletInfo?.address) {
          await syncUserToBackend(user, {
            ...walletInfo,
            publicKey: walletInfo.address,
            chain_type: 'solana',
            chain_id: 'solana-devnet',
            wallet_client: 'privy',
            wallet_client_type: 'embedded',
            recovery_method: 'privy',
            wallet_index: 0,
            delegated: false,
            imported: false,
            status: 'connected',
          });
        } else {
          console.warn('[useAuth] Missing user or wallet data, skipping sync');
        }

        const email = user?.linked_accounts?.find(
          (a: any) => a.type === 'google_oauth',
        )?.name;
        // const initialUsername = walletInfo.address.substring(0, 6);
        const initialUsername = email;
        console.log('[useAuth] Setting initial username:', initialUsername);

        dispatch(
          loginSuccess({
            provider: 'privy',
            address: walletInfo.address,
            username: initialUsername,
          }),
        );
        setIsLoading(false);
        navigation.navigate('MainTabs');
      },
    });
  };

  useEffect(() => {
    if (
      authConfig.provider === 'dynamic' &&
      status === 'authenticated' &&
      user?.id
    ) {
      onWalletConnected({provider: 'dynamic', address: user.id});
      setTimeout(() => navigation.navigate('MainTabs' as never), 100);
    }
  }, [authConfig.provider, status, onWalletConnected, navigation]);

  // --- LOGIN HANDLERS ---
  // const {authenticated, logout, user} = usePrivy();

  // const {state, login: loginWithOAuth} = useLoginWithOAuth({
  //   onSuccess: isNewUser => {
  //     console.log('User logged in successfully: ', user);
  //     if (isNewUser) {
  //       console.log('new User logged in successfully: ', isNewUser);
  //     }
  //   },
  //   onError: error => {
  //     console.error('Login failed', error);
  //   },
  // });

  const handleGoogleLogin = async () => {
    try {
      if (loginWithGoogle) {
        await loginWithGoogle();
      } else {
        Alert.alert(
          'Unavailable',
          'Google login not supported in this environment',
        );
      }
    } catch (error) {
      console.error('Google login error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with Google. Please try again.',
      );
    }
  };

  const handleAppleLogin = async () => {
    try {
      if (Platform.OS !== 'ios') {
        Alert.alert('Warning', 'Apple login is only available on iOS devices');
        return;
      }
      if (loginWithApple) await loginWithApple();
    } catch (error) {
      console.error('Apple login error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with Apple. Please try again.',
      );
    }
  };

  const handleEmailLogin = async () => {
    try {
      if (loginWithEmail) await loginWithEmail();
    } catch (error) {
      console.error('Email login error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with Email. Please try again.',
      );
    }
  };

  const handleTikTokLogin = async () => {
    try {
      if (loginWithTikTok) {
        await loginWithTikTok();
      } else {
        Alert.alert(
          'Unavailable',
          'TikTok login not supported in this environment',
        );
      }
    } catch (error) {
      console.error('TikTok login error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with TikTok. Please try again.',
      );
    }
  };

  const handleGitHubLogin = async () => {
    try {
      if (loginWithGitHub) {
        await loginWithGitHub();
      } else {
        Alert.alert(
          'Unavailable',
          'GitHub login not supported in this environment',
        );
      }
    } catch (error) {
      console.error('GitHub login error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with GitHub. Please try again.',
      );
    }
  };

  const handleTwitterLogin = async () => {
    try {
      if (loginWithTwitter) {
        await loginWithTwitter();
      } else {
        Alert.alert(
          'Unavailable',
          'Twitter login not supported in this environment',
        );
      }
    } catch (error) {
      console.error('Twitter login error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate with Twitter. Please try again.',
      );
    }
  };

  // --- UI ---

  const ArrowIcon = () => (
    <View style={styles.arrowCircle}>
      <Text style={styles.arrowText}>›</Text>
    </View>
  );
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={styles.bottomButtonsContainer}>
      {/* Twitter */}
      <TouchableOpacity style={styles.loginButton} onPress={handleTwitterLogin}>
        <View style={styles.buttonContent}>
          <Icons.Twittericon width={24} height={24} fill={COLORS.white} />
          <Text style={styles.buttonText}>Continue with Twitter</Text>
        </View>
        <ArrowIcon />
      </TouchableOpacity>

      <TouchableOpacity style={styles.loginButton} onPress={handleGoogleLogin}>
        <View style={styles.buttonContent}>
          <Icons.Google width={24} height={24} />
          <Text style={styles.buttonText}>Continue with Google</Text>
        </View>
        <ArrowIcon />
      </TouchableOpacity>
      {/* Google */}

      {hasError(state) && <Text>Error: {state.error.message}</Text>}
      {/* Apple */}
      {Platform.OS === 'ios' && (
        <TouchableOpacity style={styles.loginButton} onPress={handleAppleLogin}>
          <View style={styles.buttonContent}>
            <Icons.Apple width={24} height={24} fill={COLORS.white} />
            <Text style={styles.buttonText}>Continue with Apple</Text>
          </View>
          <ArrowIcon />
        </TouchableOpacity>
      )}

      {/* <Text>{JSON.stringify(user, null, 2)}</Text> */}
      {/* Email */}
      <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin}>
        <View style={styles.buttonContent}>
          <Icons.EmailIcon width={24} height={24} stroke={COLORS.white} />
          <Text style={styles.buttonText}>Continue with Email</Text>
        </View>
        <ArrowIcon />
      </TouchableOpacity>

      {/* TikTok */}
      <TouchableOpacity style={styles.loginButton} onPress={handleTikTokLogin}>
        <View style={styles.buttonContent}>
          <Icons.TiktokIcon width={24} height={24} fill={COLORS.white} />
          <Text style={styles.buttonText}>Continue with TikTok</Text>
        </View>
        <ArrowIcon />
      </TouchableOpacity>

      {/* GitHub */}
      <TouchableOpacity style={styles.loginButton} onPress={handleGitHubLogin}>
        <View style={styles.buttonContent}>
          <Icons.GithubIcon width={24} height={24} fill={COLORS.white} />
          <Text style={styles.buttonText}>Continue with GitHub</Text>
        </View>
        <ArrowIcon />
      </TouchableOpacity>
      {/* {hasError(state) && <Text>Error: {state.error.message}</Text>} */}

      {/* {hasError(state) && (
        <Text style={{ color: '#db0e0eff', marginTop: 10 }}>
          Error: {state.error.message}
        </Text>
      )} */}
    </View>
  );
};

export default EmbeddedWalletAuth;
