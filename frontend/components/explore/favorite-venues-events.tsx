import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image } from 'react-native';
import { router } from 'expo-router';
import { EventData, EventList, UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';
import { ShowCard } from '@/components/ui/show-card';

export function ExploreFavoriteVenuesEvents() {
    const [shows, setShows] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch user and events in parallel
                const [userRes, eventsRes] = await Promise.all([
                    apiFetchAuth<{ user: UserData }>('api/users/', { signal: controller.signal }),
                    apiFetch<EventList>('api/events?limit=50', { signal: controller.signal }),
                ]);
                const favoriteVenueIds = userRes.user.venues.map(v => v.id.toString());

                if (favoriteVenueIds.length === 0) {
                    if (isMounted) setShows([]);
                    return;
                }

                if (isMounted) {
                    const filteredShows = (eventsRes.events || []).filter(event =>
                        favoriteVenueIds.includes(String(event.venues?.id))
                    );
                    setShows(filteredShows);

                    // Prefetch images for the first 5 events
                    filteredShows.slice(0, 5).forEach((e: EventData) => {
                        if (e.image) Image.prefetch(e.image);
                    });
                }
            } catch (err: any) {
                if (isMounted && err.name !== "AbortError") {
                    setError(err.message || "Failed to fetch events");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, []);

    if (loading) return <View className="px-4 py-2"><Text className="text-foreground/60">Loading events...</Text></View>;
    if (error) return <View className="px-4 py-2"><Text className="text-red-500">{error}</Text></View>;
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
