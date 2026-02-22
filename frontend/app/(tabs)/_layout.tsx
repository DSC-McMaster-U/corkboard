import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { navBarStyle } from '@/scripts/navBarStyle';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/components/header'


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const router = useRouter();

  const lightBar = '#F5E2D2';
  const darkBar = '#111111';

  const size = 26;

  return (
    <Tabs
      screenOptions={{


        tabBarButton: HapticTab,
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: [
          navBarStyle,
          { backgroundColor: colorScheme === 'dark' ? darkBar : lightBar },
        ],
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      {/* <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      /> */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Explore',
          header: () => <AppHeader title = "Explore" />,
          tabBarIcon: ({ color }) => ( <Ionicons size={size} name="search" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Shows Near You',
          header: () => <AppHeader title = "Shows Near You"/>,
          tabBarIcon: ({ color }) => (<Ionicons size={size} name="calendar" color={color} />),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          header: () => <AppHeader title = "Map" />,
          tabBarIcon: ({ color }) => (<Ionicons size={size} name="map" color={color} />),
        }}
      />
    </Tabs>
  );
}
