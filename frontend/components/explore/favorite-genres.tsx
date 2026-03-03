import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { router } from 'expo-router';
import { UserData, Genre } from '@/constants/types';
import { apiFetchAuth } from '@/api/api';

import { Ionicons } from '@expo/vector-icons';

interface GenreCardProps {
    genre: Genre;
}

function GenreCard({ genre }: GenreCardProps) {
    const handlePress = () => {
        router.push(`/events/genre/${genre.id}`);
    };

    return (
        <View className='w-36 mr-4'>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                className='w-36 h-36 bg-[#9A6348] rounded-2xl p-4 justify-between shadow-sm'
            >
                <View className='items-end'>
                    <Ionicons name="musical-notes-outline" size={28} color="white" style={{ opacity: 0.8 }} />
                </View>

                <Text
                    className='text-white font-bold text-base leading-5'
                    numberOfLines={2}
                >
                    {genre.name}{'\n'}Shows
                </Text>
            </TouchableOpacity>

            <Text className='mt-2 text-foreground/60 text-xs' numberOfLines={2}>
                Local Hamilton {genre.name} shows near you...
            </Text>
        </View>
    );
}

export function ExploreFavoriteGenres() {
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        let isMounted = true;

        const fetchUserGenres = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await apiFetchAuth<{ user: UserData }>('api/users/', { signal: controller.signal });
                if (isMounted) {
                    setGenres(res.user.genres || []);
                }
            } catch (err: any) {
                if (isMounted && err.name !== "AbortError") {
                    setError(err.message || "Failed to fetch favorite genres");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUserGenres();

        return () => {
            controller.abort();
            isMounted = false;
        };
    }, []);

    if (loading) return null; // Keep it quiet during load
    if (error) return null;
    if (genres.length === 0) return null;

    return (
        <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className='flex-row py-2'>
                {genres.map((genre) => (
                    <GenreCard key={genre.id} genre={genre} />
                ))}
            </ScrollView>
        </View>
    );
}
