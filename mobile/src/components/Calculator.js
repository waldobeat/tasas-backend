import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Modal,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
    TouchableWithoutFeedback,
    Keyboard,
    Share
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { scale, moderateScale, STATIC_COLORS } from '../styles/theme';
import { formatNumber } from '../utils/helpers';

const { height } = Dimensions.get('window');

export default function Calculator({
    visible,
    onClose,
    title,
    rateValue,
    activeColors,
    theme,
    onShare,
    animValue,
    id = ''
}) {
    const [amount, setAmount] = useState('');
    const [result, setResult] = useState('0,00 Bs');
    const presets = [5, 10, 20, 50, 100];
    const shareRef = useRef();
    const inputRef = useRef();

    const handleCalcInput = (val) => {
        setAmount(val);
        if (!val) {
            setResult('0,00 Bs');
            return;
        }
        const cleanVal = val.replace(',', '.');
        const num = parseFloat(cleanVal);
        if (isNaN(num)) return;

        let rateNum = rateValue;
        if (typeof rateValue === 'string') {
            rateNum = parseFloat(rateValue.replace(/\./g, '').replace(',', '.'));
        }

        const total = num * rateNum;
        setResult(formatNumber(total) + ' Bs');
    };

    const handlePreset = (p) => {
        handleCalcInput(p.toString());
    };

    const handleInternalShare = async () => {
        try {
            const message = `Cambio: ${amount} ${title} = ${result} \nTasa: ${formatNumber(rateValue)} Bs.\nCalculado con La Tasa App.`;
            await Share.share({ message });
        } catch (error) {
            console.error('Error sharing text:', error);
        }
    };

    const handleImageShare = async () => {
        try {
            const uri = await captureRef(shareRef, {
                format: 'png',
                quality: 1,
                result: 'tmpfile'
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: `Compartir ${title}`,
                    UTI: 'public.png'
                });
            } else {
                handleInternalShare(); // Fallback to text
            }
        } catch (error) {
            console.error("Snapshot failed in Calculator", error);
            handleInternalShare(); // Fallback to text
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.modalOverlay}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardView}
                    >
                        <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx }]}>
                            {/* Captured Area */}
                            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
                                <View
                                    ref={shareRef}
                                    collapsable={false}
                                    style={{ backgroundColor: activeColors.cardCtx, borderRadius: 30, padding: 10 }}
                                >
                                    {/* Header */}
                                    <View style={styles.header}>
                                        <Text style={[styles.title, { color: activeColors.textDark }]}>
                                            La Tasa de {title}
                                        </Text>
                                        <View style={styles.branding}>
                                            <Ionicons name="cafe" size={16} color={activeColors.textDark} />
                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: activeColors.textDark, marginLeft: 4 }}>
                                                App
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

                                    {/* Subtitle / Rate Info */}
                                    <View style={styles.rateInfo}>
                                        <Text style={[styles.rateText, { color: activeColors.secondary }]}>
                                            Tasa: <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{formatNumber(rateValue)} Bs</Text>
                                        </Text>
                                        {animValue && (
                                            <Animated.View style={{ transform: [{ scale: animValue }] }}>
                                                <Ionicons name="flash" size={16} color="#F59E0B" />
                                            </Animated.View>
                                        )}
                                    </View>

                                    {/* Input Section */}
                                    <View style={[styles.manualInput, { backgroundColor: activeColors.inputBg, borderColor: 'rgba(0,0,0,0.05)' }]}>
                                        <Text style={{ color: activeColors.textDark, fontSize: 26, fontWeight: 'bold' }}>
                                            {amount || '0'} {title}
                                        </Text>
                                    </View>

                                    {/* Result Section */}
                                    <View style={[styles.resultContainer, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '20' }]}>
                                        <Text style={[styles.resultLabel, { color: theme.primary }]}>Total Estimado</Text>
                                        <Text style={[styles.resultHighlight, { color: theme.primary }]}>{result}</Text>
                                    </View>

                                    <Text style={{ color: activeColors.secondary, fontSize: 9, textAlign: 'center', marginTop: 15, fontStyle: 'italic' }}>
                                        Cálculo realizado con La Tasa
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            {/* Warning for Binance (Integrated) */}
                            {id && id.includes('binance') && (
                                <View style={{ backgroundColor: theme.primarySoft, padding: 10, borderRadius: 12, marginTop: 15, flexDirection: 'row', alignItems: 'center', borderStyle: 'dotted', borderWidth: 1, borderColor: theme.primary }}>
                                    <Ionicons name="warning" size={16} color={theme.secondary} style={{ marginRight: 6 }} />
                                    <Text style={{ color: theme.secondary, fontSize: 10, flex: 1, fontWeight: 'bold' }}>
                                        Mercado volátil. Verifique en Binance antes de operar.
                                    </Text>
                                </View>
                            )}

                            {/* Hidden Control Inputs */}
                            <View style={{ marginTop: 10 }}>
                                <TextInput
                                    ref={inputRef}
                                    style={{ height: 0, opacity: 0 }}
                                    keyboardType="numeric"
                                    value={amount}
                                    onChangeText={handleCalcInput}
                                />

                                {/* Presets */}
                                <View style={styles.presetRow}>
                                    {presets.map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            style={[styles.presetBtn, { backgroundColor: activeColors.bg, borderColor: activeColors.border, marginRight: 8, marginBottom: 8 }]}
                                            onPress={() => handlePreset(p)}
                                        >
                                            <Text style={[styles.presetText, { color: activeColors.textDark }]}>${p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                    <TouchableOpacity
                                        style={styles.clearBadge}
                                        onPress={() => handleCalcInput('')}
                                    >
                                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Actions */}
                            <View style={{ flexDirection: 'row', marginTop: 10 }}>
                                <TouchableOpacity
                                    style={[styles.shareBtn, { flex: 1, backgroundColor: STATIC_COLORS.whatsapp, marginRight: 10 }]}
                                    onPress={handleImageShare}
                                >
                                    <Ionicons name="image-outline" size={20} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.shareBtnText}>Compartir Imagen</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[styles.shareBtn, { width: 60, backgroundColor: activeColors.bg, borderWidth: 1, borderColor: activeColors.border }]}
                                >
                                    <Ionicons name="close" size={24} color={activeColors.secondary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center'
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 30,
        padding: 25,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    branding: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    closeBtn: {
        padding: 5
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 20
    },
    rateInfo: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    rateText: {
        fontSize: 15,
        fontWeight: '600',
        marginRight: 8
    },
    manualInput: {
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingVertical: 18,
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.05)',
        alignItems: 'center'
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginBottom: 10
    },
    presetBtn: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    presetText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    clearBadge: {
        backgroundColor: '#FEE2E2',
        padding: 10,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },
    resultContainer: {
        marginTop: 15,
        alignItems: 'center',
        padding: 20,
        borderRadius: 25,
        borderWidth: 1,
    },
    resultLabel: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    resultHighlight: {
        fontSize: 38,
        fontWeight: 'bold',
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 20,
        borderRadius: 18,
    },
    shareBtnText: {
        color: 'white',
        fontSize: 17,
        fontWeight: 'bold',
    },
});
