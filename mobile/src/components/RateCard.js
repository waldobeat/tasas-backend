import React, { useEffect, useRef, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { formatNumber } from '../utils/helpers';
import Calculator from './Calculator';

const RateCard = forwardRef(({
    id,
    title,
    subtitle,
    rateValue,
    isActive,
    onToggle,
    onShare,
    theme,
    activeColors,
    delay = 0 // Stagger animation start
}, ref) => {
    const isUSD = id.includes('usd');
    const currencyIcon = isUSD ? "logo-usd" : "logo-euro";
    const flagEmoji = isUSD ? "🇺🇸" : "🇪🇺";
    const displayRate = formatNumber(rateValue);

    // Local Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const bobAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Pulse Animation Loop
        const animatePulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000, // Slightly different durations for variety can be passed as prop if needed
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );

        // Bobbing Animation for button
        const animateBob = Animated.loop(
            Animated.sequence([
                Animated.timing(bobAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(bobAnim, {
                    toValue: 0,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );

        // Stagger start
        const timer = setTimeout(() => {
            animatePulse.start();
            animateBob.start();
        }, delay);

        return () => {
            clearTimeout(timer);
            pulseAnim.stopAnimation();
            bobAnim.stopAnimation();
        };
    }, []);

    return (
        <Animated.View
            ref={ref}
            style={[
                styles.cardContainer,
                {
                    backgroundColor: activeColors.cardCtx,
                    shadowColor: activeColors.shadow,
                    borderColor: activeColors.border,
                }
            ]}
        >
            <View style={[styles.cardAccent, { backgroundColor: theme.primary }]} />

            <View style={{ flex: 1, padding: scale(20) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                            backgroundColor: theme.primarySoft,
                            width: scale(45),
                            height: scale(45),
                            borderRadius: 15,
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: scale(12)
                        }}>
                            <Ionicons name={currencyIcon} size={scale(24)} color={theme.primary} />
                        </View>
                        <View>
                            <Text style={{ color: activeColors.secondary, fontSize: scale(11), fontWeight: '900', letterSpacing: 1 }}>{title} {flagEmoji}</Text>
                            <Text style={{ color: activeColors.textDark, fontSize: moderateScale(16), fontWeight: '800' }}>{subtitle}</Text>
                        </View>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: moderateScale(28), color: activeColors.textDark, fontWeight: '800', letterSpacing: -0.5 }}>
                            {displayRate}
                            <Text style={{ fontSize: scale(14), color: activeColors.secondary, fontWeight: '700' }}> Bs</Text>
                        </Text>

                        <TouchableOpacity
                            onPress={() => onToggle(id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.primary,
                                paddingHorizontal: scale(16),
                                paddingVertical: scale(10),
                                borderRadius: 15,
                                marginTop: scale(5),
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                                elevation: 5
                            }}
                        >
                            <Animated.View style={{
                                transform: [
                                    {
                                        scale: bobAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.3]
                                        })
                                    },
                                    {
                                        rotate: bobAnim.interpolate({
                                            inputRange: [0, 0.5, 1],
                                            outputRange: ['0deg', '15deg', '0deg']
                                        })
                                    }
                                ],
                                marginRight: 6
                            }}>
                                <Ionicons
                                    name={isActive ? "chevron-up" : "calculator"}
                                    size={scale(18)}
                                    color="white"
                                />
                            </Animated.View>
                            <Text style={{ fontSize: scale(12), fontWeight: '900', color: 'white', letterSpacing: 0.5 }}>
                                {isActive ? "CERRAR" : "CALCULAR"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {isActive && (
                    <Calculator
                        title={title}
                        rateValue={rateValue}
                        activeColors={activeColors}
                        theme={theme}
                        onShare={() => onShare(id)} // Passing ID for sharing context
                        animValue={pulseAnim} // Passing the pulse animation for the flash icon
                    />
                )}
            </View>
        </Animated.View>
    );
});

export default RateCard;

const styles = StyleSheet.create({
    cardContainer: {
        flexDirection: 'row',
        borderRadius: scale(20),
        marginBottom: verticalScale(20),
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        // Glassmorphism simulation (needs opaque background for react native unless using BlurView)
        // We rely on colors passed in props for transparency effects if desired
    },
    cardAccent: {
        width: 6,
        borderTopLeftRadius: scale(20),
        borderBottomLeftRadius: scale(20),
    },
});
