import React from 'react';
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { AppHeader } from '@/components/header';

// function to create artist, venue, and genre tages
function TagInput({ placeholder }: { placeholder: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');

  const addTag = () => {
    if (!text.trim()) return;

    // prevent duplicates
    if (tags.includes(text.trim())) return;

    setTags([...tags, text.trim()]);
    setText('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

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
          onChangeText={setText}
          placeholder={placeholder}
          onSubmitEditing={addTag}
          className="text-gray-800 px-2 py-1 min-w-[80px]"
          returnKeyType="done"
        />
      </View>
    </View>
  );
}

export default function AccountPage() {

  return (
    
    <View className="flex-1 bg-[#FDF1E6]">

        <Stack.Screen options={{ headerShown: false }} />

        {/* Header */}
        <AppHeader title="Account" showBack />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Avatar */}
        <View className="items-center mt-10">
          <View className="w-32 h-32 rounded-full bg-blue-400 items-center justify-center">
            <Image
              source={{ uri: 'https://placekitten.com/300/300' }}
              className="w-28 h-28 rounded-full"
            />
          </View>
        </View>

        {/* Form */}
        <View className="px-6 mt-6">
          <Label text="Username" />
          <Input placeholder="User123456789" />

          <Label text="Bio" />
          <Input
            placeholder="Write about your musical interests!"
            multiline
            height={80}
          />
          <Text className="text-right text-xs text-gray-500 mt-1">
            200 Characters
          </Text>

          <Label text="Email Address" />
          <Input placeholder="JohnDoe@domain.com" />

          <Label text="Favourite Genres" />
          <TagInput placeholder="Search genre" />

          <Label text="Favourite Artists" />
          <TagInput placeholder="Search artists" />

          <Label text="Favourite Venues" />
          <TagInput placeholder="Search venues" />
        </View>

        {/* Logout Button */}
        <TouchableOpacity className="bg-orange-400 mx-16 mt-10 py-4 rounded-full">
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
}: {
  placeholder: string;
  multiline?: boolean;
  height?: number;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      multiline={multiline}
      className="bg-[#F6D5B8] rounded-xl px-4 text-gray-800"
      style={{ height }}
    />
  );
}

