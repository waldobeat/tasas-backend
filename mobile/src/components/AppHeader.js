import React from 'react';
import { View, Text, Image, TouchableOpacity, Platform, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../styles/theme';

const AppHeader = ({
    date,
    activeColors,
    setMenuVisible,
    updateTag = "CLEAN START (V12)"
}) => {
    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
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
            <Image source={require('../../assets/icon.png')} style={{ width: scale(30), height: scale(30), borderRadius: 8 }} />
            <View style={{ flex: 1, marginLeft: scale(10) }}>
                <Text style={{ color: activeColors.textDark, fontSize: moderateScale(14), fontWeight: '900', letterSpacing: -0.5 }}>
                    La Tasa
                </Text>
                <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 14 }}>
                    {updateTag}
                </Text>
                <Text style={{ color: activeColors.secondary, fontSize: scale(8), opacity: 0.8 }}>
                    {date}
                </Text>
            </View>
            <TouchableOpacity
                onPress={() => { Vibration.vibrate(50); setMenuVisible(true); }}
                style={{
                    backgroundColor: activeColors.bg,
                    padding: scale(6),
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: activeColors.border
                }}
            >
                <Ionicons name="options-outline" size={scale(18)} color={activeColors.textDark} />
            </TouchableOpacity>
        </View>
    );
};

export default AppHeader;
