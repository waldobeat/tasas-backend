import React, { useRef, useEffect } from 'react';
import { Modal, View, Image, TouchableOpacity, Animated, Linking, Dimensions, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const BannerPopup = ({ visible, onClose, activeColors }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    const REFERRAL_URL = 'https://www.binance.com/referral/earn-together/refer2earn-usdc/claim?hl=en&ref=GRO_28502_9P9T2&utm_source=default&utm_medium=web_share_copy';

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible]);

    const handlePress = () => {
        Linking.openURL(REFERRAL_URL);
    };

    return (
        <Modal visible={visible} animationType="none" transparent>
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        backgroundColor: activeColors.cardCtx
                    }
                ]}>
                    <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
                        <Image
                            source={require('../../assets/binance-promo.png')}
                            style={styles.image}
                            resizeMode="contain"
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        style={[styles.closeButton, { backgroundColor: activeColors.bg }]}
                    >
                        <Ionicons name="close" size={24} color={activeColors.secondary} />
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 350,
        borderRadius: 25,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 20,
    },
    image: {
        width: '100%',
        height: 450, // Proportional to typical mobile aspect ratio for this vertical banner
    },
    closeButton: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 8,
        borderRadius: 50,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    }
});

export default BannerPopup;
