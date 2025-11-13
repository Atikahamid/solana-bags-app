import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { TradeV3 } from '@/modules/data-module/hooks/birdEye';
import { normalizeSides, timeAgo } from '@/modules/data-module/hooks/birdEye';

export default function TradeRow({ trade, onPress }: { trade: TradeV3; onPress?: () => void }) {
  const { fromSym, toSym, fromAmt, toAmt } = normalizeSides(trade);
  const ago = timeAgo(trade.block_time);
  const usd = trade.volume_usd ?? trade.price_usd;

  return (
    <TouchableOpacity onPress={onPress} style={styles.row} activeOpacity={0.7}>
      <View style={styles.line1}>
        <Text style={styles.pair}>{fromSym} → {toSym}</Text>
        <Text style={styles.ago}>{ago}</Text>
      </View>

      <View style={styles.line2}>
        <Text style={styles.amounts}>
          {fromAmt ? fromAmt.toLocaleString() : '-'} {fromSym}
          {'  '}→{'  '}
          {toAmt ? toAmt.toLocaleString() : '-'} {toSym}
        </Text>
        <Text style={styles.dex}>{trade.dex ?? trade.platform ?? ''}</Text>
      </View>

      {!!usd && (
        <View style={styles.line3}>
          <Text style={styles.usd}>~ ${usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: '#333' },
  line1: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  pair: { color: '#fff', fontWeight: '600', fontSize: 16 },
  ago: { color: '#9aa', fontSize: 12 },
  line2: { flexDirection: 'row', justifyContent: 'space-between' },
  amounts: { color: '#ccd', fontSize: 13 },
  dex: { color: '#9aa', fontSize: 12 },
  line3: { marginTop: 4 },
  usd: { color: '#bdf', fontWeight: '600' },
});
