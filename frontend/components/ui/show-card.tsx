import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { EventData } from '@/constants/types';

export interface ShowCardProps {
    show: EventData;
}

const PLACEHOLDER_IMAGE = "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";

export const ShowCard = React.memo(function ShowCard({ show }: ShowCardProps) {
    const imageUri = show.image || PLACEHOLDER_IMAGE;

    const handlePress = () => {
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
                venue_image: show.venues?.image || '',
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
                    source={imageUri}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                    transition={200}
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
});
