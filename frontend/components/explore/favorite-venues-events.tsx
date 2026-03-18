import React, { useMemo } from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { EventData, UserData } from '@/constants/types';
import { ShowCard } from '@/components/ui/show-card';
import { Image as ExpoImage } from 'expo-image';

export function ExploreFavoriteVenuesEvents({ user, events }: { user: UserData | null, events: EventData[] }) {
    const shows = useMemo(() => {
        if (!user || !user.venues || events.length === 0) return [];
        
        const favoriteVenueIds = user.venues.map(v => v.id.toString());
        if (favoriteVenueIds.length === 0) return [];

        const filteredShows = events.filter(event =>
            favoriteVenueIds.includes(String(event.venues?.id))
        );

        // Prefetch images for the first 5 events
        filteredShows.slice(0, 5).forEach((e: EventData) => {
            if (e.image) ExpoImage.prefetch(e.image);
        });

        return filteredShows;
    }, [user, events]);

    if (shows.length === 0) return <View className="px-4 py-2"><Text className="text-foreground/40 italic">No events from your favorite venues yet.</Text></View>;

    return (
        <View>
            <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={shows}
                keyExtractor={(item) => item.id.toString()}
                initialNumToRender={5}
                renderItem={({ item }) => (
                    <ShowCard show={item} />
                )}
            />
        </View>
    );
}
