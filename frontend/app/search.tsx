import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Keyboard,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { apiFetch } from '@/api/api';
import type { EventData, EventList } from '@/constants/types';
import { formatEventDateTimeToDate } from '@/scripts/formatDateHelper';

type Filter = 'none' | 'genre' | 'artist' | 'venue';

const PLACEHOLDER_IMAGE = 'https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b';

import { EventListCard } from '@/components/ui/event-list-card';

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
    { key: 'none', label: 'All' },
    { key: 'artist', label: 'Artist' },
    { key: 'venue', label: 'Venue' },
];

export default function SearchScreen() {
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('none');
    const [events, setEvents] = useState<EventData[]>([]);
    const [queryLoading, setQueryLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-focus the input when the screen opens
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Fetch all events on mount and when query is empty
    useEffect(() => {
        const controller = new AbortController();
        async function fetchAllEvents() {
            setQueryLoading(true);
            try {
                const res = await apiFetch<EventList>('api/events?limit=50&archived=false', { signal: controller.signal });
                setEvents(res.events ?? []);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Fetch all events error:', err);
                }
            } finally {
                setQueryLoading(false);
                setHasSearched(false);
            }
        }
        if (query.trim().length === 0) {
            fetchAllEvents();
            return () => controller.abort();
        }

        const timer = setTimeout(async () => {
            setQueryLoading(true);
            setHasSearched(true);
            try {
                const res = await apiFetch<EventList>('api/events?limit=50&archived=false', { signal: controller.signal });

                const tokens = query.toLowerCase().trim().split(/\s+/).filter(Boolean);

                const includesAllTokens = (haystack: string) =>
                    tokens.length === 0 || tokens.every((t) => haystack.includes(t));

                const getGenreHaystack = (e: EventData) =>
                    (e.event_genres ?? []).map((gd) => gd.genres?.name ?? '').join(' ').toLowerCase();

                const getArtistHaystack = (e: EventData) => (e.artist ?? '').toLowerCase();

                const getVenueHaystack = (e: EventData) => (e.venues?.name ?? '').toLowerCase();

                const getDefaultHaystack = (e: EventData) =>
                    [
                        e.title,
                        e.description ?? '',
                        e.artist ?? '',
                        e.venues?.name ?? '',
                        ...((e.event_genres ?? []).map((gd) => gd.genres?.name ?? '')),
                    ]
                        .join(' ')
                        .toLowerCase();

                const filtered = (res.events ?? []).filter((e) => {
                    switch (filter) {
                        case 'genre':
                            return includesAllTokens(getGenreHaystack(e));
                        case 'artist':
                            return includesAllTokens(getArtistHaystack(e));
                        case 'venue':
                            return includesAllTokens(getVenueHaystack(e));
                        case 'none':
                        default:
                            return includesAllTokens(getDefaultHaystack(e));
                    }
                });

                setEvents(filtered);
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error('Search error:', err);
                }
            } finally {
                setQueryLoading(false);
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query, filter]);

    return (
        <SafeAreaView className="flex-1 bg-[#FFF0E2]" edges={['top', 'left', 'right']}>
            {/* Header with back button and search input */}
            <View className="flex-row items-center px-4 py-3">
                <TouchableOpacity onPress={() => router.back()} className="mr-3" hitSlop={12}>
                    <Feather name="arrow-left" size={24} color="#411900" />
                </TouchableOpacity>
                <View className="flex-1 flex-row items-center bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-[#E3C9AF]/30">
                    <Feather name="search" size={18} color="#666" />
                    <TextInput
                        ref={inputRef}
                        className="flex-1 ml-3 text-base text-[#411900]"
                        placeholder="Search events..."
                        placeholderTextColor="#9a7b68"
                        value={query}
                        onChangeText={setQuery}
                        returnKeyType="search"
                        autoCorrect={false}
                    />
                    {query.length > 0 && (
                        <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                            <Feather name="x" size={18} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter tabs */}
            <View className="flex-row px-4 pb-3">
                {FILTER_OPTIONS.map((opt) => (
                    <TouchableOpacity
                        key={opt.key}
                        onPress={() => setFilter(opt.key)}
                        className={`mr-2 px-4 py-2 rounded-full ${filter === opt.key ? 'bg-[#411900]' : 'bg-[#E3C9AF]'
                            }`}
                    >
                        <Text
                            className={`text-sm font-medium ${filter === opt.key ? 'text-white' : 'text-[#411900]'
                                }`}
                        >
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Results */}
            {queryLoading && (
                <View className="py-8 items-center">
                    <ActivityIndicator size="large" color="#411900" />
                </View>
            )}

            {!queryLoading && hasSearched && events.length === 0 && (
                <View className="py-8 items-center">
                    <Feather name="search" size={48} color="#ccc" />
                    <Text className="text-neutral-500 mt-3">No results found</Text>
                </View>
            )}

            {!queryLoading && events.length > 0 && (
                <FlatList
                    className="flex-1 px-4"
                    keyboardShouldPersistTaps="handled"
                    data={events}
                    keyExtractor={(item) => item.id.toString()}
                    initialNumToRender={10}
                    renderItem={({ item }) => <EventListCard event={item} />}
                    ListFooterComponent={<View className="h-32" />}
                />
            )}


        </SafeAreaView>
    );
}
