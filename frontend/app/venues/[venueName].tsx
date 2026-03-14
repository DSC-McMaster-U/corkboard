import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { EventData, EventList, UserData } from '@/constants/types';
import { apiFetch, apiFetchAuth } from '@/api/api';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';


// Get venue type emoji
export const getVenueEmoji = (type: string | undefined) => {
  const emojiMap: Record<string, string> = {
    bar: '🍻',
    club: '🎧',
    theater: '🎭',
    venue: '🎸',
    outdoor: '🎪',
    other: '🎤',
  };
  return emojiMap[type || 'other'] || '📍';
};

export default function VenuePage() {
  const { 
    venueName, 
    venueID, 
    address, 
    created_at, 
    venueType,
    latitude,
    longitude,
    source_url,
    image,
    description
  } = useLocalSearchParams();

  const [shows, setShows] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isFavourite, setIsFavourite] = useState(false);
  const [favouriteLoading, setFavouriteLoading] = useState(false);

  const eventLimit = 100;
  
  useEffect(() => {
    // fetching event data from backend
    const controller = new AbortController();
    let isMounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<EventList>(`api/events?limit=${eventLimit}`,
          { signal: controller.signal}
        );
        if (isMounted) {
          //console.log("Fetched events:", res.events);
          const venueShows = (res.events ?? [])
            .filter((e) => String(e.venues?.id) === String(venueID))
            .sort((a, b) => {
              const ta = new Date(a.start_time ?? 0).getTime();
              const tb = new Date(b.start_time ?? 0).getTime();

              // push invalid/missing dates to the end
              if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
              if (!Number.isFinite(ta)) return 1;
              if (!Number.isFinite(tb)) return -1;

              return ta - tb;
            });
          setShows(venueShows);
          console.log("Fetched events for ", venueName, ":", venueShows)
        }
      } catch (err: any) {
        if (isMounted && err.name !== "AbortError") {
          setError(err.message || "Failed to fetch events");
          console.error("Error fetching events:", err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    // Debounce: wait 300ms after range changes before fetching
    const timer = setTimeout(fetchEvents, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
      isMounted = false;
    };
  }, [venueID]);

  type UserDataResponse = {
    success: boolean;
    user: UserData;
  }

  const venueIdParam = Array.isArray(venueID) ? venueID[0] : venueID;

  useFocusEffect(
    useCallback(() => {
      const fetchIsFavourite = async () => {
        if (!venueIdParam) return;
        try {
          setFavouriteLoading(true);
          setError(null);

          const res = await apiFetchAuth<UserDataResponse>('api/users/', {
            method: 'GET',
          });
          const isFav = res.user.venues?.some((v) => String(v.id) === String(venueIdParam));
          setIsFavourite(isFav);
        } catch (err) {
          console.error('Failed to fetch bookmarks:', err);
          setError(err instanceof Error ? err.message : 'Failed to load bookmarks');
        } finally {
          setFavouriteLoading(false);
        }
      };

      fetchIsFavourite();
    }, [venueIdParam])
  );

  const handleFavouriteToggle = async () => {
    if (!venueIdParam) return;
 
    setFavouriteLoading(true);
    try {
      if (isFavourite) {
        await apiFetchAuth('api/users/removeVenue', {
          method: 'DELETE',
          body: JSON.stringify({ venueId: venueIdParam }),
        });
      } else {
        await apiFetchAuth('api/users/addVenue', {
          method: 'POST',
          body: JSON.stringify({ venueId: venueIdParam }),
        });
      }
      setIsFavourite(prev => !prev);
    } catch (err: any) {
      console.error('Favourite toggle failed:', JSON.stringify(err, null, 2));
      console.error('Venue ID was:', venueIdParam);
    } finally {
      setFavouriteLoading(false);
    }
  };

  const handleOpenSite = async () => {
    if (source_url == null) { return }

    const url = Array.isArray(source_url) ? source_url[0] : source_url;
    if (!url) {
      alert('No URL available.');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        alert('Cannot open the source link.');
      }
    } catch (error) {
      alert('Cannot open the source link.');
      console.warn('Error opening source link:', error);
    }
  };
  
  const normalizedVenueType = Array.isArray(venueType) ? venueType[0] : (venueType ?? '');
  const processedVenueType = normalizedVenueType
    ? normalizedVenueType.charAt(0).toUpperCase() + normalizedVenueType.slice(1)
    : "TBD";
   
  const imgNormalized = Array.isArray(image) ? image[0] : image;  
  const PLACEHOLDER_IMAGE = "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";
  const imageUri = imgNormalized || PLACEHOLDER_IMAGE;

  return (
    <>
      <StatusBar style='light'/>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Hero banner with image */}

      
      {/* Header with back button and venue name */}
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
                onPress={handleFavouriteToggle}
                disabled={favouriteLoading}
                className='bg-black/40 rounded-full p-2.5 backdrop-blur-sm'
              >
                <Ionicons
                  name={isFavourite ? "star" : "star-outline"}
                  size={22}
                  color={isFavourite ? "#C4A484" : "white"}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Event Title & Artist */}
          <View className='absolute bottom-0 left-0 right-0 px-6 pb-6'>
            <Text className='text-white font-bold text-3xl leading-tight mb-1'>
              {venueName}
            </Text>
          </View>
        </View>
      </View>

      <View className='bg-background flex-1'>
        <ScrollView className='flex-1' showsVerticalScrollIndicator={false}>
          {/* Venue Details */}
          <View className='px-4 py-4'>
            <View className='bg-secondary/50 rounded-2xl p-4 flex-row items-center'>
              <View className='w-12 h-12 rounded-xl bg-accent/20 items-center justify-center mr-4'>
                <Text className='text-2xl'>{getVenueEmoji(venueType as string)}</Text>
              </View>
              <View className='flex-1'>
                <Text className='text-foreground font-semibold text-base'>
                  {processedVenueType}
                </Text>
                {address && (
                  <View className='flex-row items-start'>
                    <Ionicons name="location-outline" size={18} color="#000000" />
                    <Text className='text-muted-foreground ml-2 text-sm mt-0.5'>
                      {address}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View className='border-b border-secondary/50' />

          {/* About */}
          {description && (
            <View className='px-6 py-8'>
              <Text className='text-foreground text-2xl font-bold mb-4'>
                About This Venue
              </Text>
              <Text className='text-muted-foreground text-base leading-7'>
                {description}
              </Text>
            </View>
          )}

          {/* Map view for location */}
          {latitude && longitude && (
            <View className="px-4 py-4">
              <Text className="text-foreground text-2xl font-bold mb-3">Location</Text>
              <View className="overflow-hidden rounded-2xl h-44">
                <MapView
                  style={{ flex: 1 }}
                  provider={PROVIDER_GOOGLE} 
                  initialRegion={{
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: Number(latitude),
                      longitude: Number(longitude),
                    }}
                    title={venueName as string}
                    description={address as string}
                  />
                </MapView>
              </View>
            </View>
          )}

          {/* Upcoming events at venue */}
          {shows && 
            ( loading ? 
              <Text>Loading events...</Text> :
              <View className="px-6 mt-4">
                <Text className="text-foreground text-2xl font-bold mb-3">
                  Upcoming Events
                </Text>

                <View className="flex-row flex-wrap justify-between">
                  {shows.map((e, index) => (
                    <ShowCard key={String(e.id ?? index)} show={e} />
                  ))}
                </View>
              </View>
            )
          }
          
          {/* Map view for location */}

          {/* Spacer for button */}
          <View className='h-24' />
        </ScrollView>

        {/* Fixed Visit Site Button */}
        {source_url && (
          <View className='absolute bottom-0 left-0 right-0 bg-background px-6 py-5 border-t border-secondary/50'>
            <TouchableOpacity 
              className='bg-primary py-4 rounded-full shadow-lg'
              onPress={() => {
                handleOpenSite()
              }}
            >
              <Text className='text-foreground font-bold text-center text-lg'>
                Visit Venue Site
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
      </View>
    </>
  )
}


interface ShowCardProps {
  show: EventData;
}

const VENUE_PLACEHOLDER_IMAGE =
  "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";

const ShowCard = React.memo(function ShowCard({ show }: ShowCardProps) {
  const imageUri = show.image || VENUE_PLACEHOLDER_IMAGE;

  const handlePress = () => {
    router.push({
      pathname: "/shows/[showName]",
      params: {
        showName: show.title,
          description: show.description || '',
          start_time: show.start_time,
          cost: show.cost?.toString() || '',
          artist: show.artist || '',
          image: show.image || '',
          venue_name: show.venues?.name || '',
          venue_id: show.venues?.id || '',
          venue_address: show.venues?.address || '',
          venue_latitude: show.venues?.latitude?.toString() || '',
          venue_longtidue: show.venues?.longitude?.toString() || '',
          venue_type: show.venues?.venue_type || '',
          source_url: show.source_url || '',
          genres: JSON.stringify(
              (show.event_genres || []).map((eg) => eg.genres?.name || '')
          ),
          event_id: show.id.toString(),
      },
    });
  };

  return (
    <TouchableOpacity className="w-[48%] mb-5" onPress={handlePress}>
      <View className="rounded-2xl aspect-square mb-2 overflow-hidden bg-neutral-300">
        <Image source={{ uri: imageUri }} className="h-full w-full" resizeMode="cover" />
      </View>

      <Text className="text-foreground font-semibold text-sm" numberOfLines={1}>
        {show.title}
      </Text>

      <Text className="text-foreground/60 text-xs mt-1" numberOfLines={2}>
        {show.description}
      </Text>
    </TouchableOpacity>
  );
});