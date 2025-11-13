// ==== File: src/screens/SearchBox.tsx ====
import React from "react";
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // expo icons
import * as Clipboard from "expo-clipboard"; // for paste button
import COLORS from "@/assets/colors";

interface SearchBoxProps {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  placeholder?: string;
}

export default function SearchBox({
  searchQuery,
  setSearchQuery,
  placeholder = "Search coins & people",
}: SearchBoxProps) {
  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setSearchQuery(text);
  };

  return (
    <View style={styles.container}>
      {/* Left icon */}
      <Ionicons name="search" size={18} color={COLORS.greyMid} style={{ marginRight: 8 }} />

      {/* Input */}
      <TextInput
        style={styles.input}
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder={placeholder}
        placeholderTextColor={COLORS.greyMid}
      />

      {/* Paste button */}
      <TouchableOpacity style={styles.pasteButton} onPress={handlePaste}>
        <Text style={styles.pasteText}>Paste</Text>
      </TouchableOpacity>
    </View>
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
  input: {
    flex: 1,
    color: "#FFFFFF",
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
