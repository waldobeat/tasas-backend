import React, { useState, useRef, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, Animated, Dimensions, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const NameModal = ({ visible, onSave, activeColors, theme }) => {
    const [name, setName] = useState('');
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    const handleSave = () => {
        if (name.trim().length > 0) {
            onSave(name.trim());
        }
    };

    return (
        <Modal visible={visible} animationType="none" transparent>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20
                }}>
                    <Animated.View style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
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
                        <View style={{
                            backgroundColor: theme.primarySoft,
                            padding: 15,
                            borderRadius: 20,
                            marginBottom: 20
                        }}>
                            <Ionicons name="person" size={40} color={theme.primary} />
                        </View>

                        <Text style={{
                            color: activeColors.textDark,
                            fontSize: 24,
                            fontWeight: '800',
                            textAlign: 'center',
                            letterSpacing: -0.5
                        }}>
                            ¡Hola, bienvenido!
                        </Text>

                        <Text style={{
                            color: activeColors.secondary,
                            textAlign: 'center',
                            marginTop: 10,
                            fontSize: 16,
                            lineHeight: 22,
                            opacity: 0.8
                        }}>
                            ¿Cómo te gustaría que te llamemos?
                        </Text>

                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="Tu nombre aquí"
                            placeholderTextColor={activeColors.secondary}
                            style={{
                                width: '100%',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                borderRadius: 15,
                                padding: 16,
                                marginTop: 25,
                                color: activeColors.textDark,
                                fontSize: 16,
                                borderWidth: 1,
                                borderColor: 'rgba(255,255,255,0.1)',
                                textAlign: 'center'
                            }}
                            autoFocus={true}
                        />

                        <TouchableOpacity
                            onPress={handleSave}
                            disabled={name.trim().length === 0}
                            style={{
                                marginTop: 25,
                                backgroundColor: name.trim().length > 0 ? theme.primary : activeColors.secondary,
                                paddingVertical: 16,
                                width: '100%',
                                borderRadius: 18,
                                shadowColor: theme.primary,
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 5,
                                opacity: name.trim().length > 0 ? 1 : 0.5
                            }}
                        >
                            <Text style={{
                                color: 'white',
                                fontWeight: '700',
                                textAlign: 'center',
                                fontSize: 16
                            }}>
                                Comenzar
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

export default NameModal;
