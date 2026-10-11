import React, { useRef, forwardRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
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
    const isUSD = useMemo(() => id.includes('usd') && !id.includes('binance'), [id]);
    const isEUR = useMemo(() => id.includes('eur'), [id]);
    const isBinance = useMemo(() => id.includes('binance'), [id]);

    const displayRate = useMemo(() => formatNumber(rateValue), [rateValue]);
    const cardRef = useRef();

    // Icon & badge config
    const iconName = isBinance ? "logo-bitcoin" : (isUSD ? "logo-usd" : "logo-euro");
    const badgeText = isBinance ? "BINANCE P2P" : "BCV OFICIAL";
    const accentColor = isBinance ? '#F0B90B' : (isEUR ? '#3B82F6' : (theme.primary || '#00E5FF'));

    const handleShareImage = async () => {
        try {
            const uri = await captureRef(cardRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile'
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: `Tasa ${title} - ${displayRate} Bs`,
                    UTI: 'public.png'
                });
            } else {
                onShare(title, displayRate);
            }
        } catch (error) {
            console.error("Snapshot error:", error);
            onShare(title, displayRate);
        }
    };

    return (
        <View ref={ref} style={styles.outerWrapper}>
            <View
                ref={cardRef}
                collapsable={false}
                style={[
                    styles.card,
                    {
                        backgroundColor: '#111726',
                        borderColor: 'rgba(255, 255, 255, 0.08)',
                    }
                ]}
            >
                {/* Accent top border strip */}
                <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />

                <View style={styles.content}>
                    {/* Top Row: Info & Share */}
                    <View style={styles.headerRow}>
                        <View style={styles.titleGroup}>
                            <View style={[styles.iconCircle, { backgroundColor: accentColor + '18' }]}>
                                <Ionicons name={iconName} size={scale(20)} color={accentColor} />
                            </View>
                            <View>
                                <View style={styles.badgeRow}>
                                    <View style={[styles.badge, { backgroundColor: accentColor + '20' }]}>
                                        <Text style={[styles.badgeText, { color: accentColor }]}>{badgeText}</Text>
                                    </View>
                                </View>
                                <Text style={styles.subtitleText}>{subtitle || title}</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={handleShareImage}
                            activeOpacity={0.7}
                            style={styles.actionCircleBtn}
                        >
                            <Ionicons name="share-social-outline" size={scale(18)} color="#94A3B8" />
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Row: Rate Display & Calculator Button */}
                    <View style={styles.rateRow}>
                        <View style={styles.rateContainer}>
                            <Text style={styles.rateLabel}>VALOR ACTUAL</Text>
                            <View style={styles.valueRow}>
                                <Text style={styles.rateNumber}>{displayRate}</Text>
                                <Text style={[styles.currencySuffix, { color: accentColor }]}> Bs.</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => onToggle(id)}
                            activeOpacity={0.8}
                            style={[
                                styles.calcButton,
                                {
                                    backgroundColor: isActive ? accentColor : accentColor + '18',
                                    borderColor: accentColor + '40'
                                }
                            ]}
                        >
                            <Ionicons
                                name={isActive ? "close" : "calculator-outline"}
                                size={scale(16)}
                                color={isActive ? '#000000' : accentColor}
                                style={{ marginRight: 6 }}
                            />
                            <Text
                                style={[
                                    styles.calcButtonText,
                                    { color: isActive ? '#000000' : accentColor }
                                ]}
                            >
                                {isActive ? "Cerrar" : "Calcular"}
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
                theme={{ ...theme, primary: accentColor }}
                onShare={handleShareImage}
                id={id}
            />
        </View>
    );
});

export default RateCard;

const styles = StyleSheet.create({
    outerWrapper: {
        marginBottom: verticalScale(14),
    },
    card: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    accentStrip: {
        height: 3,
        width: '100%',
    },
    content: {
        paddingHorizontal: scale(18),
        paddingVertical: verticalScale(16),
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: verticalScale(14),
    },
    titleGroup: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconCircle: {
        width: scale(42),
        height: scale(42),
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(12),
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    subtitleText: {
        color: '#FFFFFF',
        fontSize: moderateScale(16),
        fontWeight: '700',
        marginTop: 2,
    },
    actionCircleBtn: {
        width: scale(36),
        height: scale(36),
        borderRadius: 18,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    rateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    rateContainer: {
        flex: 1,
    },
    rateLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
        color: '#64748B',
        marginBottom: 2,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    rateNumber: {
        fontSize: moderateScale(32),
        color: '#FFFFFF',
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    currencySuffix: {
        fontSize: moderateScale(18),
        fontWeight: '800',
        marginLeft: 4,
    },
    calcButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(14),
        paddingVertical: verticalScale(9),
        borderRadius: 12,
        borderWidth: 1,
    },
    calcButtonText: {
        fontSize: moderateScale(13),
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});
