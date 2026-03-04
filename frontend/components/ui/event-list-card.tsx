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

    const handlePress = () => {
        Keyboard.dismiss();
        const genreNames = event.event_genres?.map((g) => g.genres.name) || [];
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
                genres: JSON.stringify(genreNames),
                event_id: event.id.toString(),
            },
        });
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            className="mb-3"
        >
            <View className="flex-row bg-[#9A6348] rounded-3xl p-4 shadow-sm border border-black/5">
                <View className="shadow-sm">
                    <Image
                        source={{ uri: imageUri }}
                        style={{ width: 80, height: 80, borderRadius: 20, marginRight: 16 }}
                        resizeMode="cover"
                    />
                </View>
                <View className="flex-1 justify-center py-1">
                    <Text className="text-white text-[15px] font-bold mb-0.5" numberOfLines={1}>
                        {event.title}
                    </Text>
                    <Text className="text-neutral-200 text-[13px] font-medium mb-2" numberOfLines={1}>
                        {artist}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="bg-white/20 px-2 py-1 rounded-lg flex-row items-center">
                            <Feather name="map-pin" size={10} color="white" />
                            <Text className="text-white text-[10px] font-bold ml-1 uppercase tracking-tight" numberOfLines={1}>
                                {venueName.split(' ')[0]}
                            </Text>
                        </View>
                        <Text className="text-white/30 mx-2 text-[10px]">•</Text>
                        <Text className="text-neutral-300 text-[11px] font-semibold">
                            {formatEventDateTimeToDate(event.start_time)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}
