// ==== File: src/screens/LineGraph.tsx ====

import React, {
  useEffect,
  useRef,
  useMemo,
  useState,
  useCallback,
  useLayoutEffect,
} from 'react';
import {
  View,
  Dimensions,
  Animated,
  Easing,
  PanResponder,
  StyleSheet,
  Text,
  Platform,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import {
  Circle,
  ClipPath,
  Defs,
  Image as SvgImage,
  Line,
  Rect,
  G,
  Text as SvgText,
  LinearGradient as SvgLinearGradient,
  Stop,
  Polygon,
} from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import COLORS from '@/assets/colors';
import TYPOGRAPHY from '@/assets/typography';

interface LineGraphProps {
  data: number[];
  width?: number;
  executionPrice?: number;
  executionTimestamp?: number;
  timestamps?: string[];
  executionColor?: string;
  userAvatar?: any;
  isLoading?: boolean;
}

const LineGraphSkeleton: React.FC<{ width: number; height: number }> = React.memo(({ width, height }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const gradientWidth = width * 0.6;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => {
      animation.stop();
    };
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-gradientWidth, width + gradientWidth],
  });

  return (
    <View
      style={{
        width,
        height,
        backgroundColor: COLORS.borderDarkColor,
        overflow: 'hidden',
      }}
    >
      <Animated.View
        style={{
          width: gradientWidth,
          height: '100%',
          position: 'absolute',
          transform: [{ translateX }],
        }}
      >
        <LinearGradient
          colors={['transparent', COLORS.lightBackground, 'transparent']}
          style={{ flex: 1 }}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>
    </View>
  );
});

const LineGraph: React.FC<LineGraphProps> = ({
  data,
  width,
  executionPrice,
  executionTimestamp,
  timestamps,
  userAvatar,
  executionColor = COLORS.brandGreen,
  isLoading = false,
}) => {
  const chartHeight = 130;
  const containerWidth = width || Dimensions.get('window').width - 64;
  const HORIZONTAL_PADDING = 16;
  const usableChartWidth = containerWidth - HORIZONTAL_PADDING * 2;

  const animatedData = useRef(new Animated.Value(0)).current;
  const currentData = useRef(data);
  const [displayData, setDisplayData] = useState(data);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
    index: number;
    price: number;
  } | null>(null);

  const prevDataLengthRef = useRef(data.length);

  const dataRange = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 0, range: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    return { min, max, range: max - min };
  }, [data]);

  const interpolateY = useCallback(
    (dataPoint: number) => {
      const availableHeight = chartHeight - 16;
      const ratio =
        (dataPoint - dataRange.min) / (dataRange.range === 0 ? 1 : dataRange.range);
      return availableHeight - ratio * availableHeight + 8;
    },
    [dataRange],
  );

  const calculateTooltipPosition = useCallback(
    (rawX: number) => {
      if (data.length === 0) return;
      const adjustedX = rawX - HORIZONTAL_PADDING;
      let clampedX = Math.max(0, Math.min(adjustedX, usableChartWidth));
      const segmentWidth = usableChartWidth / (data.length - 1);
      let index = Math.round(clampedX / segmentWidth);
      index = Math.max(0, Math.min(data.length - 1, index));
      const dataPoint = displayData[index];
      const y = interpolateY(dataPoint);
      setTooltipPos({ x: clampedX + HORIZONTAL_PADDING, y, index, price: dataPoint });
    },
    [data, displayData, usableChartWidth, interpolateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: evt => {
          calculateTooltipPosition(evt.nativeEvent.locationX);
        },
        onPanResponderMove: evt => {
          calculateTooltipPosition(evt.nativeEvent.locationX);
        },
        onPanResponderRelease: () => setTooltipPos(null),
        onPanResponderTerminate: () => setTooltipPos(null),
      }),
    [calculateTooltipPosition],
  );

  useLayoutEffect(() => {
    const dataChanged =
      data.length !== prevDataLengthRef.current ||
      JSON.stringify(data) !== JSON.stringify(currentData.current);
    if (!dataChanged) return;
    prevDataLengthRef.current = data.length;
    animatedData.setValue(0);
    const prevData = [...currentData.current];
    currentData.current = data;
    Animated.timing(animatedData, {
      toValue: 1,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
    const id = animatedData.addListener(({ value }) => {
      const newData = data.map((target, i) => {
        const start = prevData[i] ?? dataRange.min;
        return start + (target - start) * value;
      });
      setDisplayData(newData);
    });
    return () => {
      animatedData.removeListener(id);
    };
  }, [data, animatedData, dataRange.min]);

  const formatTimestamp = useCallback((ts: number) => {
    const inMs = ts < 10000000000 ? ts * 1000 : ts;
    const d = new Date(inMs);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const formatPrice = useCallback(
    (price: number) =>
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      }).format(price),
    [],
  );

  const chartConfig = useMemo(
    () => ({
      backgroundColor: COLORS.lightBackground,
      backgroundGradientFrom: COLORS.lightBackground,
      backgroundGradientTo: COLORS.lightBackground,
      decimalPlaces: 2,
      color: () => COLORS.brandBlue,
      labelColor: () => COLORS.accessoryDarkColor,
      propsForDots: { r: '0' },
      propsForBackgroundLines: { strokeWidth: 0 },
      propsForLabels: { fontSize: TYPOGRAPHY.size.xs, display: 'none' },
    }),
    [],
  );

  // ✅ FIX: use timestamps for labels
  const chartData = useMemo(() => {
    const labels =
      timestamps && timestamps.length > 0
        ? timestamps.map((ts, i) =>
            i % Math.ceil(timestamps.length / 6) === 0
              ? formatTimestamp(ts)
              : '',
          )
        : ['', '', '', '', '', ''];

    return {
      labels,
      datasets: [
        {
          data: displayData.length > 0 ? displayData : [0, 0],
          strokeWidth: 3,
          color: () => COLORS.brandBlue,
        },
      ],
    };
  }, [displayData, timestamps, formatTimestamp]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LineGraphSkeleton width={containerWidth} height={chartHeight} />
      ) : !data || data.length < 2 ? (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No chart data available</Text>
        </View>
      ) : (
        <>
          <LineChart
            data={chartData}
            width={containerWidth}
            height={chartHeight}
            chartConfig={chartConfig}
            bezier
            withDots
            withHorizontalLines={false}
            withVerticalLines={false}
            withHorizontalLabels={false}
            withVerticalLabels={false}
            withShadow={false}
            style={{
              borderRadius: 0,
              paddingRight: HORIZONTAL_PADDING,
              paddingLeft: HORIZONTAL_PADDING,
              backgroundColor: COLORS.lightBackground,
            }}
          />
          <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers} />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightBackground,
    overflow: 'hidden',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  noDataText: {
    color: COLORS.accessoryDarkColor,
    fontSize: TYPOGRAPHY.size.sm,
  },
});

export default LineGraph;
