// ==== File: src/screens/PerpetualsScreen.tsx ====

import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import COLORS from '@/assets/colors';
import {headerStyles} from '../tokenPulse/TokenScreen';
// import Animated from 'react-native-reanimated';
import {useNavigation} from '@react-navigation/native';
import Icons from '@/assets/svgs';
import {PositionsSection} from './components/PositionsSection';
import { OrderBook } from './components/OrderBook';
import { TradesComponent } from './components/TradesComponent';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');

const TABS = [
  {key: 'positions', label: 'Positions'},
  {key: 'orderBook', label: 'Order Book'},
  {key: 'trades', label: 'Trades'},
];

const TOKENS_LIST = [
  {
    symbol: 'BTC',
    leverage: '40x',
    lastPrice: '115,303',
    change24h: '+0.195%',
    funding: '0.0100%',
    volume24h: '$45.3B',
    openInterest: '$2.3B',
  },
  {
    symbol: 'ETH',
    leverage: '25x',
    lastPrice: '4,128.3',
    change24h: '-1.000%',
    funding: '0.0100%',
    volume24h: '$23.5B',
    openInterest: '$1.8B',
  },
  {
    symbol: 'SOL',
    leverage: '20x',
    lastPrice: '200.40',
    change24h: '+0.210%',
    funding: '0.0100%',
    volume24h: '$12.7B',
    openInterest: '$1.1B',
  },
  {
    symbol: 'HYPE',
    leverage: '10x',
    lastPrice: '48.234',
    change24h: '+2.493%',
    funding: '0.0100%',
    volume24h: '$820M',
    openInterest: '$390M',
  },
  {
    symbol: 'TRUMP',
    leverage: '10x',
    lastPrice: '7.2222',
    change24h: '+11.576%',
    funding: '0.0100%',
    volume24h: '$530M',
    openInterest: '$280M',
  },
  {
    symbol: 'ZEC',
    leverage: '5x',
    lastPrice: '332.74',
    change24h: '-8.281%',
    funding: '0.0286%',
    volume24h: '$180M',
    openInterest: '$92M',
  },
  {
    symbol: 'TRUMP',
    leverage: '10x',
    lastPrice: '7.2222',
    change24h: '+11.576%',
    funding: '0.0100%',
    volume24h: '$530M',
    openInterest: '$280M',
  },
  {
    symbol: 'ZEC',
    leverage: '5x',
    lastPrice: '332.74',
    change24h: '-8.281%',
    funding: '0.0286%',
    volume24h: '$180M',
    openInterest: '$92M',
  },
  {
    symbol: 'TRUMP',
    leverage: '10x',
    lastPrice: '7.2222',
    change24h: '+11.576%',
    funding: '0.0100%',
    volume24h: '$530M',
    openInterest: '$280M',
  },
  {
    symbol: 'ZEC',
    leverage: '5x',
    lastPrice: '332.74',
    change24h: '-8.281%',
    funding: '0.0286%',
    volume24h: '$180M',
    openInterest: '$92M',
  },
];
const DEFAULT_TOKEN = TOKENS_LIST[0];
export const PerpetualsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'positions' | 'orderBook' | 'trades'
  >('positions');
  const navigation = useNavigation();
  const showHeader = true;
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [selectedToken, setSelectedToken] = useState(DEFAULT_TOKEN);

  const MODAL_HEIGHT = Math.round(SCREEN_HEIGHT * 0.9);

  // animation value for translateY (start hidden at modal height)
  const translateY = useRef(new Animated.Value(MODAL_HEIGHT)).current;

  // ensure modal hidden if screen dims change (optional)
  useEffect(() => {
    translateY.setValue(MODAL_HEIGHT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MODAL_HEIGHT]);

  const openModal = () => {
    setIsModalVisible(true);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(translateY, {
      toValue: MODAL_HEIGHT,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setIsModalVisible(false);
    });
  };

  const handleTokenSelect = (token: any) => {
    setSelectedToken(token);
    closeModal();
  };
  const handleProfilePress = () => {
    navigation.navigate('ProfileScreen' as never);
  };

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={{flex: 1}}>
        {/* ===== Header ===== */}
        {showHeader && (
          <SafeAreaView edges={['top']}>
            <Animated.View style={[styles.header, {padding: 16, height: 80}]}>
              <View style={headerStyles.container}>
                <TouchableOpacity
                  onPress={() => navigation.navigate('FiltersScreen' as never)}
                  style={headerStyles.profileContainer}>
                  <Icons.SettingsIcon
                    width={28}
                    height={28}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
                <View style={headerStyles.iconsContainer}>
                  <TouchableOpacity
                    onPress={handleProfilePress}
                    style={headerStyles.profileContainer}>
                    <Icons.RefreshIcon
                      width={28}
                      height={28}
                      color={COLORS.white}
                    />
                  </TouchableOpacity>
                </View>
                <View style={headerStyles.absoluteLogoContainer}>
                  <Icons.AppLogo width={28} height={28} />
                </View>
              </View>
            </Animated.View>
          </SafeAreaView>
        )}

        {/* ===== Tabs ===== */}
        <View style={styles.tabsContainer}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key as any)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ===== Content ===== */}
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={{paddingBottom: 120}}
          showsVerticalScrollIndicator={false}>
          {/* ===== Token Header ===== */}
          <TouchableOpacity
            onPress={openModal}
            style={styles.tokenHeader}
            activeOpacity={0.8}>
            <View style={styles.upperHeader}>
              <Text style={styles.tokenName}>{selectedToken.symbol}</Text>
              <Icons.WhiteArrowDown
                width={25}
                height={25}
                color={COLORS.white}
              />
            </View>
            <View style={styles.headerInner}>
              <Text
                style={[
                  styles.tokenChange,
                  {
                    color: selectedToken.change24h.startsWith('-')
                      ? '#FF5C5C'
                      : '#00FFB2',
                  },
                ]}>
                {selectedToken.change24h}
              </Text>
              <Text style={styles.tokenPrice}>{selectedToken.lastPrice}</Text>
            </View>
          </TouchableOpacity>

          {/* ===== Stats Grid ===== */}
          <View style={styles.statsGrid}>
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
              <Text style={[styles.statValue, {color: '#00FFB2'}]}>
                {selectedToken.funding}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Oracle Price</Text>
              <Text style={[styles.statValue]}>{selectedToken.funding}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>CountDown</Text>
              <Text style={[styles.statValue]}>{selectedToken.funding}</Text>
            </View>
          </View>
          {activeTab === 'positions' && <PositionsSection />}

          {activeTab === 'orderBook' && <OrderBook/>}

          {activeTab === 'trades' && <TradesComponent/>}
        </ScrollView>

        {/* ===== Bottom Buttons ===== */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#00C853'}]}>
            <Text style={styles.buttonText}>Long</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: '#D32F2F'}]}>
            <Text style={styles.buttonText}>Short</Text>
          </TouchableOpacity>
        </View>

        {/* ===== Modal (Token List) ===== */}
        {isModalVisible && (
          <Animated.View
            style={[
              styles.modalContainer,
              {
                height: MODAL_HEIGHT,
                transform: [{translateY}],
              },
            ]}>
            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
              <Icons.cross width={25} height={25} color={COLORS.white} />
            </TouchableOpacity>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>Select Token</Text>
            </View>

            {/* Horizontal scroll for wide table, vertical scroll for rows */}
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View style={styles.modalTableWrapper}>
                <View style={styles.modalTableHeader}>
                  <Text style={styles.modalHeaderText}>Token</Text>
                  <Text style={styles.modalHeaderText}>Last Price</Text>
                  <Text style={styles.modalHeaderText}>24h Change</Text>
                  <Text style={styles.modalHeaderText}>8h Funding</Text>
                  <Text style={styles.modalHeaderText}>24h Volume</Text>
                  <Text style={styles.modalHeaderText}>Open Interest</Text>
                </View>

                <ScrollView showsVerticalScrollIndicator>
                  {TOKENS_LIST.map((token, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.modalRow}
                      onPress={() => handleTokenSelect(token)}
                      activeOpacity={0.8}>
                      <Text style={[styles.modalCell, {fontWeight: '700'}]}>
                        {token.symbol}
                      </Text>
                      <Text style={styles.modalCell}>{token.lastPrice}</Text>
                      <Text
                        style={[
                          styles.modalCell,
                          {
                            color: token.change24h.startsWith('-')
                              ? '#FF5C5C'
                              : '#00FFB2',
                          },
                        ]}>
                        {token.change24h}
                      </Text>
                      <Text style={styles.modalCell}>{token.funding}</Text>
                      <Text style={styles.modalCell}>{token.volume24h}</Text>
                      <Text style={styles.modalCell}>{token.openInterest}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>
          </Animated.View>
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  header: {
    width: '100%',
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  upperHeader: {flexDirection: 'row', gap: 9},
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
    marginTop: 10
  },
  headerInner: {flexDirection: 'row', gap: 9},
  tokenName: {color: '#00BFFF', fontSize: 20, fontWeight: '700'},
  tokenChange: {fontSize: 14, marginTop: 9},
  tokenPrice: {color: '#FFFFFF', fontSize: 22, fontWeight: '700', marginTop: 2},
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#103d6eff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  statItem: {width: '48%', marginVertical: 6},
  statLabel: {color: '#8E97A7', fontSize: 14},
  statValue: {color: '#FFFFFF', fontSize: 15, fontWeight: '600'},
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  tab: {paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20},
  activeTab: {
    backgroundColor: '#1C2233',
    borderWidth: 1,
    borderColor: '#2F3848',
  },
  tabText: {color: '#8E97A7', fontSize: 13, fontWeight: '600'},
  activeTabText: {color: '#FFFFFF', fontWeight: '700'},
  scrollArea: {flex: 1, padding: 16},
  contentBox: {padding: 16},
  placeholderText: {
    color: '#AAA',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 14,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 55,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 10,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {color: '#FFFFFF', fontSize: 16, fontWeight: '700'},

  // Modal styles
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#02102fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // paddingLeft: 10,
    padding: 12,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: {width: 0, height: -4},
    shadowRadius: 8,
  },
  modalTopRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    // justifyContent: 'space-between',
    // alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {color: '#FFF', fontSize: 16, fontWeight: '700', paddingLeft: 40},
  closeButton: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'flex-end',
    // backgroundColor: '#2A3246',
    borderRadius: 8,
  },
  closeButtonText: {color: '#FFF', fontWeight: '700'},

  modalTableWrapper: {minWidth: 700, marginLeft: 0, paddingLeft: -4}, // ensure wide area so horizontal scroll shows columns
  modalTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#2F3848',
  },
  modalHeaderText: {
    color: '#AAA',
    width: 120,
    textAlign: 'center',
    fontWeight: '700',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: '#2F3848',
  },
  modalCell: {color: '#FFF', width: 120, textAlign: 'center'},
});
