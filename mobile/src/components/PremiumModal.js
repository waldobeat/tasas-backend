import React from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PremiumModal = ({
    visible,
    onClose,
    activeColors,
    isPremium,
    premiumType,
    activatePremiumAction,
    grantPremiumAccess
}) => {
    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ backgroundColor: activeColors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: '60%' }}>
                    <TouchableOpacity
                        onPress={onClose}
                        style={{ alignSelf: 'flex-end' }}
                    >
                        <Ionicons name="close-circle" size={28} color={activeColors.secondary} />
                    </TouchableOpacity>

                    <Text style={{ fontSize: 22, fontWeight: '900', color: activeColors.textDark, marginBottom: 20 }}>
                        Acceso Premium
                    </Text>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {!isPremium ? (
                            <>
                                <TouchableOpacity
                                    onPress={() => activatePremiumAction('buy')}
                                    style={{ padding: 15, backgroundColor: activeColors.cardCtx, marginBottom: 10, borderRadius: 12 }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <View>
                                            <Text style={{ color: activeColors.textDark, fontWeight: '800' }}>Premium Plus 1 Año</Text>
                                            <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Acceso a todas las herramientas</Text>
                                        </View>
                                        <Text style={{ color: '#10B981', fontWeight: '900' }}>$9.99</Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={grantPremiumAccess}
                                    style={{ padding: 15, backgroundColor: activeColors.cardCtx, marginBottom: 10, borderRadius: 12 }}
                                >
                                    <Text style={{ color: activeColors.textDark, fontWeight: '800' }}>Prueba Gratis 6 Horas</Text>
                                    <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Desbloqueo temporal cortesía</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <View style={{ alignItems: 'center', marginTop: 40 }}>
                                <Ionicons name="star" size={60} color="#F59E0B" />
                                <Text style={{ color: activeColors.textDark, fontSize: 18, fontWeight: 'bold', marginTop: 20 }}>
                                    Ya eres usuario Premium
                                </Text>
                                <Text style={{ color: activeColors.secondary, textAlign: 'center', marginTop: 10 }}>
                                    Disfruta de todas las funciones sin publicidad y con herramientas avanzadas.
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default PremiumModal;
