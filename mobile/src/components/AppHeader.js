import React from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Vibration } from 'react-native';
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
                <Image source={require('../../assets/icon.png')} style={{ width: scale(45), height: scale(45), borderRadius: 12 }} />
                <View style={{ marginLeft: scale(12) }}>
                    <Text style={{ color: activeColors.textDark, fontSize: moderateScale(24), fontWeight: '900', letterSpacing: -0.5 }}>
                        La Tasa
                    </Text>
                    <Text style={{ color: activeColors.secondary, fontSize: scale(12), opacity: 1, fontWeight: '600' }}>
                        Dólar en Venezuela
                    </Text>
                </View>
            </View>

            {/* Ad-Free Badge */}
            {isAdFree && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#DCFCE7',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#86EFAC'
                }}>
                    <Text style={{ fontSize: 12, marginRight: 4 }}>✨</Text>
                    <Text style={{ color: '#15803d', fontSize: 10, fontWeight: '700' }}>Sin Anuncios</Text>
                </View>
            )}
        </View>
    );
};

export default AppHeader;
