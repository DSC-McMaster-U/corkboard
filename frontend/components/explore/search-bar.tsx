import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export function ExploreSearch() {
  return (
    <Pressable onPress={() => router.push('/search')}>
      <View className="flex-row items-center rounded-xl bg-white py-3 px-3">
        <Feather name="search" size={16} color="#666" />
        <Text className="text-sm text-gray-500 ml-2">Search artists, songs, shows...</Text>
      </View>
    </Pressable>
  );
}
