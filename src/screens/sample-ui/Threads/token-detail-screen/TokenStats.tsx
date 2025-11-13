import React from "react";
import { View, Text, StyleSheet } from "react-native";

const TokenStats: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Stats</Text>

      {/* Stats Grid */}
      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.value}>$8.06B</Text>
          <Text style={styles.label}>Market cap</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>$158.16M</Text>
          <Text style={styles.label}>24h vol</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.value}>$40.04M</Text>
          <Text style={styles.label}>Liquidity</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>90491</Text>
          <Text style={styles.label}>Holders</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.value}>$0.17</Text>
          <Text style={styles.label}>All time high</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>
            31637 <Text style={styles.red}>4.45%</Text>
          </Text>
          <Text style={styles.label}>Active Traders</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.value}>999.99B</Text>
          <Text style={styles.label}>Total supply</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.value}>July 10, 2025</Text>
          <Text style={styles.label}>Created on</Text>
        </View>
      </View>

      {/* Timeframe Buttons */}
      <View style={styles.timeRow}>
        <View style={[styles.timeButton, styles.activeButton]}>
          <Text style={styles.activeText}>30M</Text>
          <Text style={styles.activePercent}>2.43%</Text>
        </View>
        <View style={styles.timeButton}>
          <Text style={styles.inactiveText}>1H</Text>
          <Text style={styles.red}>1.36%</Text>
        </View>
        <View style={styles.timeButton}>
          <Text style={styles.inactiveText}>2H</Text>
          <Text style={styles.red}>0.56%</Text>
        </View>
        <View style={styles.timeButton}>
          <Text style={styles.inactiveText}>4H</Text>
          <Text style={styles.green}>1.56%</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 16 },
  heading: { color: "#fff", fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#2c2e37ff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  value: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  label: { color: "#aaa", fontSize: 12, marginTop: 4 },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  timeButton: {
    flex: 1,
    // backgroundColor: "#494a4bff",
    borderRadius: 16,
    paddingVertical: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: "#494a4bff",
    alignItems: "center",
  },
  activeButton: { backgroundColor: "#d53144ff" },
  activeText: { color: "#fff", fontWeight: "bold" },
  activePercent: { color: "#fff", fontSize: 12 },
  inactiveText: { color: "#fff" },
  red: { color: "#d53144ff" },
  green: { color: "#00cc66" },
});

export default TokenStats;
