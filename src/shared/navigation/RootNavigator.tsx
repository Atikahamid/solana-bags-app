import React, {useEffect} from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {useSelector} from 'react-redux';
import {RootState} from '../state/store';
import MainTabs from './MainTabs';
import CoinDetailPage from '@/screens/sample-ui/Threads/coin-detail-page/CoinDetailPage';
import {PumpfunScreen, PumpSwapScreen} from '@/modules/pump-fun';
import {TokenMillScreen} from '@/modules/token-mill';
import {NftScreen} from '@/modules/nft';
import {MeteoraScreen, SwapForm} from '@/modules/meteora';
import LaunchlabsScreen from '@/modules/raydium/screens/LaunchlabsScreen';
import ChatScreen from '@/screens/sample-ui/chat/chat-screen/ChatScreen';
import ChatListScreen from '@/screens/sample-ui/chat/chat-list-screen';
import UserSelectionScreen from '@/screens/sample-ui/chat/user-selection-screen/UserSelectionScreen';
import OtherProfileScreen from '@/screens/sample-ui/Threads/other-profile-screen/OtherProfileScreen';
import PostThreadScreen from '@/screens/sample-ui/Threads/post-thread-screen/PostthreadScreen';
import FollowersFollowingListScreen from '@/core/profile/components/followers-following-listScreen/FollowersFollowingListScreen';
import ProfileScreen from '@/screens/sample-ui/Threads/profile-screen/ProfileScreen';
import ProfileScreenNew from '@/screens/sample-ui/Threads/profile-screen/ProfileScreennew';

import {MercuroScreen} from '@/modules/mercuryo';
import SwapScreen from '@/modules/swap/screens/SwapScreen';
import OnrampScreen from '@/modules/moonpay/screens/OnrampScreen';
import socketService from '@/shared/services/socketService';
import {fetchUserChats} from '@/shared/state/chat/slice';
import {useAppDispatch} from '@/shared/hooks/useReduxHooks';
import {TokenInfo} from '@/modules/data-module';

import WalletScreen from '@/modules/moonpay/screens/WalletScreen';
import {MoonPayWidget} from '@/modules/moonpay';

import {
  AddCashScreen,
  CoinbaseOnrampScreen,
  DeleteAccountConfirmationScreen,
  IntroScreen,
  LoginScreen,
  TokenDetailScreen,
  TradeScreen,
  WebViewScreen,
} from '@/screens';
import {FiltersScreen} from '@/screens/sample-ui/Threads/tokenPulse/FilterScreen';
import GlobalSearchScreen from '@/screens/sample-ui/Threads/GlobalSearchScreen';
import LoadingScreen from './LoadingScreen';
import SettingsScreen from '@/screens/sample-ui/Threads/profile-screen/SettingsScreen';
import ExportWalletScreen from '@/screens/sample-ui/Threads/profile-screen/settings-options/ExportWalletScreen';
import {PerpetualsScreen} from '@/screens/sample-ui/Threads/perpetuals-screen/PerpetualsScreen';
import LuloRebalancingYieldCard from '@/modules/moonpay/screens/LuloRebalancingYieldCard';
// import { PositionsSection } from '@/screens/sample-ui/Threads/perpetuals-screen/components/positionsSection';

