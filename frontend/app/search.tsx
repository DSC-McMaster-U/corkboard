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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FontAwesome, Feather } from '@expo/vector-icons';
import { apiFetch } from '@/api/api';
import type { EventData, EventList } from '@/constants/types';
import { formatEventDateTimeToDate } from '@/scripts/formatDateHelper';

type Filter = 'none' | 'genre' | 'artist' | 'venue';

const PLACEHOLDER_IMAGE = 'https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b';

const FILTER_OPTIONS: { key: Filter; label: string }[] = [
    { key: 'none', label: 'All' },
    { key: 'artist', label: 'Artist' },
    { key: 'venue', label: 'Venue' },
];

function SearchResultCard({ event, onPress }: { event: EventData; onPress: () => void }) {
    const imageUri = event.image || PLACEHOLDER_IMAGE;
    const venueName = event.venues?.name || 'Unspecified venue';
    const artist = event.artist || 'Unspecified artist';

    const handlePress = () => {
        Keyboard.dismiss();
        router.push({
            pathname: '/shows/[showName]',
            params: {
                showName: event.title,
                description: event.description || '',
                start_time: event.start_time,
                cost: event.cost?.toString() || '',
                artist: event.artist || '',
                image: event.image || '',
                venue_name: event.venues?.name || '',
                venue_id: event.venues?.id || '',
                venue_address: event.venues?.address || '',
                venue_latitude: event.venues?.latitude?.toString() || '',
                venue_longtidue: event.venues?.longitude?.toString() || '',
                venue_type: event.venues?.venue_type || '',
                source_url: event.source_url || '',
                genres: JSON.stringify(
                    (event.event_genres || []).map((eg) => eg.genres?.name || '')
                ),
                event_id: event.id.toString(),
            },
        });
    };

    return (
        <TouchableOpacity onPress={handlePress} className="mb-3">
            <View className="flex-row bg-[#3e0000] rounded-xl p-3">
                <Image source={{ uri: imageUri }} style={{ width: 64, height: 64, borderRadius: 8, marginRight: 12 }} resizeMode="cover" />
                <View className="flex-1 justify-center">
                    <Text className="text-white text-base font-bold" numberOfLines={1}>
                        {event.title}
                    </Text>
                    <Text className="text-neutral-300 text-sm" numberOfLines={1}>
                        {artist}
                    </Text>
                    <View className="flex-row items-center mt-1">
                        <FontAwesome name="map-marker" size={12} color="#ccc" />
                        <Text className="text-neutral-400 text-xs ml-1" numberOfLines={1}>
                            {venueName}
                        </Text>
                        <Text className="text-neutral-500 mx-2">•</Text>
                        <Text className="text-neutral-400 text-xs">
                            {formatEventDateTimeToDate(event.start_time)}
                        </Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export default function SearchScreen() {
    const inputRef = useRef<TextInput>(null);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('none');
    const [events, setEvents] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Auto-focus the input when the screen opens
    useEffect(() => {
        const timer = setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Search logic with debounce
    useEffect(() => {
        if (query.trim().length === 0) {
            setEvents([]);
            setHasSearched(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setLoading(true);
            setHasSearched(true);
            try {
                const res = await apiFetch<EventList>('api/events?limit=50', { signal: controller.signal });

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
                setLoading(false);
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
                <View className="flex-1 flex-row items-center bg-white rounded-xl px-3 py-2">
                    <Feather name="search" size={18} color="#666" />
                    <TextInput
                        ref={inputRef}
                        className="flex-1 ml-2 text-base"
                        placeholder="Search events..."
                        placeholderTextColor="#999"
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
            <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
                {loading && (
                    <View className="py-8 items-center">
                        <ActivityIndicator size="large" color="#411900" />
                    </View>
                )}

                {!loading && hasSearched && events.length === 0 && (
                    <View className="py-8 items-center">
                        <Feather name="search" size={48} color="#ccc" />
                        <Text className="text-neutral-500 mt-3">No results found</Text>
                    </View>
                )}

                {!loading &&
                    events.map((event) => (
                        <SearchResultCard
                            key={event.id}
                            event={event}
                            onPress={() => { }}
                        />
                    ))}

                {/* Spacer for keyboard */}
                <View className="h-32" />
            </ScrollView>


        </SafeAreaView>
    );
}
