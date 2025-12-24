import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import COLORS from '@/assets/colors';
import {getValidImageSource, IPFSAwareImage} from '@/shared/utils/IPFSImage';
import {DEFAULT_IMAGES} from '@/shared/config/constants';
import SearchIcon from '@/assets/svgs/SearchIcon';
import Icons from '../../../../assets/svgs';
import {PROTOCOLS} from './FilterScreen';
import {resolveProtocolFromMint} from './tokenServicefile';

interface TokenCardProps {
  mint?: string;
  logo: string;
  name: string;
  symbol: string;
  mc: string;
  createdAgo: string;
  twitterX?: string | null;
  telegramX?: string | null;
  tiktok?: string | null;
  website?: string | null;
  protocolFamily?: string | null;
  holdersCount: number;
  volume: number;
  isMigrated?: boolean;
  txCount: number;
  bondingProgress?: number | null;
  fee: number;
  stats: {
    starUser: string;
    cloud: string;
    target: string;
    ghost: string;
    blocks: string;
  };
  shortName?: string;
  status?: string;
  metrics?: {label: string; value: string | number}[];
}

export function formatMint(
  mint?: string,
  prefixLength = 4,
  suffixLength = 4,
): string {
  if (!mint) return '';
  if (mint.length <= prefixLength + suffixLength) return mint;
  return `${mint.slice(0, prefixLength)}....${mint.slice(-suffixLength)}`;
}

