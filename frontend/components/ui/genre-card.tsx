import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Genre } from '@/constants/types';
import { Ionicons } from '@expo/vector-icons';

export interface GenreCardProps {
    genre: Genre;
}

export function GenreCard({ genre }: GenreCardProps) {
    const handlePress = () => {
        router.push(`/events/genre/${genre.id}`);
    };

    return (
        <View className='w-36 mr-4'>
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={handlePress}
                className='w-36 h-36 bg-[#9A6348] rounded-2xl p-4 justify-between'
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
