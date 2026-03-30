import React, { useMemo } from 'react';
import { View, Text, ImageBackground, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { UserData, EventData } from '@/constants/types';

export function HighlightedEvent({ user, events }: { user: UserData | null, events: EventData[] }) {
  const featuredEvent = useMemo(() => {
    if (!events || events.length === 0) return null;

    const favoriteGenres = user?.genres || [];
    const favoriteGenreIds = favoriteGenres.map((g: { id: string | number }) => String(g.id));

    const eligibleEvents = favoriteGenreIds.length > 0
      ? events.filter(event => {
        return event.event_genres?.some(eg => favoriteGenreIds.includes(String(eg.genre_id)));
      })
      : [];

    if (eligibleEvents.length > 0) {
      return eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
    } else {
      // If no events match favorite genres, just pick any random event as fallback
      return events[Math.floor(Math.random() * events.length)];
    }
  }, [user, events]);

  // Fallback if no specific featured event found
  const displayTitle = featuredEvent?.title || 'Discover New Music';
  const backgroundImage = featuredEvent?.image || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80';

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

  if (!featuredEvent) return null;

  return (
    <View className='mb-20'>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <ImageBackground
          source={{ uri: backgroundImage }}
          className='rounded-xl h-56 w-full overflow-hidden justify-end'
          imageStyle={{ borderRadius: 12 }}
        >
          <View className='py-4 px-6 bg-black/45 w-full'>
            <Text className='text-white text-xl font-bold'>
              {displayTitle}
            </Text>
            {featuredEvent && (
              <Text className='text-white/80 text-sm'>
                {featuredEvent.event_genres?.length ? 'Featured from your favorite genres' : 'Suggested for you'}
              </Text>
            )}
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}
