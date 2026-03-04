import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { EventData, EventList, UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';

import { ShowCard } from '@/components/ui/show-card';

export function ExploreEventsForYou() {
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
                // 1. Fetch user to get favorite genres
                const userRes = await apiFetchAuth<{ user: UserData }>('api/users/', { signal: controller.signal });
                const favoriteGenreIds = userRes.user.genres?.map(g => g.id.toString()) || [];

                // 2. Fetch events
                const eventsRes = await apiFetch<EventList>(`api/events?limit=50`, { signal: controller.signal });

                if (isMounted) {
                    // 3. Filter events by favorite genres
                    let filteredShows = eventsRes.events || [];

                    if (favoriteGenreIds.length > 0) {
                        filteredShows = filteredShows.filter(event =>
                            event.event_genres?.some(eg => favoriteGenreIds.includes(eg.genre_id.toString()))
                        );
                    }

                    // 4. Further filter by favorite venues if applicable (if at least 8 events remain after venue filtering)
                    const favoriteVenueIds = userRes.user.venues?.map(v => v.id.toString()) || [];
                    if (favoriteVenueIds.length > 0 && filteredShows.length) {
                        const venueFilteredShows = filteredShows.filter(event =>
                            favoriteVenueIds.includes(event.venue_id.toString())
                        );
                        if (venueFilteredShows.length >= 8) {
                            filteredShows = venueFilteredShows;
                        }
                    }

                    setShows(filteredShows);
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
