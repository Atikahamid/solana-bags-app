import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {LinearGradient} from 'expo-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {Ionicons} from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import COLORS from '@/assets/colors';
import TokenCard from './TokenCardComponent';
import {formatCompactNumber} from './SearchScreen';
import {searchTokens, searchUsers} from './SearchTokenServiceFile';
import {IPFSAwareImage} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import {formatPnl} from './leader-borad-page/LeaderBoardScreen';

const TABS = [
  {key: 'Coins', label: 'Coins'},
  {key: 'Friends', label: 'Friends'},
  {key: 'Groups', label: 'Groups'},
];

const GROUPS_DATA = [
  {
    id: '1',
    name: 'FINNBAGS',
    members: 16650,
    avatar: 'https://i.pravatar.cc/150?img=12',
  },
  {
    id: '2',
    name: '8AM Bags',
    members: 4930,
    avatar: 'https://i.pravatar.cc/150?img=22',
  },
];

export default function GlobalSearchScreen() {
  const navigation = useNavigation();

  const [activeTab, setActiveTab] = useState('Coins');
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ✅ Search API (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setTokens([]);
      setUsers([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        if (activeTab === 'Coins') {
          const res = await searchTokens(searchQuery);

          setTokens(
            res.map(t => ({
              mint: t.mint_address,
              name: t.name ?? 'Unknown',
              symbol: t.symbol ?? '',
              logo: t.image,
              mc: t.market_cap ? `$${formatCompactNumber(t.market_cap)}` : '-',
              liq: t.liquidity ? `$${formatCompactNumber(t.liquidity)}` : '-',
              vol: t.volume_24h ? `$${formatCompactNumber(t.volume_24h)}` : '-',
              change: t.price_change_24h ?? 0,
            })),
          );

          setUsers([]);
        } else {
          const res = await searchUsers(searchQuery);
          setUsers(res);
          setTokens([]);
        }
      } catch (err) {
        console.error('[GlobalSearch] search error:', err);
        setTokens([]);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [searchQuery, activeTab]);

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <SafeAreaView
        style={[
          styles.container,
          Platform.OS === 'android' && styles.androidSafeArea,
        ]}>
        {/* 🔍 Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search"
              size={18}
              color={COLORS.greyMid}
              style={{marginRight: 8}}
            />

            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search coins or people..."
              placeholderTextColor={COLORS.greyMid}
              autoFocus
              returnKeyType="search"
            />

            <TouchableOpacity
              style={styles.pasteButton}
              onPress={async () => {
                const text = await Clipboard.getStringAsync();
                if (text) setSearchQuery(text);
              }}>
              <Text style={styles.pasteText}>Paste</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.activeTab]}
              onPress={() => setActiveTab(tab.key)}>
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

        {/* Results */}
        {loading ? (
          <View style={{padding: 24, alignItems: 'center'}}>
            <ActivityIndicator size="small" color={COLORS.brandPrimary} />
            <Text style={{color: COLORS.greyMid, marginTop: 10}}>
              Searching...
            </Text>
          </View>
        ) : activeTab === 'Coins' ? (
          <FlatList
            data={tokens}
            keyExtractor={item => item.mint}
            renderItem={({item}) => (
              <TokenCard
                {...item}
                onPress={() =>
                  navigation.navigate(
                    'TokenDetailScreen' as never,
                    {token: item} as never,
                  )
                }
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{paddingBottom: 40}}
            ListEmptyComponent={
              searchQuery ? (
                <Text
                  style={{
                    color: COLORS.greyMid,
                    textAlign: 'center',
                    marginTop: 30,
                  }}>
                  No results found.
                </Text>
              ) : null
            }
          />
        ) : activeTab === 'Friends' ? (
          <FlatList
            data={users}
            keyExtractor={item => item.userPrivyId}
            contentContainerStyle={{paddingBottom: 80}}
            renderItem={({item, index}) => {
              const pnlColor =
                Number(item.totalPnl) > 0
                  ? '#00FF70'
                  : Number(item.totalPnl) < 0
                  ? '#FF4D4F'
                  : '#FFFFFF';

              const visibleImages = item.tokenImages.slice(0, 3);
              const remaining = item.tokenImages.length - 3;

              return (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate(
                      'LeaderBoardUserDetailScreen' as never,
                      {user: item} as never,
                    )
                  }
                  style={styles.row}>
                  {/* <View style={styles.positionContainer}>
                    {index === 0 && (
                      <Image source={GoldMedal} style={styles.medal} />
                    )}
                    {index === 1 && (
                      <Image source={SilverMedal} style={styles.medal} />
                    )}
                    {index === 2 && (
                      <Image source={BronzeMedal} style={styles.medal} />
                    )}
                    {index > 2 && (
                      <Text style={styles.positionText}>{index + 1}</Text>
                    )}
                  </View> */}

                  <IPFSAwareImage
                    source={item.profileImage}
                    style={styles.avatar}
                    defaultSource={DEFAULT_IMAGES.user}
                  />

                  <View style={styles.userBlock}>
                    <Text style={styles.name}>{item.username}</Text>
                    <Text style={styles.Atname}>@{item.username.slice(0,5)}</Text>
                  </View>

                  <View style={styles.rightBlock}>
                    <Text style={[styles.profit, {color: pnlColor}]}>
                      {formatPnl(item.totalPnl)}
                    </Text>

                    <View style={styles.badgeRow}>
                      {visibleImages.map((img, i) => (
                        <Image
                          key={i}
                          source={{uri: img}}
                          style={[styles.tokenBadge, {marginLeft: i ? -6 : 0}]}
                        />
                      ))}

                      {remaining > 0 && (
                        <View style={[styles.tokenBadge, styles.moreBadge]}>
                          <Text style={styles.moreText}>+{remaining}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              searchQuery ? (
                <Text
                  style={{
                    color: COLORS.greyMid,
                    textAlign: 'center',
                    marginTop: 30,
                  }}>
                  No users found.
                </Text>
              ) : null
            }
          />
        ) : (
          <FlatList
            data={GROUPS_DATA}
            keyExtractor={item => item.id}
            contentContainerStyle={{paddingBottom: 80}}
            renderItem={({item}) => (
              <View style={styles.groupRow}>
                <View style={styles.groupLeft}>
                  <Image
                    source={{uri: item.avatar}}
                    style={styles.groupAvatar}
                  />

                  <View>
                    <Text style={styles.groupName}>{item.name}</Text>
                    <Text style={styles.groupMembers}>
                      {formatCompactNumber(item.members)} members
                    </Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.joinButton}>
                  <Text style={styles.joinText}>JOIN</Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No groups found.</Text>
            }
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
  androidSafeArea: {paddingTop: 0},

  searchContainer: {
    paddingTop: 10,
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#27375eff',
    borderRadius: 24,
    paddingHorizontal: 12,
    height: 44,
    marginHorizontal: 16,
  },
   Atname:{ color: '#ccbfbf', fontSize: 13 },
  row: {
    flexDirection: 'row',
    backgroundColor: '#0c0c1281',
    // padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginHorizontal: 12,
    marginVertical: 6,
  },
  avatar: {width: 40, height: 40, borderRadius: 20, marginRight: 12},
  userBlock: {flex: 1},
  name: {color: '#FFFFFF', fontSize: 15, fontWeight: '600'},
  rightBlock: {alignItems: 'flex-end'},
  profit: {fontSize: 15, fontWeight: '700'},
  badgeRow: {flexDirection: 'row', marginTop: 6},
  // badgeRow: {flexDirection: 'row', marginTop: 6},
  tokenBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#000',
  },
  moreBadge: {
    backgroundColor: '#1A1A22',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -6,
  },
  moreText: {color: '#fff', fontSize: 10, fontWeight: '700'},
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },

  pasteButton: {
    backgroundColor: '#182954ff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },

  pasteText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#2F3848',
    marginBottom: 7,
    marginTop: 10,
    marginHorizontal: 12,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },

  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.brandPrimary,
  },

  tabText: {
    color: '#7A8495',
    fontSize: 14,
    fontWeight: '600',
  },

  activeTabText: {
    color: '#FFFFFF',
  },

  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c0c1281',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 12,
    marginVertical: 6,
  },

  groupLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  groupAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },

  groupName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  groupMembers: {
    color: COLORS.greyMid,
    fontSize: 12,
    marginTop: 2,
  },

  joinButton: {
    backgroundColor: 'rgba(35, 65, 131, 0.4)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 18,
  },

  joinText: {
    color: '#f0ebeb',
    fontSize: 13,
    fontWeight: '800',
  },

  emptyText: {
    color: COLORS.greyMid,
    textAlign: 'center',
    marginTop: 30,
  },
});
