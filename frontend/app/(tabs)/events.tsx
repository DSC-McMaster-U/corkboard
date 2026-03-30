import { router } from "expo-router";
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar, ActivityIndicator } from 'react-native';
import { FontAwesome } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import EventModal from '@/components/event-modal';
import BottomPanel from '@/components/bottom-panel/bottom-panel';
import type { EventData, EventList, GenreData, Genre } from "@/constants/types";
import { formatEventDateTimeToDate, formatEventDateTimeToTime } from "@/scripts/formatDateHelper";
import { apiFetch } from "@/api/api";
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventListCard } from "@/components/ui/event-list-card";

type InfoBoxProps = {
  event: EventData;
  onPress: () => void;
}

const PLACEHOLDER_IMAGE =
  "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";

function InfoBox({ event, onPress }: InfoBoxProps) {
  const imageUri = event.image || PLACEHOLDER_IMAGE;
  const venueName = event.venues?.name || "Unspecified venue";
  const artist = event.artist || "Unspecified artist";
  const genresText = event.event_genres && event.event_genres.length > 0
    ? event.event_genres.map((eg) => eg.genres.name).join(", ")
    : "Unspecified";
  const costLabel =
    event.cost == null
      ? "Price TBA"
      : event.cost === 0
        ? "Free"
        : `$${event.cost.toFixed(2)}`;

  return (
    <TouchableOpacity onPress={onPress} className='w-full px-4 mb-3'>
      <View className='w-full flex-row bg-[#3e0000] rounded-xl p-3'>
        {/* left side - text content */}
        <View className='flex-1 justify-between'>
          {/* Title + Artist */}
          <View>
            <Text className='text-white text-lg font-bold' numberOfLines={2}>
              {event.title}
            </Text>
            <Text className='text-neutral-200 text-base mt-0' numberOfLines={1}>
              {artist}
            </Text>
          </View>

          {/* Venue */}
          <View className='flex-row items-center mt-0.5'>
            <FontAwesome name="map-marker" size={14} color="#fff" />
            <Text className='text-white text-sm ml-1.5' numberOfLines={1}>
              {venueName}
            </Text>
          </View>

          {/* Date + time chips */}
          <View className="flex-row items-center mt-0.5">
            <View className="flex-row items-center bg-white/10 rounded-full px-2 py-0.5 mr-1.5">
              <FontAwesome name="calendar" size={11} color="#fff" />
              <Text className="text-white text-xs ml-1">
                {formatEventDateTimeToDate(event.start_time)}
              </Text>
            </View>
            <View className="flex-row items-center bg-white/10 rounded-full px-2 py-0.5">
              <FontAwesome name="clock-o" size={11} color="#fff" />
              <Text className="text-white text-xs ml-1">
                {formatEventDateTimeToTime(event.start_time)}
              </Text>
            </View>
          </View>

          {/* Genres */}
          <View className="mt-1">
            <View className="flex-row items-center">
              <FontAwesome name="music" size={12} color="#fff" />
              <Text
                className="text-white text-xs ml-1.5"
                numberOfLines={1}
              >
                {genresText}
              </Text>
            </View>
          </View>

          {/* Ticket price */}
          {event.cost !== undefined && (
            <View className="flex-row items-center mt-1">
              <FontAwesome name="ticket" size={11} color="#fff" />
              <Text className="text-white text-xs ml-1">
                {costLabel}
              </Text>
            </View>
          )}
        </View>

        {/* right side - image */}
        <Image source={{ uri: imageUri }} className='w-[32%] h-full rounded-lg' resizeMode="cover" />
      </View>
    </TouchableOpacity>
  );
}

type Filter = "none" | "genre" | "artist" | "venue";

export default function EventsScreen() {
  const currentDate: Date = new Date();
  const defaultEndDate: Date = new Date(currentDate.getTime() + 14 * 24 * 60 * 60 * 1000);  // 2 weeks in the future

  const [costRange, setCostRange] = useState<[number, number]>([0, 200]);  // set up state for ticket price slider bar
  const [dateRange, setDateRange] = useState<[Date, Date]>([currentDate, defaultEndDate]);  // state for date range -> bottom panel
  const [searchFilter, setSearchFilter] = useState<Filter>("none")  // state for search filter ("genre", "artist", "venue", "none")
  const [searchQuery, setSearchQuery] = useState<String>("")    // state for search query
  const [selectedEvent, setSelectedEvent] = useState<any>(null); // store event object that user clicks
  const [modalVisible, setModalVisible] = useState(false); // modal state to open/close event popup
  const [eventList, setEvents] = useState<EventData[]>([]); // store events from backend
  const [loading, setLoading] = useState(true);  // tracks if data is still being fetched
  const [error, setError] = useState<string | null>(null); // track errors during data fetching

  const eventLimit = 100;
  const maxCostValue = 200;

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
          const recentShows = (res.events ?? [])
            .sort((a, b) => {   // sort by earliest date first
              const ta = new Date(a.start_time ?? 0).getTime();
              const tb = new Date(b.start_time ?? 0).getTime();

              // push invalid/missing dates to the end
              if (!Number.isFinite(ta) && !Number.isFinite(tb)) return 0;
              if (!Number.isFinite(ta)) return 1;
              if (!Number.isFinite(tb)) return -1;

              return ta - tb;
            })

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

          const filteredShows = recentShows.filter(e => {
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

          setEvents(filteredShows);
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


  return (

    <SafeAreaView className="flex-1" edges={['left', 'right']}>
      <StatusBar barStyle="light-content" />

      <View className="flex-1 bg-[#FFF0E2]">
        <View className="px-4 py-2 bg-[#FFF0E2] pt-2">
          <View className="self-start bg-[#E3C9AF] px-3 py-1 rounded-full">
            <Text className="text-[12px] font-semibold text-[#411900]">
              {`Showing ${eventList.length} ${eventList.length === 1 ? "event" : "events"}`}{' '}
              <Text className="text-[#6a3f1d]">{`· $${costRange[0]}–$${costRange[1]}`}</Text>
            </Text>
          </View>
        </View>

        {/* Upload an event (hardcoded - fix later)*/}
        <View className="px-4 mt-3 mb-5">
        <TouchableOpacity
          onPress={() => router.push("/events/upload")}
          activeOpacity={0.85}
          className="flex-row items-center justify-center bg-[#E2912E] rounded-xl py-4"
        >
          <Text className="text-white font-bold ml-2 text-lg">
            + Submit an Event
          </Text>
        </TouchableOpacity>
      </View>

        <FlatList
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 120, marginHorizontal: 16 }}
          data={eventList}
          keyExtractor={(item) => item.id.toString()}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={10}
          renderItem={({ item }) => <EventListCard event={item} />}
        />

        <EventModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          data={selectedEvent}
        />

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
        {!loading && !error && eventList.length === 0 && (
          <View className="absolute inset-x-4 top-5 rounded-lg bg-black/70 px-3 py-2">
            <Text className="text-white text-center text-sm">
              No events found for this price range.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>

  );
}
