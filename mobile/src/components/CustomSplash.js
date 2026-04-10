import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, StatusBar, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const CustomSplash = ({ onFinish, theme }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const gear1Rotate = useRef(new Animated.Value(0)).current;
    const gear2Rotate = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    
    const [loadingStep, setLoadingStep] = useState(0);
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('Inicializando...');

    const step1Ref = useRef(new Animated.Value(0)).current;
    const step2Ref = useRef(new Animated.Value(0)).current;
    const step3Ref = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 5,
                useNativeDriver: true,
            })
        ]).start();

        Animated.loop(
            Animated.timing(gear1Rotate, {
                toValue: 1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.timing(gear2Rotate, {
                toValue: -1,
                duration: 3000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 0.6,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                })
            ])
        ).start();

        const runLoadingSequence = async () => {
            await new Promise(r => setTimeout(r, 800));
            setLoadingStep(1);
            setStatusText('Conectando al servidor...');
            
            Animated.timing(step1Ref, { toValue: 1, duration: 1500, useNativeDriver: false }).start();
            
            await new Promise(r => setTimeout(r, 1800));
            setLoadingStep(2);
            setStatusText('Obteniendo tasas de cambio...');
            
            Animated.timing(step2Ref, { toValue: 1, duration: 1500, useNativeDriver: false }).start();
            
            await new Promise(r => setTimeout(r, 1800));
            setLoadingStep(3);
            setStatusText('Preparando interfaz...');
            
            Animated.timing(step3Ref, { toValue: 1, duration: 1200, useNativeDriver: false }).start();
            
            await new Promise(r => setTimeout(r, 1500));
            setStatusText('Listo!');
            
            await new Promise(r => setTimeout(r, 500));
            onFinish();
        };

        runLoadingSequence();
    }, []);

    const gear1Spin = gear1Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const gear2Spin = gear2Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '-360deg']
    });

    const bar1Width = step1Ref.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    const bar2Width = step2Ref.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    const bar3Width = step3Ref.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%']
    });

    return (
        <View style={[styles.container, { backgroundColor: '#0A0A0F' }]}>
            <StatusBar hidden />
            <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }], alignItems: 'center' }}>

                <View style={{ position: 'relative', width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 30 }}>
                    <Animated.View style={{ position: 'absolute', transform: [{ rotate: gear1Spin }] }}>
                        <Ionicons name="cog" size={80} color="#3B82F6" />
                    </Animated.View>
                    <Animated.View style={{ position: 'absolute', transform: [{ rotate: gear2Spin }, { scale: 0.5 }] }}>
                        <Ionicons name="cog" size={50} color="#1D4ED8" />
                    </Animated.View>
                    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                        <Ionicons name="flash" size={30} color="#60A5FA" />
                    </Animated.View>
                </View>

                <Text style={{ 
                    fontSize: scale(32), 
                    fontWeight: '900', 
                    color: '#F8FAFC',
                    letterSpacing: -1,
                    marginBottom: 10
                }}>
                    LA TASA
                </Text>

                <Text style={{ 
                    color: '#3B82F6', 
                    fontSize: scale(14), 
                    fontWeight: '600',
                    marginBottom: 30 
                }}>
                    {statusText}
                </Text>

                <View style={{ width: width - 80 }}>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressBar, { width: bar1Width, backgroundColor: '#3B82F6' }]} />
                        </View>
                        <Text style={[styles.progressLabel, { color: loadingStep >= 1 ? '#3B82F6' : '#64748B' }]}>
                            {loadingStep >= 1 ? '✓' : '○'} Conectando servidor
                        </Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressBar, { width: bar2Width, backgroundColor: '#10B981' }]} />
                        </View>
                        <Text style={[styles.progressLabel, { color: loadingStep >= 2 ? '#10B981' : '#64748B' }]}>
                            {loadingStep >= 2 ? '✓' : '○'} Obteniendo tasas
                        </Text>
                    </View>

                    <View style={styles.progressContainer}>
                        <View style={styles.progressTrack}>
                            <Animated.View style={[styles.progressBar, { width: bar3Width, backgroundColor: '#F59E0B' }]} />
                        </View>
                        <Text style={[styles.progressLabel, { color: loadingStep >= 3 ? '#F59E0B' : '#64748B' }]}>
                            {loadingStep >= 3 ? '✓' : '○'} Preparando interfaz
                        </Text>
                    </View>
                </View>

                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 30 }}>
                    {Math.round(loadingStep * 33)}%
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
    progressContainer: {
        marginBottom: 12,
    },
    progressTrack: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    progressLabel: {
        fontSize: 12,
        marginTop: 6,
        fontWeight: '500',
    },
});

export default CustomSplash;
