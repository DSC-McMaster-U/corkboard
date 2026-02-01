import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StatusBar,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

import StartDateTimePicker from "@/components/upload/start-date-time-picker";
import PriceRangeSlider from "@/components/upload/price-range-slider";

type Errors = Partial<{
  title: string;
  desc: string;
  startDate: string;
  venueName: string;
  venueAddress: string;
  photo: string;
}>;

export default function UploadScreen() {
  // required fields
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  // optional fields
  const [ticketLink, setTicketLink] = useState("");
  const [artists, setArtists] = useState<string[]>([""]); // optional overall
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const canDeleteArtist = useMemo(() => artists.length > 1, [artists.length]);

  const updateArtist = (idx: number, val: string) => {
    setArtists((prev) => prev.map((a, i) => (i === idx ? val : a)));
  };

  const addArtist = () => setArtists((prev) => [...prev, ""]);

  const deleteArtist = (idx: number) => {
    setArtists((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== idx);
    });
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo access to upload an image.");
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      aspect: [1, 1],
    });

    if (!res.canceled) {
      setPhotoUri(res.assets[0]?.uri ?? null);
      setErrors((e) => ({ ...e, photo: undefined }));
    }
  };

  const validate = (): boolean => {
    const next: Errors = {};

    if (!title.trim()) next.title = "Title is required";
    if (!desc.trim()) next.desc = "Description is required";
    if (!startDate) next.startDate = "Start date & time is required";
    if (!venueName.trim()) next.venueName = "Venue name is required";
    if (!venueAddress.trim()) next.venueAddress = "Venue address is required";
    if (!photoUri) next.photo = "Photo is required";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async () => {
    if (!validate()) {
      Alert.alert("Missing info", "Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      // Optional fields rules:
      // - ticketLink can be empty
      // - artists are optional; you can send only non-empty ones
      const cleanedArtists = artists.map(a => a.trim()).filter(Boolean);

      const payload = {
        title: title.trim(),
        description: desc.trim(),
        start_time: startDate!.toISOString(),
        min_cost: priceRange[0],
        max_cost: priceRange[1],
        ticket_link: ticketLink.trim() || null,
        venue: {
          name: venueName.trim(),
          address: venueAddress.trim(),
        },
        artists: cleanedArtists, // optional
        // photo: you’ll likely upload separately as multipart/form-data
      };

      // TODO: replace this with your actual API call(s)
      // 1) upload image -> get image path/id
      // 2) create event with image reference
      console.log("Submitting event payload:", payload);

      Alert.alert("Success", "Event submitted!");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Failed to submit event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
      <StatusBar barStyle="light-content" backgroundColor="#411900" />

      {/* Header with Back button */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={28} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Submit an event</Text>

        <View style={styles.logoCircle}>
          <Text style={{ color: "white", fontWeight: "800" }}>CB</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Event Info</Text>

        <Text style={styles.fieldLabel}>Title *</Text>
        <TextInput
          value={title}
          onChangeText={(v) => {
            setTitle(v);
            if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
          }}
          style={[styles.input, errors.title && styles.inputError]}
        />
        {!!errors.title && <Text style={styles.errorText}>{errors.title}</Text>}

        <Text style={styles.fieldLabel}>Description *</Text>
        <TextInput
          value={desc}
          onChangeText={(v) => {
            setDesc(v);
            if (errors.desc) setErrors((e) => ({ ...e, desc: undefined }));
          }}
          style={[styles.input, { height: 90 }, errors.desc && styles.inputError]}
          multiline
        />
        {!!errors.desc && <Text style={styles.errorText}>{errors.desc}</Text>}

        <Text style={styles.fieldLabel}>Date & Time *</Text>
        <StartDateTimePicker
          startDate={startDate}
          setStartDate={(d) => {
            setStartDate(d);
            if (errors.startDate) setErrors((e) => ({ ...e, startDate: undefined }));
          }}
        />
        {!!errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}

        <PriceRangeSlider range={priceRange} setRange={setPriceRange} />

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Ticket Link</Text>
        <TextInput
          value={ticketLink}
          onChangeText={setTicketLink}
          style={styles.input}
          autoCapitalize="none"
        />

        <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Photo *</Text>
        <Pressable style={[styles.photoBox, errors.photo && styles.inputError]} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          ) : (
            <Feather name="image" size={26} color="#411900" />
          )}
        </Pressable>
        {!!errors.photo && <Text style={styles.errorText}>{errors.photo}</Text>}

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Venue Info</Text>

        <Text style={styles.fieldLabel}>Name *</Text>
        <TextInput
          value={venueName}
          onChangeText={(v) => {
            setVenueName(v);
            if (errors.venueName) setErrors((e) => ({ ...e, venueName: undefined }));
          }}
          style={[styles.input, errors.venueName && styles.inputError]}
        />
        {!!errors.venueName && <Text style={styles.errorText}>{errors.venueName}</Text>}

        <Text style={styles.fieldLabel}>Address *</Text>
        <TextInput
          value={venueAddress}
          onChangeText={(v) => {
            setVenueAddress(v);
            if (errors.venueAddress) setErrors((e) => ({ ...e, venueAddress: undefined }));
          }}
          style={[styles.input, errors.venueAddress && styles.inputError]}
        />
        {!!errors.venueAddress && <Text style={styles.errorText}>{errors.venueAddress}</Text>}

        <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Artist Info</Text>

        {artists.map((a, idx) => (
          <View key={idx} style={{ marginBottom: 12 }}>
            <View style={styles.artistRowHeader}>
              <Text style={styles.fieldLabel}>Artist {idx + 1}</Text>

              {canDeleteArtist && (
                <Pressable onPress={() => deleteArtist(idx)} hitSlop={10} style={styles.trashBtn}>
                  <Feather name="trash-2" size={16} color="#411900" />
                </Pressable>
              )}
            </View>

            <TextInput
              value={a}
              onChangeText={(v) => updateArtist(idx, v)}
              style={styles.input}
              placeholder="Optional"
              placeholderTextColor="#9a7b68"
            />
          </View>
        ))}

        <Pressable style={styles.addRow} onPress={addArtist}>
          <Feather name="plus-circle" size={20} color="#411900" />
          <Text style={styles.addText}>Add another artist</Text>
        </Pressable>

        <Pressable
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitText}>{submitting ? "Submitting..." : "Submit"}</Text>
        </Pressable>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "#9A6348",
    paddingHorizontal: 12,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "white", fontSize: 24, fontWeight: "800" },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#2E7BEA",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 16,
    backgroundColor: "#FFF7EF",
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#411900", marginBottom: 8 },
  fieldLabel: { fontSize: 13, color: "#666", marginTop: 10, marginBottom: 6 },

  input: {
    backgroundColor: "#F3CBAF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#411900",
  },
  inputError: {
    borderWidth: 1,
    borderColor: "#b91c1c",
  },
  errorText: {
    marginTop: 6,
    color: "#b91c1c",
    fontSize: 12,
  },

  photoBox: {
    width: "100%",
    height: 180,
    borderRadius: 14,
    backgroundColor: "#F3CBAF",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
  },

  artistRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trashBtn: {
    paddingHorizontal: 6,
    paddingVertical: 6,
  },

  addRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  addText: { color: "#411900", fontWeight: "700" },

  submitBtn: {
    marginTop: 20,
    alignSelf: "center",
    backgroundColor: "#E2912E",
    paddingHorizontal: 44,
    paddingVertical: 12,
    borderRadius: 18,
  },
  submitText: { color: "white", fontSize: 18, fontWeight: "800" },
});
