// file: LineGraph.tsx
import React, {useState, useMemo} from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
  Button,
} from 'react-native';
import {LineChart} from 'react-native-chart-kit';
// import VictoryChart from "victory-native/lib/victory-chart";

// import { VictoryChart, VictoryLine, VictoryAxis, VictoryTheme } from "victory-native";

export type OhlcPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  count?: number;
};

type LineGraphProps = {
  ohlcData?: OhlcPoint[];
};

const screenWidth = Dimensions.get('window').width;
 
const staticDatasets: Record<string, OhlcPoint[]> = {
  '1H': [
    {time: 1696502400, open: 1.0, high: 1.2, low: 0.9, close: 1.1},
    {time: 1696503000, open: 1.1, high: 1.25, low: 1.0, close: 1.15},
    {time: 1696503600, open: 1.15, high: 1.3, low: 1.05, close: 1.2},
    {time: 1696504200, open: 1.2, high: 1.28, low: 1.1, close: 1.18},
    {time: 1696504800, open: 1.18, high: 1.3, low: 1.12, close: 1.25},
    {time: 1696505400, open: 1.25, high: 1.35, low: 1.2, close: 1.28},
    {time: 1696506000, open: 1.28, high: 1.35, low: 1.2, close: 1.3},
    {time: 1696506600, open: 1.3, high: 1.38, low: 1.25, close: 1.35},
    {time: 1696507200, open: 1.35, high: 1.4, low: 1.28, close: 1.32},
    {time: 1696507800, open: 1.32, high: 1.36, low: 1.25, close: 1.3},
  ],

  '6H': [
    {time: 1696513200, open: 2.0, high: 2.2, low: 1.9, close: 2.1},
    {time: 1696516800, open: 2.1, high: 2.3, low: 2.0, close: 2.25},
    {time: 1696520400, open: 2.25, high: 2.35, low: 2.15, close: 2.3},
    {time: 1696524000, open: 2.3, high: 2.4, low: 2.2, close: 2.35},
    {time: 1696527600, open: 2.35, high: 2.45, low: 2.25, close: 2.4},
    {time: 1696531200, open: 2.4, high: 2.5, low: 2.3, close: 2.45},
    {time: 1696534800, open: 2.45, high: 2.55, low: 2.35, close: 2.5},
  ],

  '1D': [
    {time: 1696520400, open: 3.0, high: 3.3, low: 2.9, close: 3.2},
    {time: 1696524000, open: 3.2, high: 3.4, low: 3.1, close: 3.35},
    {time: 1696527600, open: 3.35, high: 3.45, low: 3.25, close: 3.4},
    {time: 1696531200, open: 3.4, high: 3.55, low: 3.3, close: 3.5},
    {time: 1696534800, open: 3.5, high: 3.65, low: 3.4, close: 3.55},
    {time: 1696538400, open: 3.55, high: 3.7, low: 3.45, close: 3.6},
    {time: 1696542000, open: 3.6, high: 3.75, low: 3.5, close: 3.7},
  ],

  '1W': [
    {time: 1696531200, open: 4.0, high: 4.3, low: 3.9, close: 4.2},
    {time: 1696534800, open: 4.2, high: 4.4, low: 4.0, close: 4.35},
    {time: 1696538400, open: 4.35, high: 4.5, low: 4.2, close: 4.4},
    {time: 1696542000, open: 4.4, high: 4.6, low: 4.3, close: 4.55},
    {time: 1696545600, open: 4.55, high: 4.7, low: 4.4, close: 4.65},
    {time: 1696549200, open: 4.65, high: 4.8, low: 4.5, close: 4.7},
    {time: 1696552800, open: 4.7, high: 4.9, low: 4.6, close: 4.8},
  ],

  '1M': [
    {time: 1696542000, open: 5.0, high: 5.4, low: 4.9, close: 5.3},
    {time: 1696545600, open: 5.3, high: 5.5, low: 5.1, close: 5.45},
    {time: 1696549200, open: 5.45, high: 5.6, low: 5.3, close: 5.5},
    {time: 1696552800, open: 5.5, high: 5.7, low: 5.4, close: 5.6},
    {time: 1696556400, open: 5.6, high: 5.8, low: 5.5, close: 5.7},
    {time: 1696560000, open: 5.7, high: 5.9, low: 5.6, close: 5.8},
    {time: 1696563600, open: 5.8, high: 6.0, low: 5.7, close: 5.9},
  ],

  MAX: [
    {time: 1696552800, open: 6.0, high: 6.5, low: 5.9, close: 6.3},
    {time: 1696556400, open: 6.3, high: 6.7, low: 6.1, close: 6.6},
    {time: 1696560000, open: 6.6, high: 6.9, low: 6.4, close: 6.8},
    {time: 1696563600, open: 6.8, high: 7.0, low: 6.6, close: 6.9},
    {time: 1696567200, open: 6.9, high: 7.2, low: 6.7, close: 7.1},
    {time: 1696570800, open: 7.1, high: 7.3, low: 6.9, close: 7.25},
    {time: 1696574400, open: 7.25, high: 7.5, low: 7.0, close: 7.4},
  ],

  USD: [
    {time: 1696560000, open: 7.0, high: 7.2, low: 6.9, close: 7.1},
    {time: 1696563600, open: 7.1, high: 7.3, low: 7.0, close: 7.25},
    {time: 1696567200, open: 7.25, high: 7.4, low: 7.1, close: 7.3},
    {time: 1696570800, open: 7.3, high: 7.5, low: 7.2, close: 7.4},
    {time: 1696574400, open: 7.4, high: 7.6, low: 7.25, close: 7.5},
    {time: 1696578000, open: 7.5, high: 7.7, low: 7.3, close: 7.65},
  ],

  MC: [
    {time: 1696567200, open: 8.0, high: 8.4, low: 7.9, close: 8.2},
    {time: 1696570800, open: 8.2, high: 8.5, low: 8.0, close: 8.35},
    {time: 1696574400, open: 8.35, high: 8.55, low: 8.2, close: 8.45},
    {time: 1696578000, open: 8.45, high: 8.65, low: 8.3, close: 8.55},
    {time: 1696581600, open: 8.55, high: 8.75, low: 8.4, close: 8.7},
    {time: 1696585200, open: 8.7, high: 8.9, low: 8.5, close: 8.8},
    {time: 1696588800, open: 8.8, high: 9.0, low: 8.6, close: 8.9},
  ],
};

