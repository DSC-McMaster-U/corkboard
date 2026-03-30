import React, { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Slider } from '@miblanchard/react-native-slider';
import DateRangePicker from "@/components/bottom-panel/date-range-picker";
import SearchBarFilter from '@/components/bottom-panel/search-bar-filter'; 

type Filter = "none" | "genre" | "artist" | "venue";

type Props = {
  range: [number, number];
  setRange: (r: [number, number]) => void;
  dateRange: [Date, Date];
  setDateRange: (r: [Date, Date]) => void;
  setSearchFilter: (r: Filter) => void;
  setSearchQuery: (r: String) => void;
  maxCostValue: number;
};

export default function BottomPanel({ range, setRange, dateRange, setDateRange, setSearchFilter, setSearchQuery, maxCostValue }: Props) {
  const snapPoints = useMemo(() => ['15%','55%'], []);
  const [searchActive, setSearchActive] = useState(false);
  const dismissRef = useRef<() => void>(() => {});

  return (
    <BottomSheet
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: '#F6D0AE' }}
      handleIndicatorStyle={{ backgroundColor: '#FFF0E2' }}
      keyboardBehavior="interactive"  
      keyboardBlurBehavior="restore"  
    >
      
      <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1 }}
      >
      
        <BottomSheetView style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 }}>

          {/* Full-sheet invisible overlay to dismiss search (shown only when active) */}
          {searchActive && (
            <Pressable
              onPress={() => dismissRef.current?.()}
              style={{
                position: 'absolute',
                left: 0, right: 0, top: 0, bottom: 0,
                // transparent, just to catch taps
                zIndex: 5,          // below the dropdown (which uses zIndex:10)
              }}
            />
          )}

          {/* Search bar */}
          <View style={{ marginBottom: 18 }}>
            <SearchBarFilter
              onSearch={({ query, filter }) => {
                console.log("query: ", query)
                console.log("filter: ", filter)

                setSearchQuery(query)
                setSearchFilter(filter)
                // run your search using { query, filter, range }
              }}
              onActiveChange={setSearchActive}                
              registerDismiss={(fn) => { dismissRef.current = fn; }} 
            />
          </View>

          
          {/* Calendar buttons */}
          <View className='mb-2'>
            <Text style={{ color: '#411900' }} className='font-semibold mb-2 '>Date Range:</Text>
            <DateRangePicker dateRange={dateRange} setDateRange={setDateRange}/>
          </View>

          {/* ticket price slider */}
          <Text style={{ color: '#411900' }} className='font-semibold mt-2'>Ticket price:</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: '#411900' }}>${range[0].toFixed(0)}</Text>
            <Text style={{ color: '#411900' }}>{range[1] == maxCostValue ? "Max" : `$${range[1].toFixed(0)}`}</Text>
          </View>
          <Slider
            value={range}
            onValueChange={(value) => {
              const arr = Array.isArray(value) ? value : [value, value];
              setRange([arr[0] ?? 0, arr[1] ?? arr[0] ?? 0]);
            }}
            minimumValue={0}
            maximumValue={maxCostValue}
            step={1}
            minimumTrackTintColor="#E2912E"
            maximumTrackTintColor="#FFF0E2"
            thumbTintColor="#411900"
            thumbStyle={{ width: 14, height: 14, borderRadius: 7 }}
            thumbTouchSize={{ width: 40, height: 40 }}
            trackStyle={{ height: 3, borderRadius: 2 }}
          />

          </BottomSheetView>
        </KeyboardAvoidingView>
    </BottomSheet>
  );
}
