import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export const OrderBook: React.FC = () => {
  const asks = [
    { price: '114,752', amount: '81,279', total: '944,124' },
    { price: '114,751', amount: '13', total: '862,845' },
    { price: '114,750', amount: '48,345', total: '862,832' },
    { price: '114,749', amount: '29', total: '814,487' },
    { price: '114,748', amount: '814,458', total: '814,458' },
  ];

  const bids = [
    { price: '114,747', amount: '1,382,450', total: '1,382,450' },
    { price: '114,746', amount: '4,799', total: '1,387,249' },
    { price: '114,745', amount: '232,024', total: '1,619,273' },
    { price: '114,744', amount: '87,139', total: '1,706,412' },
    { price: '114,743', amount: '82,238', total: '1,780,650' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Price</Text>
        <Text style={styles.headerText}>Amount (USD)</Text>
        <Text style={styles.headerText}>Total (USD)</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {asks.map((item, i) => (
          <View key={`ask-${i}`} style={[styles.row, styles.askRow]}>
            <Text style={[styles.price, { color: '#FF5C5C' }]}>{item.price}</Text>
            <Text style={styles.amount}>{item.amount}</Text>
            <Text style={styles.total}>{item.total}</Text>
          </View>
        ))}

        <View style={styles.spreadRow}>
          <Text style={styles.spreadText}>Spread: 1 ▼ 0.009%</Text>
        </View>

        {bids.map((item, i) => (
          <View key={`bid-${i}`} style={[styles.row, styles.bidRow]}>
            <Text style={[styles.price, { color: '#00FFB2' }]}>{item.price}</Text>
            <Text style={styles.amount}>{item.amount}</Text>
            <Text style={styles.total}>{item.total}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A1224',
    borderRadius: 10,
    padding: 10,
    marginTop: 9,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: '#1E2433',
  },
  headerText: {
    flex: 1,
    color: '#8E97A7',
    fontWeight: '700',
    fontSize: 13,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  askRow: {
    backgroundColor: 'rgba(255, 92, 92, 0.1)',
    borderRadius: 4,
    marginVertical: 2,
  },
  bidRow: {
    backgroundColor: 'rgba(0, 255, 178, 0.1)',
    borderRadius: 4,
    marginVertical: 2,
  },
  price: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  amount: {
    flex: 1,
    color: '#FFF',
    textAlign: 'center',
    fontSize: 13,
  },
  total: {
    flex: 1,
    color: '#FFF',
    textAlign: 'center',
    fontSize: 13,
  },
  spreadRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  spreadText: {
    color: '#AAA',
    fontSize: 12,
    fontWeight: '600',
  },
});
