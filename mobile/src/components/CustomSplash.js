import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar, Animated, Text, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const CustomSplash = ({ onFinish, theme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    const smoke1 = useRef(new Animated.Value(0)).current;
    const smoke2 = useRef(new Animated.Value(0)).current;
    const smoke3 = useRef(new Animated.Value(0)).current;
    const textAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Master Splash Entrance
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();

        // Smoke Loops
        const animateSmoke = (anim, delay) => {
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(anim, {
                            toValue: 1,
                            duration: 2000,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true
                        })
                    ]),
                    Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true })
                ])
            ).start();
        };

        animateSmoke(smoke1, 0);
        animateSmoke(smoke2, 1200);
        animateSmoke(smoke3, 2400);

        // Shine Loop
        Animated.loop(
            Animated.sequence([
                Animated.delay(2000),
                Animated.timing(textAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true
                }),
                Animated.timing(textAnim, {
                    toValue: 0,
                    duration: 500,
                    easing: Easing.linear,
                    useNativeDriver: true
                })
            ])
        ).start();

        const timer = setTimeout(() => {
            onFinish();
        }, 3000); // 3 seconds

        return () => clearTimeout(timer);
    }, []);

    const getSmokeStyle = (anim) => ({
        opacity: anim.interpolate({
            inputRange: [0, 0.2, 0.5, 1],
            outputRange: [0, 0.8, 0.4, 0]
        }),
        transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -60] }) },
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() * 15 - 7.5] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 3] }) }
        ]
    });

    const getTextStyle = (anim) => ({
        opacity: anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 1, 0.3]
        }),
        transform: [
            { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) },
        ]
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar hidden />
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>

                <View style={{ width: scale(160), alignItems: 'center', marginBottom: 20 }}>
                    <Animated.View style={[{ position: 'absolute', bottom: 70, right: 30 }, getSmokeStyle(smoke1)]}>
                        <Ionicons name="cloud" size={30} color={theme.textDark || theme.text} />
                    </Animated.View>
                    <Animated.View style={[{ position: 'absolute', bottom: 70, left: 30 }, getSmokeStyle(smoke2)]}>
                        <Ionicons name="cloud" size={24} color={theme.textDark || theme.text} />
                    </Animated.View>
                    <Animated.View style={[{ position: 'absolute', bottom: 80, alignSelf: 'center' }, getSmokeStyle(smoke3)]}>
                        <Ionicons name="cloud" size={20} color={theme.textDark || theme.text} />
                    </Animated.View>

                    <Ionicons name="cafe" size={scale(120)} color={theme.textDark || theme.text} />

                    <Animated.Text style={[{ position: 'absolute', bottom: -10, fontSize: scale(24), fontWeight: 'bold', color: theme.textDark || theme.text }, getTextStyle(textAnim)]}>
                        La Tasa
                    </Animated.Text>
                </View>

                <Text style={{ marginTop: 20, color: theme.secondary, fontSize: 14 }}>
                    Cargando información...
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    image: {
        width: width * 0.4, // Smaller for icon
        height: width * 0.4,
    }
});

export default CustomSplash;