const LineGraph: React.FC<LineGraphProps> = () => {
  const [interval, setInterval] = useState<keyof typeof staticDatasets>('1H');

  const chartData = useMemo(() => {
    const ohlcData = staticDatasets[interval];
    if (!ohlcData || ohlcData.length === 0) return null;

    return ohlcData.map(d => {
      let t = Number(d.time);
      if (t > 9999999999) t = Math.floor(t / 1000);
      return {
        x: new Date(t * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        y: Number(d.close),
      };
    });
  }, [interval]);
  return (
    <View style={{flex: 1}}>
      {chartData ? (
        <LineChart
          data={{
            labels: chartData.map(p => p.x),
            datasets: [{data: chartData.map(p => p.y)}],
          }}
          width={340}
          height={300}
          chartConfig={{
            backgroundGradientFrom: '#3c4146ff',
            backgroundGradientTo: '#1e2635ff',
            color: () => '#00FF84',
            labelColor: () => '#aaa',
            propsForDots: {
              r: '2',
              strokeWidth: '1',
              stroke: '#00FF84',
            },
          }}
          withShadow={false}
          withVerticalLines={false}
          withHorizontalLines={false}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text style={styles.noTrades}>
          No trades yet 😔{'\n'}Trading history shows here once you make your
          first trade.
        </Text>
      )}

      <View style={styles.buttons}>
        {['1H', '6H', '1D', '1W', '1M', 'MAX', 'USD'].map(intv => (
          <Button style={{ backgroundColor: '#164780ff',}} key={intv} title={intv} onPress={() => setInterval(intv)} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  chart: {
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 8,
  },
  buttons: {
   
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  noTrades: {
    color: '#aaa',
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
});

export default LineGraph;
