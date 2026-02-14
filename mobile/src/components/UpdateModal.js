import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Animated, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const UpdateModal = ({
    visible,
    isDownloading,
    downloadProgress,
    isUpdatePending,
    progressAnim,
    activeColors,
    theme,
    onClose
}) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [visible]);

    return (
        <Modal visible={visible} animationType="fade" transparent>
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.85)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: activeColors.cardCtx,
                    padding: 30,
                    borderRadius: 30,
                    width: '100%',
                    maxWidth: 400,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.1)',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 15,
                    elevation: 20,
                }}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            backgroundColor: 'rgba(255,255,255,0.05)',
                            padding: 8,
                            borderRadius: 20
                        }}
                    >
                        <Ionicons name="close" size={20} color={activeColors.secondary} />
                    </TouchableOpacity>

                    <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 10 }}>
                        <Ionicons
                            name={isUpdatePending ? "checkmark-circle" : "cloud-download"}
                            size={60}
                            color={theme.primary}
                        />
                    </Animated.View>

                    <Text style={{
                        color: activeColors.textDark,
                        fontSize: 22,
                        fontWeight: '800',
                        marginTop: 10,
                        textAlign: 'center',
                        letterSpacing: -0.5
                    }}>
                        {isUpdatePending ? 'Aplicando actualización' : 'Mejorando tu experiencia'}
                    </Text>

                    <Text style={{
                        color: activeColors.secondary,
                        textAlign: 'center',
                        marginTop: 12,
                        fontSize: 15,
                        lineHeight: 20,
                        opacity: 0.8
                    }}>
                        {isUpdatePending
                            ? 'La aplicación se reactivará en un momento con las últimas mejoras.'
                            : 'Estamos descargando nuevas funcionalidades para ti.'}
                    </Text>

                    <View style={{
                        width: '100%',
                        height: 6,
                        backgroundColor: 'rgba(255,255,255,0.05)',
                        borderRadius: 10,
                        marginTop: 30,
                        overflow: 'hidden'
                    }}>
                        <Animated.View style={{
                            width: progressAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%']
                            }),
                            height: '100%',
                            backgroundColor: theme.primary,
                            borderRadius: 10
                        }} />
                    </View>

                    {isUpdatePending && (
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    await require('expo-updates').reloadAsync();
                                } catch (e) {
                                    console.log("Manual reload failed:", e);
                                }
                            }}
                            style={{
                                marginTop: 30,
                                backgroundColor: theme.primary,
                                paddingVertical: 16,
                                width: '100%',
                                borderRadius: 18,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 5
                            }}
                        >
                            <Text style={{
                                color: 'white',
                                fontWeight: '700',
                                textAlign: 'center',
                                fontSize: 16
                            }}>
                                Reiniciar ahora
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!isUpdatePending && (
                        <Text style={{
                            color: activeColors.secondary,
                            marginTop: 15,
                            fontSize: 12,
                            fontWeight: '600'
                        }}>
                            {Math.round((downloadProgress || 0) * 100)}% Completado
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default UpdateModal;
