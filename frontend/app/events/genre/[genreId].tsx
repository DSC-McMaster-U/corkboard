import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { EventData, EventList } from '@/constants/types';
import { apiFetch } from '@/api/api';

import { EventListCard } from '@/components/ui/event-list-card';

export default function GenreEventsPage() {
    const { genreId } = useLocalSearchParams();
    const [events, setEvents] = useState<EventData[]>([]);
    const [genreName, setGenreName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const res = await apiFetch<EventList>(`api/events?limit=100`);
                const filtered = (res.events || []).filter(e =>
                    e.event_genres?.some(eg => eg.genre_id.toString() === genreId)
                );

                // Find genre name from first event if available
                if (filtered.length > 0) {
                    const genreObj = filtered[0].event_genres?.find(eg => eg.genre_id.toString() === genreId);
                    if (genreObj) setGenreName(genreObj.genres.name);
                }

                setEvents(filtered);
            } catch (err: any) {
                setError(err.message || "Failed to load events");
            } finally {
                setLoading(false);
            }
        };

        if (genreId) fetchEvents();
    }, [genreId]);

    return (
        <SafeAreaView className="flex-1 bg-[#FFF0E2]" edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" />
            <Stack.Screen options={{ headerShown: false }} />

            <View className="flex-row items-center px-4 py-4">
                <TouchableOpacity onPress={() => router.back()} className="p-2">
                    <Feather name="arrow-left" size={24} color="#411900" />
                </TouchableOpacity>
                <Text className="text-xl font-semibold text-foreground ml-2">
                    {genreName || "Genre"} Shows
                </Text>
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
                {loading ? (
                    <View className="py-20 items-center">
                        <ActivityIndicator size="large" color="#E2912E" />
                    </View>
                ) : error ? (
                    <Text className="text-red-500 text-center py-10">{error}</Text>
                ) : events.length === 0 ? (
                    <View className="py-20 items-center">
                        <Feather name="calendar" size={48} color="#ccc" />
                        <Text className="text-foreground/40 mt-4 text-center">No shows found for this genre.</Text>
                    </View>
                ) : (
                    events.map(event => <EventListCard key={event.id} event={event} />)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
