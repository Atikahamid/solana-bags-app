// ==== File: src/screens/SearchBoxButton.tsx ====

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import COLORS from "@/assets/colors";

interface SearchBoxButtonProps {
  placeholder?: string;
  onPress: () => void;
}

export default function SearchBoxButton({
  placeholder = "Search coins & people",
  onPress,
}: SearchBoxButtonProps) {
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
      <View style={styles.container}>
        {/* Left icon */}
        <Ionicons
          name="search"
          size={18}
          color={COLORS.greyMid}
          style={{ marginRight: 8 }}
        />

        {/* Fake input text */}
        <Text style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Text>

        {/* Paste-looking button (visual only) */}
        <View style={styles.pasteButton}>
          <Text style={styles.pasteText}>Paste</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#27375eff",
    borderRadius: 24,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
  },
  placeholder: {
    flex: 1,
    color: "#7A8495",
    fontSize: 14,
  },
  pasteButton: {
    backgroundColor: "#182954ff",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  pasteText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
});
