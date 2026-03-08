import React, {useState, useEffect} from 'react';
import { View, Text, TouchableOpacity, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Genre, EventData, EventList } from '@/constants/types';
import { apiFetch } from '@/api/api';
import { Ionicons } from '@expo/vector-icons';

export interface GenreCardProps {
    genre: Genre;
}

// Returns a random event image for a given genre, or null if none found
export async function getRandomEventImageForGenre(genreId: string): Promise<string | null> {
  try {
    const eventsRes = await apiFetch<EventList>(`api/events?limit=100`);
    const eligibleEvents = (eventsRes.events || []).filter(event =>
      event.event_genres?.some(eg => eg.genre_id.toString() === genreId) && event.image
    );
    if (eligibleEvents.length > 0) {
      const randomEvent = eligibleEvents[Math.floor(Math.random() * eligibleEvents.length)];
      return randomEvent.image || null;
    }
    return null;
  } catch (e) {
    return null;
  }
}

export function GenreCard({ genre }: GenreCardProps) {
    const handlePress = () => {
        router.push(`/events/genre/${genre.id}`);
    };

    const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchBackgroundImage = async () => {
            const image = await getRandomEventImageForGenre(genre.id);
            setBackgroundImage(image);
        };

        fetchBackgroundImage();
    }, [genre.id]);

    const fallbackImage = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80';
    return (
        <View className='w-36 mr-4'>
            <ImageBackground
                source={{ uri: backgroundImage || fallbackImage }}
                className='w-36 h-36 rounded-2xl overflow-hidden'
                resizeMode="cover"
            >
                {/* Overlay for darkening the image */}
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.45)',
                    borderRadius: 16,
                }} />
                <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={handlePress}
                    className='flex-1 p-4 justify-between'
                    style={{ height: '100%' }}
                >
                    <View className='items-end'>
                        <Ionicons name="musical-notes-outline" size={28} color="white" style={{ opacity: 0.8 }} />
                    </View>
                    <Text
                        className='text-white font-bold text-base leading-5'
                        numberOfLines={2}
                    >
                        {genre.name}{'\n'}Shows
                    </Text>
                </TouchableOpacity>
            </ImageBackground>
            {/* <Text className='mt-2 text-foreground/60 text-xs' numberOfLines={2}>
                Local Hamilton {genre.name} shows near you...
            </Text> */}
        </View>
    );
}
