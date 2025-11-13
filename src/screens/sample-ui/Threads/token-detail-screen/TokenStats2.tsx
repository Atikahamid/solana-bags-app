import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

const TokenStats2: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Volume & Trades */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>VOLUME</Text>
          <Text style={styles.value}>$186.29K</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>TRADES</Text>
          <Text style={styles.value}>813</Text>
        </View>
      </View>

      {/* Buy Vol / Sell Vol */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>BUY VOL</Text>
          <Text style={styles.value}>$69.67K</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: "#00cc66", width: "40%" }]} />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>SELL VOL</Text>
          <Text style={styles.value}>$116.62K</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: "#ff007f", width: "70%" }]} />
          </View>
        </View>
      </View>

      {/* Buys / Sells */}
      <View style={styles.row}>
        <View style={styles.card}>
          <Text style={styles.label}>BUYS</Text>
          <Text style={styles.value}>422</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: "#00cc66", width: "45%" }]} />
          </View>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>SELLS</Text>
          <Text style={styles.value}>391</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { backgroundColor: "#ff007f", width: "40%" }]} />
          </View>
        </View>
      </View>

      {/* About Section */}
      <Text style={styles.aboutHeading}>About</Text>
      <Text style={styles.tokenDescription}>Lorem ipsum dolor sit amet consectetur adipisicing elit. Explicabo, rerum.</Text>
      <View style={styles.raisedBox}>
        <Text style={styles.raisedValue}>$0.00</Text>
        <Text style={styles.raisedLabel}>total raised</Text>
      </View>

      {/* Website Button */}
      <TouchableOpacity style={styles.websiteButton}>
        <Text style={styles.websiteText}>🌐 Website</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 20, paddingHorizontal: 16 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  card: {
    flex: 1,
    backgroundColor: "#2c2e37ff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  tokenDescription:{
    color: "#aaa",
    fontSize: 14,
    marginBottom: 10
  },
  label: { color: "#aaa", fontSize: 12, marginBottom: 4 },
  value: { color: "#fff", fontSize: 16, fontWeight: "bold", marginBottom: 6 },
  progressBar: {
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: 4, borderRadius: 2 },
  aboutHeading: { color: "#fff", fontSize: 16, fontWeight: "bold", marginTop: 20, marginBottom: 10 },
  raisedBox: {
    backgroundColor: "#494d55ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  raisedValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  raisedLabel: { color: "#aaa", fontSize: 12, marginTop: 4 },
  websiteButton: {
    backgroundColor: "#3e3f41ff",
    borderRadius: 20,
    paddingVertical: 8,
    alignItems: "center",
    width: 100,
    marginLeft: 10
  },
  websiteText: { color: "#fff", fontSize: 14, fontWeight: "bold" },
});

export default TokenStats2;
