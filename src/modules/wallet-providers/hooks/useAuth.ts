import { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginSuccess, logoutSuccess } from '@/shared/state/auth/reducer';
import { usePrivyWalletLogic } from '../services/walletProviders/privy';
import { useCustomization } from '@/shared/config/CustomizationProvider';
import { useAppNavigation } from '@/shared/hooks/useAppNavigation';
import { getDynamicClient } from '../services/walletProviders/dynamic';
import { useAppSelector } from '@/shared/hooks/useReduxHooks';
import { VersionedTransaction, PublicKey } from '@solana/web3.js';
import { useLoginWithOAuth, usePrivy, } from '@privy-io/expo';
import { useDynamicWalletLogic } from './useDynamicWalletLogic';
import { useTurnkeyWalletLogic } from './useTurnkeyWalletLogic';
import { StandardWallet, LoginMethod, WalletMonitorParams } from '../types';
import axios from 'axios';
import { SERVER_URL } from "@env";
const GET_USER_RELATIVE = '/api/userRoutess/user';
const SYNC_RELATIVE = "/api/userRoutess/syncUser";
/**
 * Summarized usage:
 *  1) Read which provider is set from config.
 *  2) If 'privy', we handle via `usePrivyWalletLogic`.
 *  3) If 'dynamic', we handle via `useDynamicWalletLogic`.
 *  4) If 'turnkey', we handle via `useTurnkeyWalletLogic`.
 */
