import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { apiFetch, apiFetchAuth } from '@/api/api';
import { LinearGradient } from 'expo-linear-gradient';

interface BookmarkResponse {
  bookmarks: Array<{ event_id: string }>;
}

export default function ShowDetailsPage() {
  const {
    showName,
    description,
    start_time,
    cost,
    artist,
    image,
    venue_name,
    venue_id,
    venue_address,
    venue_latitude,
    venue_longtidue,
    venue_type,
    venue_image,
    source_url,
    genres,
    event_id,
  } = useLocalSearchParams();

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Check if event is already bookmarked on mount
  useEffect(() => {
    if (!event_id) {
      console.log('No event_id provided');
      return;
    }

    const checkBookmarkStatus = async () => {
      try {
        const response = await apiFetchAuth<BookmarkResponse>('api/bookmarks');

        const isAlreadyBookmarked = response.bookmarks.some(
          (bookmark) => bookmark.event_id === event_id
        );
        setIsBookmarked(isAlreadyBookmarked);
      } catch (err) {
        console.error('Failed to check bookmark status:', err);
      }
    };

    checkBookmarkStatus();
  }, [event_id]);

  // Get the proper image URL

  const PLACEHOLDER_IMAGE = "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";
  const imgNormalized = Array.isArray(image) ? image[0] : image;
  const imageUri = imgNormalized || PLACEHOLDER_IMAGE;

  // Parse genres if passed as JSON string
  const parsedGenres: string[] = genres
    ? JSON.parse(genres as string)
    : [];

  // Format date to be more readable
  const formatDate = (dateString: string | string[]) => {
    const date = new Date(dateString as string);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string | string[]) => {
    const date = new Date(dateString as string);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Removed getVenueEmoji

  const handleBookmarkToggle = async () => {
    if (!event_id) return;

    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await apiFetchAuth('api/bookmarks', {
          method: 'DELETE',
          body: JSON.stringify({ eventId: event_id }),
        });
      } else {
        await apiFetchAuth('api/bookmarks', {
          method: 'POST',
          body: JSON.stringify({ eventId: event_id }),
        });
      }
      setIsBookmarked(!isBookmarked);
    } catch (err: any) {
      console.error('Bookmark toggle failed:', JSON.stringify(err, null, 2));
      console.error('Event ID was:', event_id);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleVenuePress = () => {
    router.push({
      pathname: '/venues/[venueName]',
      params: {
        venueName: typeof venue_name === 'string' ? venue_name : venue_name?.[0] || '',
        venueID: venue_id,
        address: venue_address,
        created_at: null,
        venueType: venue_type,
        latitude: venue_latitude,
        longitude: venue_longtidue,
        source_url: source_url, // temp
        image: venue_image || image, // securely uses venue_image if available
        description: null
      },
    });
  };

  const handleGetTickets = async () => {
    if (source_url) {
      Linking.openURL(source_url as string);
    }

    // Only create bookmark if not already bookmarked
    if (!isBookmarked && event_id) {
      setBookmarkLoading(true);
      try {
        await apiFetchAuth('api/bookmarks', {
          method: 'POST',
          body: JSON.stringify({ eventId: event_id }),
        });
        setIsBookmarked(true);
      } catch (err) {
        console.error('Failed to bookmark event:', err);
      } finally {
        setBookmarkLoading(false);
      }
    }
  };

  return (
    <>
      <StatusBar style='light' />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero Banner with Image */}
      <View className='bg-accent'>
        <View className='relative h-[42vh]'>
          <Image
            source={{ uri: imageUri }}
            className='w-full h-full'
            resizeMode='cover'
          />
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.95)']}
            locations={[0.2, 0.6, 1]}
            className='absolute inset-0'
          />

          {/* Top Bar - Back & Actions */}
          <View className='absolute top-14 left-0 right-0 px-5 flex-row justify-between items-center'>
            <TouchableOpacity
              onPress={() => router.back()}
              className='bg-black/40 rounded-full p-2.5 backdrop-blur-sm'
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>

            <View className='flex-row gap-3'>
              <TouchableOpacity
                onPress={handleBookmarkToggle}
                disabled={bookmarkLoading}
                className='bg-black/40 rounded-full p-2.5 backdrop-blur-sm'
              >
                <Ionicons
                  name={isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isBookmarked ? "#C4A484" : "white"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Title & Artist */}
          <View className='absolute bottom-0 left-0 right-0 px-6 pb-6'>
            {/* Genre Tags */}
            {parsedGenres.length > 0 && (
              <View className='flex-row flex-wrap gap-2 mb-3'>
                {parsedGenres.slice(0, 3).map((genre, index) => (
                  <View
                    key={index}
                    className='bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm'
                  >
                    <Text className='text-white/90 text-xs font-medium'>{genre}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text className='text-white font-bold text-3xl leading-tight mb-1'>
              {showName}
            </Text>
            {artist && (
              <Text className='text-white/80 text-lg font-medium'>{artist}</Text>
            )}
          </View>
        </View>
      </View>

      <View className='bg-background flex-1'>
        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          {/* Quick Info Cards */}
          <View className='px-6 py-6'>
            <View className='flex-row gap-3'>
              {/* Date Card */}
              <View className='flex-1 bg-secondary/50 rounded-2xl p-4'>
                <View className='flex-row items-center mb-2'>
                  <Ionicons name="calendar" size={18} color="#C4A484" />
                  <Text className='text-accent text-xs font-semibold ml-2 uppercase tracking-wide'>
                    Date
                  </Text>
                </View>
                <Text className='text-foreground font-semibold text-sm'>
                  {start_time ? formatDate(start_time) : 'TBA'}
                </Text>
              </View>

              {/* Time Card */}
              <View className='flex-1 bg-secondary/50 rounded-2xl p-4'>
                <View className='flex-row items-center mb-2'>
                  <Ionicons name="time" size={18} color="#C4A484" />
                  <Text className='text-accent text-xs font-semibold ml-2 uppercase tracking-wide'>
                    Time
                  </Text>
                </View>
                <Text className='text-foreground font-semibold text-sm'>
                  {start_time ? formatTime(start_time) : 'TBA'}
                </Text>
              </View>
            </View>

            {/* Cost Card */}
            {cost && (
              <View className='bg-secondary/50 rounded-2xl p-4 mt-3'>
                <View className='flex-row items-center justify-between'>
                  <View className='flex-row items-center'>
                    <Ionicons name="ticket" size={20} color="#C4A484" />
                    <Text className='text-accent text-xs font-semibold ml-2 uppercase tracking-wide'>
                      Price
                    </Text>
                  </View>
                  <Text className='text-foreground font-bold text-xl'>
                    ${parseFloat(cost as string).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Venue Section */}
          <View className='px-6 pb-6'>
            <Text className='text-foreground text-lg font-bold mb-3'>
              Venue
            </Text>
            <TouchableOpacity onPress={handleVenuePress} className='bg-secondary/50 rounded-2xl p-4 flex-row items-center'>
              <View className='w-14 h-14 rounded-xl items-center justify-center mr-4 overflow-hidden bg-accent/20'>
                {venue_image && typeof venue_image === 'string' && venue_image.length > 5 ? (
                  <Image source={{ uri: venue_image }} className="w-full h-full" resizeMode="cover" />
                ) : (
                  <Ionicons name="location" size={26} color="#C4A484" />
                )}
              </View>
              <View className='flex-1'>
                <Text className='text-foreground font-semibold text-base'>
                  {venue_name || 'Venue TBA'}
                </Text>
                {venue_address && (
                  <Text className='text-muted-foreground text-sm mt-0.5'>
                    {venue_address}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* About Section */}
          {description && (
            <View className='px-6 pb-6'>
              <Text className='text-foreground text-lg font-bold mb-3'>
                About This Event
              </Text>
              <View className='bg-secondary/30 rounded-2xl p-5'>
                <Text className='text-muted-foreground text-base leading-7'>
                  {description}
                </Text>
              </View>
            </View>
          )}

          {/* Spacer for button */}
          <View className='h-28' />
        </ScrollView>

        {/* Fixed Get Tickets Button */}
        <View className='absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm px-6 py-5 border-t border-secondary/30'>
          <TouchableOpacity
            className='bg-accent py-4 rounded-2xl shadow-lg flex-row items-center justify-center'
            onPress={handleGetTickets}
            activeOpacity={0.8}
          >
            <Ionicons name="ticket-outline" size={20} color="white" />
            <Text className='text-white font-bold text-center text-lg ml-2'>
              Get Tickets
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}