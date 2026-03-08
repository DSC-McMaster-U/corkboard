import React from 'react';
import { View, Text, TouchableOpacity, Image, Keyboard } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { EventData } from '@/constants/types';
import { formatEventDateTimeToDate, formatEventDateTimeToTime } from '@/scripts/formatDateHelper';

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
            className="mb-4 w-full"
        >
            <View className="flex-row bg-[#9A6348] rounded-xl p-2 shadow-lg border border-black/10 w-full">
                {/* image */}
                <Image source={{ uri: imageUri}} className='w-[32%] h-full rounded-md mr-2' resizeMode='cover' />
                {/* event details */}
                <View className="flex-1 justify-between py-1">
                    <Text className="text-white text-[16px] font-bold mb-1" numberOfLines={2}>
                        {event.title}
                    </Text>
                    {artist !== 'Unspecified artist' && (
                        <Text className="text-neutral-200 text-[13px] font-medium mb-2" numberOfLines={1}>
                            {artist}
                        </Text>
                    )}

                    {/* venue */}
                    <View className='flex-row items-center mt-0.5'>
                        <FontAwesome name="map-marker" size={12} color="white" />
                        <Text className='text-white text-sm ml-1.5' numberOfLines={1}>
                            {venueName}
                        </Text>
                    </View>

                    {/* ticket price */}
                    {event.cost !== undefined && (
                        <View className='flex-row items-center mt-0.5'>
                            <FontAwesome name="ticket" size={12} color="white" />
                            <Text className='text-white text-sm ml-1.5' numberOfLines={1}>
                                {costLabel}
                            </Text>
                        </View>
                    )}

                    {/* date time chips */}
                    <View className="flex-row items-center mt-0.5">
                        <View className="flex-row items-center bg-white/10 rounded-full px-2 py-0.5 mr-1.5">
                            <FontAwesome name="calendar" size={11} color="#fff" />
                            <Text className="text-white text-xs ml-1">
                            {formatEventDateTimeToDate(event.start_time)}
                            </Text>
                        </View>
                        <View className="flex-row items-center bg-white/10 rounded-full px-2 py-0.5">
                            <FontAwesome name="clock-o" size={11} color="#fff" />
                            <Text className="text-white text-xs ml-1">
                            {formatEventDateTimeToTime(event.start_time)}
                            </Text>
                        </View>
                    </View>

                    

                    {/* genre tags */}
                    {genres.length > 0 && (
                        <View className="flex-row flex-wrap mt-2">
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
                </View>
            </View>
        </TouchableOpacity>
    );
}
