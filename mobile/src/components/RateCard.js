import React, { useEffect, useRef, forwardRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
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
    onShare, // We might still use this for text fallback or analytics if needed
    theme,
    activeColors,
    delay = 0
}, ref) => {
    const isUSD = id.includes('usd');
    const currencyIcon = isUSD ? "logo-usd" : "logo-euro";
    const flagEmoji = isUSD ? "🇺🇸" : "🇪🇺";
    const displayRate = formatNumber(rateValue);

    // Ref for ViewShot
    const cardRef = useRef();

    // Local Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const bobAnim = useRef(new Animated.Value(0)).current;

    const handleShareImage = async () => {
        try {
            const uri = await captureRef(cardRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile'
            });

            if (Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: `Compartir Tasa ${title}`,
                    UTI: 'public.png'
                });
            } else {
                onShare(); // Fallback
            }
        } catch (error) {
            console.error("Snapshot failed", error);
            onShare(); // Fallback to text
        }
    };

    useEffect(() => {
        const animatePulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );

        const animateBob = Animated.loop(
            Animated.sequence([
                Animated.timing(bobAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
                Animated.timing(bobAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.ease),
                }),
            ])
        );

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
            <View
                ref={cardRef}
                collapsable={false}
                style={{ flex: 1, backgroundColor: activeColors.cardCtx, borderRadius: scale(20), overflow: 'hidden' }}
            >
                <View style={[styles.cardAccent, { backgroundColor: theme.primary }]} />

                <View style={{ flex: 1, padding: scale(20) }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                                backgroundColor: theme.primarySoft,
                                width: scale(48),
                                height: scale(48),
                                borderRadius: 16,
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: scale(14)
                            }}>
                                <Ionicons name={currencyIcon} size={scale(26)} color={theme.primary} />
                            </View>
                            <View>
                                <Text style={{ color: activeColors.secondary, fontSize: scale(12), fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>{title} {flagEmoji}</Text>
                                <Text style={{ color: activeColors.textDark, fontSize: moderateScale(18), fontWeight: '800', marginTop: 2 }}>{subtitle}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleShareImage}
                            style={{
                                padding: 8,
                                backgroundColor: activeColors.bg,
                                borderRadius: 50,
                                marginLeft: 8
                            }}
                        >
                            <Ionicons name="share-social-outline" size={scale(20)} color={theme.primary} />
                        </TouchableOpacity>
                    </View>

                    <View style={{ marginTop: scale(15), flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: moderateScale(32), color: activeColors.textDark, fontWeight: '800', letterSpacing: -1 }}>
                                {displayRate}
                                <Text style={{ fontSize: scale(16), color: activeColors.secondary, fontWeight: '600' }}> Bs</Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => onToggle(id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.primary,
                                paddingHorizontal: scale(18),
                                paddingVertical: scale(12),
                                borderRadius: 16,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.25,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                        >
                            <Animated.View style={{
                                transform: [
                                    { translateY: bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }
                                ],
                                marginRight: 6
                            }}>
                                <Ionicons
                                    name={isActive ? "chevron-up" : "calculator"}
                                    size={scale(18)}
                                    color="white"
                                />
                            </Animated.View>
                            <Text style={{ fontSize: scale(13), fontWeight: '800', color: 'white' }}>
                                {isActive ? "CERRAR" : "CALCULAR"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <Calculator
                visible={isActive}
                onClose={() => onToggle(id)}
                title={title}
                rateValue={rateValue}
                activeColors={activeColors}
                theme={theme}
                onShare={handleShareImage}
                animValue={pulseAnim}
                id={id}
            />
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
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 20,
        elevation: 3,
    },
    cardAccent: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 6,
        borderTopLeftRadius: scale(20),
        borderBottomLeftRadius: scale(20),
    },
});
