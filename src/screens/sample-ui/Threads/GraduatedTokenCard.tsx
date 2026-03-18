import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Platform} from 'react-native';
import COLORS from '@/assets/colors';
import {IPFSAwareImage, getValidImageSource} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import Icons from '@/assets/svgs';

interface Props {
  mint: string;
  name: string;
  symbol: string;
  logo?: string;
  mc: string; 
  // vol?: string;
  priceUsd: number;
  change: number;
  onPress?: () => void;
}

export default function GraduatedTokenCard({
  mint,
  name,
  symbol,
  logo,
  mc,
  priceUsd,
  change,
  onPress,
}: Props) {
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#22C55E' : '#EF4444';
const priceText =
    priceUsd != null ? `$${priceUsd.toFixed(5)}` : '--';
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.card}
      onPress={onPress}>
      {/* LEFT */}
      <IPFSAwareImage
        source={getValidImageSource(logo)}
        defaultSource={DEFAULT_IMAGES.token}
        style={styles.logo}
        key={Platform.OS === 'android' ? `grad-${mint}` : 'grad'}
      />

      {/* CENTER */}
      <View style={styles.center}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.mc}>{mc} MC</Text>
      </View>

      {/* RIGHT */}
      <View style={styles.right}>
        {/* <Text style={styles.price}>{symbol.startsWith('$') ? symbol : `$${symbol}`}</Text> */}
        <Text style={styles.price}>${priceText}</Text>
        <View style={styles.changeRow}>
          {isPositive ? (
            <Icons.FillArrowUp width={13} height={13} />
          ) : (
            <Icons.FillArrowDown width={13} height={13} />
          )}
          <Text style={[styles.change, {color: changeColor}]}>
            {Math.abs(change).toFixed(2)}%
          </Text>
        </View>
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
    borderRadius: 14,
     borderWidth: 1,
    borderColor: '#1F2937',
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },

  center: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  mc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },

  right: {
    alignItems: 'flex-end',
  },
  price: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});
