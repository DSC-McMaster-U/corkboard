import { useMemo, useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { AppHeader } from '@/components/header';
import { UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TagList = {
  placeholder: string;
  endpoint: string;
  maxDropdownHeight?: number;
  tags: string[]; // pass in current tags
  onAddTag?: (tag: string) => void; // adding tags update
  onRemoveTag?: (tag: string) => void;  // removing tags update
};

// function to create artist, venue, and genre tages
function TagInput({ placeholder, endpoint, maxDropdownHeight = 100, tags, onAddTag, onRemoveTag }: TagList) {
  //const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);

  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [venuesOptions, setVenuesOptions] = useState<string[]>([]);

  // prevent duplicates
  const normalizedTags = useMemo(() => new Set(tags.map((t) => t.trim().toLowerCase())), [tags]);

  
  // Fetch all options from backend
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const data = (await apiFetch(endpoint)) as any;
        //const data = await res.json();
        console.log("Response data:", data);

        // Expected shape: { genres: [...] } or { artists: [...] } or { venues: [...] }
        const arr = Array.isArray(data)
          ? data
          : data.genres ?? data.artists ?? data.venues ?? [];

        // Turn objects into strings (supports {name:"Pop"} or plain "Pop")
        const names = arr.map((x: any) => (typeof x === "string" ? x : x?.name)).filter(Boolean);

        if (!cancelled) setOptions(names);
      } catch (e) {
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

  // filter options based on user's input text
  const filtered = useMemo(() => {
  const q = text.trim().toLowerCase();

  const base = q
    ? options.filter((o) => o.toLowerCase().includes(q))
    : options;

  return base.filter((o) => !normalizedTags.has(o.toLowerCase()));
}, [text, options, normalizedTags]);


  const addTag = (value: string) => {
    const v = value.trim();
    if (!v || normalizedTags.has(v.toLowerCase())) return;
    if (onAddTag) onAddTag(v);
    setText('');
    setOpen(false);
  };

  const removeTag = (value: string) => {
    if (onRemoveTag) onRemoveTag(value);
  };

  console.log("TagInput", { open, optionsLen: options.length, filteredLen: filtered.length, text });

  return (
    <View className="bg-[#F6D5B8] rounded-xl px-2 py-2">
      <View className="flex-row flex-wrap items-center">
        {tags.map(tag => (
          <TouchableOpacity
            key={tag}
            onPress={() => removeTag(tag)}
            className="bg-[#5A1E14] px-3 py-1 rounded-full mr-2 mb-2"
          >
            <Text className="text-white text-xs">{tag} ✕</Text>
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
            key={item}
            onPress={() => addTag(item)}
            className="px-3 py-3 border-b border-gray-200"
          >
            <Text className="text-sm text-gray-800">{item}</Text>
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
    
  return (
    
    <View className="flex-1 bg-[#FDF1E6]">

        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <AppHeader title="Account" showBack showProfile={false} />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} keyboardShouldPersistTaps="always">
        {/* Avatar */}
        <View className="items-center mt-10"> 
          <View className="w-36 h-36 rounded-full bg-blue-400 items-center justify-center">
            {userData && 
              <Image
                source={{ uri: userData?.profile_picture }}
                className="w-36 h-36 rounded-full border-2 border-black shadow-lg"
              />
            }
          </View>
        </View>

        {/* Form */}
        <View className="px-6 mt-6">
          <Label text="Username" />
          <Input placeholder={loading ? "Loading username..." : userData?.name || "Enter username"} />

          <Label text="Bio" />
          <Input
            placeholder={loading ? "Loading user bio..." : userData?.bio || "Tell us about yourself"}
            multiline
            height={80}
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
            placeholder={userData?.genres.map(g => g.name).join(", ") || "Search genres"}
            endpoint={"api/genres"}
            tags={userData?.genres.map(g => g.name) || []} // controlled from userData
        
            // adding a favourite genre tag and updating backend
            onAddTag={async (genreName) => {
            if (!userData) return;

            try {
            // fetch all genres to get the ID
            const allGenresBackend = await apiFetch("api/genres") as any;

            const genresArray = Array.isArray(allGenresBackend)
              ? allGenresBackend
              : allGenresBackend.genres ?? [];

            // find the genre object by name
            const genreObj = genresArray.find((g: any) => g.name === genreName);
            if (!genreObj) {
              console.log("Genre not found:", genreName)
              return;
            }

              // call backend to add it to user's favourites
              await apiFetchAuth("api/users/addGenre", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ genreId: genreObj.id }),
              });

              const newGenre = {
                id: String(genreObj.id),  
                name: genreObj.name
              };

              // update frontend state immediately
              setUserData(prev => prev ? { ...prev, genres: [...prev.genres, newGenre] } : prev);
            } catch (err) { console.error("Failed to add genre:", err); } }}

            // removing a genre tag and updating backend
            onRemoveTag={async (genreName) => {
              if (!userData) return;

              const genreObj = userData.genres.find(g => g.name === genreName);
              if (!genreObj) return;

              // remove from backend
              await apiFetchAuth("api/users/removeGenre", {
                method: "DELETE",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ genreId: genreObj.id }),
              });

              // update frontend
              setUserData(prev =>
                prev
                  ? { ...prev, genres: prev.genres.filter(g => g.id !== genreObj.id) }
                  : prev
              );
            }}
          />

          {/* <Label text="Favourite Artists" />
          <TagInput placeholder="Search artists" endpoint={"/api/genres"} /> */}

          <Label text="Favourite Venues" />
          <TagInput
            placeholder={userData?.venues.map(v => v.name).join(", ") || "Search venues"}
            endpoint={"/api/venues"}
            tags={userData?.venues.map(v => v.name) || []} // controlled tags
            onAddTag={async (venueName) => {
              if (!userData) return;

              // Find venue object from backend
              const allVenuesRes = (await apiFetch("/api/venues")) as any;
              const venueObj = allVenuesRes.find((v: any) => v.name === venueName);
              if (!venueObj) return;

              // Call backend to add
              await apiFetchAuth("/api/users/addVenue", {
                method: "POST",
                body: JSON.stringify({ venueId: venueObj.id }),
              });

              // Update local state immediately
              setUserData(prev => prev ? { ...prev, venues: [...prev.venues, venueObj] } : prev);
            }}
            onRemoveTag={async (venueName) => {
              if (!userData) return;

              const venueObj = userData.venues.find(v => v.name === venueName);
              if (!venueObj) return;

              // Call backend to remove
              await apiFetchAuth("/api/users/removeVenue", {
                method: "DELETE",
                body: JSON.stringify({ venueId: venueObj.id }),
              });

              // Update local state immediately
              setUserData(prev => prev ? { ...prev, venues: prev.venues.filter(v => v.id !== venueObj.id) } : prev);
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
}: {
  placeholder: string;
  multiline?: boolean;
  height?: number;
  editable?: boolean;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      multiline={multiline}
      editable={editable}
      className="bg-[#F6D5B8] rounded-xl px-4 text-gray-800"
      style={{ height }}
    />
  );
}

