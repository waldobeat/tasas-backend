import React, { useEffect, useRef, forwardRef, useState, useMemo, useCallback } from 'react';
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
    onShare,
    theme,
    activeColors,
    delay = 0
}, ref) => {
    const isUSD = useMemo(() => id.includes('usd'), [id]);
    const currencyIcon = useMemo(() => isUSD ? "logo-usd" : "logo-euro", [isUSD]);
    const flagEmoji = useMemo(() => isUSD ? "🇺🇸" : "🇪🇺", [isUSD]);
    const displayRate = useMemo(() => formatNumber(rateValue), [rateValue]);

    // Ref for ViewShot
    const cardRef = useRef();

    // Local Animations
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const bobAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(-1)).current;

    // Matrix Effect State
    const [scrambledRate, setScrambledRate] = useState('');
    const [isDecrypted, setIsDecrypted] = useState(false);

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

            // Shimmer effect (sweeps across the card every few seconds)
            Animated.loop(
                Animated.sequence([
                    Animated.timing(shimmerAnim, {
                        toValue: 2,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.linear
                    }),
                    Animated.delay(3500) // Wait before next sweep
                ])
            ).start();

            // Matrix Decryption Effect
            let iterations = 0;
            const scrambleInterval = setInterval(() => {
                let randomNum = (Math.random() * 50).toFixed(2);
                setScrambledRate(randomNum.toString());
                iterations++;
                if (iterations > 12) { // Stop after ~600ms
                    clearInterval(scrambleInterval);
                    setIsDecrypted(true);
                }
            }, 50);

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
                    backgroundColor: activeColors.cardCtx, // Glass
                    borderColor: activeColors.border,
                    borderWidth: 1,
                    shadowColor: theme.primary,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2, // Neon glow effect
                    shadowRadius: 15,
                    overflow: 'hidden'
                }
            ]}
        >
            {/* SHIMMER GLARE EFFECT */}
            <Animated.View style={{
                position: 'absolute',
                top: 0, bottom: 0, left: 0, width: '50%',
                backgroundColor: 'rgba(255,255,255,0.08)',
                transform: [
                    { skewX: '-30deg' },
                    {
                        translateX: shimmerAnim.interpolate({
                            inputRange: [-1, 2],
                            outputRange: [-200, 500]
                        })
                    }
                ],
                zIndex: 0
            }} />

            <View
                ref={cardRef}
                collapsable={false}
                style={{ flex: 1, backgroundColor: 'transparent', borderRadius: scale(20) }}
            >
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
                            <Text style={{
                                fontSize: moderateScale(40),
                                color: activeColors.textDark,
                                fontWeight: '900',
                                letterSpacing: -1.5,
                                textShadowColor: isDecrypted ? activeColors.textDark : theme.primary,
                                textShadowOffset: { width: 0, height: 0 },
                                textShadowRadius: 15,
                                opacity: isDecrypted ? 1 : 0.8
                            }}>
                                {isDecrypted ? displayRate : scrambledRate}
                                <Text style={{ fontSize: scale(18), color: theme.primary, fontWeight: '800' }}> Bs</Text>
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={() => onToggle(id)}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme.primarySoft,
                                paddingHorizontal: 18,
                                paddingVertical: 12,
                                borderRadius: 16,
                                borderWidth: 1,
                                borderColor: theme.primary + '40',
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 0 },
                                shadowOpacity: 0.5,
                                shadowRadius: 10,
                                elevation: 4
                            }}
                        >
                            <Animated.View style={{
                                transform: [
                                    { translateY: bobAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -3] }) },
                                    { rotate: isActive ? '180deg' : '0deg' }
                                ],
                                marginRight: 8
                            }}>
                                <Ionicons
                                    name={isActive ? "close" : "calculator"}
                                    size={scale(20)}
                                    color={theme.primary}
                                />
                            </Animated.View>
                            <Text style={{ color: theme.primary, fontWeight: '900', fontSize: 13, letterSpacing: 1 }}>
                                {isActive ? "CERRAR" : "CONVERTIR"}
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
        // Glass effect usually relies on backdrop filter natively, but Expo handles it gracefully via opacity
    },
});
