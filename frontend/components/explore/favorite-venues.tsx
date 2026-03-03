import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { VenueData, UserData } from '@/constants/types';
import { apiFetchAuth } from '@/api/api';

interface VenueCardProps {
    venue: VenueData;
}

function VenueCard({ venue }: VenueCardProps) {
    // Since we don't have venue images yet, we use a placeholder or a generic icon
    const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1514525253361-bee8a187499d?q=80&w=300&auto=format&fit=crop";

    const handlePress = () => {
        // Navigate to a venue detail page if it exists, or just log for now
        // Actually, we can push to shows and filter by venue if implemented
        console.log("Venue pressed:", venue.name);
    };

    return (
        <TouchableOpacity className='w-36 mr-4' onPress={handlePress}>
            <View className="rounded-2xl h-36 w-36 mb-2 overflow-hidden bg-neutral-300">
                <Image
                    source={{ uri: PLACEHOLDER_IMAGE }}
                    className="h-full w-full"
                    resizeMode="cover"
                />
            </View>
            <Text className='text-foreground font-semibold text-sm' numberOfLines={1}>
                {venue.name}
            </Text>
            <Text className='text-foreground/60 text-xs' numberOfLines={1}>
                {venue.venue_type || 'Venue'}
            </Text>
        </TouchableOpacity>
    );
}

export function ExploreFavoriteVenues() {
    const [venues, setVenues] = useState<VenueData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchVenues = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetchAuth<{ user: UserData }>('api/users/', { signal: controller.signal });
                if (isMounted) {
                    setVenues(res.user.venues || []);
                }
            } catch (err: any) {
                if (isMounted && err.name !== "AbortError") {
                    setError(err.message || "Failed to fetch favorite venues");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchVenues();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, []);

    if (loading) return <View className="px-4 py-2"><Text className="text-foreground/60">Loading venues...</Text></View>;
    if (error) return <View className="px-4 py-2"><Text className="text-red-500">{error}</Text></View>;
    if (venues.length === 0) return <View className="px-4 py-2"><Text className="text-foreground/40 italic">No favorite venues yet.</Text></View>;

    return (
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='flex-row'>
                {venues.map((venue, index) => (
                    <VenueCard key={index} venue={venue} />
                ))}
            </ScrollView>
        </View>
    );
}
