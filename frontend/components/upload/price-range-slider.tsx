import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Slider } from "@miblanchard/react-native-slider";

type Props = {
  range: [number, number];
  setRange: (r: [number, number]) => void;
};

export default function PriceRangeSlider({ range, setRange }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>Ticket price</Text>
        <Text style={styles.label}>${range[0]} – ${range[1]}</Text>
      </View>

      <Slider
        value={range}
        onValueChange={(value) => {
          const arr = Array.isArray(value) ? value : [value, value];
          setRange([arr[0] ?? 0, arr[1] ?? arr[0] ?? 0]);
        }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        minimumTrackTintColor="#E2912E"
        maximumTrackTintColor="#FFF0E2"
        thumbTintColor="#411900"
        thumbStyle={{ width: 14, height: 14, borderRadius: 7 }}
        thumbTouchSize={{ width: 40, height: 40 }}
        trackStyle={{ height: 3, borderRadius: 2 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: { fontSize: 13, color: "#666" },
});
