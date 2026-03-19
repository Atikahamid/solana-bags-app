import React, {useState, useMemo} from 'react';
import {View, StyleSheet, Text, Button, Dimensions, TouchableOpacity} from 'react-native';
import {
  VictoryChart,
  Line,
  // VictoryAxis,
  VictoryScatter,
  // VictoryLabel,
} from 'victory-native';

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

const {width} = Dimensions.get('window');

/* WHY: prevents scientific notation & oversized labels */
const formatPrice = (value: number) => {
  if (value >= 1) return value.toFixed(4);
  if (value >= 0.01) return value.toFixed(6);
  return value.toPrecision(4);
};

const getDecimalPlaces = (value: number) => {
  if (value === 0) return 2;
  return Math.min(Math.max(-Math.floor(Math.log10(Math.abs(value))), 2), 8);
};

const LineGraph: React.FC<LineGraphProps> = ({ohlcData = []}) => {
  const [interval, setInterval] = useState<
    '1H' | '4H' | '24H' | 'Live' | 'All' 
  >('1H');

  const chartData = useMemo(() => {
    if (!ohlcData.length) return null;

    const latestTime = Math.max(...ohlcData.map(d => d.time));

    const ranges: Record<typeof interval, number | null> = {
      '1H': 3600,
      '4H': 6 * 3600,
      '24H': 24 * 3600,
      'Live': 7 * 24 * 3600,
      'All': 30 * 24 * 3600,
    };

    const cutoff = ranges[interval] ? latestTime - ranges[interval]! : null;

    const filtered = cutoff ? ohlcData.filter(d => d.time >= cutoff) : ohlcData;

    if (!filtered.length) return null;

    return filtered.map(d => ({
      x: new Date(d.time * 1000),
      y: Number(d.close),
    }));
  }, [ohlcData, interval]);

  if (!chartData) {
    return <Text style={styles.noTrades}>No trades yet 😔</Text>;
  }

  const lastPoint = chartData[chartData.length - 1];
  const decimals = getDecimalPlaces(lastPoint.y);
  return (
    <View style={{flex: 1}}>
      <VictoryChart
        scale={{x: 'time', y: 'linear'}}
        padding={{left: 10, right: 10, top: 20, bottom: 20}}
        domainPadding={{y: 10}}
        theme={{
          axis: {
            style: {
              axis: {stroke: 'transparent'},
              ticks: {stroke: 'transparent'},
              tickLabels: {fill: 'transparent'},
              grid: {stroke: 'transparent'},
            },
          },
        }}>
        {/* X AXIS (labels only, no line) */}
        {/* <VictoryAxis
          tickFormat={t =>
            new Date(t).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          }
          style={{
            axis: {stroke: 'transparent'},
            tickLabels: {fill: '#8b8b8b', fontSize: 10},
            grid: {stroke: 'transparent'},
          }}
        /> */}

        {/* Y AXIS RIGHT (compact, formatted) */}
        {/* <VictoryAxis
          dependentAxis
          orientation="right"
          tickFormat={t => Number(t).toFixed(decimals)}
          tickCount={6}
          style={{
            axis: {stroke: 'transparent'},
            tickLabels: {
              fill: '#8b8b8b',
              fontSize: 10,
              padding: 6,
            },
            grid: {
              stroke: '#1f1f1f',
              strokeDasharray: '4,4',
            },
          }}
        /> */}

        {/* MAIN PRICE LINE */}
        <Line
          data={chartData}
          interpolation="monotoneX"
          style={{
            data: {
              stroke: '#00FF84',
              strokeWidth: 2.2,
            },
          }}
        />

        {/* LAST PRICE HORIZONTAL DOTTED LINE */}
        <Line
          data={[
            {x: chartData[0].x, y: lastPoint.y},
            {x: lastPoint.x, y: lastPoint.y},
          ]}
          style={{
            data: {
              stroke: '#00FF84',
              strokeDasharray: '6,6',
              opacity: 0.6,
            },
          }}
        />

        {/* LAST PRICE DOT */}
        <VictoryScatter
          data={[lastPoint]}
          size={4}
          style={{
            data: {fill: '#00FF84'},
          }}
        />

        {/* RIGHT-SIDE PRICE LABEL */}
        {/* <VictoryLabel
          text={formatPrice(lastPoint.y)}
          x={width - 52}
          y={40}
          textAnchor="start"
          style={{
            fill: '#00FF84',
            fontSize: 12,
            fontWeight: 'bold',
          }}
        /> */}
      </VictoryChart>

      {/* INTERVAL BUTTONS */}
      <View style={styles.buttons}>
        {['LIVE', '1H','4H', '24H', 'ALL'].map(intv => {
          const isActive = interval === intv;

          return (
            <TouchableOpacity
              key={intv}
              onPress={() => setInterval(intv as any)}
              style={[
                styles.intervalBtn,
                isActive && styles.intervalBtnActive,
              ]}>
              <Text
                style={[
                  styles.intervalText,
                  isActive && styles.intervalTextActive,
                ]}>
                {intv}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginRight: 15, 
    marginBottom: 10,
    marginLeft: 10,
    // paddingVertical: 10,
  },

  intervalBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },

  intervalBtnActive: {
    backgroundColor: '#38393a',
    borderWidth: 1,
    borderColor: '#5d5f61'
  },

  intervalText: {
    fontSize: 12,
    color: '#8b8b8b',
    fontWeight: '500',
  },

  intervalTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  noTrades: {
    color: '#aaa',
    textAlign: 'center',
    padding: 16,
    fontSize: 14,
  },
});

export default LineGraph;
