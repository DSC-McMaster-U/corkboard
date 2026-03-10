import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { EventData, EventList, UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';

import { ShowCard } from '@/components/ui/show-card';

export function ExplorePersonalizedEvents() {
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
                // api/users/suggested-events endpoint returns events personalized to the user based on their favorites and past interactions
                const res = await apiFetchAuth<{ events: any[] }>('api/users/suggested-events?limit=20', { signal: controller.signal });
                if (isMounted) {
                    // Map event_id to id for compatibility with EventData
                    const mappedEvents = (res.events || []).map((event) => ({
                        ...event,
                        id: event.id ?? event.event_id,
                    }));
                    setShows(mappedEvents);
                }
            } catch (err: any) {
                if (isMounted && err.name !== "AbortError") {
                    setError(err.message || "Failed to fetch personalized events");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                    console.log("Fetched personalized events:", shows[0]);
                }
            }
        };

        fetchData();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, []);

    if (loading) return <View className="px-4 py-2"><Text className="text-foreground/60">Loading your events...</Text></View>;
    if (error) return <View className="px-4 py-2"><Text className="text-red-500">{error}</Text></View>;
    if (shows.length === 0) return <View className="px-4 py-2"><Text className="text-foreground/40 italic">No personalized events found yet. Try adding more favorite genres!</Text></View>;

    return (
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='flex-row'>
                {shows.map((show, index) => (
                    <ShowCard key={index} show={show} />
                ))}
            </ScrollView>
        </View>
    );
}
