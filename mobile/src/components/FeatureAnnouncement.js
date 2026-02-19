import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, verticalScale } from '../styles/theme';

const { width } = Dimensions.get('window');

const FeatureAnnouncement = ({ visible, onClose, onTryNow, activeColors, theme }) => {
    const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 10,
                bounciness: 8
            }).start();
        }
    }, [visible]);

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.container,
                    {
                        backgroundColor: activeColors.cardCtx,
                        transform: [{ translateY: slideAnim }]
                    }
                ]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeXBtn}>
                        <Ionicons name="close" size={24} color={activeColors.secondary} />
                    </TouchableOpacity>

                    <View style={[styles.iconContainer, { backgroundColor: theme.primarySoft }]}>
                        <Ionicons name="stats-chart" size={60} color={theme.primary} />
                    </View>

                    <Text style={[styles.title, { color: activeColors.textDark }]}>
                        ¡Nueva Gestión Financiera!
                    </Text>

                    <Text style={[styles.description, { color: activeColors.secondary }]}>
                        Controla tus ingresos, gastos y deudas con herramientas avanzadas diseñadas para ti.
                    </Text>

                    <View style={styles.featureList}>
                        <FeatureItem icon="pie-chart" text="Análisis detallado de gastos" colors={activeColors} theme={theme} />
                        <FeatureItem icon="trending-up" text="Monitoreo de balance total" colors={activeColors} theme={theme} />
                        <FeatureItem icon="wallet" text="Gestión rápida de deudas" colors={activeColors} theme={theme} />
                    </View>

                    <TouchableOpacity
                        onPress={onTryNow}
                        style={[styles.mainBtn, { backgroundColor: theme.primary }]}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.mainBtnText}>Explorar Ahora</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.secondaryBtn}>
                        <Text style={{ color: activeColors.secondary, fontSize: 14 }}>Quizás más tarde</Text>
                    </TouchableOpacity>

                </Animated.View>
            </View>
        </Modal>
    );
};

const FeatureItem = ({ icon, text, colors, theme }) => (
    <View style={styles.featureRow}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: theme.primarySoft, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={{ color: colors.textDark, fontSize: 15, fontWeight: '500', flex: 1 }}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end'
    },
    container: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 30,
        alignItems: 'center',
        paddingBottom: 50,
        position: 'relative'
    },
    closeXBtn: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        padding: 5
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginBottom: 10,
        textAlign: 'center'
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 24
    },
    featureList: {
        width: '100%',
        marginBottom: 30,
        paddingHorizontal: 20
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16
    },
    mainBtn: {
        width: '100%',
        padding: 18,
        borderRadius: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6
    },
    mainBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18
    },
    secondaryBtn: {
        padding: 10
    }
});

export default FeatureAnnouncement;
