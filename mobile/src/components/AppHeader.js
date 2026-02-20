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
    userName,
    onOpenRegistration
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

    // Rating State
    const [ratingData, setRatingData] = useState({ average: 0, total: 0 });

    useEffect(() => {
        const fetchRating = async () => {
            try {
                // We need to import authService or similar to get comments, 
                // but AppHeader might not satisfy dependency if we import directly.
                // Better to pass logic or import authService.
                // Assuming authService is available in ../utils/authService
                const { authService } = require('../utils/authService');
                const data = await authService.getComments();
                if (data) {
                    setRatingData({ average: data.averageRating || 5.0, total: data.totalComments || 0 });
                }
            } catch (e) {
                console.log("Error fetching rating", e);
            }
        };

        fetchRating();
        // Poll every minute for updates
        const interval = setInterval(fetchRating, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: scale(15),
            paddingTop: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(50),
            paddingBottom: verticalScale(10),
            backgroundColor: activeColors.cardCtx,
            borderBottomWidth: 1,
            borderBottomColor: activeColors.border,
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
            shadowColor: activeColors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 5,
            elevation: 3,
            zIndex: 10
        }}>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: scale(55), flexDirection: 'column', alignItems: 'center', marginRight: scale(5) }}>
                    <Animated.View style={[{ position: 'absolute', bottom: 30, right: 20 }, getSmokeStyle(smoke1)]}>
                        <Ionicons name="cloud" size={14} color={activeColors.textDark} />
                    </Animated.View>
                    <Animated.View style={[{ position: 'absolute', bottom: 30, left: 20 }, getSmokeStyle(smoke2)]}>
                        <Ionicons name="cloud" size={12} color={activeColors.textDark} />
                    </Animated.View>
                    <Animated.View style={[{ position: 'absolute', bottom: 35, alignSelf: 'center' }, getSmokeStyle(smoke3)]}>
                        <Ionicons name="cloud" size={10} color={activeColors.textDark} />
                    </Animated.View>

                    <Ionicons name="cafe" size={scale(48)} color={activeColors.textDark} />

                    <Animated.Text style={[{ position: 'absolute', bottom: -5, fontSize: scale(10), fontWeight: 'bold', color: activeColors.textDark }, getTextStyle(textAnim)]}>
                        La Tasa
                    </Animated.Text>
                </View>
                <View style={{ marginLeft: scale(12) }}>
                    <Text style={{ color: activeColors.textDark, fontSize: moderateScale(24), fontWeight: '900', letterSpacing: -0.5 }}>
                        La Tasa V2
                    </Text>
                    <Text style={{ color: activeColors.secondary, fontSize: scale(12), opacity: 1, fontWeight: '600' }}>
                        {userName ? `Hola, ${userName}` : 'Tus calculos en tiempo real'}
                    </Text>
                </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {/* Rating Badge */}
                {ratingData.total > 0 && (
                    <View style={{ marginRight: 8, alignItems: 'flex-end' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text style={{ color: activeColors.textDark, fontWeight: 'bold', fontSize: 12, marginLeft: 2 }}>
                                {ratingData.average}
                            </Text>
                        </View>
                        <Text style={{ color: activeColors.secondary, fontSize: 10 }}>
                            {ratingData.total} {ratingData.total === 1 ? 'opinión' : 'opiniones'}
                        </Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={onOpenRegistration}
                    style={{
                        padding: 6,
                        backgroundColor: activeColors.bg,
                        borderRadius: 12,
                        marginRight: 8
                    }}
                >
                    <Ionicons name="gift-outline" size={24} color={activeColors.secondary} />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={setMenuVisible}
                    style={{
                        padding: 6,
                        backgroundColor: activeColors.bg,
                        borderRadius: 12,
                    }}
                >
                    <Ionicons name="settings-sharp" size={24} color={activeColors.secondary} />
                </TouchableOpacity>
            </View>
        </View >
    );
};

export default AppHeader;
