import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions, Easing } from 'react-native';

const { width, height } = Dimensions.get('window');

const PRESETS = ['❤️', '💖', '💘', '💝', '💓', '💕', '🌹', '💌'];
const COUNT = 15; // Number of hearts on screen

const Heart = ({ delay, duration, startX, scale }) => {
    const anim = useRef(new Animated.Value(0)).current;
    const emoji = PRESETS[Math.floor(Math.random() * PRESETS.length)];

    useEffect(() => {
        const runAnimation = () => {
            anim.setValue(0);
            Animated.sequence([
                Animated.delay(delay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: duration,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ]).start(() => runAnimation());
        };

        runAnimation();
    }, [delay, duration]);

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [-50, height + 50],
    });

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [startX, startX + (Math.random() * 40 - 20)] // Slight drift
    })

    const opacity = anim.interpolate({
        inputRange: [0, 0.8, 1],
        outputRange: [1, 1, 0]
    })

    return (
        <Animated.Text
            style={[
                styles.heart,
                {
                    transform: [{ translateY }, { translateX }, { scale }],
                    opacity
                },
            ]}
        >
            {emoji}
        </Animated.Text>
    );
};

const ValentineRain = () => {
    const hearts = useRef(
        Array.from({ length: COUNT }).map((_, i) => ({
            id: i,
            delay: Math.random() * 5000,
            duration: 4000 + Math.random() * 3000, // Slow fall
            startX: Math.random() * width,
            scale: 0.8 + Math.random() * 0.7, // Random size
        }))
    ).current;

    return (
        <View style={styles.container} pointerEvents="none">
            {hearts.map((h) => (
                <Heart
                    key={h.id}
                    delay={h.delay}
                    duration={h.duration}
                    startX={h.startX}
                    scale={h.scale}
                />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, // On top of everything
        elevation: 9999,
    },
    heart: {
        position: 'absolute',
        top: 0,
        fontSize: 24,
        color: 'red', // Fallback color, though emojis have their own colors
    },
});

export default ValentineRain;
