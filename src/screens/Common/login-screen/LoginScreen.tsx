import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StatusBar} from 'expo-status-bar';
import {useSelector} from 'react-redux';
import {useAppDispatch} from '@/shared/hooks/useReduxHooks';
import {useAppNavigation} from '@/shared/hooks/useAppNavigation';
import EmbeddedWalletAuth from '@/modules/wallet-providers/components/wallet/EmbeddedWallet';
import {
  loginSuccess,
  fetchUserProfile,
  updateProfilePic,
} from '@/shared/state/auth/reducer';
import {RootState} from '@/shared/state/store';
import {useCustomization} from '@/shared/config/CustomizationProvider';
import axios from 'axios';
import {SERVER_URL} from '@env';
import COLORS from '@/assets/colors';
import {generateAndStoreAvatar} from '@/shared/services/diceBearAvatarService';
import {LinearGradient} from 'expo-linear-gradient';
import styles from './LoginScreen.styles';
import { useAuth } from '@/modules/wallet-providers';
import LoadingScreen from '@/shared/navigation/LoadingScreen';

const SERVER_BASE_URL = SERVER_URL || 'http://192.168.1.70:8080';

export default function LoginScreen() {
  const navigation = useAppNavigation();
  const dispatch = useAppDispatch();
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const {auth: authConfig} = useCustomization();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  // const {isLoading} = useAuth();
  // ✅ Navigate to main tabs if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    }
  }, [isLoggedIn, navigation]);

  // ✅ Wallet connection handler (kept identical)
  const handleWalletConnected = async (info: {
    provider: string;
    address: string;
  }) => {
    console.log('Wallet connected:', info);
    setIsAuthenticating(true);
    try {
      // Step 1: Create/verify user in backend
      let isNewUser = false;
      try {
        const response = await axios.post(
          `${SERVER_BASE_URL}/api/profile/createUser`,
          {
            userId: info.address,
            username: info.address.slice(0, 6),
            handle: '@' + info.address.slice(0, 6),
          },
        );
        if (response.data?.user && !response.data?.user?.profile_picture_url) {
          isNewUser = true;
        }
      } catch (err: any) {
        console.log(
          'User creation skipped:',
          err?.response?.status || err.message,
        );
      }

      // Step 2: Dispatch login
      dispatch(loginSuccess({provider: info.provider, address: info.address}));

      // Step 3: Fetch or generate avatar
      try {
        const profileResult = await dispatch(
          fetchUserProfile(info.address),
        ).unwrap();
        if (!profileResult?.profilePicUrl) {
          const avatarUrl = await generateAndStoreAvatar(info.address);
          dispatch(updateProfilePic(avatarUrl));
          await axios.post(`${SERVER_BASE_URL}/api/profile/updateProfilePic`, {
            userId: info.address,
            profilePicUrl: avatarUrl,
          });
        }
      } catch (error) {
        console.warn('Profile fetch error:', error);
      }

      // Step 4: Navigate to main tabs
      navigation.reset({index: 0, routes: [{name: 'MainTabs'}]});
    } catch (error) {
      console.error('Error handling wallet connection:', error);
      Alert.alert(
        'Connection Error',
        'Successfully connected but encountered an error.',
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  // if(isLoading) {
  //   return <Text>Loading screen......</Text>
  // }
  // ✅ UI (clean, gradient-based)
  return (
    <LinearGradient
      colors={COLORS.backgroundSemiGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* 🔹 Top Section — Logo */}
        <View style={{alignItems: 'center', marginTop: 40}}>
          <Text
            style={{
              color: '#fff',
              fontSize: 26,
              fontWeight: 'bold',
              textAlign: 'center',
            }}>
            APP LOGO
          </Text>
        </View>

        {/* 🔹 Middle Section — Auth Buttons */}
        <View style={{width: '100%', alignItems: 'center'}}>
          <EmbeddedWalletAuth onWalletConnected={handleWalletConnected} />
          {/* <LoadingScreen/> */}
        </View>

        {/* 🔹 Bottom Section — Terms */}
        <View style={{width: '70%', marginBottom: 40}}>
          <Text
            style={{
              color: '#AAA',
              fontSize: 12,
              textAlign: 'center',
              lineHeight: 20,
            }}>
            By continuing you agree to our Terms of Use and Privacy Policy.
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
