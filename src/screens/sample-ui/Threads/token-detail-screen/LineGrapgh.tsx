import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Button,
} from 'react-native';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryLabel,
} from "victory-native";

export type OhlcPoint = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

type LineGraphProps = {
  ohlcData?: OhlcPoint[];
};

const LineGraph: React.FC<LineGraphProps> = ({ ohlcData = [] }) => {
  const [interval, setInterval] = useState<
    '1H' | '6H' | '1D' | '1W' | '1M' | 'MAX'
  >('1H');

  const chartData = useMemo(() => {
    if (!ohlcData.length) return null;

    const latestTime = Math.max(...ohlcData.map(d => d.time));

    const ranges: Record<typeof interval, number | null> = {
      '1H': 3600,
      '6H': 6 * 3600,
      '1D': 24 * 3600,
      '1W': 7 * 24 * 3600,
      '1M': 30 * 24 * 3600,
      'MAX': null,
    };

    const cutoff = ranges[interval]
      ? latestTime - ranges[interval]!
      : null;

    const filtered = cutoff
      ? ohlcData.filter(d => d.time >= cutoff)
      : ohlcData;

    if (!filtered.length) return null;

    return filtered.map(d => ({
      x: new Date(d.time * 1000),   // ✅ REAL TIME SCALE
      y: Number(d.close),
    }));
  }, [ohlcData, interval]);

  if (!chartData) {
    return (
      <Text style={styles.noTrades}>
        No trades yet 😔
      </Text>
    );
  }

  const lastPoint = chartData[chartData.length - 1];

  return (
    <View style={{ flex: 1 }}>
      <VictoryChart
        scale={{ x: "time" }}
        padding={{ left: 20, right: 60, top: 20, bottom: 30 }}
      >
        {/* X Axis */}
        <VictoryAxis
          style={{
            axis: { stroke: "#333" },
            tickLabels: { fill: "#888", fontSize: 10 },
            grid: { stroke: "transparent" },
          }}
        />

        {/* Y Axis (RIGHT) */}
        <VictoryAxis
          dependentAxis
          orientation="right"
          style={{
            axis: { stroke: "#333" },
            tickLabels: { fill: "#888", fontSize: 10 },
            grid: { stroke: "#222", strokeDasharray: "4,4" },
          }}
        />

        {/* Main Line */}
        <VictoryLine
          data={chartData}
          interpolation="monotoneX"
          style={{
            data: { stroke: "#00FF84", strokeWidth: 2 },
          }}
        />

        {/* Dotted last-price horizontal line */}
        <VictoryLine
          data={[
            { x: chartData[0].x, y: lastPoint.y },
            { x: lastPoint.x, y: lastPoint.y },
          ]}
          style={{
            data: {
              stroke: "#00FF84",
              strokeDasharray: "6,6",
              opacity: 0.6,
            },
          }}
        />

        {/* Last price dot */}
        <VictoryScatter
          data={[lastPoint]}
          size={4}
          style={{
            data: { fill: "#00FF84" },
          }}
        />

        {/* Price label */}
        <VictoryLabel
          text={`${lastPoint.y.toFixed(4)}`}
          x={300}
          y={50}
          textAnchor="start"
          style={{
            fill: "#00FF84",
            fontSize: 12,
            fontWeight: "bold",
          }}
        />
      </VictoryChart>

      <View style={styles.buttons}>
        {['1H', '6H', '1D', '1W', '1M', 'MAX'].map(intv => (
          <Button
            key={intv}
            title={intv}
            onPress={() => setInterval(intv as any)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
