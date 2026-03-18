// src/screens/TokenStats2.tsx
import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Linking} from 'react-native';
import {TokenStatsApiResponse} from './tokenDetailService';
import {formatCompactNumber} from '../SearchScreen';
import Icons from '@/assets/svgs';
import {DimensionValue} from 'react-native';
interface Props {
  stats: TokenStatsApiResponse | null;
}

const GREEN = '#00cc66';
const RED = '#ff007f';

const calcPercent = (part: number, total: number): DimensionValue => {
  if (!total || total <= 0) return '0%';
  return `${Math.min(100, Math.round((part / total) * 100))}%`;
};

const TokenStats2: React.FC<Props> = ({stats}) => {
  if (!stats) return null;

  const s = stats.tokenStats;
  const socials = stats.token.socials ?? {};

  const volume24h = Number(s.volume_24h ?? 0);
  const buyVolume = Number(s.buy_volume ?? 0);
  const sellVolume = Number(s.sell_volume ?? 0);

  const txCount = Number(s.tx_count ?? 0);
  const buys = s.num_buys ? Number(s.num_buys) : Math.round(txCount / 2);
  const sells = s.num_sells ? Number(s.num_sells) : txCount - buys;

  const buyVolPercent = calcPercent(buyVolume, volume24h);
  console.log('buy vol %: ', buyVolPercent);
  const sellVolPercent = calcPercent(sellVolume, volume24h);
  console.log('sellVolPercent: ', buyVolPercent);

  const buyTxPercent = calcPercent(buys, txCount);
  console.log('buyTxPercent: ', buyVolPercent);

  const sellTxPercent = calcPercent(sells, txCount);
  console.log('sellTxPercent: ', buyVolPercent);

  const openLink = (url: string) => Linking.openURL(url);

  return (
    <View style={styles.container}>
      {/* About */}
      <Text style={styles.aboutHeading}>Description</Text>
      <Text style={styles.tokenDescription}>
        {stats.token.description ?? 'No description available'}
      </Text>

      {/* Raised */}
      {/* <View style={styles.raisedBox}>
        <Text style={styles.raisedValue}>$0.00</Text>
        <Text style={styles.raisedLabel}>total raised</Text>
      </View> */}

      {/* Socials */}
      <View style={{flexDirection: 'column', gap: 10, marginBottom: 10}}>
        {socials.website && (
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => openLink(socials?.website)}>
            <Icons.WebIcon width={16} height={16} />
            <Text style={styles.websiteText}> Website</Text>
          </TouchableOpacity>
        )}

        {socials.twitter && (
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => openLink(socials.twitter)}>
            <Icons.Twittericon width={16} height={16} />
            <Text style={styles.websiteText}> Twitter</Text>
          </TouchableOpacity>
        )}

        {socials.telegram && (
          <TouchableOpacity
            style={styles.websiteButton}
            onPress={() => openLink(socials.telegram)}>
            <Text style={styles.websiteText}>✈️ Telegram</Text>
          </TouchableOpacity>
        )}
      </View>


      {/* Time Filter */}
      <View style={styles.txHeader}>
        <Text style={styles.txTitle}>Transactions</Text>
        <View style={styles.txTabs}>
          <Text style={styles.txTab}>5M</Text>
          <Text style={[styles.txTab, styles.txTabActive]}>1H</Text>
          <Text style={styles.txTab}>1D</Text>
        </View>
      </View>

      {/* Buys vs Sells */}
      <View style={styles.txRow}>
        <View style={styles.txRowHeader}>
          <Text style={styles.txLeft}>{buys.toLocaleString()} buys</Text>
          <Text style={styles.txRight}>{sells.toLocaleString()} sells</Text>
        </View>
        <View style={styles.txBar}>
          <View style={[styles.txBarBuy, {flex: buys}]} />
          <View style={[styles.txBarSell, {flex: sells}]} />
        </View>
      </View>

      {/* Volume */}
      <View style={styles.txRow}>
        <View style={styles.txRowHeader}>
          <Text style={styles.txLeft}>
            ${formatCompactNumber(buyVolume)} vol.
          </Text>
          <Text style={styles.txRight}>
            ${formatCompactNumber(sellVolume)} vol.
          </Text>
        </View>
        <View style={styles.txBar}>
          <View style={[styles.txBarBuy, {flex: buyVolume}]} />
          <View style={[styles.txBarSell, {flex: sellVolume}]} />
        </View>
      </View>
      {/* Buyers vs Sellers */}
      <View style={styles.txRow}>
        <View style={styles.txRowHeader}>
          <Text style={styles.txLeft}>{buys.toLocaleString()} buyers</Text>
          <Text style={styles.txRight}>{sells.toLocaleString()} sellers</Text>
        </View>
        <View style={styles.txBar}>
          <View style={[styles.txBarBuy, {flex: buys}]} />
          <View style={[styles.txBarSell, {flex: sells}]} />
        </View>
      </View>

      <Text style={styles.aboutHeading}>Holders</Text>
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>No. of Holders</Text>
          <Text style={styles.value}>
            {formatCompactNumber(Number(s.volume_24h))}
          </Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Top 10 Holdings</Text>
          <Text style={styles.value}>{txCount.toLocaleString()}</Text>
        </View>
      </View>
      {/* Volume & Trades */}
      {/* <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>VOLUME</Text>
          <Text style={styles.value}>{formatCompactNumber(Number(s.volume_24h))}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>TRADES</Text>
          <Text style={styles.value}>{txCount.toLocaleString()}</Text>
        </View>
      </View> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {paddingHorizontal: 5},
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'column',
    flex: 1,
    // alignItems: 'center',
    // justifyContent: 'space-between',
    backgroundColor: 'rgba(62, 63, 65, 0.68)',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  innerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenDescription: {color: '#aaa', fontSize: 14, marginBottom: 10},
  label: {color: '#aaa', fontSize: 12, marginBottom: 4},
  value: {color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 6},
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {height: 4, borderRadius: 2},
  aboutHeading: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    // borderWidth: 2,
    // marginTop: 20,
    marginBottom: 15,
    marginTop: 10,
  },
  raisedBox: {
    backgroundColor: '#494d55ff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  raisedValue: {color: '#fff', fontSize: 20, fontWeight: 'bold'},
  raisedLabel: {color: '#aaa', fontSize: 12, marginTop: 4},
  websiteButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(62, 63, 65, 0.68)',
    borderRadius: 10,
    paddingVertical: 8,
    gap: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  websiteText: {color: '#fff', fontSize: 14, fontWeight: 'bold'},

  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },

  txTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15, 
    marginTop: 10,
  },

  txTabs: {
    flexDirection: 'row',
    gap: 12,
  },

  txTab: {
    color: '#777',
    fontSize: 12,
  },

  txTabActive: {
    color: '#fff',
    fontWeight: '700',
  },

  txRow: {
    marginBottom: 14,
    padding: 5,
  },

  txRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },

  txLeft: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },

  txRight: {
    color: '#aaa',
    fontSize: 13,
    fontWeight: '500',
  },

  txBar: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    gap: 5,
    backgroundColor: '#1f1f23',
    borderRadius: 2,
    overflow: 'hidden',
  },

  txBarBuy: {
    backgroundColor: '#22c55e',
  },

  txBarSell: {
    backgroundColor: '#f97316',
  },
});

export default TokenStats2;
