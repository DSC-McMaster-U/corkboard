import React from 'react';
import { View, Text, ScrollView, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// adding components
import { ExploreSearch } from '@/components/explore/search-bar';
import { Bookmarks } from '@/components/explore/bookmarks';
import { HighlightedEvent } from '@/components/explore/highlighted-event';
import { ExploreEventsForYou } from '@/components/explore/events-for-you';
import { ExploreFavoriteGenres } from '@/components/explore/favorite-genres';
import { ExploreFavoriteVenuesEvents } from '@/components/explore/favorite-venues-events';
import { ExploreEventsFromFavGenres } from '@/components/explore/events-genres-mixed';
import { ShowcaseEvent } from '@/components/explore/showcase-event';

//import {} from 'expo-router';

export default function ExploreScreen() {

  return (
    <SafeAreaView className='bg-background flex-1' edges={['left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#000000" />
      <View className='flex-1 flex-col px-4 py-4'>

        {/* heading with search bar and profile picture*/}
        <View className='flex-row justify-between items-center mb-8'>
          <View className='flex-1'>
            <ExploreSearch />
          </View>
        </View>
        <ScrollView>
          {/* Bookmarks Section */}
          <View className='mb-6'>
            <Bookmarks />
          </View>

          {/* Explore shows - personalized based on favourites*/}
          <View className='mb-6'>
            <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Based on all your favourites</Text>
            <ExploreEventsForYou />
          </View>

          {/* Showcased Event 1 */}
          <View className='mb-6'>
            <ShowcaseEvent eventId={"33450f88-351e-4dd8-8621-5aeb6ee6bf89"} showcaseMessage='Wolf Parade returns, live at Bridgeworks'/>
          </View>

          {/* Explore shows from favourite genres*/}
          <View className='mb-6'>
            <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Your favourite genres</Text>
            <ExploreFavoriteGenres />
          </View>

          {/* Explore shows from favourite venues*/}
          <View className='mb-6'>
            <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Events from your favourite venues</Text>
            <ExploreFavoriteVenuesEvents />
          </View>

          {/* Showcased Event 2 */}
          <View className='mb-6'>
            <ShowcaseEvent eventId={"50539bda-0c5c-49d2-9e73-96990d13d4e3"} showcaseMessage='with hi, low + Dear Maryanne'/>
          </View>

          {/* Explore shows from all your favourite genres */}
          <View className='mb-6'>
             <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Events from all your favourite genres</Text>
             <ExploreEventsFromFavGenres />
          </View>

          {/* Highlighted event */}
          <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Here's a randomly chosen event..</Text>
          <HighlightedEvent />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
