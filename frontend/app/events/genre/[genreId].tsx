import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StatusBar } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { EventData, EventList } from '@/constants/types';
import { apiFetch } from '@/api/api';

function EventListItem({ event }: { event: EventData }) {
    const handlePress = () => {
        const genreNames = event.event_genres?.map((g) => g.genres.name) || [];
        router.push({
            pathname: '/shows/[showName]',
            params: {
                showName: event.title,
                description: event.description,
                artist: event.artist,
                start_time: event.start_time,
                cost: event.cost,
                image: event.image,
                venue_name: event.venues?.name,
                venue_id: event.venues?.id,
                venue_address: event.venues?.address,
                venue_latitude: event.venues?.latitude,
                venue_longtidue: event.venues?.longitude,
                venue_type: event.venues?.venue_type,
                source_url: event.source_url,
                genres: JSON.stringify(genreNames),
                event_id: event.id.toString(),
            },
        });
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const imageUri = event.image || 'https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b';

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
                        {event.artist || 'Unspecified artist'}
                    </Text>
                    <View className="flex-row items-center">
                        <View className="bg-white/20 px-2 py-1 rounded-lg flex-row items-center">
                            <Feather name="map-pin" size={10} color="white" />
                            <Text className="text-white text-[10px] font-bold ml-1 uppercase tracking-tight" numberOfLines={1}>
                                {(event.venues?.name || 'Venue').split(' ')[0]}
                            </Text>
                        </View>
                        <Text className="text-white/30 mx-2 text-[10px]">•</Text>
                        <Text className="text-neutral-300 text-[11px] font-semibold">
                            {formatDate(event.start_time)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

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
                    events.map(event => <EventListItem key={event.id} event={event} />)
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
