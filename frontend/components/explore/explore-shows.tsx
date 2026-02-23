import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { router } from 'expo-router';
import { EventData, EventList } from '@/constants/types';
import { apiFetch } from '@/api/api';

interface ShowCardProps {
  show: EventData;
}

function ShowCard({ show }: ShowCardProps) {
  const PLACEHOLDER_IMAGE = "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";
  const imageUri = show.image || PLACEHOLDER_IMAGE;

  const handlePress = () => {
    // Extract genre names from the event_genres array
    const genreNames = show.event_genres?.map((g) => g.genres.name) || [];

    router.push({
      pathname: '/shows/[showName]',
      params: {
        showName: show.title,
        description: show.description,
        artist: show.artist,
        start_time: show.start_time,
        cost: show.cost,
        image: show.image,
        venue_name: show.venues?.name,
        venue_id: show.venues?.id,
        venue_address: show.venues?.address,
        venue_latitude: show.venues?.latitude,
        venue_longtidue: show.venues?.longitude,
        venue_type: show.venues?.venue_type,
        source_url: show.source_url,
        genres: JSON.stringify(genreNames),
        event_id: show.id.toString(),
      },
    });
  };

  return (
    <TouchableOpacity className='w-36 mr-4' onPress={handlePress}>
      <View className="rounded-2xl h-36 w-36 mb-2 overflow-hidden bg-neutral-300">
        <Image
          source={{ uri: imageUri }}
          className="h-full w-full"
          resizeMode="cover"
        />
      </View>
      <Text className='text-foreground font-semibold text-sm' numberOfLines={1}>
        {show.title}
      </Text>
      <Text className='text-foreground/60 text-xs' numberOfLines={2}>
        {show.description}
      </Text>
    </TouchableOpacity>
  );
}

export function ExploreShows() {
  const [shows, setShows] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetching event data from backend
  const eventLimit = 8;

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<EventList>(`api/events?limit=${eventLimit}`,
          { signal: controller.signal }
        );
        if (isMounted) {
          //console.log("Fetched events:", res.events);
          setShows(res.events || []);
        }
      } catch (err: any) {
        if (isMounted && err.name !== "AbortError") {
          setError(err.message || "Failed to fetch events");
          console.error("Error fetching events:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Debounce: wait 300ms after range changes before fetching
    const timer = setTimeout(fetchEvents, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="px-4 py-2">
        <Text>This component is loading.</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-4 py-2">
        <Text>{`This component has an error: ${error}`}</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className='flex-row'
      >
        {shows && shows.map((show: EventData, index: number) => (
          <ShowCard
            key={index}
            show={show}
          />
        ))}
      </ScrollView>
    </View>
  );
}
