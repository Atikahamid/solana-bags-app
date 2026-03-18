// src/screens/TokenStats3.tsx
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import SampleAvatar from '@/assets/images/User2.png';
import {
  fetchTokenHolders,
  fetchTokenActivity,
  TokenHolderApi,
  TransactionActivityApi,
  TokenStatsApiResponse,
} from './tokenDetailService';
import {getRelativeTime} from '../tokenPulse/tokenServicefile';
import {formatCompactNumber} from '../SearchScreen';
import BagsLogo from '@/assets/images/bags-logo.png';
import {getValidImageSource, IPFSAwareImage} from '@/shared/utils/IPFSImage';
import Icons from '@/assets/svgs';
import COLORS from '@/assets/colors';
interface Props {
  mint: string;
}

const shortenAddress = (addr: string) =>
  addr.length > 10 ? `${addr.slice(0, 4)}...${addr.slice(-4)}` : addr;

const TokenStats3: React.FC<Props> = ({mint}) => {
  const [showAllHolders, setShowAllHolders] = useState(false);
  const [showAllActivity, setShowAllActivity] = useState(false);
const [stats, setStats] = useState<TokenStatsApiResponse | null>(null);
  const [holders, setHolders] = useState<TokenHolderApi[]>([]);
  const [activities, setActivities] = useState<TransactionActivityApi[]>([]);
   const isPositive = Number(stats?.tokenStats.price_change_24h) >= 0;
  const changeColor = isPositive ? '#4CAF50' : '#FF4C4C';
  const [loading, setLoading] = useState(true);
 const arrow = isPositive ? (
    <Icons.UpArrowIcon width={11} height={10} />
  ) : (
    <Icons.DownArrowIcon width={11} height={10} />
  );
  const formattedChange = `${isPositive ? '+' : ''}${Number(
    stats?.tokenStats.price_change_24h,
  )?.toFixed(2)}%`;

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const [holdersRes, activityRes] = await Promise.all([
          fetchTokenHolders(mint),
          fetchTokenActivity(mint),
        ]);
        // const holdersRes = await fetchTokenHolders(mint);
        console.log('holders REssssss: ', holdersRes);
        setHolders(holdersRes.holders ?? []);
        setActivities(activityRes ?? []);
      } catch (err) {
        console.error('❌ TokenStats3 load error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (mint) loadData();
  }, [mint]);

  if (loading) {
    return (
      <View style={{padding: 20, alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  const displayedHolders = showAllHolders ? holders : holders.slice(0, 3);
  const displayedActivities = showAllActivity
    ? activities
    : activities.slice(0, 2);

  // console.log('activities progile url: ', activities[1].profile_image_url);
  return (
    <View style={styles.container}>
      {/* Holders */}
      {/* <Text style={styles.sectionTitle}>Top Holders</Text> */}
      {/* <FlatList
        data={displayedHolders}
        keyExtractor={item => String(item.id)}
        renderItem={({item}) => (
          <View style={styles.holderRow}>
            
            <Image source={BagsLogo} style={styles.holderIcon} />

            <View style={styles.holderInfo}>
              <Text style={styles.holderAddress}>
                {shortenAddress(item.holder_address)}
              </Text>
              <Text style={styles.holderAmount}>
                {formatCompactNumber(Number(item.tokens_holdings))}
              </Text>
            </View>

            <View style={styles.rightholders}>
              <Text style={styles.holderPercent}>
                {Number(item.holding_percent).toFixed(2)}%
              </Text>

              <Text style={styles.holderValue}>
                ${formatCompactNumber(Number(item.value_of_tokens_holdings))}
              </Text>
            </View>
          </View>
        )}
      /> */}

      {/* <TouchableOpacity onPress={() => setShowAllHolders(!showAllHolders)}>
        <Text style={styles.viewMore}>
          {showAllHolders ? 'VIEW LESS' : 'VIEW MORE'}
        </Text>
      </TouchableOpacity> */}

      {/* Activity */}
      {/* <Text style={[styles.sectionTitle, {marginTop: 16}]}>Activity</Text> */}
      <FlatList
        data={displayedActivities}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const isBuy = item.type === 'BUY';
          return (
            <View style={styles.activityRow}>
              <IPFSAwareImage
                source={getValidImageSource(item.profile_image_url)}
                style={styles.logo}
                // defaultSource={DEFAULT_IMAGES.user}
                // key={Platform.OS === 'android' ? `user-${logo}` : 'user'}
              />
              <View style={styles.activityInfo}>
                <Text style={styles.username}>
                  {shortenAddress(item.username)}
                </Text>

                {/* <View style={styles.innerActivity}>
                  <Text
                    style={[
                      styles.activityType,
                      isBuy ? styles.buy : styles.sell,
                    ]}>
                    {item.type}
                  </Text>

                  <Text style={styles.activityAmount}>
                    {Number(item.price_sol).toFixed(5)}SOL @
                    {item.price_usd
                      ? formatCompactNumber(Number(item.marketcap_at_trade))
                      : 'N/A'}
                  </Text>
                </View> */}
                <Text style={styles.avgHold}>11m avg.hold</Text>
              </View>

              <View style={styles.activityRight}>
                {/* <Text style={styles.activityTime}>
                  {getRelativeTime(item.created_at)}
                </Text> */}
                <Text style={styles.dollarvalue}>$14332</Text>
                <Text style={[styles.priceChange, {color: changeColor}]}>
                  {arrow} {formattedChange}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <TouchableOpacity onPress={() => setShowAllActivity(!showAllActivity)}>
        <Text style={styles.viewMore}>
          {showAllActivity ? 'VIEW LESS' : 'VIEW MORE'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {paddingHorizontal: 6, marginTop: 5},
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  viewMore: {
    color: '#888',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 10,
  },
  rightholders: {
    flexDirection: 'column',
  },
  holderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
   priceChange: {
    fontSize: 14,
    textAlign: 'center',
    // marginTop: 10,
  },
  dollarvalue: {color: "#fff", fontSize: 16, fontWeight: "600"},
  holderIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    // backgroundColor: '#444',
    marginRight: 12,
    // borderWidth: 1,
    // padding: 3,
    // borderColor: '#444'
  },
  holderInfo: {flex: 1},
  holderAddress: {color: '#fff', fontSize: 14, fontWeight: '600'},
  holderAmount: {color: '#aaa', fontSize: 12},
  holderPercent: {color: '#fff', fontSize: 13, marginRight: 12},
  holderValue: {color: '#aaa', fontSize: 12},
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  avatar: {width: 32, height: 32, borderRadius: 16, marginRight: 10},
  logo: {
    width: 40,
    height: 40,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.greyMid,
    marginRight: 10,
  },
  activityInfo: {flex: 1, gap: 3},
  username: {color: '#fff', fontSize: 16, fontWeight: '600'},
  avgHold: {color: '#bfc5cf', fontSize: 12},
  activityType: {
    fontSize: 12,
    marginVertical: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },
  buy: {color: '#000', backgroundColor: 'limegreen'},
  sell: {color: '#fff', backgroundColor: 'red'},
  innerActivity: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  activityAmount: {color: '#aaa', fontSize: 12},
  activityRight: {alignItems: 'flex-end', gap: 2},
  activityChange: {fontSize: 12},
  activityTime: {color: '#777', fontSize: 10, marginTop: 2},
});

export default TokenStats3;
