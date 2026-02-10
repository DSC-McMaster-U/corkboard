import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// adding components
import { ExploreSearch } from '@/components/explore/search-bar';
import { ExploreShows } from '@/components/explore/explore-shows';
import { Bookmarks } from '@/components/explore/bookmarks';
import { FeaturedArtist } from '@/components/explore/featured-artist';

//import {} from 'expo-router';

export default function ExploreScreen() {
  // fetching trending songs

  return (
    <SafeAreaView className='bg-background flex-1' edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#000000" />
      <View className='flex-1 flex-col px-4 py-4'>

        {/* heading with search bar and profile picture*/}
        <View className='flex-row justify-between items-center mb-8'>
          <View className='flex-1 mr-12'>
            <ExploreSearch />
          </View>
          <View className='w-8 h-8 rounded-full bg-blue-300' />
        </View>
        <ScrollView>
          {/* Bookmarks Section */}
          <View className='mb-8'>
            <Bookmarks />
          </View>

          {/* Explore shows section*/}
          <View className='mb-8'>
            <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Explore shows in Hamilton</Text>
            <ExploreShows />
          </View>

          {/* Featured Artist of the day */}
          <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Featured artist for you</Text>
          <FeaturedArtist />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