export type RootStackParamList = {
  IntroScreen: undefined;
  LoginOptions: undefined;
  MainTabs: undefined;
  LoadingScreen: undefined;
  GlobalSearchScreen: undefined;
  TokenDetailScreen: undefined;
  FiltersScreen: undefined;
  ExportWalletScreen: undefined;
  TradeScreen: undefined;
  CoinDetailPage: undefined;
  AddCashScreen: undefined;
  Blink: undefined;
  Pumpfun: undefined;
  PerpetualsScreen: undefined;
  TokenMill: undefined;
  CoinbaseOnRampScreen: {
    walletAddress: string;
    amount: number;
  };
  NftScreen: undefined;
  SettingsScreen: undefined;
  ChatListScreen: undefined;
  ChatScreen: {
    chatId: string;
    chatName: string;
    isGroup: boolean;
  };
  UserSelectionScreen: undefined;
  PumpSwap: undefined;
  MercuroScreen: undefined;
  onRampScreen: undefined;
  walletScreenMoonPay: undefined;
  luloRebalancingYield: undefined;
  LaunchlabsScreen: undefined;
  ProfileScreenNew: undefined;
  MeteoraScreen: undefined;
  OtherProfile: {userId: string};
  PostThread: {postId: string};
  FollowersFollowingList: undefined;
  ProfileScreen: undefined;
  WalletScreen: {
    walletAddress?: string;
    walletBalance?: string;
  };
  OnrampScreen: undefined;
  WebViewScreen: {uri: string; title: string};
  DeleteAccountConfirmationScreen: undefined;
  SwapScreen: {
    inputToken?: Partial<TokenInfo>;
    outputToken?: {
      address: string;
      symbol: string;
      mint?: string;
      logoURI?: string;
      name?: string;
    };
    SwapForm: undefined;
    inputAmount?: string;
    shouldInitialize?: boolean;
    showBackButton?: boolean;
  };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const userId = useSelector((state: RootState) => state.auth.address);
  const chats = useSelector((state: RootState) => state.chat.chats);
  const dispatch = useAppDispatch();

  useEffect(() => {
    console.log(`[RootNavigator] isLoggedIn state changed: ${isLoggedIn}`);
  }, [isLoggedIn]);

  // Initialize socket connection and join all chat rooms when user is logged in
  useEffect(() => {
    if (isLoggedIn && userId) {
      console.log(
        '[RootNavigator] User logged in, initializing persistent socket connection',
      );

      // Initialize socket connection with persistent mode
      socketService
        .initSocket(userId)
        .then(connected => {
          if (connected) {
            console.log('[RootNavigator] Socket connected successfully');
            socketService.setPersistentMode(true);

            // Fetch user chats if not already loaded
            if (chats.length === 0) {
              dispatch(fetchUserChats(userId))
                .then(resultAction => {
                  if (fetchUserChats.fulfilled.match(resultAction)) {
                    const userChats = resultAction.payload;
                    if (userChats && Array.isArray(userChats)) {
                      // Join all chat rooms
                      const chatIds = userChats
                        .map(chat => chat.id)
                        .filter(Boolean);
                      if (chatIds.length > 0) {
                        console.log(
                          '[RootNavigator] Joining all chat rooms:',
                          chatIds,
                        );
                        socketService.joinChats(chatIds);
                      }
                    }
                  }
                })
                .catch(error => {
                  console.error(
                    '[RootNavigator] Error fetching user chats:',
                    error,
                  );
                });
            } else {
              // If chats are already loaded, just join them
              const chatIds = chats.map(chat => chat.id).filter(Boolean);
              if (chatIds.length > 0) {
                console.log(
                  '[RootNavigator] Joining existing chat rooms:',
                  chatIds,
                );
                socketService.joinChats(chatIds);
              }
            }
          } else {
            console.error('[RootNavigator] Failed to connect socket');
          }
        })
        .catch(error => {
          console.error('[RootNavigator] Socket initialization error:', error);
        });
    }

    // Cleanup function
    return () => {
      // We don't disconnect on unmount - this component is always mounted
      // Only disconnect explicitly on logout
    };
  }, [isLoggedIn, userId, dispatch]);

  // Determine which screens to show based on login state
  const renderScreens = () => {
    if (isLoggedIn) {
      return (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="CoinDetailPage" component={CoinDetailPage} />
          <Stack.Screen name="Pumpfun" component={PumpfunScreen} />
          <Stack.Screen name="TokenMill" component={TokenMillScreen} />
          <Stack.Screen name="NftScreen" component={NftScreen} />
          <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
          <Stack.Screen name="ChatScreen" component={ChatScreen} />
          {/* <Stack.Screen name="moonpayWidget" component={MoonPayWidget} /> */}
          <Stack.Screen name="onRampScreen" component={OnrampScreen} />
          <Stack.Screen name="walletScreenMoonPay" component={WalletScreen} />
          <Stack.Screen
            name="luloRebalancingYield"
            component={LuloRebalancingYieldCard}
          />

          <Stack.Screen
            name="UserSelectionScreen"
            component={UserSelectionScreen}
          />
          <Stack.Screen name="PumpSwap" component={PumpSwapScreen} />
          <Stack.Screen name="MercuroScreen" component={MercuroScreen} />
          <Stack.Screen name="LaunchlabsScreen" component={LaunchlabsScreen} />
          <Stack.Screen name="MeteoraScreen" component={MeteoraScreen} />
          <Stack.Screen name="CoinbaseOnRampScreen" component={CoinbaseOnrampScreen}/>


          {/* NEW SCREEN for viewing other user's profile */}
          <Stack.Screen name="OtherProfile" component={OtherProfileScreen} />
          <Stack.Screen name="PostThread" component={PostThreadScreen} />
          <Stack.Screen
            name="FollowersFollowingList"
            component={FollowersFollowingListScreen}
            options={{title: ''}}
          />
          <Stack.Screen name="AddCashScreen" component={AddCashScreen} />
          <Stack.Screen
            name="ExportWalletScreen"
            component={ExportWalletScreen}
          />

          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="ProfileScreenNew" component={ProfileScreenNew} />
          <Stack.Screen name="PerpetualsScreen" component={PerpetualsScreen} />

          <Stack.Screen name="TradeScreen" component={TradeScreen} />
          {/* <Stack.Screen name="positionSection" component={PositionsSection} /> */}

          <Stack.Screen
            name="SettingsScreen"
            component={SettingsScreen}
            options={{
              headerShown: false,
              presentation: 'transparentModal',
              animation: 'none', // we handle animation manually
            }}
          />
          <Stack.Screen
            name="TokenDetailScreen"
            component={TokenDetailScreen}
          />
          <Stack.Screen name="FiltersScreen" component={FiltersScreen} />
          <Stack.Screen name="LoadingScreen" component={LoadingScreen} />
          <Stack.Screen
            name="GlobalSearchScreen"
            component={GlobalSearchScreen}
          />
          <Stack.Screen name="WalletScreen" component={WalletScreen} />
          <Stack.Screen name="OnrampScreen" component={OnrampScreen} />
          <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
          <Stack.Screen
            name="DeleteAccountConfirmationScreen"
            component={DeleteAccountConfirmationScreen}
          />
          <Stack.Screen name="SwapScreen" component={SwapScreen} />
          <Stack.Screen name="SwapForm" component={SwapForm} />
        </>
      );
    } else {
      return (
        <>
          <Stack.Screen name="IntroScreen" component={IntroScreen} />
          <Stack.Screen name="LoginOptions" component={LoginScreen} />
          {/* Still include MainTabs for navigation from IntroScreen if user is found to be logged in */}
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </>
      );
    }
  };

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      // When logged in, start at MainTabs; otherwise start at IntroScreen
      initialRouteName={isLoggedIn ? 'MainTabs' : 'IntroScreen'}>
      {renderScreens()}
    </Stack.Navigator>
  );
}
