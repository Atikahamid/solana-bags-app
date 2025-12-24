// ==== File: components/TokenCard.tsx ====
import COLORS from '@/assets/colors';
import React from 'react';
import FastImage from 'react-native-fast-image';

import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from 'react-native';
import SolanaIconIMage from '@/assets/images/solana-icon image.png';
import Icons from '@/assets/svgs';
import {IPFSAwareImage} from '@/shared/utils/IPFSImage';

interface TokenCardProps {
  name: string;
  symbol: string;
  logo?: string;
  mc: string;
  liq: string;
  vol: string;
  change: number;
  onPress?: () => void; // ✅ new
}

export const resolveImageUrl = (url: string) => {
  if (!url) return null;

  // Case 1: ipfs://CID
  if (url.startsWith('ipfs://')) {
    const cid = url.replace('ipfs://', '');
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }

  // Case 2: https://ipfs.io/ipfs/CID or any other gateway
  if (url.includes('/ipfs/')) {
    const parts = url.split('/ipfs/');
    const cid = parts[1];
    return `https://cloudflare-ipfs.com/ipfs/${cid}`;
  }

  // Case 3: Any normal HTTP URL → leave unchanged
  return url;
};

export default function TokenCard({
  name,
  symbol,
  logo,
  mc,
  liq,
  vol,
  change,
  onPress,
}: TokenCardProps) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#4CAF50' : '#FF4C4C';
  const formattedChange = `${Math.abs(change).toFixed(1)}%`;

  const arrow = isPositive ? (
    <Icons.UpArrowIcon width={11} height={10} />
  ) : (
    <Icons.DownArrowIcon width={11} height={10} />
  );

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        {logo ? (
          <Image source={{uri: resolveImageUrl(logo)}} style={styles.logo} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>{symbol[0]}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.firstInfo}>
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>

        <Text style={styles.stats}>
          {mc} MC   {liq} LIQ   {vol} VOL
        </Text>
      </View>

      {/* Change */}
      <View style={styles.rightSide}>
        <Text style={[styles.change, {color: changeColor}]}>
          {arrow} {formattedChange}
        </Text>
        <View style={styles.solanaOne}>
          <Image
            source={SolanaIconIMage}
            style={styles.fallbackImage}
            resizeMode="contain"
          />
          <Text style={styles.solanaOneText}> 1</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1F25',
    borderRadius: 8,
    // padding: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 12,
    marginVertical: 6,
    borderWidth: 0.75,
    borderColor: '#3f433bf8',
  },
  firstInfo: {
    flexDirection: 'row',
    gap: 10,
  },
  rightSide: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  fallbackImage: {
    width: 16,
    height: 16,
  },
  solanaOne: {
    flexDirection: 'row',
    color: COLORS.white,
    borderWidth: 0.75,
    borderColor: COLORS.greyMid,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#25292eff',
    marginVertical: 8,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  solanaOneText: {
    color: COLORS.white,
    fontSize: 10,
  },
  logoContainer: {
    width: 50,
    height: 50,
    borderRadius: 21,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 28,
  },
  logoPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
    marginLeft: 4,
  },
  symbol: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  name: {
    color: '#AAA',
    fontSize: 11,
    marginTop: 3,
  },
  stats: {
    color: '#777',
    fontSize: 11,
    marginTop: 2,
  },
  change: {
    fontSize: 13,
    fontWeight: '600',
  },
});
