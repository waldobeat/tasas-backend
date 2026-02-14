import React, { useRef, useEffect, useState } from 'react';
import { Modal, View, Text, Image, TouchableOpacity, Animated, Dimensions, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// --- HEART PARTICLE COMPONENT ---
const HeartParticle = ({ index, startAnim }) => {
    const randomAngle = Math.random() * 360;
    const randomDistance = 100 + Math.random() * 150; // Explosion radius
    const randomDuration = 1500 + Math.random() * 1000;
    const randomSize = 20 + Math.random() * 20;
    const randomDelay = Math.random() * 500;

    const anim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (startAnim) {
            anim.setValue(0);
            Animated.sequence([
                Animated.delay(randomDelay),
                Animated.timing(anim, {
                    toValue: 1,
                    duration: randomDuration,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                })
            ]).start();
        }
    }, [startAnim]);

    const translateX = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.cos(randomAngle) * randomDistance]
    });

    const translateY = anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, Math.sin(randomAngle) * randomDistance + 100] // +100 to simulate gravity/fall
    });

    const opacity = anim.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [1, 1, 0]
    });

    const scale = anim.interpolate({
        inputRange: [0, 0.2, 1],
        outputRange: [0, 1.2, 0.5]
    });

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: '40%', // Start from somewhat center-top
                left: '50%',
                transform: [{ translateX }, { translateY }, { scale }],
                opacity,
                zIndex: 100,
                marginLeft: -randomSize / 2, // Center the particle
                marginTop: -randomSize / 2
            }}
        >
            <Ionicons name="heart" size={randomSize} color="#EF4444" />
        </Animated.View>
    );
};

const HolidayModal = ({ visible, onClose, activeColors, theme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Create an array of 25 particles
    const particles = Array.from({ length: 25 }, (_, i) => i);

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            slideAnim.setValue(50);
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="none" transparent>
            <View style={styles.overlay}>
                {/* EXPLOSION EFFECT */}
                {visible && particles.map((_, index) => (
                    <HeartParticle key={index} index={index} startAnim={visible} />
                ))}

                <Animated.View style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        backgroundColor: activeColors.cardCtx
                    }
                ]}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={require('../../assets/holiday-splash.png')}
                            style={styles.image}
                            resizeMode="cover"
                        />
                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.closeButton, { backgroundColor: activeColors.bg }]}
                        >
                            <Ionicons name="close" size={24} color={activeColors.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.textContainer}>
                        <Text style={[styles.title, { color: activeColors.textDark }]}>
                            ¡Feliz Día del Amor y la Amistad!
                        </Text>

                        <View style={[styles.dateContainer, { backgroundColor: theme.primary + '15' }]}>
                            <Text style={[styles.subtitle, { color: theme.primary }]}>
                                Valor para el Miercoles 18 de febrero: 396,36 Bs
                            </Text>
                        </View>

                        <TouchableOpacity
                            onPress={onClose}
                            style={[styles.button, { backgroundColor: theme.primary }]}
                        >
                            <Text style={styles.buttonText}>Continuar</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        elevation: 20,
        zIndex: 50,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
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
    },
    textContainer: {
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 28,
    },
    dateContainer: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 20,
        width: '100%',
    },
    subtitle: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
    button: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        fontSize: 16,
    }
});

export default HolidayModal;
