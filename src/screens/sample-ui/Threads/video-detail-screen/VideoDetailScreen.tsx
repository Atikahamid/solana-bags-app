import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
// import { Video } from 'expo-av';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import COLORS from '@/assets/colors';
import { useRoute, RouteProp, useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { useAppSelector } from '@/shared/hooks/useReduxHooks';
import { LinearGradient } from 'expo-linear-gradient';
import Icons from '@/assets/svgs';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

type Comment = {
  id: string;
  username: string;
  profile_image_url: string | null;
  comment_content: string;
  created_at: string;
};

type VideoDetail = {
  id: string;
  video_url: string;
  token_name: string;
  token_symbol: string;
  token_image: string | null;
  title: string | null;
  description: string | null;
  views_count: number;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  username: string;
  profile_image_url: string | null;
  tokenStats?: {
    marketCap?: string;
    price?: string;
    change24h?: string;
    holders?: number;
  } | null;
  userInteractions?: string[];
  comments?: Comment[];
};

export default function VideoDetailScreen() {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const route = useRoute<RouteProp<RootStackParamList, 'VideoDetail'>>();
  const userId = useAppSelector(state => state.auth.address);

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const videoId = route.params?.id;

  const fetchVideoDetails = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);

    try {
      const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
      const resp = await fetch(
        `${baseUrl}/api/videos/${encodeURIComponent(videoId)}${userId ? `?userId=${encodeURIComponent(userId)}` : ''
        }`,
      );
      const data = await resp.json();
      if (data?.success) {
        setVideo(data.video);
      } else {
        console.warn('Failed to load video detail', data?.error);
      }
    } catch (err) {
      console.error('Error loading video details', err);
    } finally {
      setLoading(false);
    }
  }, [userId, videoId]);

  useEffect(() => {
    if (isFocused) {
      fetchVideoDetails();
    }
  }, [fetchVideoDetails, isFocused]);

  const triggerInteraction = useCallback(
    async (type: 'like' | 'share' | 'comment', commentContent?: string) => {
      if (!video || !video.id) return;
      if (!userId) {
        Alert.alert('Login required', 'Please log in to interact with videos.');
        return;
      }

      if (type === 'comment' && !commentContent?.trim()) {
        return;
      }

      try {
        if (type === 'like') setIsLiking(true);

        const baseUrl = process.env.EXPO_PUBLIC_SERVER_URL || 'http://localhost:3000';
        const resp = await fetch(`${baseUrl}/api/videos/${encodeURIComponent(video.id)}/interact`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            interactionType: type,
            commentContent: commentContent || undefined,
          }),
        });
        const result = await resp.json();

        if (!result.success) {
          throw new Error(result.error || 'Interaction failed');
        }

        // Refetch details to refresh counts and comments
        await fetchVideoDetails();
      } catch (err) {
        console.error('Interaction error', err);
        Alert.alert('Error', (err as any)?.message || 'Failed to perform action');
      } finally {
        setIsLiking(false);
        setSubmittingComment(false);
      }
    },
    [fetchVideoDetails, userId, video],
  );

  const isLiked = useMemo(
    () => video?.userInteractions?.includes('like') ?? false,
    [video],
  );

  const handleLike = () => {
    if (!video) return;
    triggerInteraction('like');
  };

  const handleShare = () => {
    if (!video) return;
    triggerInteraction('share');
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    setSubmittingComment(true);
    await triggerInteraction('comment', commentInput.trim());
    setCommentInput('');
  };

  if (loading || !video) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={COLORS.brandBlue} />
      </View>
    );
  }

  const marketCap = video.tokenStats?.marketCap || '$127,453';
  const change24h = video.tokenStats?.change24h || '+234%';
  const holders = video.tokenStats?.holders || 521;

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {/* <Video
        source={{ uri: video.video_url }}
        style={styles.videoPlayer}
        resizeMode="cover"
        shouldPlay={isFocused}
      useNativeControls
      /> */}

      <Image
        source={{ uri: video.thumbnail_url }}
        style={styles.videoPlayer}
        resizeMode="cover"
      />

      <View style={[styles.topInfo]}>
        <View style={styles.topTitleRow}>
          <Text style={styles.title}>{video.token_name || video.title || 'Video'}</Text>
          {video.token_symbol ? <Text style={styles.verified}>✓ {video.token_symbol}</Text> : null}
        </View>
        {video.description ? (
          <Text style={styles.description}>{video.description}</Text>
        ) : null}
      </View>

      <View style={styles.rightActionColumn}>
        <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
          <View style={styles.actionIconCircle}>
            <Text style={styles.actionLabel}>{isLiked ? '❤️' : '🤍'}</Text>
          </View>
          <Text style={styles.actionCount}>{video.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleComment}>
          <View style={styles.actionIconCircle}>
            {/* <Text style={styles.actionLabel}>💬</Text> */}
            <Icons.MessageCommentIcon width={25} height={25} />
          </View>
          <Text style={styles.actionCount}>{video.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <View style={styles.actionIconCircle}>
            {/* <Text style={styles.actionLabel}>↗️</Text> */}
            <Icons.ShareReelIcon width={25} height={25} />
          </View>
          <Text style={styles.actionCount}>{video.shares_count}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomOverlay}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Views</Text>
            <Text style={styles.statValue}>{video.views_count > 1000 ? Math.floor(video.views_count / 1000) + 'K' : video.views_count}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>MCap</Text>
            <Text style={styles.statValue}>{marketCap}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>24h</Text>
            <Text style={[styles.statValue, styles.positive]}>{change24h}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Holders</Text>
            <Text style={styles.statValue}>{holders}</Text>
          </View>
        </View>

        <View style={styles.bottomRow}>

          <TouchableOpacity style={styles.buyButton} activeOpacity={0.8}>
            <Text style={styles.buyButtonText}>💸 BUY NOW</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.chartButton}>
            <Text style={styles.chartButtonText}>📊 CHART</Text>
          </TouchableOpacity>
        </View>

        {/* <View style={styles.predictSection}>
          <Text style={styles.predictIcon}>🤖</Text>
          <View style={styles.predictContent}>
            <Text style={styles.predictText}>AI Predicts: 10x Potential</Text>
            <Text style={styles.predictConfidence}>87% confidence</Text>
          </View>
        </View> */}

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    position: 'relative',
  },
  videoPlayer: {
    width: screenWidth,
    height: screenHeight,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  topInfo: {
    position: 'absolute',
    top: 37,
    left: 16,
    right: 80,
    zIndex: 10,
  },
  topTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  verified: {
    marginLeft: 8,
    color: '#00D1FF',
    fontSize: 16,
  },
  description: {
    color: '#B0B0C2',
    fontSize: 13,
    lineHeight: 15,
  },
  rightActionColumn: {
    position: 'absolute',
    right: 16,
    top: '35%',
    alignItems: 'center',
    zIndex: 10,
  },
  actionButton: {
    marginBottom: 24,
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 24,
    // backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  actionCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.37)',
    zIndex: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(50, 50, 60, 0.9)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statLabel: {
    color: '#c9c9d9',
    fontSize: 10,
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  positive: {
    color: '#00FF00',
  },

  buyButton: {
    flex: 1,
    backgroundColor: '#C23A8F',
    borderRadius: 12,
    paddingVertical: 14,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',

  },
  buyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chartButton: {
    flex: 1,
    backgroundColor: '#064351',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chartButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  predictSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(100, 50, 150, 0.6)',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  predictIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  predictContent: {
    flex: 1,
  },
  predictText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  predictConfidence: {
    color: '#B0B0C2',
    fontSize: 11,
    marginTop: 2,
  },
});
