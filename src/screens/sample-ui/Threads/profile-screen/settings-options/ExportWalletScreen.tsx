// /src/screens/ExportWalletScreen.js
/**
 * ExportWalletScreen
 * - Slide-in animated screen matching Settings animation style
 * - Single "Export Private Key" section with a Reveal button
 * - Revealed private key (static dummy) with working copy button
 *
 * Minimal comments. Focus on why for important bits.
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
  Clipboard as RNClipboard, // fallback for older RN versions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import Icons from '@/assets/svgs'; // assumes your project has Icons
import COLORS from '@/assets/colors';

export default function ExportWalletScreen() {
  const navigation = useNavigation();

  // Animation refs: same concept as Settings screen
  const slideAnim = useRef(new Animated.Value(400)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // UI state
  const [revealed, setRevealed] = useState(false);
  const [copying, setCopying] = useState(false);

  // static dummy private key for now
  const privateKey = '5f3b2a1c-EXAMPLE-PRIVATE-KEY-THIS-IS-STATIC-1234567890';

  useEffect(() => {
    // Animate in on mount
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, backdropOpacity]);

  const handleGoBack = useCallback(() => {
    // animate out then navigate back
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => navigation.goBack());
  }, [navigation]);

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleCopy = async () => {
    try {
      setCopying(true);
      // expo-clipboard preferred
      if (Clipboard && Clipboard.setStringAsync) {
        await Clipboard.setStringAsync(privateKey);
      } else if (RNClipboard && RNClipboard.setString) {
        RNClipboard.setString(privateKey);
      }
      // Minimal user feedback
      Alert.alert('Copied', 'Private key copied to clipboard.');
    } catch (err) {
      console.error('Copy error:', err);
      Alert.alert('Error', 'Failed to copy to clipboard.');
    } finally {
      setCopying(false);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.overlay, { opacity: backdropOpacity }]} />
      <Animated.View
        style={[styles.animatedWrapper, { transform: [{ translateX: slideAnim }] }]}
      >
        <LinearGradient
          colors={COLORS?.backgroundGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.container}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
              {/* Use your project's ArrowLeft icon */}
              {Icons?.ArrowLeft ? (
                <Icons.ArrowLeft width={22} height={22} color="#fff" />
              ) : (
                <Text style={styles.backFallback}>{'<'}</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Export Wallet</Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.sectionTitle}>Export Private Key</Text>
            <Text style={styles.sectionSubtitle}>
              Your private key should always be stored in a safe place offline.
            </Text>

            {!revealed ? (
              <TouchableOpacity style={styles.revealButton} onPress={handleReveal}>
                <View style={styles.revealInner}>
                  {/* Eye icon if available */}
                  {Icons?.EyeIcon ? (
                    <Icons.EyeIcon width={16} height={16} color="#00ff7f" />
                  ) : (
                    <Text style={styles.eyeFallback}>👁️</Text>
                  )}
                  <Text style={styles.revealText}>Reveal private key</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.revealedContainer}>
                <Text style={styles.privateKeyText} numberOfLines={1} ellipsizeMode="middle">
                  {privateKey}
                </Text>

                <TouchableOpacity
                  style={styles.copyButton}
                  onPress={handleCopy}
                  disabled={copying}
                >
                  {Icons?.copyIcon ? (
                    <Icons.copyIcon width={14} height={14} color="#fff" />
                  ) : (
                    <Text style={styles.copyFallback}>Copy</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  animatedWrapper: { position: 'absolute', top: 0, bottom: 0, right: 0, left: 0 },
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 28 },
  backButton: { marginRight: 14, padding: 6 },
  backFallback: { color: '#fff', fontSize: 20 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  // content
  content: { paddingTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  sectionSubtitle: { color: '#9aa6b2', fontSize: 13, marginBottom: 18, lineHeight: 18 },

  // reveal button (pill, green text)
  revealButton: {
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,255,127,0.15)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    alignSelf: 'flex-start',
    minWidth: 220,
  },
  revealInner: { flexDirection: 'row', alignItems: 'center' },
  eyeFallback: { marginRight: 10 },
  revealText: { color: '#00ff7f', marginLeft: 10, fontWeight: '600' },

  // revealed container (rounded box with key + copy button)
  revealedContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071a2b',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  privateKeyText: {
    color: '#dfe9ef',
    flex: 1,
    marginRight: 10,
    fontSize: 13,
  },
  copyButton: {
    backgroundColor: '#164780',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyFallback: { color: '#fff', fontWeight: '600' },
});