// ✅ Helper to send properly formatted user + wallet data to backend
export async function syncUserToBackend(privyUser: any, solanaWallet: any) {
  try {
    console.log("[syncUser] Preparing data for backend...");

    const linkedAccounts =
      privyUser?.linked_accounts?.map((acc: any) => ({
        type: acc.type || null,
        name: acc.name || null,
        email: acc.email || null,
        profile_image_url: acc.profile_image_url || null,
        oauth_provider: acc.type?.includes("oauth")
          ? acc.type.replace("_oauth", "")
          : null,
      })) || [];

    const payload = {
      user: {
        id: privyUser.id,
        has_accepted_terms: !!privyUser.has_accepted_terms,
        is_guest: !!privyUser.is_guest,
        linked_accounts: linkedAccounts,
        mfa_methods: privyUser.mfa_methods || [],
        primary_oauth_type:
          privyUser.linked_accounts?.find((a: any) =>
            a.type?.includes("oauth")
          )?.type || null,
      },
      wallet: {
        address:
          solanaWallet.address ||
          solanaWallet.publicKey ||
          solanaWallet.wallets?.[0]?.publicKey,
        publicKey:
          solanaWallet.publicKey ||
          solanaWallet.address ||
          solanaWallet.wallets?.[0]?.publicKey,
        chain_type: solanaWallet.chain_type || "solana",
        chain_id: solanaWallet.chain_id || "solana-mainnet",
        wallet_client: solanaWallet.wallet_client || "privy",
        wallet_client_type: solanaWallet.wallet_client_type || "embedded",
        recovery_method: solanaWallet.recovery_method || "privy",
        wallet_index: solanaWallet.wallet_index || 0,
        delegated: solanaWallet.delegated || false,
        imported: solanaWallet.imported || false,
        status: solanaWallet.status || "connected",
      },
    };

    console.log("[syncUser] Sending payload:", JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${SERVER_URL}${SYNC_RELATIVE}`,
      payload
    );

    if (response.data?.success) {
      console.log(
        "[syncUser] ✅ User synced successfully. userId:",
        response.data.userId
      );
    } else {
      console.warn("[syncUser] ❌ Sync failed:", response.data?.message);
    }
  } catch (error: any) {
    console.error("[syncUser] 🚨 Error syncing user:", error.message);
  }
}

export function useAuth() {
  const { auth: authConfig } = useCustomization();
  const selectedProvider = authConfig.provider;
  const dispatch = useDispatch();
  const navigation = useAppNavigation();
  const authState = useAppSelector(state => state.auth);


  // --- Fetch user profile ---


  // const [isLoading, setIsLoading] = useState(false);

  // Get wallet address and provider from Redux state
  const storedAddress = authState.address;
  const storedProvider = authState.provider;

  /** PRIVY CASE */
  if (selectedProvider === 'privy') {
    const {
      handlePrivyLogin,
      handlePrivyLogout,
      monitorSolanaWallet,
      user,
      solanaWallet,
    } = usePrivyWalletLogic();
    const [profile, setProfile] = useState<any>(null);
    const fetchUserProfile = useCallback(async (privyId: string) => {
      if (!privyId) return null;
      try {
        const res = await axios.get(
          `${SERVER_URL}${GET_USER_RELATIVE}/${encodeURIComponent(privyId)}`,
        );
        if (res.data?.success) {
          console.log('[useAuth] ✅ Profile fetched successfully');
          return res.data.user;
        } else {
          console.warn('[useAuth] ❌ Failed to fetch profile', res.data);
          return null;
        }
      } catch (err: any) {
        console.error('[useAuth] 🚨 Error fetching profile:', err.message);
        return null;
      }
    }, []);

    const fetchProfile = useCallback(async () => {
      if (!user?.id) return;
      const data = await fetchUserProfile(user.id);
      if (data) setProfile(data);
    }, [user?.id, fetchUserProfile]);

    // Auto-fetch when user changes
    useEffect(() => {
      if (user?.id) fetchProfile();
    }, [user?.id, fetchProfile]);
    // Get the direct Privy OAuth login hook
    const { login: loginWithOAuth } = useLoginWithOAuth();
    // const { user } = usePrivy();


    // Create a standardized wallet object for Privy
    const standardWallet: StandardWallet | null = solanaWallet?.wallets?.[0] ? {
      provider: 'privy',
      address: solanaWallet.wallets[0].publicKey,
      publicKey: solanaWallet.wallets[0].publicKey,
      rawWallet: solanaWallet.wallets[0],
      getWalletInfo: () => ({
        walletType: 'Privy',
        address: solanaWallet.wallets?.[0]?.publicKey || null,
      }),
      getProvider: async () => {
        if (solanaWallet?.getProvider) {
          return solanaWallet.getProvider();
        }
        throw new Error('Privy wallet provider not available');
      },
    } : null;

    const loginWithApple = useCallback(async () => {
      try {
        console.log('[useAuth] Starting Apple login process...');
        // Use direct OAuth login with proper error handling
        const result = await loginWithOAuth({
          provider: 'apple',
          // Don't pass isLegacyAppleIosBehaviorEnabled to use native flow
        });

        console.log('[useAuth] Apple OAuth login result:', result);

        // Check if we have a valid authentication result before proceeding
        if (!result) {
          console.error('[useAuth] Apple authentication failed - no result returned');
          throw new Error('Apple authentication failed to complete');
        }

        console.log('[useAuth] Starting Solana wallet monitoring after successful login');

        // First try creating the wallet explicitly
        if (solanaWallet && typeof solanaWallet.create === 'function') {
          try {
            console.log('[useAuth] Attempting direct wallet creation first');
            const createResult = await solanaWallet.create();
            console.log('[useAuth] Direct wallet creation result:', createResult);
          } catch (createError) {
            console.log('[useAuth] Direct wallet creation failed (may already exist):', createError);
          }
        }

        // Continue monitoring the wallet after login
        await monitorSolanaWallet({
          selectedProvider: 'privy',
          setStatusMessage: (msg) => {
            console.log('[useAuth] Wallet status:', msg);
          },
          onWalletConnected: info => {
            console.log('[useAuth] Wallet connected:', info);
            // Set initial username from the wallet address when logging in
            const initialUsername = info.address.substring(0, 6);
            console.log('[useAuth] Setting initial username:', initialUsername);

            dispatch(loginSuccess({
              provider: 'privy',
              address: info.address,
              username: initialUsername
            }));
            navigation.navigate('MainTabs');
          },
        });
      } catch (error) {
        console.error('[useAuth] Apple login error:', error);
        throw error; // Re-throw to allow component-level error handling
      }
    }, [loginWithOAuth, monitorSolanaWallet, solanaWallet, dispatch, navigation]);

    // const loginWithGoogle = useCallback(async () => {
    //   try {
    //     // Use direct OAuth login instead of handlePrivyLogin
    //     const result = await loginWithOAuth({
    //       provider: 'google',
    //       onSuccess: ({ user }) => {
    //         console.log('[useAuth] OAuth onSuccess user:', user);
    //       },
    //       onError: (error) => {
    //         console.error('[useAuth] OAuth onError:', error);
    //       }
    //     });
    //     console.log('[useAuth] OAuth login result:', result);
    //     // if (!result) throw new Error('Privy returned undefined result');
    //     console.log('[useAuth] Starting Solana wallet monitoring after successful login');

    //     // First try creating the wallet explicitly
    //     // if (solanaWallet && typeof solanaWallet.create === 'function') {
    //     //   try {
    //     //     console.log('[useAuth] Attempting direct wallet creation first');
    //     //     const createResult = await solanaWallet.create();
    //     //     console.log('[useAuth] Direct wallet creation result:', createResult);
    //     //   } catch (createError) {
    //     //     console.log('[useAuth] Direct wallet creation failed (may already exist):', createError);
    //     //   }
    //     // }

    //     // Continue monitoring the wallet after login
    //     await monitorSolanaWallet({
    //       selectedProvider: 'privy',
    //       setStatusMessage: (msg) => {
    //         console.log('[useAuth] Wallet status:', msg);
    //       },
    //       onWalletConnected: info => {
    //         console.log('[useAuth] Wallet connected:', info);
    //         // Set initial username from the wallet address when logging in
    //         const initialUsername = info.address.substring(0, 6);
    //         console.log('[useAuth] Setting initial username:', initialUsername);

    //         dispatch(loginSuccess({
    //           provider: 'privy',
    //           address: info.address,
    //           username: initialUsername
    //         }));
    //         navigation.navigate('MainTabs');
    //       },
    //     });
    //   } catch (error) {
    //     console.error('[useAuth] Google login error:', error);
    //   }
    // }, [loginWithOAuth, monitorSolanaWallet, solanaWallet, dispatch, navigation]);

    const loginWithGoogle = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'google',
        setStatusMessage: (msg) => {
          console.log('[useAuth] Auth status:', msg);
        }
      });
      // try {
      //   // setIsLoading(true);
      //   console.log('[useAuth] Starting google login process...');
      //   if (handlePrivyLogin) {
      //     await handlePrivyLogin({
      //       loginMethod: 'google',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Auth status:', msg);
      //       }
      //     });
      //     console.log('[useAuth] OAuth step done, waiting for Privy user...', user);


      //     console.log('[useAuth] gogogle auth successful, starting wallet monitoring...');
      //     if (user) {
      //       await monitorSolanaWallet({
      //         selectedProvider: 'privy',
      //         setStatusMessage: (msg) => {
      //           console.log('[useAuth] Wallet status:', msg);
      //         },
      //         onWalletConnected: async (walletInfo) => {
      //           console.log('[useAuth] Wallet connected successfully:', walletInfo);
      //           // Set initial username from the wallet address when logging in
      //           // Step 3️⃣: Sync user + wallet to backend
      //           if (user && walletInfo?.address) {
      //             await syncUserToBackend(user, {
      //               ...walletInfo,
      //               publicKey: walletInfo.address,
      //               chain_type: "solana",
      //               chain_id: "solana-devnet",
      //               wallet_client: "privy",
      //               wallet_client_type: "embedded",
      //               recovery_method: "privy",
      //               wallet_index: 0,
      //               delegated: false,
      //               imported: false,
      //               status: "connected",
      //             });
      //           } else {
      //             console.warn("[useAuth] Missing user or wallet data, skipping sync");
      //           }

      //           const email = user?.linked_accounts?.find((a: any) => a.type === "google_oauth")?.name;
      //           // const initialUsername = walletInfo.address.substring(0, 6);
      //           const initialUsername = email;
      //           console.log('[useAuth] Setting initial username:', initialUsername);

      //           dispatch(loginSuccess({
      //             provider: 'privy',
      //             address: walletInfo.address,
      //             username: initialUsername
      //           }));

      //           navigation.navigate('MainTabs');
      //         },
      //       });
      //     }

      //   } else {
      //     throw new Error('google login not available');
      //   }
      // } catch (error) {
      //   console.error('[useAuth] google login error:', error);
      //   throw error; // Re-throw to allow component-level error handling
      // } finally {
      //   setIsLoading(false);
      // }
    }, [loginWithOAuth, monitorSolanaWallet, solanaWallet, dispatch, navigation]);

    const loginWithEmail = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'email',
        setStatusMessage: (msg) => {
          console.log('[useAuth] Auth status:', msg);
        }
      });
      // try {
      //   console.log('[useAuth] Starting email login process...');
      //   if (handlePrivyLogin) {
      //     await handlePrivyLogin({
      //       loginMethod: 'email',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Auth status:', msg);
      //       }
      //     });

      //     console.log('[useAuth] Email auth successful, starting wallet monitoring...');

      //     // navigation.navigate('LoadingScreen');

      //     await monitorSolanaWallet({
      //       selectedProvider: 'privy',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Wallet status:', msg);
      //       },
      //       onWalletConnected: info => {
      //         console.log('[useAuth] Wallet connected successfully:', info);
      //         // Set initial username from the wallet address when logging in
      //         const initialUsername = info.address.substring(0, 6);
      //         console.log('[useAuth] Setting initial username:', initialUsername);

      //         dispatch(loginSuccess({
      //           provider: 'privy',
      //           address: info.address,
      //           username: initialUsername
      //         }));

      //         navigation.navigate('MainTabs');
      //       },
      //     });
      //   } else {
      //     throw new Error('Email login not available');
      //   }
      // } catch (error) {
      //   console.error('[useAuth] Email login error:', error);
      //   throw error; // Re-throw to allow component-level error handling
      // }
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation]);

    const loginWithTwitter = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'twitter',
        setStatusMessage: (msg) => {
          console.log('[useAuth] Auth status:', msg);
        }
      });
      // try {
      //   console.log('[useAuth] Starting twitter login process...');
      //   if (handlePrivyLogin) {
      //     await handlePrivyLogin({
      //       loginMethod: 'twitter',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Auth status:', msg);
      //       }
      //     });

      //     console.log('[useAuth] twitter auth successful, starting wallet monitoring...');
      //     await monitorSolanaWallet({
      //       selectedProvider: 'privy',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Wallet status:', msg);
      //       },
      //       onWalletConnected: info => {
      //         console.log('[useAuth] Wallet connected successfully:', info);
      //         // Set initial username from the wallet address when logging in
      //         const initialUsername = info.address.substring(0, 6);
      //         console.log('[useAuth] Setting initial username:', initialUsername);

      //         dispatch(loginSuccess({
      //           provider: 'privy',
      //           address: info.address,
      //           username: initialUsername
      //         }));

      //         navigation.navigate('MainTabs');
      //       },
      //     });
      //   } else {
      //     throw new Error('twitter login not available');
      //   }
      // } catch (error) {
      //   console.error('[useAuth] twitter login error:', error);
      //   throw error; // Re-throw to allow component-level error handling
      // }
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation]);

    const loginWithGitHub = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'github',
        setStatusMessage: (msg) => {
          console.log('[useAuth] Auth status:', msg);
        }
      });
      // try {
      //   console.log('[useAuth] Starting github login process...');
      //   if (handlePrivyLogin) {
      //     await handlePrivyLogin({
      //       loginMethod: 'github',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Auth status:', msg);
      //       }
      //     });

      //     console.log('[useAuth] github auth successful, starting wallet monitoring...');
      //     await monitorSolanaWallet({
      //       selectedProvider: 'privy',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Wallet status:', msg);
      //       },
      //       onWalletConnected: info => {
      //         console.log('[useAuth] Wallet connected successfully:', info);
      //         // Set initial username from the wallet address when logging in
      //         const initialUsername = info.address.substring(0, 6);
      //         console.log('[useAuth] Setting initial username:', initialUsername);

      //         dispatch(loginSuccess({
      //           provider: 'privy',
      //           address: info.address,
      //           username: initialUsername
      //         }));

      //         navigation.navigate('MainTabs');
      //       },
      //     });
      //   } else {
      //     throw new Error('github login not available');
      //   }
      // } catch (error) {
      //   console.error('[useAuth] github login error:', error);
      //   throw error; // Re-throw to allow component-level error handling
      // }
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation]);

    const loginWithTikTok = useCallback(async () => {
      await handlePrivyLogin({
        loginMethod: 'tiktok',
        setStatusMessage: (msg) => {
          console.log('[useAuth] Auth status:', msg);
        }
      });
      // try {
      //   console.log('[useAuth] Starting tiktok login process...');
      //   if (handlePrivyLogin) {
      //     await handlePrivyLogin({
      //       loginMethod: 'tiktok',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Auth status:', msg);
      //       }
      //     });

      //     console.log('[useAuth] tiktok auth successful, starting wallet monitoring...');
      //     await monitorSolanaWallet({
      //       selectedProvider: 'privy',
      //       setStatusMessage: (msg) => {
      //         console.log('[useAuth] Wallet status:', msg);
      //       },
      //       onWalletConnected: info => {
      //         console.log('[useAuth] Wallet connected successfully:', info);
      //         // Set initial username from the wallet address when logging in
      //         const initialUsername = info.address.substring(0, 6);
      //         console.log('[useAuth] Setting initial username:', initialUsername);

      //         dispatch(loginSuccess({
      //           provider: 'privy',
      //           address: info.address,
      //           username: initialUsername
      //         }));

      //         navigation.navigate('MainTabs');
      //       },
      //     });
      //   } else {
      //     throw new Error('Tiktok login not available');
      //   }
      // } catch (error) {
      //   console.error('[useAuth] Tiktok login error:', error);
      //   throw error; // Re-throw to allow component-level error handling
      // }
    }, [handlePrivyLogin, monitorSolanaWallet, dispatch, navigation]);

    const logout = useCallback(async () => {
      console.log('[useAuth] Attempting Privy logout...');
      try {
        // Wrap the SDK call in a try/catch
        try {
          await handlePrivyLogout(() => { });
          console.log('[useAuth] Privy SDK logout successful.');
        } catch (sdkError) {
          console.error('[useAuth] Error during Privy SDK logout (continuing anyway):', sdkError);
          // Continue with Redux state cleanup even if SDK logout fails
        }

        // Always clean up Redux state
        console.log('[useAuth] Dispatching logoutSuccess.');
        dispatch(logoutSuccess());
        console.log('[useAuth] Redux logout dispatched. Resetting navigation.');

        // Use setTimeout to allow React to process state changes before navigation
        setTimeout(() => {
          try {
            // Reset navigation to the initial route of the logged-out stack
            navigation.reset({
              index: 0,
              routes: [{ name: 'IntroScreen' }],
            });
          } catch (navError) {
            console.error('[useAuth] Error during navigation reset:', navError);
          }
        }, 50);
      } catch (error) {
        console.error('[useAuth] Error during Privy logout:', error);
      }
    }, [handlePrivyLogout, dispatch, navigation]);

    return {
      status: '',
      // isLoading,
      loginWithGoogle,
      loginWithApple,
      loginWithEmail,
      loginWithGitHub,
      loginWithTwitter,
      loginWithTikTok,
      logout,
      user,
      solanaWallet, // Keep for backward compatibility
      wallet: standardWallet, // Add standardized wallet
      profile,
      fetchProfile,
    };
  }


  const safeLogout = async () => {
    console.warn('[useAuth] Logout called but no provider active.');
    // Still dispatch logout action to ensure clean state
    dispatch(logoutSuccess());
    // Navigate to intro screen for safety
    setTimeout(() => {
      try {
        navigation.reset({
          index: 0,
          routes: [{ name: 'IntroScreen' }],
        });
      } catch (navError) {
        console.error('[useAuth] Error during navigation reset:', navError);
      }
    }, 50);
  };

  // Create a complete empty interface with all methods that
  // could be called from any component
  return {
    status: '',
    // setIsLoading,
    logout: async () => { },
    // Auth methods
    loginWithGoogle: async () => { },
    loginWithApple: async () => { },
    loginWithEmail: async () => { },
    loginWithSMS: async () => { },
    initEmailOtpLogin: async () => { },
    verifyEmailOtp: async () => { },
    // Data
    user: null,
    solanaWallet: null,
    wallet: null,
    // State
    loading: false,
    otpResponse: null,
    isAuthenticated: false,
    connected: false,
    profile: null,
    fetchProfile: async () => { },
  };
}