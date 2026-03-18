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

  useEffect(() => {
    const loadChartData = async () => {
      try {
        const res = await fetchTokenChart(mintAddress);
        console.log("chart data" , res.candles[1]);
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

  return <LineGraph ohlcData={ohlcData} />;
};

export default Chart;
