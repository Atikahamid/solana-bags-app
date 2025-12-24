import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {LinearGradient} from 'expo-linear-gradient';
import COLORS from '@/assets/colors';
import {useNavigation} from '@react-navigation/native';

import {SERVER_URL} from '@env';
import {useAuth} from '@/modules/wallet-providers';

export default function ReferralCodeScreen() {
  const navigation = useNavigation();
  const {user} = useAuth();
  const userPrivyId = user?.id;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePaste = async () => {
    const value = await Clipboard.getStringAsync();
    setCode(value.trim());
  };

  const handleContinue = useCallback(async () => {
    if (!code.trim()) return;

    try {
      setLoading(true);

      const res = await fetch(`${SERVER_URL}/api/userRoutess/referral/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrivyId,
          referralCode: code.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message);
      }

      navigation.navigate('MainTabs', {
        referralSuccess: true,
        referralMessage:
          '🎉 Referral applied! You’ll get 10% trading fee discount.',
      });
    } catch (err: any) {
      Alert.alert(
        'Invalid referral code',
        err?.message || 'This referral code is invalid or already used.',
      );
    } finally {
      setLoading(false);
    }
  }, [code, userPrivyId, navigation]);

  const handleSkip = useCallback(async () => {
    try {
      setLoading(true);

      const res = await fetch(`${SERVER_URL}/api/userRoutess/referral/skip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrivyId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message);
      }

      navigation.navigate('MainTabs');
    } catch {
      Alert.alert('Error', 'Failed to continue. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userPrivyId, navigation]);

  const isValid = code.length > 0;

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Enter referral code</Text>

          <Text style={styles.subtitle}>
            Get a <Text style={styles.highlight}>10% discount</Text> on trading
            fees{'\n'}
            for a limited time.
          </Text>

          <View style={styles.inputWrapper}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder=""
              placeholderTextColor="#666"
              style={styles.input}
              autoCapitalize="characters"
              autoFocus={true}
              editable={!loading}
            />
          </View>

          <TouchableOpacity onPress={handleSkip} disabled={loading}>
            <Text style={styles.noCode}>I don’t have a code</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              isValid ? styles.buttonActive : styles.buttonInactive,
            ]}
            onPress={isValid ? handleContinue : handlePaste}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text
                style={[
                  styles.buttonText,
                  isValid ? styles.buttonTextActive : styles.buttonTextInactive,
                ]}>
                {isValid ? 'Continue' : 'Paste from clipboard'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#9CA3AF',
    lineHeight: 22,
    marginBottom: 32,
  },
  highlight: {
    color: '#4F8CFF',
    fontWeight: '600',
  },
  inputWrapper: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#9090926b',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  noCode: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 32,
    marginTop: 5,
    textAlign: 'center',
  },
  button: {
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonInactive: {
    backgroundColor: '#464d58ff',
  },
  buttonActive: {
    backgroundColor: '#4F8CFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextInactive: {
    color: '#9298a1ff',
  },
  buttonTextActive: {
    color: '#FFFFFF',
  },
});
