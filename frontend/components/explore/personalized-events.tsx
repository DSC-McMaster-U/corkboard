import React, { useMemo } from 'react';
import { View, Text, FlatList, Image as RNImage } from 'react-native';
import { EventData } from '@/constants/types';
import { Image } from 'expo-image';

import { ShowCard } from '@/components/ui/show-card';

export function ExplorePersonalizedEvents({ suggestedEvents }: { suggestedEvents: EventData[] }) {
    const shows = useMemo(() => {
        if (!suggestedEvents || suggestedEvents.length === 0) return [];
        
        // Map event_id to id for compatibility with EventData if needed from suggested format
        const mappedEvents = suggestedEvents.map((event: any) => ({
            ...event,
            id: event.id ?? event.event_id,
        }));

        // Prefetch images for the first 5 events
        mappedEvents.slice(0, 5).forEach((e: EventData) => {
            if (e.image) Image.prefetch(e.image);
        });

        return mappedEvents as EventData[];
    }, [suggestedEvents]);

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
