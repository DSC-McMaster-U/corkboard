import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

function SkeletonBox({ width, height, borderRadius = 8, style }: {
    width: number | string;
    height: number | string;
    borderRadius?: number;
    style?: any;
}) {
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: '#d4c4b0',
                    opacity,
                },
                style,
            ]}
        />
    );
}

export function BookmarkSkeleton() {
    return (
        <View style={{ gap: 8 }}>
            {[0, 1, 2].map((i) => (
                <View
                    key={i}
                    className="flex-row items-center bg-secondary rounded-xl px-3 py-2"
                >
                    <SkeletonBox width={40} height={40} borderRadius={8} />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                        <SkeletonBox width="70%" height={14} borderRadius={4} />
                        <SkeletonBox width="50%" height={10} borderRadius={4} style={{ marginTop: 6 }} />
                    </View>
                    <SkeletonBox width={16} height={16} borderRadius={4} style={{ marginLeft: 8 }} />
                </View>
            ))}
        </View>
    );
}

export function ShowCardSkeleton({ count = 4 }: { count?: number }) {
    return (
        <View style={{ flexDirection: 'row' }}>
            {Array.from({ length: count }).map((_, i) => (
                <View key={i} style={{ width: 144, marginRight: 16 }}>
                    <SkeletonBox width={144} height={144} borderRadius={16} />
                    <SkeletonBox width={100} height={12} borderRadius={4} style={{ marginTop: 8 }} />
                    <SkeletonBox width={120} height={10} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
            ))}
        </View>
    );
}
