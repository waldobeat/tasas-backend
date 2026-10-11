import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale, moderateScale } from '../styles/theme';

const AppHeader = ({
    date,
    valueDate,
    activeColors,
    setMenuVisible,
    theme
}) => {
    const textAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.delay(2000),
                Animated.timing(textAnim, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
                    useNativeDriver: true
                }),
                Animated.timing(textAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ).start();
    }, []);

    const getTextStyle = () => ({
        opacity: textAnim.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [0.3, 1, 0.3]
        }),
        transform: [
            { scale: textAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.1, 1] }) }
        ]
    });

    return (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: scale(20),
            paddingTop: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(50),
            paddingBottom: verticalScale(15),
            backgroundColor: 'transparent',
            zIndex: 10
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                    width: scale(44),
                    height: scale(44),
                    borderRadius: 22,
                    backgroundColor: theme.primarySoft,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: scale(12)
                }}>
                    <Ionicons name="cafe" size={scale(26)} color={theme.primary} />
                </View>

                <View>
                    <Animated.Text style={[{
                        color: activeColors.textDark,
                        fontSize: moderateScale(24),
                        fontWeight: '900',
                        letterSpacing: -1
                    }, getTextStyle()]}>
                        La Tasa
                    </Animated.Text>
                    <Text style={{ color: activeColors.secondary, fontSize: scale(10), fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' }}>
                        Mercado en Tiempo Real
                    </Text>
                </View>
            </View>

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
                <Ionicons name="options-outline" size={22} color={activeColors.textDark} />
            </TouchableOpacity>
        </View>
    );
};

export default AppHeader;
