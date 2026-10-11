import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../styles/theme';

const AppHeader = ({
    date,
    valueDate,
    activeColors,
    setMenuVisible,
    theme
}) => {
    return (
        <View style={styles.header}>
            <View style={styles.brandContainer}>
                <View style={[styles.logoBox, { backgroundColor: (theme.primary || '#00E5FF') + '15' }]}>
                    <Ionicons name="trending-up" size={scale(22)} color={theme.primary || '#00E5FF'} />
                </View>

                <View>
                    <View style={styles.titleRow}>
                        <Text style={styles.appTitle}>La Tasa</Text>
                        <View style={styles.liveBadge}>
                            <View style={styles.liveDot} />
                            <Text style={styles.liveText}>EN VIVO</Text>
                        </View>
                    </View>
                    <Text style={styles.dateSubtitle}>
                        {date || 'Tasas de cambio actualizadas'}
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                onPress={setMenuVisible}
                activeOpacity={0.7}
                style={styles.settingsBtn}
            >
                <Ionicons name="options-outline" size={scale(20)} color="#CBD5E1" />
            </TouchableOpacity>
        </View>
    );
};

export default AppHeader;

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: scale(18),
        paddingTop: Platform.OS === 'ios' ? verticalScale(10) : verticalScale(14),
        paddingBottom: verticalScale(12),
        backgroundColor: 'transparent',
    },
    brandContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoBox: {
        width: scale(42),
        height: scale(42),
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: scale(12),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    appTitle: {
        color: '#FFFFFF',
        fontSize: moderateScale(22),
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 7,
        paddingVertical: 2,
        borderRadius: 20,
        marginLeft: 8,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981',
        marginRight: 4,
    },
    liveText: {
        color: '#10B981',
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dateSubtitle: {
        color: '#64748B',
        fontSize: moderateScale(11),
        fontWeight: '600',
        marginTop: 2,
        letterSpacing: 0.2,
    },
    settingsBtn: {
        width: scale(40),
        height: scale(40),
        borderRadius: 12,
        backgroundColor: '#111726',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
});
