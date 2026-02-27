import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet,
    Animated, Modal, KeyboardAvoidingView, Platform,
    Dimensions, TouchableWithoutFeedback, Keyboard, Share,
    ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { scale, moderateScale, STATIC_COLORS } from '../styles/theme';
import { formatNumber } from '../utils/helpers';

const { height } = Dimensions.get('window');

export default function Calculator({
    visible, onClose, title, rateValue, activeColors, theme, onShare, animValue, id = ''
}) {
    const [amount, setAmount] = useState('');
    const [isReversed, setIsReversed] = useState(false); // false: Divisa -> Bs, true: Bs -> Divisa
    const [resultStr, setResultStr] = useState('0,00');

    const swapAnim = useRef(new Animated.Value(0)).current;
    const shareRef = useRef();
    const inputRef = useRef();

    useEffect(() => {
        if (!visible) {
            setAmount('');
            setIsReversed(false);
            setResultStr('0,00');
            swapAnim.setValue(0);
            Keyboard.dismiss();
        } else {
            // Focus automágico cuando se abre el modal para levantar el teclado
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [visible]);

    useEffect(() => {
        calculate(amount, isReversed);
    }, [amount, isReversed, rateValue]);

    const getRateNum = () => {
        let rateNum = rateValue;
        if (typeof rateValue === 'string') {
            rateNum = parseFloat(rateValue.replace(/\./g, '').replace(',', '.'));
        }
        return rateNum || 1;
    };

    const calculate = (val, reversed) => {
        if (!val) {
            setResultStr('0,00');
            return;
        }
        const cleanVal = val.replace(',', '.');
        const num = parseFloat(cleanVal);
        if (isNaN(num)) {
            setResultStr('0,00');
            return;
        }

        const rateNum = getRateNum();

        if (reversed) {
            const total = num / rateNum;
            setResultStr(formatNumber(total));
        } else {
            const total = num * rateNum;
            setResultStr(formatNumber(total));
        }
    };

    const handlePreset = (p) => {
        setAmount(p.toString());
        // Desestimamos el teclado cuando tocan un preset para ver el resultado limpio (opcional)
        // Keyboard.dismiss();
    };

    const toggleDirection = () => {
        Animated.sequence([
            Animated.timing(swapAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
            Animated.timing(swapAnim, { toValue: 0, duration: 150, useNativeDriver: true })
        ]).start();
        setIsReversed(!isReversed);
    };

    const handleInternalShare = async () => {
        try {
            const from = isReversed ? 'Bs' : title;
            const to = isReversed ? title : 'Bs';
            const message = `Cambio estimado:\n${amount || 0} ${from} = ${resultStr} ${to}\nTasa: ${formatNumber(rateValue)} Bs.\n\nCalculado con La Tasa V2 ✨\nhttps://tasas-backend.onrender.com`;
            await Share.share({ message });
        } catch (error) {
            console.error('Error sharing text:', error);
        }
    };

    const handleImageShare = async () => {
        try {
            const uri = await captureRef(shareRef, { format: 'png', quality: 1, result: 'tmpfile' });
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: `Compartir Cálculo`, UTI: 'public.png' });
            } else {
                handleInternalShare();
            }
        } catch (error) {
            handleInternalShare();
        }
    };

    const fromLabel = isReversed ? "Bolívares (Bs)" : `Divisa (${title})`;
    const toLabel = isReversed ? `Divisa (${title})` : "Bolívares (Bs)";
    const fromSymbol = isReversed ? 'Bs' : title;
    const toSymbol = isReversed ? title : 'Bs';

    // Acceso rapido de conversion modificado The presets requested: 1, 5, 7, 10, 50, 100
    const presets = isReversed ? [100, 500, 1000] : [1, 5, 7, 10, 50, 100];

    const spin = swapAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg']
    });

    const ModalInnerContent = (
        <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx }]}>

            <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
                <View ref={shareRef} collapsable={false} style={{ backgroundColor: activeColors.cardCtx, borderRadius: 30, padding: 10 }}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: activeColors.textDark }]}>Calculadora {title}</Text>
                        <View style={styles.branding}>
                            <Ionicons name="cafe" size={16} color={activeColors.textDark} />
                            <Text style={{ fontSize: 10, fontWeight: '900', color: activeColors.textDark, marginLeft: 4 }}>TASA V2</Text>
                        </View>
                    </View>

                    <View style={styles.rateInfo}>
                        <Text style={{ color: activeColors.secondary, fontSize: 14 }}>
                            Tasa de cambio: <Text style={{ color: theme.primary, fontWeight: '800' }}>{formatNumber(rateValue)} Bs</Text>
                        </Text>
                        {animValue && (
                            <Animated.View style={{ transform: [{ scale: animValue }], marginLeft: 6 }}>
                                <Ionicons name="flash" size={16} color="#F59E0B" />
                            </Animated.View>
                        )}
                    </View>

                    {/* Exchanger UI */}
                    <View style={[styles.exchangeBox, { backgroundColor: activeColors.bg, borderColor: activeColors.border }]}>
                        {/* FROM */}
                        <View style={styles.currencyRow}>
                            <View>
                                <Text style={[styles.currencyLabel, { color: activeColors.secondary }]}>Convertir ({fromLabel})</Text>
                                <Text style={[styles.currencyValue, { color: theme.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {amount || '0'}
                                    <Text style={{ fontSize: 20, color: theme.primary + '90' }}> {fromSymbol}</Text>
                                </Text>
                            </View>
                        </View>

                        {/* SWAP BUTTON */}
                        <View style={styles.swapContainer}>
                            <View style={[styles.swapLine, { backgroundColor: activeColors.border }]} />
                            <TouchableOpacity onPress={toggleDirection} style={[styles.swapBtn, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '40' }]}>
                                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                                    <Ionicons name="swap-vertical" size={24} color={theme.primary} />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>

                        {/* TO */}
                        <View style={styles.currencyRow}>
                            <View>
                                <Text style={[styles.currencyLabel, { color: activeColors.secondary }]}>Recibes ({toLabel})</Text>
                                <Text style={[styles.currencyValue, { color: activeColors.textDark }]} numberOfLines={1} adjustsFontSizeToFit>
                                    {resultStr}
                                    <Text style={{ fontSize: 20, color: activeColors.secondary }}> {toSymbol}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Watermark */}
                    <Text style={{ color: activeColors.secondary, fontSize: 10, textAlign: 'center', marginTop: 18, fontStyle: 'italic', fontWeight: '600' }}>
                        Cálculo estimado • La Tasa App
                    </Text>
                </View>
            </TouchableOpacity>

            {/* Warning for Binance */}
            {id && id.includes('binance') && (
                <View style={[styles.warningBox, { backgroundColor: theme.primarySoft, borderColor: theme.primary }]}>
                    <Ionicons name="warning" size={16} color={theme.secondary || '#F59E0B'} style={{ marginRight: 6 }} />
                    <Text style={{ color: theme.secondary || '#F59E0B', fontSize: 11, flex: 1, fontWeight: '800' }}>
                        Estimación P2P. Verifique directamente en Binance.
                    </Text>
                </View>
            )}

            {/* Hidden Input & Controls */}
            <View style={{ marginTop: 15 }}>
                <TextInput
                    ref={inputRef}
                    style={{ height: 0, opacity: 0 }}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    autoFocus={Platform.OS === 'ios'} // Prevent autofocus issues on some Androids
                />

                {/* Presets */}
                <View style={styles.presetRow}>
                    {presets.map(p => (
                        <TouchableOpacity
                            key={p}
                            style={[styles.presetBtn, { backgroundColor: activeColors.bg, borderColor: activeColors.border }]}
                            onPress={() => handlePreset(p)}
                        >
                            <Text style={[styles.presetText, { color: activeColors.textDark }]}>{p}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity style={[styles.clearBadge, { backgroundColor: '#FEE2E2', minWidth: '15%' }]} onPress={() => setAmount('')}>
                        <Ionicons name="backspace" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: 'row', marginTop: 10, gap: 10 }}>
                <TouchableOpacity style={[styles.shareBtn, { flex: 1, backgroundColor: STATIC_COLORS.whatsapp }]} onPress={handleImageShare}>
                    <Ionicons name="share-social-outline" size={22} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.shareBtnText}>Compartir</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} style={[styles.shareBtn, { width: 65, backgroundColor: activeColors.bg, borderWidth: 1, borderColor: activeColors.border }]}>
                    <Ionicons name="close" size={26} color={activeColors.secondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                {Platform.OS === 'ios' ? (
                    <KeyboardAvoidingView behavior="padding" style={styles.keyboardView}>
                        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                            {ModalInnerContent}
                        </TouchableWithoutFeedback>
                    </KeyboardAvoidingView>
                ) : (
                    // In Android, we use a robust ScrollView wrapper instead of KeyboardAvoidingView
                    // which often fails inside full-screen modals.
                    <ScrollView
                        contentContainerStyle={styles.androidScrollContent}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {ModalInnerContent}
                    </ScrollView>
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 16 },
    keyboardView: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    androidScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 },

    modalContent: { width: '100%', maxWidth: 420, borderRadius: 32, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.3, shadowRadius: 32, elevation: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 10 },
    branding: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
    title: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    rateInfo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 20, marginHorizontal: 10 },

    exchangeBox: { borderRadius: 24, padding: 16, borderWidth: 1, marginHorizontal: 4 },
    currencyRow: { paddingVertical: 12, paddingHorizontal: 8 },
    currencyLabel: { fontSize: 13, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    currencyValue: { fontSize: 42, fontWeight: '900', letterSpacing: -1 },

    swapContainer: { height: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 4 },
    swapLine: { position: 'absolute', width: '90%', height: 1 },
    swapBtn: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2, zIndex: 10 },

    warningBox: { padding: 12, borderRadius: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed' },

    presetRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 6 },
    presetBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, alignItems: 'center', minWidth: '12%' },
    presetText: { fontWeight: '800', fontSize: 16 },
    clearBadge: { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },

    shareBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, marginTop: 16, borderRadius: 20 },
    shareBtnText: { color: 'white', fontSize: 17, fontWeight: '800' },
});

