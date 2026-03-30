import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiFetch, apiFetchAuth } from '@/api/api';
import { EventData, EventList, UserData } from '@/constants/types';

// adding components
import { ExploreSearch } from '@/components/explore/search-bar';
import { Bookmarks } from '@/components/explore/bookmarks';
import { HighlightedEvent } from '@/components/explore/highlighted-event';
import { ExploreEventsForYou } from '@/components/explore/events-for-you';
import { ExploreFavoriteGenres } from '@/components/explore/favorite-genres';
import { ExploreFavoriteVenuesEvents } from '@/components/explore/favorite-venues-events';
import { ExploreEventsFromFavGenres } from '@/components/explore/events-genres-mixed';
import { ShowcaseEvent } from '@/components/explore/showcase-event';
import { ExplorePersonalizedEvents } from '@/components/explore/personalized-events';

//import {} from 'expo-router';

export default function ExploreScreen() {
  const [user, setUser] = useState<UserData | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [suggestedEvents, setSuggestedEvents] = useState<EventData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchExploreData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [userRes, eventsRes, suggestedRes] = await Promise.all([
          apiFetchAuth<{ user: UserData }>('api/users/', { signal: controller.signal }),
          apiFetch<EventList>('api/events?limit=100', { signal: controller.signal }),
          apiFetchAuth<{ events: any[] }>('api/users/suggested-events?limit=20', { signal: controller.signal }),
        ]);

        if (isMounted) {
          setUser(userRes.user);
          setEvents(eventsRes.events || []);
          setSuggestedEvents(suggestedRes.events || []);
        }
      } catch (err: any) {
        if (isMounted && err.name !== "AbortError") {
          setError(err.message || 'Failed to load explore data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchExploreData();
    return () => {
      controller.abort();
      isMounted = false;
    };
  }, []);

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

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#E2912E" />
            <Text className="mt-4 text-foreground/60">Loading explore page...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center p-4">
            <Text className="text-red-500 text-center">{error}</Text>
          </View>
        ) : (
          <ScrollView>
            {/* Bookmarks Section */}
            <View className='mb-6'>
              <Bookmarks />
            </View>

            {/* Personlized for you section */}
            <View className='mb-6'>
              <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Personalized events for you</Text>
              <ExplorePersonalizedEvents suggestedEvents={suggestedEvents} />
            </View>

            {/* Explore shows - personalized based on favourites*/}
            <View className='mb-6'>
              <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Based on all your favourites</Text>
              <ExploreEventsForYou user={user} events={events} />
            </View>

            {/* Showcased Event 1 */}
            <View className='mb-6'>
              <ShowcaseEvent eventId={"33450f88-351e-4dd8-8621-5aeb6ee6bf89"} showcaseMessage='Wolf Parade returns, live at Bridgeworks'/>
            </View>

            {/* Explore shows from favourite genres*/}
            <View className='mb-6'>
              <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Your favourite genres</Text>
              <ExploreFavoriteGenres user={user} />
            </View>

            {/* Explore shows from favourite venues*/}
            <View className='mb-6'>
              <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Events from your favourite venues</Text>
              <ExploreFavoriteVenuesEvents user={user} events={events} />
            </View>

            {/* Showcased Event 2 */}
            <View className='mb-6'>
              <ShowcaseEvent eventId={"50539bda-0c5c-49d2-9e73-96990d13d4e3"} showcaseMessage='with hi, low + Dear Maryanne'/>
            </View>

            {/* Explore shows from all your favourite genres */}
            <View className='mb-6'>
               <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Events from all your favourite genres</Text>
               <ExploreEventsFromFavGenres user={user} events={events} />
            </View>

            {/* Highlighted event */}
            <Text className='text-lg mb-4 text-foreground font-semibold tracking-wide'>Here's a randomly chosen event..</Text>
            <HighlightedEvent user={user} events={events} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
