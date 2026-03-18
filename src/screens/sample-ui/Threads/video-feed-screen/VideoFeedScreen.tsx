import COLORS from '@/assets/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Image, // ✅ ADD
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { RootStackParamList } from '@/shared/navigation/RootNavigator';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '@/shared/hooks/useReduxHooks';
import { AppHeader } from '@/core/shared-ui';

const { height: screenHeight } = Dimensions.get('window');

type VideoFeedItem = {
  id: string;
  token_mint: string;
  token_name: string;
  token_symbol: string;
  token_image: string | null;
  video_url: string;
  thumbnail_url: string | null;
  title: string | null;
  description: string | null;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  username: string;
  profile_image_url: string | null;
};

export default function VideoFeedScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const userId = useAppSelector(state => state.auth.address);

  const [videos, setVideos] = useState<VideoFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 75, waitForInteraction: true }),
    [],
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  });

  const fetchVideos = useCallback(
    async (pageNumber: number) => {
      if (!hasMore && pageNumber > 0) return;
      setLoading(true);
      try {
        const baseUrl = process.env.SERVER_URL || 'http://localhost:3000';
        const resp = await fetch(
          `${baseUrl}/api/videos/feed?limit=10&offset=${pageNumber * 10}`,
        );
        const data = await resp.json();
        console.log('Fetched videos', data);
        if (data?.success) {
          const newVideos: VideoFeedItem[] = data.videos || [];
          setVideos(prev => (pageNumber === 0 ? newVideos : [...prev, ...newVideos]));
          setHasMore(data.hasMore ?? false);
          setPage(pageNumber);
        } else {
          console.warn('Failed to fetch video feed', data?.error);
        }
      } catch (err) {
        console.error('Error fetching video feed', err);
      } finally {
        setLoading(false);
      }
    },
    [hasMore],
  );

  useEffect(() => {
    if (isFocused) {
      fetchVideos(0);
    }
  }, [fetchVideos, isFocused]);

  const handlePress = (id: string) => {
    navigation.navigate('VideoDetail', { id });
  };
  const change = 5.2;
  const isPositive = change >= 0;
  const changeColor = isPositive ? '#22C55E' : '#EF4444';

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderItem = useCallback(
    ({ item }: { item: VideoFeedItem }) => {
      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => handlePress(item.id)}
          activeOpacity={0.9}
        >

          {/* Title ABOVE image */}
          <Text style={styles.name} numberOfLines={1}>
            {item.token_name || item.title || 'Untitled'}
          </Text>

          {/* Thumbnail */}
          <View style={styles.imageWrapper}>
            {item.thumbnail_url ? (
              <Image
                source={{ uri: item.thumbnail_url }}
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fallback}>
                <Text style={styles.videoLabel}>No Preview</Text>
              </View>
            )}

            {/* Play icon overlay */}
            <View style={styles.playOverlay}>
              <Text style={styles.playIcon}>▶</Text>
            </View>

          </View>

          {/* Stats BELOW image */}
          <View style={styles.statsRow}>
            <Text style={styles.stat}>{item.views_count}</Text>
            <Text style={styles.stat}>123.4K MC</Text>
            {/* <Text style={styles.stat}>📈 +5.2%</Text> */}
            <Text style={[styles.change, { color: changeColor }]}>
              {Math.abs(change).toFixed(2)}%
            </Text>
          </View>

        </TouchableOpacity>
      );
    },
    [],
  );

  return (
    <LinearGradient
      colors={COLORS.backgroundGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}>
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        {/* <View style={styles.headerRow}>
          <Text style={styles.header}>Video Feed</Text>
          
          {loading && <ActivityIndicator color={COLORS.brandBlue} />}
        </View> */}
        <AppHeader  showBackButton={true} onBackPress={handleBack} />

 
        {videos.length === 0 && !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No videos available yet.</Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (!loading && hasMore) fetchVideos(page + 1);
            }}
            onEndReachedThreshold={0.5}
            contentContainerStyle={styles.scroll}
            columnWrapperStyle={styles.row} // ✅ ADD THIS
            initialNumToRender={6}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  row: {
    // justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10, // vertical gap between rows
  },
  container: {
    flex: 1,
    // backgroundColor: '#0A0A10',
  },
  scroll: {
    paddingHorizontal: 10,
    paddingBottom: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  // card: {
  //   width: '48%',
  //   backgroundColor: '#13131A',
  //   borderRadius: 16,
  //   padding: 12,
  //   marginBottom: 12,
  // },
  card: {
    width: '48%',
    marginBottom: 14,
    marginTop: 4,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    marginLeft: 4,
  },
  video: {
    flex: 1,
    height: 150,
    backgroundColor: '#1E1E2A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  videoLabel: {
    color: '#999',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  stat: {
    color: '#B0B0C2',
    fontSize: 12,
  },
  // thumbnail: {
  //   width: '100%',
  //   height: '100%',
  //   borderRadius: 12,
  // },

  fallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 9 / 16, // ✅ TikTok portrait
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    backgroundColor: '#1E1E2A',
  },

  thumbnail: {
    width: '100%',
    height: '100%',
  },

  playOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },

  playIcon: {
    color: '#fff',
    fontSize: 12,
  },
  change: {
    fontSize: 12,
    fontWeight: '600',
  },
});
