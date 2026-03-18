import React, { useMemo } from 'react';
import { View, Text, FlatList } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { EventData, UserData } from '@/constants/types';

import { ShowCard } from '@/components/ui/show-card';
import { ShowCardSkeleton } from '@/components/ui/skeleton';

export function ExploreEventsForYou({ user, events }: { user: UserData | null, events: EventData[] }) {
    const shows = useMemo(() => {
        if (!user || events.length === 0) return [];
        
        let filteredShows = events;
        const favoriteGenreIds = user.genres?.map(g => g.id.toString()) || [];

        if (favoriteGenreIds.length > 0) {
            filteredShows = filteredShows.filter(event =>
                event.event_genres?.some(eg => favoriteGenreIds.includes(eg.genre_id.toString()))
            );
        }

        const favoriteVenueIds = user.venues?.map(v => v.id.toString()) || [];
        if (favoriteVenueIds.length > 0 && filteredShows.length) {
            const venueFilteredShows = filteredShows.filter(event =>
                favoriteVenueIds.includes(event.venue_id.toString())
            );
            if (venueFilteredShows.length >= 8) {
                filteredShows = venueFilteredShows;
            }
        }

        // Prefetch images for the first 5 events
        filteredShows.slice(0, 5).forEach((e: EventData) => {
            if (e.image) ExpoImage.prefetch(e.image);
        });

        return filteredShows;
    }, [user, events]);

    if (shows.length === 0) return <View className="px-4 py-2"><Text className="text-foreground/40 italic">No personalized events found yet. Try adding more favorite genres!</Text></View>;

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
