import React from 'react';
import { View, ScrollView } from 'react-native';
import { UserData } from '@/constants/types';
import { GenreCard } from '@/components/ui/genre-card';

export function ExploreFavoriteGenres({ user }: { user: UserData | null }) {
    const genres = user?.genres || [];

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
