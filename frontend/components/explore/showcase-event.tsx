import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { apiFetch, apiFetchAuth } from '@/api/api';
import { UserData, EventData, EventList } from '@/constants/types';

type ShowcaseEventProp = {
    eventId: string;
    showcaseMessage?: string;
};

type EventResponse = {
    event: EventData;
};

export function ShowcaseEvent({ eventId, showcaseMessage }: ShowcaseEventProp) {
  const [featuredEvent, setFeaturedEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch data for the specific event ID passed in
    const fetchData = async () => {
      try {
        setLoading(true);
        const eventsRes = await apiFetch<EventResponse>(`api/events/${eventId}`);
        setFeaturedEvent(eventsRes.event);
      } catch (error) {
        console.error('Error fetching showcased event:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [eventId]);

  if (loading) {
    return (
      <View className='mb-20 h-56 w-full items-center justify-center bg-neutral-100 rounded-xl'>
        <ActivityIndicator color='#E2912E' />
      </View>
    );
  }

  const handlePress = () => {
    if (featuredEvent) {
      const genreNames = featuredEvent.event_genres?.map((g) => g.genres.name) || [];
      router.push({
        pathname: '/shows/[showName]',
        params: {
          showName: featuredEvent.title,
          description: featuredEvent.description,
          artist: featuredEvent.artist,
          start_time: featuredEvent.start_time,
          cost: featuredEvent.cost,
          image: featuredEvent.image,
          venue_name: featuredEvent.venues?.name,
          venue_id: featuredEvent.venues?.id,
          venue_address: featuredEvent.venues?.address,
          venue_latitude: featuredEvent.venues?.latitude,
          venue_longtidue: featuredEvent.venues?.longitude,
          venue_type: featuredEvent.venues?.venue_type,
          source_url: featuredEvent.source_url,
          genres: JSON.stringify(genreNames),
          event_id: featuredEvent.id.toString(),
        },
      });
    }
  };

  if (!featuredEvent) {
    return (
      <View />
    );
  }

  return (
    <View className='mb-2'>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <ImageBackground
          source={{ uri: featuredEvent?.image }}
          className='rounded-xl h-56 w-full overflow-hidden justify-end'
          imageStyle={{ borderRadius: 12 }}
        >
          <View className='py-4 px-6 bg-black/45 w-full'>
            <Text className='text-white text-xl font-bold'>
              {featuredEvent?.title || 'Discover New Music'}
            </Text>
            {featuredEvent && showcaseMessage && (
              <Text className='text-white/80 text-sm'>
                {showcaseMessage}
              </Text>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}
