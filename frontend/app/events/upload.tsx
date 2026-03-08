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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AppHeader } from "@/components/header";

import StartDateTimePicker from "@/components/upload/start-date-time-picker";
import PriceRangeSlider from "@/components/upload/price-range-slider";

type Errors = Partial<{
  photo: string;
  form: string;
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
  const [artists, setArtists] = useState<string[]>([""]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [touched, setTouched] = useState({
    title: false,
    desc: false,
    startDate: false,
    venueName: false,
    venueAddress: false,
    photo: false,
  });

  const canDeleteArtist = useMemo(() => artists.length > 1, [artists.length]);

  const titleMsg = !title.trim() ? "Enter a short, clear event title." : null;
  const descMsg = !desc.trim()
    ? "Add a short description (what to expect, who’s playing, etc.)."
    : null;
  const startDateMsg = !startDate ? "Pick a start date and time." : null;
  const venueNameMsg = !venueName.trim()
    ? "Enter the venue name (e.g., Mills Hardware)."
    : null;
  const venueAddressMsg = !venueAddress.trim()
    ? "Enter the venue address so people can find it."
    : null;
  const photoMsg = !photoUri ? "Add a photo/poster to help it stand out." : null;

  const canSubmit =
    title.trim().length > 0 &&
    desc.trim().length > 0 &&
    !!startDate &&
    venueName.trim().length > 0 &&
    venueAddress.trim().length > 0 &&
    !!photoUri;

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
    setTouched((t) => ({ ...t, photo: true }));

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErrors((e) => ({
        ...e,
        photo: "Please allow photo access to upload an image.",
      }));
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
      setErrors((e) => ({ ...e, photo: undefined, form: undefined }));
    }
  };

  const onSubmit = async () => {
    if (!canSubmit || submitting) {
      setErrors((e) => ({
        ...e,
        form: "Please complete the required fields above.",
      }));
      return;
    }

    setErrors((e) => ({ ...e, form: undefined }));
    setSubmitting(true);

    try {
      const cleanedArtists = artists.map((a) => a.trim()).filter(Boolean);

      const payload = {
        title: title.trim(),
        description: desc.trim(),
        start_time: startDate!.toISOString(),
        min_cost: priceRange[0],
        max_cost: priceRange[1],
        ticket_link: ticketLink.trim() || null,
        venue: { name: venueName.trim(), address: venueAddress.trim() },
        artists: cleanedArtists,
      };

      console.log("Submitting event payload:", payload);

      router.back();
    } catch (e: any) {
      setErrors((prev) => ({
        ...prev,
        form: e?.message ?? "Failed to submit event. Please try again.",
      }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["left", "right", "bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => <AppHeader title="Submit an Event" showBack />,
        }}
      />

      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card */}
          <View style={styles.card}>
            {/* Event Info */}
            <Text style={styles.cardTitle}>Event Info</Text>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Title</Text>
              <TextInput
                value={title}
                onChangeText={(v) => {
                  setTitle(v);
                  setTouched((t) => ({ ...t, title: true }));
                }}
                style={styles.input}
                placeholder="e.g., Music of the Night"
                placeholderTextColor="#9a7b68"
              />
              {touched.title && titleMsg && (
                <Text style={styles.helperText}>{titleMsg}</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                value={desc}
                onChangeText={(v) => {
                  setDesc(v);
                  setTouched((t) => ({ ...t, desc: true }));
                }}
                style={[styles.input, styles.textarea]}
                multiline
                placeholder="What is this event about?"
                placeholderTextColor="#9a7b68"
              />
              {touched.desc && descMsg && (
                <Text style={styles.helperText}>{descMsg}</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Date & Time</Text>
              <StartDateTimePicker
                startDate={startDate}
                setStartDate={(d) => {
                  setStartDate(d);
                  setTouched((t) => ({ ...t, startDate: true }));
                }}
              />
              {touched.startDate && startDateMsg && (
                <Text style={styles.helperText}>{startDateMsg}</Text>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldBlock}>
              <PriceRangeSlider range={priceRange} setRange={setPriceRange} />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Ticket Link</Text>
              <TextInput
                value={ticketLink}
                onChangeText={setTicketLink}
                style={styles.input}
                autoCapitalize="none"
                placeholder="Optional"
                placeholderTextColor="#9a7b68"
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Photo</Text>
              <Pressable style={styles.photoBox} onPress={pickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Feather name="image" size={50} color="#7a4c2a" />
                    <Text style={styles.photoHint}>Tap to add photo</Text>
                  </View>
                )}
              </Pressable>

              {touched.photo && photoMsg && (
                <Text style={styles.helperText}>{photoMsg}</Text>
              )}
              {!!errors.photo && (
                <Text style={[styles.errorText, { marginTop: 8 }]}>
                  {errors.photo}
                </Text>
              )}
            </View>

            {/* Venue Info */}
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Venue Info</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                value={venueName}
                onChangeText={(v) => {
                  setVenueName(v);
                  setTouched((t) => ({ ...t, venueName: true }));
                }}
                style={styles.input}
                placeholder="e.g., Mills Hardware"
                placeholderTextColor="#9a7b68"
              />
              {touched.venueName && venueNameMsg && (
                <Text style={styles.helperText}>{venueNameMsg}</Text>
              )}
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                value={venueAddress}
                onChangeText={(v) => {
                  setVenueAddress(v);
                  setTouched((t) => ({ ...t, venueAddress: true }));
                }}
                style={styles.input}
                placeholder="Street, City"
                placeholderTextColor="#9a7b68"
              />
              {touched.venueAddress && venueAddressMsg && (
                <Text style={styles.helperText}>{venueAddressMsg}</Text>
              )}
            </View>

            {/* Artists */}
            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Artist Info</Text>
              <Pressable style={styles.addPill} onPress={addArtist}>
                <Feather name="plus" size={14} color="#411900" />
                <Text style={styles.addPillText}>Add</Text>
              </Pressable>
            </View>

            {artists.map((a, idx) => (
              <View key={idx} style={styles.artistRow}>
                <TextInput
                  value={a}
                  onChangeText={(v) => updateArtist(idx, v)}
                  style={[styles.input, { flex: 1 }]}
                  placeholder={`Artist ${idx + 1} (optional)`}
                  placeholderTextColor="#9a7b68"
                />
                {canDeleteArtist && (
                  <Pressable
                    onPress={() => deleteArtist(idx)}
                    hitSlop={10}
                    style={styles.iconBtn}
                  >
                    <Feather name="trash-2" size={16} color="#411900" />
                  </Pressable>
                )}
              </View>
            ))}

            {!!errors.form && (
              <Text style={[styles.errorText, { marginTop: 12 }]}>
                {errors.form}
              </Text>
            )}

            <Pressable
              style={[
                styles.submitBtn,
                (!canSubmit || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={onSubmit}
              disabled={!canSubmit || submitting}
            >
              <Text style={styles.submitText}>
                {submitting ? "Submitting..." : "Submit"}
              </Text>
            </Pressable>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: 16,
    backgroundColor: "#FFF7EF",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },

  sectionHeader: {
    marginTop: 18,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#411900",
  },

  fieldBlock: {
    marginTop: 12,
  },

  fieldLabel: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 8,
  },

  helperText: {
    color: "#6a3f1d",
    marginTop: 6,
    marginLeft: 2,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.95,
  },

  input: {
    backgroundColor: "#F3CBAF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#411900",
    fontSize: 15,
  },

  textarea: {
    height: 110,
    textAlignVertical: "top",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(65, 25, 0, 0.08)",
    marginTop: 16,
  },

  photoBox: {
    height: 170,
    borderRadius: 14,
    backgroundColor: "#F3CBAF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },

  photoPreview: {
    width: "100%",
    height: "100%",
  },

  photoPlaceholder: {
    alignItems: "center",
    gap: 8,
  },

  photoHint: {
    color: "#411900",
    fontWeight: "600",
    opacity: 0.75,
  },

  errorText: {
    color: "#b91c1c",
    fontSize: 12,
  },

  addPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(65, 25, 0, 0.08)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  addPillText: {
    color: "#411900",
    fontWeight: "500",
    fontSize: 12,
  },

  artistRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconBtn: {
    width: 40,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: "rgba(65, 25, 0, 0.08)",
  },

  submitBtn: {
    marginTop: 20,
    alignItems: "center",
    backgroundColor: "#E2912E",
    paddingVertical: 14,
    borderRadius: 16,
  },

  submitBtnDisabled: {
    opacity: 0.6,
  },

  submitText: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
});