export const TokenCard: React.FC<TokenCardProps> = ({
  mint,
  logo,
  name,
  symbol,
  mc,
  twitterX,
  telegramX,
  tiktok,
  website,
  protocolFamily,
  volume,
  fee,
  txCount,
  createdAgo,
  bondingProgress,
  isMigrated,
  stats,
  status = '0s',
  holdersCount,
  metrics = [
    {label: 'Holders', value: holdersCount},
    {label: 'CandleStiks', value: txCount},
    {label: 'Trophy', value: '0'},
    {label: 'Crown', value: '0/1'},
  ],
}) => {
  /* 🔹 NEW: resolve protocol from mint */
  const protocol = mint ? resolveProtocolFromMint(mint, PROTOCOLS) : null;

  return (
    <View style={styles.card}>
      <View style={styles.rowContainer}>
        <View style={styles.left}>
          <IPFSAwareImage
            source={getValidImageSource(logo)}
            style={styles.logo}
            defaultSource={DEFAULT_IMAGES.user}
            key={Platform.OS === 'android' ? `user-${logo}` : 'user'}
          />
          <Text style={styles.shortName}>{formatMint(mint)}</Text>
        </View>

        <View style={styles.middle}>
          <View style={styles.nameRow}>
            <View style={styles.firstnameRow}>
              <Text style={styles.symbol}>{symbol}</Text>
              <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
                {name}
              </Text>
            </View>
            <View style={styles.secnameRow}>
              <Text style={styles.status}>{createdAgo}</Text>
              {website && <Icons.WebIcon width={16} height={16} />}
              {twitterX && <Icons.Twittericon width={15} height={15} />}
              {telegramX && <Icons.TelegramIcon width={18} height={18} />}
              {tiktok && <Icons.TiktokIcon width={18} height={18} />}
              {protocol && (
                <>
                  <Image
                    source={protocol.image}
                    style={{width: 15, height: 15}}
                    resizeMode="contain"
                  />
                  {/* <Text style={[styles.metricText, {color: protocol.color}]}>
                    {protocol.name}
                  </Text> */}
                </>
              )}
            </View>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Icons.Holders width={15} height={15} />
              <Text style={styles.metricText}>{holdersCount}</Text>
            </View>

            {/* 🔹 MODIFIED: protocol image instead of candlestick */}
            <View style={styles.metric}>
              <Icons.CandleStiks width={15} height={15} />
              <Text style={styles.metricText}>{txCount}</Text>
            </View>

            <View style={styles.metric}>
              <Icons.Trophy width={15} height={15} />
              <Text style={styles.metricText}>0</Text>
            </View>
            <View style={styles.metric}>
              <Icons.Crown width={15} height={15} />
              <Text style={styles.metricText}>0</Text>
            </View>
          </View>
        </View>

        <View style={styles.right}>
          <Text style={styles.info}>
            MC <Text style={styles.blue}>{mc}</Text>
          </Text>
          <Text style={styles.info}>
            V <Text style={styles.white}>{volume}</Text>
          </Text>
          <Text style={styles.info}>
            TX <Text style={styles.green}>{txCount}</Text>
          </Text>
          <Text style={styles.info}>
            {isMigrated ? (
              <Text style={styles.purple}>Virtual Curve</Text>
            ) : (
              <>
                B.C.P <Text style={styles.purple}>{bondingProgress}%</Text>
              </>
            )}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        {/* bottom stats unchanged */}
        {/* StarUser stat */}
        <View style={styles.statItem}>
          {stats.starUser?.includes('-') ? (
            <Icons.StarUserRed width={14} height={14} />
          ) : (
            <Icons.StarUserGreen width={14} height={14} />
          )}
          <Text
            style={[
              styles.statBadge,
              stats.starUser?.includes('-') ? styles.negative : styles.positive,
            ]}>
            {stats.starUser}
          </Text>
        </View>

        {/* Cloud stat */}
        <View style={styles.statItem}>
          {stats.cloud?.includes('-') ? (
            <Icons.CloudRed width={14} height={14} />
          ) : (
            <Icons.CloudGreen width={14} height={14} />
          )}
          <Text
            style={[
              styles.statBadge,
              stats.cloud?.includes('-') ? styles.negative : styles.positive,
            ]}>
            {stats.cloud}
          </Text>
        </View>

        {/* Target stat */}
        <View style={styles.statItem}>
          {stats.target?.includes('-') ? (
            <Icons.TargetRed width={14} height={14} />
          ) : (
            <Icons.TargetGreen width={14} height={14} />
          )}
          <Text
            style={[
              styles.statBadge,
              stats.target?.includes('-') ? styles.negative : styles.positive,
            ]}>
            {stats.target}
          </Text>
        </View>

        {/* Ghost stat */}
        <View style={styles.statItem}>
          {stats.ghost?.includes('-') ? (
            <Icons.GhostRed width={14} height={14} />
          ) : (
            <Icons.GhostGreen width={14} height={14} />
          )}
          <Text
            style={[
              styles.statBadge,
              stats.ghost?.includes('-') ? styles.negative : styles.positive,
            ]}>
            {stats.ghost}
          </Text>
        </View>

        {/* Blocks stat */}
        <View style={styles.statItem}>
          {stats.blocks?.includes('-') ? (
            <Icons.BlocksRed width={14} height={14} />
          ) : (
            <Icons.BlcoksGreen width={14} height={14} />
          )}
          <Text
            style={[
              styles.statBadge,
              stats.blocks?.includes('-') ? styles.negative : styles.positive,
            ]}>
            {stats.blocks}
          </Text>
        </View>
        <TouchableOpacity style={styles.btn}>
          <Text style={styles.btnText}>⚡ 0 SOL</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1F25',
    // marginHorizontal: 12,
    borderRadius: 8,
    borderColor: '#3f433bf8',
    borderWidth: 0.75,
    marginVertical: 8,
    padding: 12,
    width: '100%',
    boxShadow: '0 4px 6px 3px #e0d4d4ad',
  },

  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  left: {
    alignItems: 'center',
    marginRight: 5,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyMid,
  },
  shortName: {
    color: COLORS.greyMid,
    fontSize: 10,
    marginTop: 4,
  },
  middle: {
    flex: 1,
    marginHorizontal: 8,
  },
  nameRow: {
    flexDirection: 'column',
    // alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
    gap: 8,
  },
  firstnameRow: {
    flexDirection: 'row',
    gap: 5,
  },
  secnameRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 2,
  },
  name: {
    color: COLORS.greyMid,
    fontWeight: '600',
    fontSize: 12,
    marginRight: 4,
    marginTop: 3,
    width: 140,
    // borderWidth: 1,
    overflow: 'hidden',
  },
  symbol: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    color: 'lime',
    fontSize: 14,
    marginRight: 4,
  },
  icon: {
    fontSize: 12,
    color: COLORS.greyLight,
    marginHorizontal: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  metricIcon: {
    fontSize: 12,
    color: COLORS.greyMid,
    marginRight: 2,
  },
  metricText: {
    fontSize: 12,
    color: COLORS.white,
  },
  right: {
    alignItems: 'flex-end',
    minWidth: 80,
    gap: 4,
  },
  info: {
    color: COLORS.greyMid,
    fontSize: 14,
    marginBottom: 2,
  },
  blue: {color: '#3ba7ff'},
  white: {color: COLORS.white},
  purple: {color: '#a78bfa'},
  green: {color: '#22c55e'},
  btn: {
    alignSelf: 'flex-end',
    marginTop: 2,
    marginLeft: 4,

    backgroundColor: '#0b2899ff',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '600',
    paddingBottom: 3,
  },
  bottomRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 2,
    minWidth: 100,
    justifyContent: 'space-between',
  },
  statBadge: {
    fontSize: 11,
    fontWeight: '600',
    // paddingHorizontal: 6,
    // paddingVertical: 2,
    marginTop: 2,

    // marginRight: 6,
    marginBottom: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginRight: 8,
    // marginBottom: 4,
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(14, 15, 14, 0.09)',
    borderColor: '#3f433bf8',
    borderWidth: 0.75,
  },
  positive: {
    color: '#18aa29ff',
    // backgroundColor: 'rgba(14, 15, 14, 0.09)',
    // borderColor: '#3f433bf8',
    // borderWidth: 0.75,
  },
  negative: {
    color: '#cd250bee',
    // backgroundColor: 'rgba(14, 15, 14, 0.09)',
    // borderColor: '#3f433bf8',
    // borderWidth: 0.75,
  },
});
