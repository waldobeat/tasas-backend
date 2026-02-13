import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Dimensions, StatusBar, Animated, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

const CustomSplash = ({ onFinish, theme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();

        const timer = setTimeout(() => {
            onFinish();
        }, 3000); // 3 seconds

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            <StatusBar hidden />
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>
                <Image
                    source={require('../../assets/icon.png')}
                    style={styles.image}
                    resizeMode="contain"
                />
                <Text style={{ marginTop: 20, color: theme.text, fontSize: 18, fontWeight: '600' }}>
                    La Tasa
                </Text>
                <Text style={{ marginTop: 5, color: theme.secondary, fontSize: 12 }}>
                    Cargando información...
                </Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: width,
        height: height,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        position: 'absolute',
        top: 0,
        left: 0,
    },
    image: {
        width: width * 0.4, // Smaller for icon
        height: width * 0.4,
    }
});

export default CustomSplash;
