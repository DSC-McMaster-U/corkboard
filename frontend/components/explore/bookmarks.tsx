import React, { useState, useCallback } from 'react';
import { Text, TouchableOpacity, View, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiFetchAuth } from '@/api/api';
import { useFocusEffect } from 'expo-router';
import { EventData } from '@/constants/types';

// API response types for bookmarks endpoint
interface BookmarkResponse {
    user_id: string;
    event_id: string;
    created_at: string;
    events: EventData;
}

interface ApiBookmarksResponse {
    bookmarks: BookmarkResponse[];
}

interface BookmarkCardProps {
    event: EventData;
    onRemove: (eventId: string) => void;
    isRemoving: boolean;
    hasFailed: boolean;
}

function BookmarkCard({ event, onRemove, isRemoving, hasFailed }: BookmarkCardProps) {
    const handleOnPress = () => {
        // Extract genre names from the event_genres array
        const genreNames = event.event_genres?.map((g) => g.genres.name) || [];

        router.push({
            pathname: '/shows/[showName]',
            params: {
                showName: event.title,
                description: event.description,
                start_time: event.start_time,
                cost: event.cost,
                artist: event.artist,
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

    const handleRemoveBookmark = () => {
        onRemove(event.id.toString());
    };

    // Format subtitle
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

    const subtitle = `${event.venues?.name || 'Unknown Venue'} • ${formatDate(event.start_time)}`;

    return (
        <TouchableOpacity onPress={handleOnPress} activeOpacity={0.7}>
            <View className="flex-row items-center bg-secondary rounded-xl px-3 py-2 mb-2">
                {/* Event Image */}
                <View className="w-10 h-10 rounded-lg overflow-hidden bg-accent/30 items-center justify-center mr-3">
                    {event.image ? (
                        <Image
                            source={{ uri: event.image }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Text className="text-lg">🎵</Text>
                    )}
                </View>

                {/* Content */}
                <View className="flex-1">
                    <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
                        {event.title}
                    </Text>
                    <Text className="text-foreground/60 text-xs" numberOfLines={1}>
                        {subtitle}
                    </Text>
                </View>

                {/* Bookmark Icon - Toggleable */}
                <View className="relative">
                    {hasFailed && (
                        <View className="absolute -top-8 right-0 bg-red-500 px-2 py-1 rounded-md">
                            <Text className="text-white text-xs">Failed</Text>
                        </View>
                    )}
                    <TouchableOpacity
                        onPress={handleRemoveBookmark}
                        disabled={isRemoving}
                        className="ml-2 p-1"
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons
                            name="bookmark"
                            size={16}
                            color={isRemoving ? '#999' : hasFailed ? '#ef4444' : '#411900'}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
}

export function Bookmarks() {
    const [bookmarks, setBookmarks] = useState<EventData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
    const [failedIds, setFailedIds] = useState<Set<string>>(new Set());

    const removeBookmark = async (eventId: string) => {
        // Clear any previous error for this item
        setFailedIds((prev) => {
            const next = new Set(prev);
            next.delete(eventId);
            return next;
        });

        setRemovingIds((prev) => new Set(prev).add(eventId));

        try {
            await apiFetchAuth('api/bookmarks', {
                method: 'DELETE',
                body: JSON.stringify({ eventId }),
            });

            // Remove from state on success
            setBookmarks((prev) => prev.filter((b) => b.id.toString() !== eventId));
        } catch (err) {
            console.error('Failed to remove bookmark:', err);
            // Mark this item as failed
            setFailedIds((prev) => new Set(prev).add(eventId));
            // Auto-clear the error after 3 seconds
            setTimeout(() => {
                setFailedIds((prev) => {
                    const next = new Set(prev);
                    next.delete(eventId);
                    return next;
                });
            }, 3000);
        } finally {
            setRemovingIds((prev) => {
                const next = new Set(prev);
                next.delete(eventId);
                return next;
            });
        }
    };

    useFocusEffect(
        useCallback(() => {
            const fetchBookmarks = async () => {
                try {
                    setLoading(true);
                    setError(null);

                    const response = await apiFetchAuth<ApiBookmarksResponse>('api/bookmarks');

                    // Extract events from bookmarks response
                    const eventsMap = new Map<string, EventData>();
                    response.bookmarks.forEach((bookmark) => {
                        if (!bookmark.events) {
                            console.warn('Bookmark missing event data:', bookmark.event_id);
                            return; // Skip bookmarks without event data
                        }
                        
                        // Use the UUID directly from the bookmark events (bookmark.event_id should match)
                        const eventId = String(bookmark.events.id);
                        eventsMap.set(eventId, {
                            ...bookmark.events,
                            id: String(bookmark.events.id), // Keep as string ID to match backend UUID
                        } as any);
                    });
                    const events: EventData[] = Array.from(eventsMap.values());

                    setBookmarks(events);
                } catch (err) {
                    console.error('Failed to fetch bookmarks:', err);
                    setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
                } finally {
                    setLoading(false);
                }
            };

            fetchBookmarks();
        }, [])
    );

    return (
        <View>
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg text-foreground font-semibold tracking-wide">
                    Events you've bookmarked
                </Text>
                {/*
                <TouchableOpacity>
                    <Text className="text-accent font-medium">View all</Text>
                </TouchableOpacity>
                */}
            </View>

            {/* Bookmark List */}
            <View>
                {loading ? (
                    <View className="py-8 items-center">
                        <ActivityIndicator size="small" color="#C4A484" />
                        <Text className="text-foreground/60 mt-2">Loading bookmarks...</Text>
                    </View>
                ) : error ? (
                    <View className="py-8 items-center">
                        <Text className="text-red-500">{error}</Text>
                    </View>
                ) : bookmarks.length === 0 ? (
                    <View className="py-8 items-center">
                        <Text className="text-foreground/60">No bookmarks yet</Text>
                    </View>
                ) : (
                    bookmarks.map((event) => (
                        <BookmarkCard
                            key={event.id}
                            event={event}
                            onRemove={removeBookmark}
                            isRemoving={removingIds.has(event.id.toString())}
                            hasFailed={failedIds.has(event.id.toString())}
                        />
                    ))
                )}
            </View>
        </View>
    );
}
