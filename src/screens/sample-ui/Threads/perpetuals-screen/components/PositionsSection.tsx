// ==== File: src/components/PositionsSection.tsx ====

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  // Dimensions,
} from 'react-native';
import COLORS from '@/assets/colors';
import Icons from '@/assets/svgs';

// const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const SUB_TABS = [
  { key: 'positions', label: 'Positions' },
  { key: 'openOrders', label: 'Open Orders' },
  { key: 'trades', label: 'Trades' },
];

// Static tokens list
// const TOKENS_LIST = [
//   {
//     symbol: 'BTC',
//     leverage: '40x',
//     lastPrice: '115,303',
//     change24h: '+0.195%',
//     funding: '0.0100%',
//     volume24h: '$45.3B',
//     openInterest: '$2.3B',
//   },
//   {
//     symbol: 'ETH',
//     leverage: '25x',
//     lastPrice: '4,128.3',
//     change24h: '-1.000%',
//     funding: '0.0100%',
//     volume24h: '$23.5B',
//     openInterest: '$1.8B',
//   },
//   {
//     symbol: 'SOL',
//     leverage: '20x',
//     lastPrice: '200.40',
//     change24h: '+0.210%',
//     funding: '0.0100%',
//     volume24h: '$12.7B',
//     openInterest: '$1.1B',
//   },
//   {
//     symbol: 'HYPE',
//     leverage: '10x',
//     lastPrice: '48.234',
//     change24h: '+2.493%',
//     funding: '0.0100%',
//     volume24h: '$820M',
//     openInterest: '$390M',
//   },
//   {
//     symbol: 'TRUMP',
//     leverage: '10x',
//     lastPrice: '7.2222',
//     change24h: '+11.576%',
//     funding: '0.0100%',
//     volume24h: '$530M',
//     openInterest: '$280M',
//   },
//   {
//     symbol: 'ZEC',
//     leverage: '5x',
//     lastPrice: '332.74',
//     change24h: '-8.281%',
//     funding: '0.0286%',
//     volume24h: '$180M',
//     openInterest: '$92M',
//   },
//   {
//     symbol: 'TRUMP',
//     leverage: '10x',
//     lastPrice: '7.2222',
//     change24h: '+11.576%',
//     funding: '0.0100%',
//     volume24h: '$530M',
//     openInterest: '$280M',
//   },
//   {
//     symbol: 'ZEC',
//     leverage: '5x',
//     lastPrice: '332.74',
//     change24h: '-8.281%',
//     funding: '0.0286%',
//     volume24h: '$180M',
//     openInterest: '$92M',
//   },
//   {
//     symbol: 'TRUMP',
//     leverage: '10x',
//     lastPrice: '7.2222',
//     change24h: '+11.576%',
//     funding: '0.0100%',
//     volume24h: '$530M',
//     openInterest: '$280M',
//   },
//   {
//     symbol: 'ZEC',
//     leverage: '5x',
//     lastPrice: '332.74',
//     change24h: '-8.281%',
//     funding: '0.0286%',
//     volume24h: '$180M',
//     openInterest: '$92M',
//   },
// ];

// Initial selected token
// const DEFAULT_TOKEN = TOKENS_LIST[0];

// Mock table data
const mockTableData = [
  { col1: 'BTC', col2: 'Long', col3: '$20,000', col4: '+5%' },
  { col1: 'ETH', col2: 'Short', col3: '$1,500', col4: '-2%' },
  { col1: 'SOL', col2: 'Long', col3: '$38', col4: '+12%' },
];

