import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground, ActivityIndicator, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { apiFetch, apiFetchAuth } from '@/api/api';
import { UserData, EventData, EventList } from '@/constants/types';

export function FeaturedArtist() {
  const [featuredEvent, setFeaturedEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 1. Fetch user to get favorite genres
        const userRes = await apiFetchAuth<{ user: UserData }>('api/users/');
        const favoriteGenres = userRes.user.genres || [];
        console.log('FeaturedArtist: Favorite Genres:', favoriteGenres.map(g => g.name));

        if (favoriteGenres.length === 0) {
          console.log('FeaturedArtist: No favorite genres found for user.');
          setLoading(false);
          return;
        }

        // 2. Select a random favorite genre
        const favoriteGenreIds = favoriteGenres.map(g => g.id.toString());
        console.log('FeaturedArtist: Favorite Genre IDs:', favoriteGenreIds);

        // 3. Fetch events
        const eventsRes = await apiFetch<EventList>(`api/events?limit=100`);
        console.log('FeaturedArtist: Total events fetched:', eventsRes.events?.length);

        // 4. Filter events that belong to ANY of the favorite genres
        const eligibleEvents = (eventsRes.events || []).filter(event => {
          return event.event_genres?.some(eg => favoriteGenreIds.includes(eg.genre_id.toString()));
        });
        console.log('FeaturedArtist: Eligible events for ANY favorite genre:', eligibleEvents.length);

        if (eligibleEvents.length > 0) {
          const randomEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
          setFeaturedEvent(randomEvent);
        } else {
          // If no events match favorite genres, just pick any random event as fallback
          if (eventsRes.events && eventsRes.events.length > 0) {
            console.log('FeaturedArtist: No genre matches, using random fallback event.');
            setFeaturedEvent(eventsRes.events[Math.floor(Math.random() * eventsRes.events.length)]);
          }
        }
      } catch (error) {
        console.error('Error fetching featured artist:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <View className='mb-20 h-56 w-full items-center justify-center bg-neutral-100 rounded-xl'>
        <ActivityIndicator color='#E2912E' />
      </View>
    );
  }

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

  return (
    <View className='mb-20'>
      <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
        <ImageBackground
          source={{ uri: backgroundImage }}
          className='rounded-xl h-56 w-full overflow-hidden justify-end'
          imageStyle={{ borderRadius: 12 }}
        >
          <View className='py-4 px-6 bg-black/30 w-full'>
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
