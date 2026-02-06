import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Dimensions } from 'react-native';
import { COLORS } from '../styles/theme';

const { width } = Dimensions.get('window');

const IntroScreen = ({ onFinish }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            onFinish();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <View style={styles.logoContainer}>
                    <Image
                        source={require('../../assets/icon.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <Text style={styles.title}>La Tasa</Text>
                <Text style={styles.subtitle}>Tu gestor financiero sin publicidad</Text>
            </Animated.View>

            <View style={styles.footer}>
                <Text style={styles.version}>v1.0.0</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg, // Uses theme background
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 15,
        marginBottom: 20,
    },
    logo: {
        width: width * 0.35,
        height: width * 0.35,
        borderRadius: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        color: COLORS.textDark,
        letterSpacing: -1,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.secondary,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 50,
        opacity: 0.5,
    },
    version: {
        fontSize: 12,
        color: COLORS.secondary,
        fontWeight: '800',
    }
});

export default IntroScreen;
