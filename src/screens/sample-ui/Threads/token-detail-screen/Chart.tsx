import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { fetchTokenChart } from "./tokenDetailService";
import LineGraph, { OhlcPoint } from "./LineGrapgh";

type ChartProps = {
  mintAddress: string;
};

const Chart: React.FC<ChartProps> = ({ mintAddress }) => {
  const [ohlcData, setOhlcData] = useState<OhlcPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const staticData: OhlcPoint[] = [
    { time: 1696502400, open: 1.0, high: 1.2, low: 0.9, close: 1.1, volume: 1200 },
    { time: 1696506000, open: 1.1, high: 1.3, low: 1.0, close: 1.25, volume: 1500 },
    { time: 1696509600, open: 1.25, high: 1.35, low: 1.15, close: 1.3, volume: 1100 },
    { time: 1696513200, open: 1.3, high: 1.4, low: 1.2, close: 1.35, volume: 1700 },
    { time: 1696516800, open: 1.35, high: 1.45, low: 1.25, close: 1.4, volume: 900 },
  ];
  
  useEffect(() => {
    const loadChartData = async () => {
      try {
        const res = await fetchTokenChart(mintAddress);
        // console.log("res.candles:", res.candles);
        setOhlcData(res.candles ?? []);
      } catch (err) {
        console.error("❌ Error loading chart data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadChartData();
  }, [mintAddress]);

  if (loading) {
    return (
      <View style={{ height: 300, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#00FF84" />
      </View>
    );
  }

  return <LineGraph ohlcData={staticData} />;
};

export default Chart;
