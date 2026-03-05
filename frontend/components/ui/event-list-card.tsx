import React from 'react';
import { View, Text, TouchableOpacity, Image, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { EventData } from '@/constants/types';
import { formatEventDateTimeToDate } from '@/scripts/formatDateHelper';

export interface EventListCardProps {
    event: EventData;
}

const PLACEHOLDER_IMAGE = 'https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b';

export function EventListCard({ event }: EventListCardProps) {
    const imageUri = event.image || PLACEHOLDER_IMAGE;
    const venueName = event.venues?.name || 'Unspecified venue';
    const artist = event.artist || 'Unspecified artist';
    const genres = event.event_genres?.map(g => g.genres.name) || [];
    const costLabel =
        event.cost == null
            ? 'Price TBA'
            : event.cost === 0
                ? 'Free'
                : `$${event.cost.toFixed(2)}`;

    const handlePress = () => {
        Keyboard.dismiss();
        router.push({
            pathname: '/shows/[showName]',
            params: {
                showName: event.title,
                description: event.description || '',
                start_time: event.start_time,
                cost: event.cost?.toString() || '',
                artist: event.artist || '',
                image: event.image || '',
                venue_name: event.venues?.name || '',
                venue_id: event.venues?.id || '',
                venue_address: event.venues?.address || '',
                venue_latitude: event.venues?.latitude?.toString() || '',
                venue_longtidue: event.venues?.longitude?.toString() || '',
                venue_type: event.venues?.venue_type || '',
                source_url: event.source_url || '',
                genres: JSON.stringify(genres),
                event_id: event.id.toString(),
            },
        });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.85}
            className="mb-4"
        >
            <View className="flex-row bg-[#9A6348] rounded-2xl p-2 shadow-lg border border-black/10">
                {/* Event image with rounded corners and shadow */}
                <View className="shadow-lg">
                    <Image
                        source={{ uri: imageUri }}
                        className='w-32 h-32 mr-4 rounded-xl'
                        resizeMode="cover"
                    />
                </View>
                {/* Card content */}
                <View className="flex-1 justify-between py-1">
                    {/* Title and artist */}
                    <Text className="text-white text-[16px] font-bold mb-1" numberOfLines={2}>
                        {event.title}
                    </Text>
                    {artist !== 'Unspecified artist' && (
                        <Text className="text-neutral-200 text-[13px] font-medium mb-2" numberOfLines={1}>
                            {artist}
                        </Text>
                    )}
                    {/* Genres as pill tags */}
                    {genres.length > 0 && (
                        <View className="flex-row flex-wrap mb-2">
                            {genres.map((genre, idx) => (
                                <View
                                    key={genre + idx}
                                    className="bg-white/15 px-2 py-0.5 rounded mr-1 mb-1"
                                >
                                    <Text className="text-white text-xs font-semibold" numberOfLines={1}>{genre}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                    {/* Date badge, price, venue */}
                    <View className="flex-row items-center mt-1">
                        <View className="bg-white/20 px-2 py-1 rounded-lg flex-row items-center mr-2">
                            <Feather name="calendar" size={12} color="white" />
                            <Text className="text-white text-xs font-bold ml-1 tracking-tight" numberOfLines={1}>
                                {formatEventDateTimeToDate(event.start_time)}
                            </Text>
                        </View>
                        <View className="bg-white/20 px-2 py-1 rounded-lg flex-row items-center mr-2">
                            <Feather name="dollar-sign" size={12} color="white" />
                            <Text className="text-white text-xs font-bold ml-1 tracking-tight" numberOfLines={1}>
                                {costLabel}
                            </Text>
                        </View>
                        <View className="bg-white/20 px-2 py-1 rounded-lg flex-row items-center">
                            <Feather name="map-pin" size={12} color="white" />
                            <Text className="text-white text-xs font-bold ml-1 uppercase tracking-tight" numberOfLines={1}>
                                {venueName.split(' ')[0]}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
