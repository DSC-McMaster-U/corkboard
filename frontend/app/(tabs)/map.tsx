import { useState, useEffect, use, useRef } from "react";
import { View, Text, StatusBar, ActivityIndicator } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker, Callout } from "react-native-maps";
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomPanel from '@/components/bottom-panel/bottom-panel'; 
import EventModal from '@/components/event-modal'; 
import { apiFetch } from "@/api/api";
import { EventData, EventList, VenueData } from "@/constants/types";
import { formatEventDateTime } from "@/scripts/formatDateHelper";
import { router } from 'expo-router';
import { useNavBarVisibility } from "@/scripts/navBarVisibility";
import { Colors } from "@/constants/theme";
import { getVenueEmoji } from "../venues/[venueName]";
const HAMILTON = { latitude: 43.2557, longitude: -79.8711, latitudeDelta: 0.04, longitudeDelta: 0.04 };
const eventLimit = 100;

type Filter = "none" | "genre" | "artist" | "venue";

export default function MapScreen() {

  const currentDate: Date = new Date();
  const defaultEndDate: Date = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);  // 2 weeks in the future

  const [dateRange, setDateRange] = useState<[Date, Date]>([currentDate, defaultEndDate]);  // state for date range -> bottom panel
  const [costRange, setCostRange] = useState<[number, number]>([0, 200]);
  const [searchFilter, setSearchFilter] = useState<Filter>("none")  // state for search filter ("genre", "artist", "venue", "none")
  const [searchQuery, setSearchQuery] = useState<String>("")    // state for search query
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [events, setEvents] = useState<EventData[]>([]);
  const [venues, setVenues] = useState<VenueData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<MapView>(null);

  const maxCostValue = 200;

  const { hideNavBar, showNavBar } = useNavBarVisibility();
  useEffect(() => {
    if (modalVisible) hideNavBar();
    else showNavBar();
  }, [modalVisible]);

  // fetch events when:
  // - screen first mounds
  // - range changes
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
          let costQuery = "";
          if (costRange[1] == maxCostValue) {
            costQuery = `&min_cost=${costRange[0]}`;
          } else {
            costQuery = `&min_cost=${costRange[0]}&max_cost=${costRange[1]}`;
          }
          const res = await apiFetch<EventList>(`api/events?limit=${eventLimit}${costQuery}&min_start_time=${dateRange[0].toISOString()}&max_start_time=${(new Date(dateRange[1].getTime() + 24 * 60 * 60 * 1000)).toISOString()}`,
            { signal: controller.signal }
          );
        if (isMounted) {
          //console.log("Events received:", res.events);
          const shows = (res.events ?? [])

          const tokens = searchQuery
              .toLowerCase()
              .trim()
              .split(/\s+/)
              .filter(Boolean);            
              
          const includesAllTokens = (haystack: string) =>
            tokens.length === 0 || tokens.every(t => haystack.includes(t));

          const getGenreHaystack = (e: EventData) =>
            (e.event_genres ?? [])
              .map(gd => gd.genres?.name ?? "")
              .join(" ")
              .toLowerCase();

          const getArtistHaystack = (e: EventData) =>
            (e.artist ?? "").toLowerCase();

          const getVenueHaystack = (e: EventData) =>
            (e.venues?.name ?? "").toLowerCase();

          // for "none", search a few useful fields
          const getDefaultHaystack = (e: EventData) =>
            [
              e.title,
              e.description ?? "",
              e.artist ?? "",
              e.venues?.name ?? "",
              ...((e.event_genres ?? []).map(gd => gd.genres?.name ?? "")),
            ]
              .join(" ")
              .toLowerCase();
          
          const filteredShows = shows.filter(e => {
            if (tokens.length === 0) return true;

            switch (searchFilter) {
              case "genre":
                return includesAllTokens(getGenreHaystack(e));
              case "artist":
                return includesAllTokens(getArtistHaystack(e));
              case "venue":
                return includesAllTokens(getVenueHaystack(e));
              case "none":
              default:
                return includesAllTokens(getDefaultHaystack(e));
            }
          });


          const venueList: VenueData[] = []
          let venueMap: Map<string, number> = new Map();
          filteredShows.forEach(e => {
            const id: string = e.venues?.id;
            if (id && venueMap.has(id)) {
              if (venueMap.get(id) == 1) venueList.push(e.venues)
              venueMap.set(id, venueMap.get(id)! + 1);
            } else if (id && !venueMap.has(id)) {
              venueMap.set(id, 1);
            }
          });
          // console.log('venue map: ', venueMap)


          // if multiple events at same venue, just place marker for venue
          const uniqueVenueEvents = filteredShows.filter(e => {
            if (venueMap.has(e.venues?.id) && venueMap.get(e.venues.id)! > 1) return false
            else return true
          })

          // console.log('events: ', uniqueVenueEvents);
          // console.log('venues: ', venueList);

          setEvents(uniqueVenueEvents);
          setVenues(venueList)
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
  }, [costRange, dateRange, searchFilter, searchQuery]);

  // Helper function to generate random coordinates around Hamilton
  const getRandomCoordinate = (base: number, offset: number) => base + Math.random() * offset;

  const handleVenuePress = (v: VenueData) => {
    if (!v) return;

    router.push({
      pathname: '/venues/[venueName]',
      params: {
        venueName: v.name,
        venueID: v.id,
        address: v.address,
        created_at: null,
        venueType: v.venue_type,
        latitude: v.latitude,
        longitude: v.longitude,
        source_url: "ticketmaster.com/", // temp
        image: null,
        description: null,
      },
    });
  };

  const HAMILTON_BOUNDS = {
    northEast: { latitude: 43.30, longitude: -79.80 },
    southWest: { latitude: 43.20, longitude: -79.95 },
  };
  const MIN_ZOOM = 12;
  const MAX_ZOOM = 17;

  const hidePOIStyle = [
    {
      featureType: "poi",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.business",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi.park",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      elementType: "all",
      stylers: [{ visibility: "off" }]
    }
  ];

  return (
    <SafeAreaView className="flex-1" edges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#411900" />

      
      <View className="flex-1">
        {/* Map */}
        <MapView style={{ flex: 1 }} 
          provider={PROVIDER_GOOGLE} 
          initialRegion={HAMILTON} 
          customMapStyle={hidePOIStyle}
          showsPointsOfInterest={false} 
          showsBuildings={false}
          minZoomLevel={MIN_ZOOM} 
          maxZoomLevel={MAX_ZOOM} 
          onRegionChangeComplete={region => {
            // ensure the map stays within hamilton
            let latitude = Math.max(HAMILTON_BOUNDS.southWest.latitude, Math.min(HAMILTON_BOUNDS.northEast.latitude, region.latitude));
            let longitude = Math.max(HAMILTON_BOUNDS.southWest.longitude, Math.min(HAMILTON_BOUNDS.northEast.longitude, region.longitude));
            if (latitude !== region.latitude || longitude !== region.longitude) {
              mapRef.current?.animateToRegion({...region, latitude, longitude });
            }
          }}
          ref={mapRef}
        >
          {events.map((e, idx) => (   // map events with unique venues
            <Marker 
              key={`e-${e.id}`} 
              coordinate={{ 
              latitude: typeof e.venues?.latitude === 'number'
                ? e.venues.latitude
                : getRandomCoordinate(43.25, 0.01),
              longitude: typeof e.venues?.longitude === 'number'
                ? e.venues.longitude
                : getRandomCoordinate(-79.88, 0.01),
              }}
              title={e.title}
              // description={`${formatEventDateTime(e.start_time)} • ${e.description}`}
              onPress={() => {
                setSelectedEvent(e);
                setModalVisible(true);
              }}
            />
          ))}
          {venues.map((v, idx) => ( // map venues in place of events with nonunique venues
            <Marker 
              key={`v-${v.id}`}
              coordinate={{ 
                latitude: typeof v.latitude === 'number'
                  ? v.latitude
                  : getRandomCoordinate(43.25, 0.01), //temp
                longitude: typeof v.longitude === 'number'
                  ? v.longitude
                  : getRandomCoordinate(-79.88, 0.01), //temp
              }}
              // title={v.name}
              onPress={() => {
                handleVenuePress(v);
              }}
            >
              <View className="items-center justify-center">
                <View className="rounded-full bg-slate-50 p-1 border-1 border-black shadow-2xl drop-shadow-2xl">
                  <Text className='text-2xl'>{getVenueEmoji(v.venue_type as string)}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        <EventModal visible={modalVisible} onClose={() => setModalVisible(false)} data={selectedEvent}/>
    
        {/* Bottom panel */}
        <BottomPanel range={costRange} setRange={setCostRange} dateRange={dateRange} setDateRange={setDateRange} setSearchFilter={setSearchFilter} setSearchQuery={setSearchQuery} maxCostValue={maxCostValue} />

        {/* Loading overlay */}
        {loading && (
          <View className="absolute inset-0 justify-center items-center bg-black/40">
            <ActivityIndicator size="large" />
            <Text className="text-white mt-2">Loading events...</Text>
          </View>
        )}

        {/* Error banner */}
        {error && !loading && (
          <View className="absolute inset-x-4 top-5 rounded-lg bg-red-800/90 px-3 py-2">
            <Text className="text-white text-center text-sm">{error}</Text>
          </View>
        )}

        {/* No results banner */}
        {!loading && !error && (events.length === 0 && venues.length === 0) && (
          <View className="absolute inset-x-4 top-5 rounded-lg bg-black/70 px-3 py-2">
            <Text className="text-white text-center text-sm">
              No events found for these filters.
            </Text>
          </View>
        )}
      </View>
      
    </SafeAreaView>
  );
}
