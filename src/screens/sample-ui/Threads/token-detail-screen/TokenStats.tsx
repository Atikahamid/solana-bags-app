import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { fetchTokenStats, TokenStatsApiResponse } from "./tokenDetailService";
import { formatCompactNumber } from "../SearchScreen";

interface Props {
  stats: TokenStatsApiResponse | null;
}

const TokenStats: React.FC<Props> = ({ stats }) => {
  if (!stats) return null;
  // console.log("stats in component: ", stats);

  return (
    <View style={styles.container}>
      {/* <Text style={styles.heading}>Stats</Text> */}

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.label}>Market cap</Text>
          <Text style={styles.value}>{formatCompactNumber(stats.tokenStats.market_cap)}</Text>
          
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>24h vol</Text>
          <Text style={styles.value}>{formatCompactNumber(Number(stats.tokenStats.volume_24h))}</Text>
          
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Liquidity</Text>
          <Text style={styles.value}>{formatCompactNumber(Number(stats.tokenStats.liquidity))}</Text>
          
        </View>

        

        <View style={styles.card}>
           <Text style={styles.label}>LaunchPad</Text>
          {/* <Text style={styles.value}>{formatCompactNumber(Number(stats.tokenStats.all_time_high))}</Text> */}
          <Text style={styles.value}>PumpFun</Text>

         
        </View>

        <View style={styles.card}>
           <Text style={styles.label}>Blockchain</Text>
          {/* <Text style={styles.value}>
            {stats.tokenStats.active_traders?.toLocaleString() ?? "--"}
          </Text> */}
          <Text style={styles.value}>Solana</Text>
         
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Total supply</Text>
          <Text style={styles.value}>
            {Number(stats.tokenStats.total_supply).toFixed(0).toLocaleString()}
          </Text>
          
        </View>

        <View style={styles.card}>
           <Text style={styles.label}>Created on</Text>
          <Text style={styles.value}>
            {new Date(stats.tokenStats.created_on).toLocaleDateString()}
          </Text>
         
        </View>
        <View style={styles.card}>
           <Text style={styles.label}>Contract Address</Text>
          {/* <Text style={styles.value}>
            {stats.tokenStats.active_traders?.toLocaleString() ?? "--"}
          </Text> */}
          <Text style={styles.value}>4w15GL2...</Text>
         
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginTop: 20,
    paddingHorizontal: 16,
  },

  heading: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },

  grid: {
    // backgroundColor: "#0f1117",
    // borderRadius: 12,
    // paddingHorizontal: 12,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  value: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },

  label: {
    color: "#9aa0a6",
    fontSize: 14,
    fontWeight: "400",
  },
});


export default TokenStats;
