import { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { AppHeader } from '@/components/header';
import { UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from "expo-image-picker";

type TagProps<T> = {
  placeholder: string;
  endpoint: string;
  maxDropdownHeight?: number;
  tags: T[]; // pass in current tags
  getTagName: (tag: T) => string; // how to display tag
  onAddTag?: (tag: T) => void; // adding tags update
  onRemoveTag?: (tag: T) => void;  // removing tags update
};

// function to create artist, venue, and genre tages
function TagInput<T>({ placeholder, endpoint, maxDropdownHeight = 100, tags, getTagName, onAddTag, onRemoveTag }: TagProps<T>) {
  //const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  // prevent duplicates
  const normalizedTags = useMemo(() => new Set(tags.map(t => getTagName(t).toLowerCase())), [tags]);
  
  // Fetch all options from backend
    useEffect(() => {
    let cancelled = false;
     async function load() {
    try {
      setLoading(true);

      const data = await apiFetch(endpoint) as any; 

      // Determine which array exists
      const arr: T[] = Array.isArray(data)
        ? data
        : (data.genres ?? data.venues ?? data.artists ?? []) as T[];

      if (!cancelled) setOptions(arr);
    } catch (err) {
      if (!cancelled) setOptions([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  load();
  return () => {
    cancelled = true;
  };
}, [endpoint]);

  // Filter options
  const filtered = useMemo(() => {
    const q = text.trim().toLowerCase();
    return options
      .filter(o => getTagName(o).toLowerCase().includes(q))
      .filter(o => !normalizedTags.has(getTagName(o).toLowerCase()));
  }, [text, options, normalizedTags]);

  const addTag = (tag: T) => {
    //if (normalizedTags.has(getTagName(tag).toLowerCase())) return;
    if (onAddTag) onAddTag(tag);
    setText("");
    setOpen(false);
  };

  const removeTag = (tag: T) => {
    if (onRemoveTag) onRemoveTag(tag);
  };

  return (
    <View className="bg-[#F6D5B8] rounded-xl px-2 py-2">
      <View className="flex-row flex-wrap items-center">
        {tags.map(tag => (
          <TouchableOpacity
            key={(tag as any).id}
            onPress={() => removeTag(tag)}
            className="bg-[#5A1E14] px-3 py-1 rounded-full mr-2 mb-2"
          >
            <Text className="text-white text-xs">{getTagName(tag)} ✕</Text>
          </TouchableOpacity>
        ))}

        <TextInput
          value={text}
           onChangeText={(v) => {
            setText(v);
            setOpen(true);
          }}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          //onBlur={() => {
           // //delay so tapping an option still works before it closes
          //  setTimeout(() => setOpen(false), 150);
          //}}
          onSubmitEditing={() => setOpen(false)} // no custom tags
          className="text-gray-800 px-2 py-1 min-w-[80px]"
          returnKeyType="done"
        />
      </View>
      {/* Scrollable Dropdown for tags*/}
      {open && filtered.length > 0 && (
    <View
      className="mt-2 bg-white rounded-xl overflow-hidden"
      style={{ maxHeight: maxDropdownHeight, zIndex: 999, elevation: 20 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        {filtered.map((item) => (
          <TouchableOpacity
            key={(item as any).id}
            onPress={() => addTag(item)}
            className="px-3 py-3 border-b border-gray-200"
          >
            <Text className="text-sm text-gray-800">{getTagName(item)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )}
    </View>
  );
}

type UserDataResponse = {
  success: boolean;
  user: UserData;
}

export default function AccountPage() {
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAccountData = async () => {
      try {
        setLoading(true);
        const res = await apiFetchAuth<UserDataResponse>('api/users/', {
          method: 'GET',
        });
        setUserData(res.user);
        console.log("Fetched user data: ", res.user);
      } catch (e) {
        console.error("Failed to fetch user data:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, []);

  const handleUpdate = async () => {
  if (!userData) return;

  try {
    const body = {
      name: userData.name,
      username: userData.username,
      profile_picture: userData.profile_picture,
      bio: userData.bio,
    };

    await apiFetchAuth(`api/users/${userData.id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });

    alert("Profile updated successfully!");
  } catch (err) {
    console.error("Failed to update profile:", err);
    alert("Failed to update profile");
  }
};

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    router.replace('/(auth)/login');
  }

  // allow user to upload a profile photo 
  const pickProfilePhoto = async () => {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!perm.granted) {
    alert("Please allow photo access to upload a profile picture.");
    return;
  }

  // open the phone's gallery and let the user pick and crop a photo
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.5,
    aspect: [1, 1],
  });

  if (res.canceled) return;

  const asset = res.assets[0];
  const uri = asset.uri;

  console.log("Picked image URI:", uri);

  try {
    // Build FormData
    const formData = new FormData();
    formData.append("image", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    } as any);

    // upload image URL to backend on android emulator
    const uploadUrl = "http://10.0.2.2:3000/api/images/users";

    // Use fetch directly (FormData + auth header)
    const token = await AsyncStorage.getItem("authToken");
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      throw new Error(errText || "Upload failed");
    }

    const data = await uploadRes.json();
    const imageUrl = data.url;
    console.log("Uploaded image URL:", imageUrl);

    // Update user profile
    if (userData) {
      await apiFetchAuth(`api/users/${userData.id}`, {
        method: "PUT",
        body: JSON.stringify({
          name: userData.name,
          username: userData.username,
          bio: userData.bio,
          profile_picture: imageUrl,
        }),
      });

      setUserData(prev =>
        prev ? { ...prev, profile_picture: imageUrl } : prev
      );
    }
  } catch (err) {
    console.error("Image upload failed:", err);
    alert("Failed to upload image. Make sure your backend is running.");
  }
};
    
  return (
    
    <View className="flex-1 bg-[#FDF1E6]">

        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <AppHeader title="Account" showBack showProfile={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="always">
        {/* Avatar: profile photo that can be changed */}
        <View className="items-center mt-10"> 
          <View className="items-center mt-10">
            <TouchableOpacity
              onPress={pickProfilePhoto}
              className="w-36 h-36 rounded-full bg-blue-400 items-center justify-center overflow-hidden"
            >
              {userData?.profile_picture ? (
                <Image
                  source={{ uri: userData.profile_picture }}
                  className="w-36 h-36 rounded-full border-2 border-black"
                />
              ) : (
                <Ionicons name="person" size={60} color="white" />
              )}
            </TouchableOpacity>

            <Text className="text-xs text-gray-500 mt-2">
              Tap to change profile photo
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="px-6 mt-6">
          <Label text="Username" />
          <Input
            value={userData?.username ?? ""}
            placeholder={loading ? "Loading username..." : "Enter username"}
            onChangeText={(text) =>
              setUserData(prev => prev ? { ...prev, username: text } : prev)
            }
          />

          <Label text="Bio" />
          <Input
            value={userData?.bio ?? ""}
            placeholder="Tell us about yourself"
            multiline
            height={80}
            onChangeText={(text) =>
              setUserData(prev => prev ? { ...prev, bio: text } : prev)
            }
          />
          <Text className="text-right text-xs text-gray-500 mt-1">
            200 Characters
          </Text>

          <Label text="Email Address" />
          <Input placeholder={loading ? "Loading email..." : userData?.email || "Enter email address"}
                 editable={false} 
          />

          <Label text="Favourite Genres" />
          <TagInput
            placeholder={"Search genres"}
            endpoint={"api/genres"}
            tags={userData?.genres ?? [] }
            getTagName = {g => g.name}
        
            // adding a favourite genre tag and updating backend
            onAddTag={async (genre) => {
              await apiFetchAuth("api/users/addGenre", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ genreId: genre.id }) });
              setUserData(prev => prev ? { ...prev, genres: [...prev.genres, genre] } : prev);
            }}
            onRemoveTag={async (genre) => {
              await apiFetchAuth("api/users/removeGenre", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ genreId: genre.id }) });
              setUserData(prev => prev ? { ...prev, genres: prev.genres.filter(g => g.id !== genre.id) } : prev);
            }}
          />

          {/* <Label text="Favourite Artists" />
          <TagInput placeholder="Search artists" endpoint={"/api/genres"} /> */}

          <Label text="Favourite Venues" />
          <TagInput
            placeholder={"Search venues"}
            endpoint={"api/venues"}
            tags={userData?.venues ?? [] }
            getTagName = {v => v.name}
            onAddTag={async (venue) => {
              await apiFetchAuth("api/users/addVenue", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ venueId: venue.id }) });
              setUserData(prev => prev ? { ...prev, venues: [...prev.venues, venue] } : prev);
            }}
            onRemoveTag={async (venue) => {
              await apiFetchAuth("api/users/removeVenue", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ venueId: venue.id }) });
              setUserData(prev => prev ? { ...prev, venues: prev.venues.filter(v => v.id !== venue.id) } : prev);
            }}
          />
        </View>

        {/* Update button*/}
        <TouchableOpacity className="bg-[#AE6E4E] mx-16 mt-10 py-4 rounded-full" onPress={handleUpdate}>
          <Text className="text-center text-white font-bold text-lg">
            Update
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity className="bg-orange-400 mx-16 mt-10 py-4 rounded-full" onPress={handleLogout}>
          <Text className="text-center text-white font-bold text-lg">
            Logout
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}


function Label({ text }: { text: string }) {
  return <Text className="text-sm font-semibold text-gray-700 mt-4 mb-1">{text}</Text>;
}

function Input({
  placeholder,
  multiline = false,
  height = 48,
  editable = true,
  value,
  onChangeText,
}: {
  placeholder: string;
  multiline?: boolean;
  height?: number;
  editable?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      multiline={multiline}
      editable={editable}
      className="bg-[#F6D5B8] rounded-xl px-4 text-gray-800"
      style={{ height }}
    />
  );
}

