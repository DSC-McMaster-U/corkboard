import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { EventData, EventList, UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';
import { usePerfTracker } from '@/hooks/use-perf';

import { ShowCard } from '@/components/ui/show-card';
import { ShowCardSkeleton } from '@/components/ui/skeleton';

export function ExplorePersonalizedEvents() {
    const [shows, setShows] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    usePerfTracker('PersonalizedEvents', loading, shows.length > 0);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // api/users/suggested-events endpoint returns events personalized to the user based on their favorites and past interactions
                const res = await apiFetchAuth<{ events: any[] }>('api/users/suggested-events?limit=20', { signal: controller.signal });
                if (isMounted) {
                    // Map event_id to id for compatibility with EventData
                    const mappedEvents = (res.events || []).map((event) => ({
                        ...event,
                        id: event.id ?? event.event_id,
                    }));
                    setShows(mappedEvents);

                    // Prefetch images for the first 5 events
                    mappedEvents.slice(0, 5).forEach((e: EventData) => {
                        if (e.image) Image.prefetch(e.image);
                    });
                }
            } catch (err: any) {
                if (isMounted && err.name !== "AbortError") {
                    setError(err.message || "Failed to fetch personalized events");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    //console.log("Fetched personalized events:", shows[0]);
                }
            }
        };

        fetchData();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, []);

    if (loading) return <ShowCardSkeleton />;
    if (error) return <View className="px-4 py-2"><Text className="text-red-500">{error}</Text></View>;
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
