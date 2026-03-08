import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Keyboard, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
type Filter = "none" | "genre" | "artist" | "venue";

export default function SearchBarFilter({
  onSearch,
  onActiveChange,
  registerDismiss,
}: {
  onSearch?: (payload: { query: string; filter: Filter }) => void;
  onActiveChange?: (active: boolean) => void;      
  registerDismiss?: (fn: () => void) => void;      
}) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [f, setF] = useState<Filter>("none");

  const active = open || focused;
  const dismiss = () => {
    setOpen(false);
    Keyboard.dismiss();
  };

  // Notify parent when active state changes
  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Give parent a dismiss function it can call
  useEffect(() => {
    registerDismiss?.(dismiss);
  }, [registerDismiss]);

  return (
    <View style={styles.wrap}>
      <View className="flex-row items-center rounded-xl bg-[#FFF0E2] py-0 px-3">
        <Pressable
          onPress={() => setOpen(o => !o)}
          className="flex-row items-center rounded-md bg-[#F5E5D2] px-2 py-1 mr-2 border border-[#E3C9AF]"
          hitSlop={8}
        >
          <Text className="text-sm mr-1" style={{ color: '#411900' }}>{f === "none" ? "All" : f[0].toUpperCase() + f.slice(1)}</Text>
          <Feather name={open ? "chevron-up" : "chevron-down"} style={{ color: '#411900' }} size={16} />
        </Pressable>

        <BottomSheetTextInput
          className="flex-1 text-base"
          placeholder="Search..."
          value={q}
          onChangeText={setQ}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          onSubmitEditing={() => { dismiss(); onSearch?.({ query: q, filter: f }); }}
          placeholderTextColor="#666"
        />

        <Pressable onPress={() => { dismiss(); onSearch?.({ query: q, filter: f }); }} hitSlop={12}>
          <Feather name="search" style={{ color: '#411900' }} size={18} />
        </Pressable>
      </View>

      {open && (
        <View style={styles.menu}>
          {(["none", "genre", "artist", "venue"] as Filter[]).map((opt) => (
            <Pressable key={opt} onPress={() => { setF(opt); setOpen(false); }} className="px-3 py-2 flex-row items-center justify-between">
              <Text className="text-base" style={{ color: '#411900' }}>{opt === "none" ? "All" : opt[0].toUpperCase() + opt.slice(1)}</Text>
              {opt === f && <Feather name="check" style={{ color: '#411900' }} size={14} />}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "relative", overflow: "visible" },
  menu: {
    position: "absolute",
    left: 12,
    top: 48,
    backgroundColor: "#F5E5D2",
    borderWidth: 1,
    borderColor: "#E3C9AF",  
    borderRadius: 10,
    zIndex: 10,
    elevation: 6,
  },
});
