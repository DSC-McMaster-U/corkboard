import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { EventData, EventList, UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';

interface ShowCardProps {
    show: EventData;
}

function ShowCard({ show }: ShowCardProps) {
    const PLACEHOLDER_IMAGE = "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";
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
                    source={{ uri: imageUri }}
                    className="h-full w-full"
                    resizeMode="cover"
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
}

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
                // 1. Fetch user to get favorite venues
                const userRes = await apiFetchAuth<{ user: UserData }>('api/users/', { signal: controller.signal });
                const favoriteVenueIds = userRes.user.venues.map(v => v.id.toString());

                if (favoriteVenueIds.length === 0) {
                    if (isMounted) setShows([]);
                    return;
                }

                // 2. Fetch events (limited to 50 for filtering)
                const eventsRes = await apiFetch<EventList>(`api/events?limit=50`, { signal: controller.signal });

                if (isMounted) {
                    // 3. Filter events by favorite venues
                    const filteredShows = (eventsRes.events || []).filter(event =>
                        favoriteVenueIds.includes(event.venues?.id.toString())
                    );
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

    if (loading) return <View className="px-4 py-2"><Text className="text-foreground/60">Loading events...</Text></View>;
    if (error) return <View className="px-4 py-2"><Text className="text-red-500">{error}</Text></View>;
    if (shows.length === 0) return <View className="px-4 py-2"><Text className="text-foreground/40 italic">No events from your favorite venues yet.</Text></View>;

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
