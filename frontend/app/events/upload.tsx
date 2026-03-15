import React, { useEffect, useMemo, useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { AppHeader } from "@/components/header";
import { apiFetch } from "@/api/api";

import StartDateTimePicker from "@/components/upload/start-date-time-picker";
import PriceRangeSlider from "@/components/upload/price-range-slider";

type Errors = Partial<{
  photo: string;
  artistPhoto: string;
  form: string;
}>;

type Mode = "existing" | "new";

type ExistingVenue = {
  id: string;
  name: string;
  address?: string;
};

type ExistingArtist = {
  id: string;
  name: string;
  bio?: string;
  image?: string;
};

type VenuesResponse = {
  venue?: ExistingVenue;
  venues?: ExistingVenue[];
  error?: string;
};

function ModeToggle({
  value,
  onChange,
  leftLabel,
  rightLabel,
}: {
  value: Mode;
  onChange: (value: Mode) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <View style={styles.modeToggle}>
      <Pressable
        onPress={() => onChange("existing")}
        style={[
          styles.modeOption,
          value === "existing" && styles.modeOptionActive,
        ]}
      >
        <Text
          style={[
            styles.modeOptionText,
            value === "existing" && styles.modeOptionTextActive,
          ]}
        >
          {leftLabel}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("new")}
        style={[styles.modeOption, value === "new" && styles.modeOptionActive]}
      >
        <Text
          style={[
            styles.modeOptionText,
            value === "new" && styles.modeOptionTextActive,
          ]}
        >
          {rightLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function SelectField<T extends { id: string; name: string }>({
  label,
  placeholder,
  items,
  selectedId,
  onSelect,
  emptyText,
  getSubtitle,
  disabled = false,
  loading = false,
}: {
  label: string;
  placeholder: string;
  items: T[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyText: string;
  getSubtitle?: (item: T) => string | undefined;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((item) => item.id === selectedId);

  return (
    <View style={styles.fieldBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <Pressable
        style={[styles.selectTrigger, disabled && styles.selectTriggerDisabled]}
        onPress={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
      >
        <Text
          style={[
            styles.selectTriggerText,
            !selectedItem && styles.placeholderText,
            disabled && styles.disabledText,
          ]}
        >
          {selectedItem ? selectedItem.name : placeholder}
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color="#411900" />
        ) : (
          <Feather
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color="#411900"
          />
        )}
      </Pressable>

      {open && !disabled && (
        <View style={styles.selectMenu}>
          {items.length === 0 ? (
            <Text style={styles.emptyMenuText}>{emptyText}</Text>
          ) : (
            items.map((item) => {
              const isSelected = item.id === selectedId;
              const subtitle = getSubtitle?.(item);

              return (
                <Pressable
                  key={item.id}
                  style={[
                    styles.selectItem,
                    isSelected && styles.selectItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setOpen(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.selectItemTitle}>{item.name}</Text>
                    {!!subtitle && (
                      <Text style={styles.selectItemSubtitle} numberOfLines={2}>
                        {subtitle}
                      </Text>
                    )}
                  </View>

                  {isSelected && (
                    <Feather name="check" size={16} color="#411900" />
                  )}
                </Pressable>
              );
            })
          )}
        </View>
      )}
    </View>
  );
}

export default function UploadScreen() {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const [ticketLink, setTicketLink] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [venueMode, setVenueMode] = useState<Mode>("existing");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");

  const [artistMode, setArtistMode] = useState<Mode>("new");
  const [selectedArtistId, setSelectedArtistId] = useState("");
  const [artistName, setArtistName] = useState("");
  const [artistBio, setArtistBio] = useState("");
  const [artistImageUri, setArtistImageUri] = useState<string | null>(null);

  const [existingVenues, setExistingVenues] = useState<ExistingVenue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);

  const [existingArtists] = useState<ExistingArtist[]>([]);
  const [artistsLoading] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [touched, setTouched] = useState({
    title: false,
    desc: false,
    startDate: false,
    venueName: false,
    venueAddress: false,
    selectedVenueId: false,
    selectedArtistId: false,
    artistName: false,
    photo: false,
    artistPhoto: false,
  });

  useEffect(() => {
    const loadVenues = async () => {
      try {
        setVenuesLoading(true);
    
        const data = await apiFetch<VenuesResponse>("api/venues", {
          method: "GET",
        });
    
        if (data?.error) {
          throw new Error(data.error);
        }
    
        const venues = (data?.venues ?? []).filter(
          (v) => !v.name.startsWith("GENERATED-VENUE")
        );
    
        setExistingVenues(venues);
      } catch (e) {
        console.error("Failed to load venues:", e);
        setExistingVenues([]);
      } finally {
        setVenuesLoading(false);
      }
    };

    loadVenues();
  }, []);

  const selectedVenue = useMemo(
    () => existingVenues.find((v) => v.id === selectedVenueId),
    [existingVenues, selectedVenueId]
  );

  const selectedArtist = useMemo(
    () => existingArtists.find((a) => a.id === selectedArtistId),
    [existingArtists, selectedArtistId]
  );

  const artistHasAnyNewValue = useMemo(
    () =>
      [artistName, artistBio, artistImageUri].some(
        (value) => !!value && value.trim().length > 0
      ),
    [artistName, artistBio, artistImageUri]
  );

  const titleMsg = !title.trim() ? "Enter a short, clear event title." : null;
  const descMsg = !desc.trim()
    ? "Add a short description (what to expect, who’s playing, etc.)."
    : null;
  const startDateMsg = !startDate ? "Pick a start date and time." : null;

  const venueExistingMsg =
    venueMode === "existing" && touched.selectedVenueId && !selectedVenueId
      ? "Select an existing venue."
      : null;

  const venueNameMsg =
    venueMode === "new" && !venueName.trim()
      ? "Enter the venue name (e.g., Mills Hardware)."
      : null;

  const venueAddressMsg =
    venueMode === "new" && !venueAddress.trim()
      ? "Enter the venue address so people can find it."
      : null;

  const artistExistingMsg =
    artistMode === "existing" && touched.selectedArtistId && !selectedArtistId
      ? "Select an existing artist, or switch to Add New."
      : null;

  const artistNewMsg =
  artistMode === "new" && !artistName.trim()
    ? "Enter an artist name when adding a new artist."
    : null;

  const isVenueValid =
    venueMode === "existing"
      ? selectedVenueId.trim().length > 0
      : venueName.trim().length > 0 && venueAddress.trim().length > 0;

  const isArtistValid =
  artistMode === "existing"
    ? true
    : artistName.trim().length > 0;

  const canSubmit =
    title.trim().length > 0 &&
    desc.trim().length > 0 &&
    !!startDate &&
    isVenueValid &&
    isArtistValid;

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

  const pickArtistPhoto = async () => {
    setTouched((t) => ({ ...t, artistPhoto: true }));

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setErrors((e) => ({
        ...e,
        artistPhoto: "Please allow photo access to upload an artist image.",
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
      setArtistImageUri(res.assets[0]?.uri ?? null);
      setErrors((e) => ({ ...e, artistPhoto: undefined, form: undefined }));
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
      const userId = "db024f4d-89bf-46bc-95f1-221706ed99f0";

      const payload: Record<string, any> = {
        title: title.trim(),
        description: desc.trim(),
        start_time: startDate!.toISOString(),
        cost: priceRange[0],
        user_id: userId,
        source_url: ticketLink.trim() || undefined,
        image: photoUri || undefined,
      };

      if (venueMode === "existing") {
        payload.venue_id = selectedVenueId;
      } else {
        payload.venue_name = venueName.trim();
        payload.venue_address = venueAddress.trim();
      }

      if (artistMode === "existing") {
        if (selectedArtistId.trim()) {
          payload.artist_id = selectedArtistId.trim();
        }
      } else if (artistHasAnyNewValue) {
        payload.artist_name = artistName.trim() || undefined;
        payload.artist_bio = artistBio.trim() || undefined;
        payload.artist_image = artistImageUri || undefined;
      }

      const data = await apiFetch<{
        id?: string;
        success?: boolean;
        error?: string;
      }>("api/drafts/upload", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!data || data.success === false || data.error) {
        throw new Error(data?.error || "Failed to submit draft.");
      }

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
          <View style={styles.card}>
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
              <Text style={styles.fieldLabel}>Event Photo (optional)</Text>
              <Pressable style={styles.photoBox} onPress={pickPhoto}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <Feather name="image" size={50} color="#7a4c2a" />
                    <Text style={styles.photoHint}>Tap to add event photo</Text>
                  </View>
                )}
              </Pressable>

              {!!errors.photo && (
                <Text style={[styles.errorText, { marginTop: 8 }]}>
                  {errors.photo}
                </Text>
              )}
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Venue Info</Text>
            </View>

            <ModeToggle
              value={venueMode}
              onChange={(mode) => {
                setVenueMode(mode);
                setErrors((e) => ({ ...e, form: undefined }));

                if (mode === "existing") {
                  setVenueName("");
                  setVenueAddress("");
                } else {
                  setSelectedVenueId("");
                }
              }}
              leftLabel="Select Existing"
              rightLabel="Add New"
            />

            {venueMode === "existing" ? (
              <>
                <SelectField
                  label="Venue"
                  placeholder={
                    venuesLoading ? "Loading venues..." : "Choose a venue"
                  }
                  items={existingVenues}
                  selectedId={selectedVenueId}
                  onSelect={(id) => {
                    setSelectedVenueId(id);
                    setTouched((t) => ({ ...t, selectedVenueId: true }));
                  }}
                  emptyText={
                    venuesLoading
                      ? "Loading venues..."
                      : "No existing venues available."
                  }
                  getSubtitle={(item) => item.address}
                  loading={venuesLoading}
                />

                {touched.selectedVenueId && venueExistingMsg && (
                  <Text style={styles.helperText}>{venueExistingMsg}</Text>
                )}

                {!!selectedVenue?.address && (
                  <Text style={styles.previewText}>
                    Address: {selectedVenue.address}
                  </Text>
                )}
              </>
            ) : (
              <>
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
              </>
            )}

            <View style={styles.sectionHeader}>
              <Text style={styles.cardTitle}>Artist Info</Text>
            </View>

            <ModeToggle
              value={artistMode}
              onChange={(mode) => {
                setArtistMode(mode);
                setErrors((e) => ({ ...e, form: undefined }));

                if (mode === "existing") {
                  setArtistName("");
                  setArtistBio("");
                  setArtistImageUri(null);
                } else {
                  setSelectedArtistId("");
                }
              }}
              leftLabel="Select Existing"
              rightLabel="Add New"
            />

            {artistMode === "existing" ? (
              <>
                <SelectField
                  label="Artist"
                  placeholder="Choose an artist"
                  items={existingArtists}
                  selectedId={selectedArtistId}
                  onSelect={(id) => {
                    setSelectedArtistId(id);
                    setTouched((t) => ({ ...t, selectedArtistId: true }));
                  }}
                  emptyText="No existing artists available."
                  getSubtitle={(item) => item.bio}
                  loading={artistsLoading}
                />

                {artistExistingMsg && (
                  <Text style={styles.helperText}>{artistExistingMsg}</Text>
                )}

                {!!selectedArtist?.bio && (
                  <Text style={styles.previewText} numberOfLines={3}>
                    Bio: {selectedArtist.bio}
                  </Text>
                )}
              </>
            ) : (
              <>
                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Artist Name</Text>
                  <TextInput
                    value={artistName}
                    onChangeText={(v) => {
                      setArtistName(v);
                      setTouched((t) => ({ ...t, artistName: true }));
                    }}
                    style={styles.input}
                    placeholder="Enter artist name"
                    placeholderTextColor="#9a7b68"
                  />
                  {touched.artistName && artistNewMsg && (
                    <Text style={styles.helperText}>{artistNewMsg}</Text>
                  )}
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Artist Bio</Text>
                  <TextInput
                    value={artistBio}
                    onChangeText={setArtistBio}
                    style={[styles.input, styles.textarea]}
                    multiline
                    placeholder="Optional"
                    placeholderTextColor="#9a7b68"
                  />
                </View>

                <View style={styles.fieldBlock}>
                  <Text style={styles.fieldLabel}>Artist Photo (optional)</Text>
                  <Pressable style={styles.photoBox} onPress={pickArtistPhoto}>
                    {artistImageUri ? (
                      <Image
                        source={{ uri: artistImageUri }}
                        style={styles.photoPreview}
                      />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Feather name="image" size={50} color="#7a4c2a" />
                        <Text style={styles.photoHint}>Tap to add artist photo</Text>
                      </View>
                    )}
                  </Pressable>

                  {!!errors.artistPhoto && (
                    <Text style={[styles.errorText, { marginTop: 8 }]}>
                      {errors.artistPhoto}
                    </Text>
                  )}
                </View>
              </>
            )}

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

  previewText: {
    color: "#6a3f1d",
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
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

  modeToggle: {
    flexDirection: "row",
    backgroundColor: "rgba(65, 25, 0, 0.08)",
    borderRadius: 14,
    padding: 4,
    marginTop: 4,
  },

  modeOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },

  modeOptionActive: {
    backgroundColor: "#E2912E",
  },

  modeOptionText: {
    color: "#411900",
    fontSize: 13,
    fontWeight: "600",
  },

  modeOptionTextActive: {
    color: "#ffffff",
  },

  selectTrigger: {
    backgroundColor: "#F3CBAF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  selectTriggerDisabled: {
    opacity: 0.7,
  },

  selectTriggerText: {
    color: "#411900",
    fontSize: 15,
    flex: 1,
  },

  placeholderText: {
    color: "#9a7b68",
  },

  disabledText: {
    opacity: 0.7,
  },

  selectMenu: {
    marginTop: 8,
    backgroundColor: "#fff6ee",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(65, 25, 0, 0.08)",
    overflow: "hidden",
  },

  selectItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(65, 25, 0, 0.06)",
  },

  selectItemSelected: {
    backgroundColor: "rgba(226, 145, 46, 0.12)",
  },

  selectItemTitle: {
    color: "#411900",
    fontSize: 14,
    fontWeight: "600",
  },

  selectItemSubtitle: {
    color: "#6a3f1d",
    fontSize: 12,
    marginTop: 4,
    opacity: 0.85,
  },

  emptyMenuText: {
    color: "#6a3f1d",
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 12,
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