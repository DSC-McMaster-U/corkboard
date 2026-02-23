import { Modal, View, Text, TouchableOpacity, Linking, Image, StyleSheet, ScrollView, Pressable, useColorScheme } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { EventData } from "@/constants/types";
import { formatEventDateTime, formatEventDateTimeToDate, formatEventDateTimeToTime } from "@/scripts/formatDateHelper";
import { Colors } from "@/constants/theme";
import { router } from 'expo-router';


type EventModalProps = {
  visible: boolean;
  onClose: () => void;
  data: EventData | null;
};

const PLACEHOLDER_IMAGE =
  "https://i.scdn.co/image/ab6761610000e5ebc011b6c30a684a084618e20b";

export default function EventModal({ visible, onClose, data }: EventModalProps) {
  if (!data) return null;

  const imageUri = data.image || PLACEHOLDER_IMAGE;
  const venue = data.venues ? data.venues : { name: "Unspecified venue", address: "", venue_type: "" };
  const genresText = data.event_genres && data.event_genres.length > 0
    ? data.event_genres.map((eg) => eg.genres.name).join(", ")
    : "Unspecified";
  const costText = data.cost !== null ? `$${data.cost!.toFixed(2)}` : "Unspecified";
  const descriptionText = data.description ? data.description : "No description available.";
  const sourceUrl = data.source_url ? data.source_url : "https://www.ticketmaster.com";

  const handleVenuePress = () => {
    if (!data.venues) return;

    router.push({
      pathname: '/venues/[venueName]',
      params: {
        venueName: data.venues.name,
        venueID: data.venues.id,
        address: data.venues.address,
        created_at: null,
        venueType: data.venues.venue_type,
        latitude: data.venues.latitude,
        longitude: data.venues.longitude,
        source_url: sourceUrl, // temp
        image: null,
        description: null,
      },
    });
  };

  // console.log("Event data:", JSON.stringify(data, null, 2))

  const handleOpenTickets = async () => {
    try {
      const canOpen = await Linking.canOpenURL(sourceUrl);
      if (canOpen) {
        await Linking.openURL(sourceUrl);
      }
    } catch (error) {
      alert("Cannot open the ticket link.");
      console.warn("Error opening ticket link:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        className="flex-1 bg-black/60 justify-end"
        onPress={onClose}
      >
        {/* Sheet container – stop propagation so taps inside don’t close */}
        <Pressable className="w-full justify-end" onPress={() => {}}>
          <View className="w-full min-h-[75%] rounded-t-3xl rounded-b-lg overflow-hidden bg-[#3e0000]">
            {/* Hero image with overlay + date pill */}
            <View className="w-full h-44 relative overflow-hidden mt-2">
              <Image
                source={{ uri: imageUri }}
                className="w-full h-full"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/25" />
              <View className="absolute bottom-3 left-4 px-3 py-1 rounded-full bg-black/70 flex-row items-center">
                <FontAwesome name="calendar" size={12} color="white" />
                <Text className="text-xs text-white ml-1.5">
                  {formatEventDateTimeToDate(data.start_time)} ·{" "}
                  {formatEventDateTimeToTime(data.start_time)}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="px-4 pt-3 pb-4 flex-1">
              {/* Title + artist */}
              <View className="mb-1">
                <Text
                  className="text-xl font-bold text-white"
                  numberOfLines={2}
                >
                  {data.title}
                </Text>
                <Text
                  className="text-lg mt-0.5 text-neutral-200"
                  numberOfLines={1}
                >
                  {data.artist || "Unspecified artist"}
                </Text>
              </View>

              {/* Venue */}
              <View className="flex-row items-center mt-2">
                <FontAwesome name="map-marker" size={16} color="#f97316" />
                <View className="ml-2 flex-1">
                  {venue?.name ? (
                    <Pressable
                      onPress={handleVenuePress}
                      android_ripple={{ color: 'rgba(249,115,22,0.12)' }}
                      style={({ pressed }) => [
                        { transform: [{ scale: pressed ? 0.97 : 1 }] },
                        pressed ? { opacity: 0.95 } : {},
                      ]}
                      hitSlop={6}
                      accessibilityRole="link"
                    >
                      <Text
                        className="font-medium text-neutral-100 underline decoration-[#f97316] underline-offset-2"
                        numberOfLines={1}
                      >
                        {venue.name}
                      </Text>
                    </Pressable>
                  ) : (
                    <Text
                      className="font-medium text-neutral-100"
                      numberOfLines={1}
                    >
                      Unspecified venue
                    </Text>
                  )}
                  {venue?.address && (
                    <Text
                      className="text-sm mt-0.5 text-neutral-200"
                      numberOfLines={1}
                    >
                      {venue.address}
                    </Text>
                  )}
                </View>
              </View>

              {/* Ticket price */}
              <View className="flex-row items-center mt-2">
                <FontAwesome name="ticket" size={16} color="#f97316" />
                <Text className="ml-2 font-medium text-neutral-100">
                  Ticket Price: {costText}
                </Text>
              </View>

              {/* Genres */}
              <View className="flex-row items-center my-2">
                <FontAwesome name="music" size={16} color="#f97316" />
                <Text
                  className="ml-2 font-medium flex-1 text-neutral-100"
                  numberOfLines={1}
                >
                  {genresText}
                </Text>
              </View>

              {/* Description box */}
              <View className="mt-3 rounded-2xl bg-[#FFF4EA] px-3 py-2 max-h-[50%]">
                <ScrollView>
                  <Text className="text-sm font-semibold text-[#5b3b24] mb-1">
                    Event details
                  </Text>
                  <Text className="text-sm text-[#3b2717] leading-5">
                    {descriptionText}
                  </Text>
                </ScrollView>
              </View>

              {/* Buttons */}
              <View className="flex-row justify-end mt-3 space-x-2">
                <TouchableOpacity
                  onPress={handleOpenTickets}
                  className="rounded-full px-4 py-2 bg-[#f97316]"
                >
                  <Text className="text-white font-semibold text-sm">
                    Buy Tickets
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  className="rounded-full px-4 py-2 bg-neutral-100"
                >
                  <Text className="font-semibold text-sm text-neutral-900">
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

    // old modal design
    // <Modal visible={visible} transparent animationType="slide">
    //   <View
    //     style={{
    //       flex: 1,
    //       justifyContent: "center",
    //       alignItems: "center",
    //       backgroundColor: "rgba(0,0,0,0.5)",
    //     }}
    //   >
    //     <View
    //       style={{
    //         width: 360,
    //         height: 420,
    //         backgroundColor: "#3e0000",
    //         borderRadius: 16,
    //         padding: 20,
    //         elevation: 5,
    //       }}
    //     >
    //       {/* Show Name */}
    //     <Text style={{ position: 'absolute', top: 10, left: 15, fontSize: 18, fontWeight: 'bold', color: 'white' }}>
    //       {data.title}
    //     </Text>

    //     {/* Artist */}
    //     <Text style={{ position: 'absolute', top: 27, left: 15, fontSize: 18, color: 'white'}}>
    //       {data.artist ? data.artist : "Unspecified artist"}
    //     </Text>

    //     {/* Date */}
    //     <View style={{position: 'absolute', top: 78, left: 15, flexDirection: 'row', alignItems: 'center'}}>
    //       <FontAwesome name="calendar" size={14} color="white" />
    //       <Text style={{ fontSize: 14, color: 'white', marginLeft: 6 }}>
    //         {formatEventDateTimeToDate(data.start_time)}
    //       </Text>
    //     </View>

    //     {/* Time */}
    //     <View style={{ position: 'absolute', top: 98, left: 15, flexDirection: 'row', alignItems: 'center'}}>
    //       <FontAwesome name="clock-o" size={14} color="white" />
    //       <Text style={{fontSize: 14, color: 'white', marginLeft: 6}}>
    //         {formatEventDateTimeToTime(data.start_time)}
    //       </Text>
    //     </View>

    //       {/* Location */}
    //     <View style={{ position: 'absolute', top: 60, left: 15, flexDirection: 'row', alignItems: 'center' }}>
    //       <FontAwesome name="map-marker" size={14} color="white" />
    //       <Text style={{ fontSize: 14, color: 'white', marginLeft: 6 }}>
    //         {data.venues.name ? data.venues.name : "Unspecified venue"}
    //       </Text>
    //     </View>

    //       {/* Genre */}
    //     <View
    //       style={{ position: 'absolute', top: 115, left: 15, flexDirection: 'row', alignItems: 'center'}}>
    //       <FontAwesome name="music" size={14} color="white" />
    //       <Text style={{ fontSize: 14, color: 'white', marginLeft: 6 }}>
    //         {data.event_genres && data.event_genres.length > 0
    //           ? data.event_genres.map((eg) => eg.genres.name).join(", ")
    //           : "Unspecified"
    //         }
    //       </Text>
    //     </View>

    //     <Image
    //       source={{ uri: imageUri }} // temp placeholder
    //       style={{width: 124, height: 120, borderRadius: 3, position: 'absolute', top: 14, right: 14 }}
    //     />

    //     {/* Description Box */}  
    //     <View
    //       style={{
    //         position: 'absolute',
    //         top: 170,
    //         left: 20,
    //         width: 310,
    //         height: 160,
    //         backgroundColor: "#FFF0E2",
    //         borderRadius: 16,
    //         padding: 20,
    //         elevation: 5,
    //       }}>
    //         <Text>{`Address: ${data.venues.address ? data.venues.address : "Unspecified address."}`}</Text>
    //         <Text>{`Venue Type: ${data.venues.venue_type ? data.venues.venue_type : "Unspecified type."}`}</Text>
    //         <Text>{`Ticket Price: ${data.cost !== undefined ? `$${data.cost.toFixed(2)}` : "Unspecified cost."}`}</Text>
    //         <Text style={{ marginTop: 10 }}>{data.description ? data.description : "No description available."}</Text>
    //     </View>

    //     {/* Open external link button - for tickets */}
    //     <TouchableOpacity
    //       onPress={() => Linking.openURL("https://www.ticketmaster.com")}
    //       style={{
    //         position: "absolute",
    //         bottom: 15,
    //         left: 20,
    //         alignSelf: "center",
    //         backgroundColor: "#E8894A",
    //         borderRadius: 8,
    //         paddingHorizontal: 20,
    //         paddingVertical: 10,
    //       }}
    //     >
    //       <Text style={{ color: "white", fontWeight: "bold" }}>Buy Tickets</Text>
    //     </TouchableOpacity>
        
      
    //       <TouchableOpacity
    //         onPress={onClose}
    //         style={{
    //           position: "absolute",
    //           bottom: 15,
    //           right: 20,
    //           alignSelf: "center",
    //           backgroundColor: "#3e0000",
    //           borderRadius: 8,
    //           paddingHorizontal: 20,
    //           paddingVertical: 8,
    //         }}
    //       >
    //         <Text style={{ color: "white" }}>Close</Text>
    //       </TouchableOpacity>
    //     </View>
    //   </View>
    // </Modal>
//   );
// }
