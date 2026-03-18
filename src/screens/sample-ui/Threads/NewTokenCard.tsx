// ==== File: components/NewTokenCard.tsx ====

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import COLORS from '@/assets/colors';
import {IPFSAwareImage, getValidImageSource} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
 
interface Props {
  mint: string;
  name: string;
  symbol: string;
  logo?: string;
  progressPercent?: number; // 👈 ADD THIS
  mc: string;
  onPress?: () => void;
}

export default function NewTokenCard({
  mint,
  name,
  symbol,
  logo,
  progressPercent,
  mc,
  onPress,
}: Props) {
  const hasProgress = typeof progressPercent === 'number';

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}>
      {/* LEFT: LOGO */}
      <IPFSAwareImage
        source={getValidImageSource(logo)}
        defaultSource={DEFAULT_IMAGES.token}
        style={styles.logo}
        key={Platform.OS === 'android' ? `new-${mint}` : 'new'}
      />

      {/* CENTER */}
      <View style={styles.center}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.symbol}>{symbol.toLowerCase()}</Text>

        {/* Progress bar */}
        {hasProgress && (
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, {width: `${progressPercent}%`}]}
            />
          </View>
        )}
      </View>

      {/* RIGHT */}
      <View style={styles.right}>
        <Text style={styles.time}>2m</Text>
        <Text style={styles.mc}>$23.45K MC</Text>
        {hasProgress ? (
          <Text style={styles.progressText}>{progressPercent}%</Text>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NEW</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0e111679',
    marginHorizontal: 9,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },

  /* LOGO */
  logo: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },

  /* CENTER */
  center: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  progressText: {
  marginTop: 6,
  color: '#22C55E',
  fontSize: 12,
  fontWeight: '600',
},

  time: {color: '#83868b', fontSize: 12},
  symbol: {
    color: '#7C8494',
    fontSize: 12,
    marginTop: 2,
  },

  progressTrack: {
    height: 3,
    backgroundColor: '#1F2937',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
    marginRight: 7,
  },
  progressFill: {
    width: '18%', // visually matches screenshot
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 2,
  },

  /* RIGHT */
  right: {
    alignItems: 'flex-end',
  },
  mc: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1F2937',
  },
  badgeText: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
  },
});
