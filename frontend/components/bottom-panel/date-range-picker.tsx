import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Feather } from "@expo/vector-icons";

type Which = "start" | "end";

type DateRangePickerProps = {
  dateRange: [Date, Date];
  setDateRange: (r: [Date, Date]) => void;
}

export default function DateRangePicker({
  dateRange, setDateRange
}: DateRangePickerProps) {
  const [which, setWhich] = useState<Which>("start");
  const [visible, setVisible] = useState(false);

  const fmt = (d: Date | null) =>
  d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
        d.getDate()
      ).padStart(2, "0")}`
    : "";

  const open = (w: Which) => {
    setWhich(w);
    setVisible(true);
  };

  const close = () => setVisible(false);

  const handleConfirm = (date: Date) => {
    if (which === "start") {
      setDateRange([date, dateRange[1]])
    } else {
      setDateRange([dateRange[0], date])
    }
    close();
  };

  return (
    <View>
      <View style={styles.row}>
        <Pressable style={[styles.btn, styles.mr]} onPress={() => open("start")}>
          <View style={styles.inline}>
            <Feather name="calendar" style={{ color: '#411900' }} size={16} />
            <Text style={styles.label} className="font-semibold">Start date:</Text>
          </View>
          <Text style={[styles.value, { color: "#411900" }]}>{fmt(dateRange[0])}</Text>
        </Pressable>

        <Pressable style={styles.btn} onPress={() => open("end")}>
          <View style={styles.inline}>
            <Feather name="calendar" style={{ color: '#411900' }} size={16} />
            <Text style={styles.label} className="font-semibold">End date:</Text>
          </View>
          <Text style={[styles.value, { color: "#411900" }]}>{fmt(dateRange[1])}</Text>
        </Pressable>
      </View>

      <DateTimePickerModal
        isVisible={visible}
        mode="date"
        onConfirm={handleConfirm}
        onCancel={close}
        date={(which === "start" ? dateRange[0] : dateRange[1]) ?? new Date()}
        display={Platform.select({ ios: "inline", android: "calendar" })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FFF0E2",
  },
  mr: { marginRight: 10 }, 
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 14, color: "#666" },
  value: { marginTop: 4, fontSize: 14 },
});
