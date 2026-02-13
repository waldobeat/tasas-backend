import React, { useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Vibration, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../styles/theme';

const AppHeader = ({
    date,
    valueDate,
    activeColors,
    setMenuVisible,
    updateTag = "CLEAN START (V12)",
    isAdFree = false
}) => {
    const smoke1 = useRef(new Animated.Value(0)).current;
    const smoke2 = useRef(new Animated.Value(0)).current;
    const smoke3 = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between', // Changed to space-between
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
                <View style={{ width: scale(55), height: scale(55), justifyContent: 'flex-end', alignItems: 'center', marginRight: scale(5) }}>
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
                </View>
                <View style={{ marginLeft: scale(12) }}>
                    <Text style={{ color: activeColors.textDark, fontSize: moderateScale(24), fontWeight: '900', letterSpacing: -0.5 }}>
                        La Tasa
                    </Text>
                    <Text style={{ color: activeColors.secondary, fontSize: scale(12), opacity: 1, fontWeight: '600' }}>
                        Tus calculos en tiempo real
                    </Text>
                </View>
            </View>

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
        </View >
    );
};

export default AppHeader;
