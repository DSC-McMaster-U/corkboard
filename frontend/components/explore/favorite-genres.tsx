import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { router } from 'expo-router';
import { UserData, Genre } from '@/constants/types';
import { apiFetchAuth } from '@/api/api';

import { Ionicons } from '@expo/vector-icons';

import { GenreCard } from '@/components/ui/genre-card';

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
