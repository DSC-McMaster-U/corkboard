import React from 'react';
import { View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  showBack?: boolean;
};

export function AppHeader({ title, showBack = false }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ backgroundColor: '#3E2723' }}>
      {/* Top brown strip */}
      <View style={{ height: insets.top, backgroundColor: '#3E2723' }} />

      {/* Main header */}
      <View
        style={{
            backgroundColor: '#AE6E4E',
            justifyContent: 'center',
            paddingHorizontal: 16,
            paddingVertical: 20,
        }}
        >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Back button */}
          {showBack && (
            <TouchableOpacity
                onPress={() => router.back()}
                style={{ position: 'absolute', left: 0 }}
            >
                <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            )}

          {/* Title */}
          <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '600' }}>
            {title}
          </Text>

          {/* Profile icon */}
          <TouchableOpacity
            onPress={() => router.push('/account')}
            style={{ position: 'absolute', right: 0 }}
          >
            <Ionicons name="person-circle-outline" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}