export const PositionsSection: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'positions' | 'openOrders' | 'trades'>('positions');
  // const [selectedToken, setSelectedToken] = useState(DEFAULT_TOKEN);
  // const [isModalVisible, setIsModalVisible] = useState(true);

  // modal will occupy 80% of the screen height
  // const MODAL_HEIGHT = Math.round(SCREEN_HEIGHT * 1.01);

  // // animation value for translateY (start hidden at modal height)
  // const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  // // ensure modal hidden if screen dims change (optional)
  // useEffect(() => {
  //   translateY.setValue(MODAL_HEIGHT);
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [MODAL_HEIGHT]);

  // const openModal = () => {
  //   setIsModalVisible(true);
  //   Animated.timing(translateY, {
  //     toValue: 0,
  //     duration: 300,
  //     useNativeDriver: true,
  //   }).start();
  // };

  // const closeModal = () => {
  //   Animated.timing(translateY, {
  //     toValue: MODAL_HEIGHT,
  //     duration: 300,
  //     useNativeDriver: true,
  //   }).start(() => {
  //     setIsModalVisible(false);
  //   });
  // };

  // const handleTokenSelect = (token: any) => {
  //   setSelectedToken(token);
  //   closeModal();
  // };

  return (
    <View style={styles.contentBox}>
      {/* ===== Token Header ===== */}
      {/* <TouchableOpacity onPress={openModal} style={styles.tokenHeader} activeOpacity={0.8}>
        <View style={styles.upperHeader}>
          <Text style={styles.tokenName}>{selectedToken.symbol}</Text>
          <Icons.WhiteArrowDown width={25} height={25} color={COLORS.white} />
        </View>
        <View style={styles.headerInner}>
          <Text
            style={[
              styles.tokenChange,
              { color: selectedToken.change24h.startsWith('-') ? '#FF5C5C' : '#00FFB2' },
            ]}
          >
            {selectedToken.change24h}
          </Text>
          <Text style={styles.tokenPrice}>{selectedToken.lastPrice}</Text>
        </View>
      </TouchableOpacity> */}

      {/* ===== Stats Grid ===== */}
      {/* <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Mark Price</Text>
          <Text style={styles.statValue}>{selectedToken.lastPrice}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>24h Volume</Text>
          <Text style={styles.statValue}>{selectedToken.volume24h}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Open Interest</Text>
          <Text style={styles.statValue}>{selectedToken.openInterest}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Funding</Text>
          <Text style={[styles.statValue, { color: '#00FFB2' }]}>{selectedToken.funding}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Oracle Price</Text>
          <Text style={[styles.statValue]}>{selectedToken.funding}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>CountDown</Text>
          <Text style={[styles.statValue]}>{selectedToken.funding}</Text>
        </View>
      </View> */}

      {/* ===== Chart Placeholder ===== */}
      <View style={styles.chartBox}>
        <Text style={styles.chartPlaceholder}>[ Chart Area ]</Text>
      </View>

      {/* ===== Sub Tabs Section ===== */}
      <View style={{ marginTop: 24 }}>
        <View style={styles.subTabsContainer}>
          {SUB_TABS.map(sub => (
            <TouchableOpacity
              key={sub.key}
              style={[styles.subTab, activeSubTab === sub.key && styles.activeSubTab]}
              onPress={() => setActiveSubTab(sub.key as any)}
            >
              <Text
                style={[
                  styles.subTabText,
                  activeSubTab === sub.key && styles.activeSubTabText,
                ]}
              >
                {sub.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== Table Section ===== */}
        <ScrollView horizontal showsHorizontalScrollIndicator={true}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Asset</Text>
              <Text style={styles.tableHeaderText}>Position</Text>
              <Text style={styles.tableHeaderText}>Value</Text>
              <Text style={styles.tableHeaderText}>PnL</Text>
            </View>
            {mockTableData.map((row, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.tableCell}>{row.col1}</Text>
                <Text style={styles.tableCell}>{row.col2}</Text>
                <Text style={styles.tableCell}>{row.col3}</Text>
                <Text style={styles.tableCell}>{row.col4}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

     
      
    </View>
  );
};

const styles = StyleSheet.create({
  contentBox: { padding: 1, flex: 1 },
  chartBox: {
    backgroundColor: '#131a30ff', borderRadius: 10, height: 300, alignItems: 'center', justifyContent: 'center',
  },
  chartPlaceholder: { color: '#555', fontSize: 14 },
  subTabsContainer: {
    flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10,
  },
  subTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  activeSubTab: { backgroundColor: '#2A3246' },
  subTabText: { color: '#8E97A7', fontSize: 13, fontWeight: '600' },
  activeSubTabText: { color: '#FFFFFF' },
  tableContainer: { minWidth: 500, paddingVertical: 10 },
  tableHeader: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#2F3848',
  },
  tableHeaderText: { color: '#AAA', width: 100, textAlign: 'center', fontWeight: '700' },
  tableRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 0.5, borderColor: '#2F3848',
  },
  tableCell: { color: '#FFF', width: 100, textAlign: 'center' },

  
});
