import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

interface Trade {
  price: string;
  size: string;
  age: string;
  type: 'buy' | 'sell';
}

const TRADES_DATA: Trade[] = [
  { price: '114,885', size: '$41.36', age: '0s', type: 'buy' },
  { price: '114,885', size: '$14.94', age: '1s', type: 'buy' },
  { price: '114,885', size: '$303.30', age: '1s', type: 'buy' },
  { price: '114,884', size: '$499.75', age: '1s', type: 'sell' },
  { price: '114,884', size: '$3,499.37', age: '1s', type: 'sell' },
  { price: '114,885', size: '$119.48', age: '1s', type: 'buy' },
  { price: '114,885', size: '$1,105.19', age: '2s', type: 'buy' },
  { price: '114,885', size: '$199.90', age: '2s', type: 'buy' },
  { price: '114,885', size: '$189.56', age: '2s', type: 'buy' },
  { price: '114,884', size: '$26.42', age: '2s', type: 'sell' },
  { price: '114,884', size: '$3,499.37', age: '3s', type: 'sell' },
  { price: '114,885', size: '$199.90', age: '2s', type: 'buy' },
  { price: '114,885', size: '$189.56', age: '2s', type: 'buy' },
  { price: '114,884', size: '$26.42', age: '2s', type: 'sell' },
  { price: '114,884', size: '$3,499.37', age: '3s', type: 'sell' },
  { price: '114,885', size: '$199.90', age: '2s', type: 'buy' },
  { price: '114,885', size: '$189.56', age: '2s', type: 'buy' },
  { price: '114,884', size: '$26.42', age: '2s', type: 'sell' },
  { price: '114,884', size: '$3,499.37', age: '3s', type: 'sell' },
];

export const TradesComponent: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.headerText, { flex: 1 }]}>Price</Text>
        <Text style={[styles.headerText, { flex: 1 }]}>Size (USD)</Text>
        <Text style={[styles.headerText, { flex: 1, textAlign: 'right' }]}>
          Age
        </Text>
      </View>

      {/* Scrollable Trades List */}
      <View style={styles.scrollWrapper}>
        <ScrollView
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {TRADES_DATA.map((trade, idx) => (
            <View
              key={idx}
              style={[
                styles.tradeRow,
                trade.type === 'buy' ? styles.buyRow : styles.sellRow,
              ]}
            >
              <Text
                style={[
                  styles.priceText,
                  { color: trade.type === 'buy' ? '#00FFB2' : '#FF5C5C' },
                ]}
              >
                {trade.price}
              </Text>
              <Text style={styles.sizeText}>{trade.size}</Text>
              <Text style={styles.ageText}>{trade.age}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0B1622',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#1F2A38',
    marginBottom: 4,
  },
  headerText: {
    color: '#8E97A7',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollWrapper: {
    height: 300, // fixed height
    overflow: 'hidden', // ensures only the scroll area is visible
  },
  tradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 6,
    marginVertical: 1,
  },
  buyRow: {
    backgroundColor: 'rgba(0,255,178,0.05)',
  },
  sellRow: {
    backgroundColor: 'rgba(255,92,92,0.05)',
  },
  priceText: {
    flex: 1,
    fontWeight: '700',
    fontSize: 13,
  },
  sizeText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  ageText: {
    flex: 1,
    textAlign: 'right',
    color: '#8E97A7',
    fontSize: 13,
  },
});
