import React, { useMemo, useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Feather } from "@expo/vector-icons";

type Props = {
  startDate: Date | null;
  setStartDate: (d: Date) => void;
};

type Which = "date" | "time";

export default function StartDateTimePicker({ startDate, setStartDate }: Props) {
  const [visible, setVisible] = useState(false);
  const [which, setWhich] = useState<Which>("date");

  const open = (w: Which) => {
    setWhich(w);
    setVisible(true);
  };
  const close = () => setVisible(false);

  const base = startDate ?? new Date();

  const fmtDate = useMemo(() => {
    if (!startDate) return "Select date";
    const y = startDate.getFullYear();
    const m = String(startDate.getMonth() + 1).padStart(2, "0");
    const d = String(startDate.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [startDate]);

  const fmtTime = useMemo(() => {
    if (!startDate) return "Select time";
    const hh = String(startDate.getHours()).padStart(2, "0");
    const mm = String(startDate.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }, [startDate]);

  const onConfirm = (picked: Date) => {
    const current = startDate ?? new Date();

    if (which === "date") {
      const merged = new Date(current);
      merged.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
      setStartDate(merged);
    } else {
      const merged = new Date(current);
      merged.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
      setStartDate(merged);
    }

    close();
  };

  return (
    <View style={styles.row}>
      <Pressable style={[styles.btn, styles.mr]} onPress={() => open("date")}>
        <View style={styles.inline}>
          <Feather name="calendar" size={16} color="#411900" />
          <Text style={styles.label}>Start date</Text>
        </View>
        <Text style={[styles.value, { color: "#411900" }]}>{fmtDate}</Text>
      </Pressable>

      <Pressable style={styles.btn} onPress={() => open("time")}>
        <View style={styles.inline}>
          <Feather name="clock" size={16} color="#411900" />
          <Text style={styles.label}>Start time</Text>
        </View>
        <Text style={[styles.value, { color: "#411900" }]}>{fmtTime}</Text>
      </Pressable>

      <DateTimePickerModal
        isVisible={visible}
        mode={which}
        onConfirm={onConfirm}
        onCancel={close}
        date={base}
        display={Platform.select({ ios: "inline", android: which === "time" ? "spinner" : "calendar" })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  mr: { marginRight: 10 },
  btn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: "#FFF0E2",
  },
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 14, color: "#666" },
  value: { marginTop: 4, fontSize: 14 },
});
