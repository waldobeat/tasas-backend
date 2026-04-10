import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Vibration, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../styles/theme';

const AppHeader = ({
    date,
    valueDate,
    activeColors,
    setMenuVisible,
    updateTag = "CLEAN START (V12)",
    isAdFree = false,
    theme
}) => {
    // Smoke animations
    const smoke1 = useRef(new Animated.Value(0)).current;
    const smoke2 = useRef(new Animated.Value(0)).current;
    const smoke3 = useRef(new Animated.Value(0)).current;

    // Text animation
    const textAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Smoke Loop
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

        // Text Loop
        // Text "Shine/Brillo" Loop
        Animated.loop(
            Animated.sequence([
                Animated.delay(2000), // Wait a bit between shines
                Animated.timing(textAnim, {
                    toValue: 1,
                    duration: 500, // Fast wipe
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
    }, []);

    const getSmokeStyle = (anim) => ({
        opacity: anim.interpolate({
            inputRange: [0, 0.2, 0.5, 1],
            outputRange: [0, 0.8, 0.4, 0]
        }),
        transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -25] }) },
            { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.random() * 5 - 2.5] }) },
            { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 2] }) }
        ]
    });

    const getTextStyle = (anim) => ({
        opacity: anim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 1, 0.3] // Glimmer: Dim -> Bright -> Dim
        }),
        transform: [
            { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.15, 1] }) }, // Pop a bit when bright
        ]
    });

    // Gift Animation (Wobble/Pulse)
    const giftAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const wobble = Animated.sequence([
            Animated.timing(giftAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
            Animated.timing(giftAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
            Animated.timing(giftAnim, { toValue: 0.5, duration: 100, useNativeDriver: true }),
            Animated.timing(giftAnim, { toValue: -0.5, duration: 100, useNativeDriver: true }),
            Animated.timing(giftAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
            Animated.delay(2000) // Wait before next wiggle
        ]);
        Animated.loop(wobble).start();
    }, []);

    const getGiftStyle = () => ({
        transform: [
            { rotate: giftAnim.interpolate({ inputRange: [-1, 1], outputRange: ['-15deg', '15deg'] }) },
            { scale: giftAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }
        ]
    });

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: scale(20),
            paddingTop: Platform.OS === 'ios' ? verticalScale(50) : verticalScale(60),
            paddingBottom: verticalScale(15),
            backgroundColor: 'transparent', // Glass effect handled globally
            zIndex: 10
        }}>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>

                    {/* Coffee and Smoke Logo */}
                    <View style={{ width: scale(55), flexDirection: 'column', alignItems: 'center', marginRight: scale(10) }}>
                        <Animated.View style={[{ position: 'absolute', bottom: 30, right: 20 }, getSmokeStyle(smoke1)]}>
                            <Ionicons name="cloud" size={14} color={theme.primary} />
                        </Animated.View>
                        <Animated.View style={[{ position: 'absolute', bottom: 30, left: 20 }, getSmokeStyle(smoke2)]}>
                            <Ionicons name="cloud" size={12} color={theme.primary} />
                        </Animated.View>
                        <Animated.View style={[{ position: 'absolute', bottom: 35, alignSelf: 'center' }, getSmokeStyle(smoke3)]}>
                            <Ionicons name="cloud" size={10} color={theme.primary} />
                        </Animated.View>

                        <Ionicons name="cafe" size={scale(48)} color={activeColors.textDark} />
                    </View>

                    <View>
                        <Animated.Text style={[{
                            color: activeColors.textDark,
                            fontSize: moderateScale(32),
                            fontWeight: '900',
                            letterSpacing: -1,
                            textShadowColor: theme.primary,
                            textShadowOffset: { width: 0, height: 0 },
                            textShadowRadius: 10
                        }, getTextStyle(textAnim)]}>
                            La Tasa
                        </Animated.Text>
                        <Text style={{ color: activeColors.secondary, fontSize: scale(11), fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
                            Mercado en Tiempo Real
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        onPress={setMenuVisible}
                        style={{
                            padding: 10,
                            backgroundColor: activeColors.cardCtx,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: activeColors.border
                        }}
                    >
                        <Ionicons name="options-outline" size={24} color={activeColors.textDark} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

export default AppHeader;
