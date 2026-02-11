import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, STATIC_COLORS } from '../styles/theme';
import { formatNumber } from '../utils/helpers';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system'; // Use FileSystem instead of captureRef for now to avoid complexity or pass Ref

// Note: captureRef needs a View reference. Since we are splitting components, 
// sharing might need a ref passed from parent or handled cleanly. 
// For now, removing captureRef dependency inside Calculator to keep it simple or we can add it later.
// The original code passed `handleShare(id)` which captured `cardRefs.current[id]`.
// We will emit an event `onShare` so parent can handle capturing.

export default function Calculator({
    title,
    rateValue,
    activeColors,
    theme,
    onShare,
    animValue // Optional animation for the flash icon
}) {
    const [amount, setAmount] = useState('');
    const [result, setResult] = useState('0,00 Bs');
    const presets = [5, 10, 20, 50, 100];

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

    return (
        <View style={[styles.calcBody, { borderTopColor: activeColors.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.calcLabel, { color: activeColors.secondary }]}>Convertir {title} a Bolívares</Text>
                {animValue && (
                    <Animated.View style={{ transform: [{ scale: animValue }] }}>
                        <Ionicons name="flash" size={14} color="#F59E0B" />
                    </Animated.View>
                )}
            </View>

            <TextInput
                style={[styles.manualInput, { backgroundColor: activeColors.inputBg, color: activeColors.textDark }]}
                placeholder={`Monto en ${title}`}
                keyboardType="numeric"
                value={amount}
                onChangeText={handleCalcInput}
                placeholderTextColor={activeColors.secondary}
            />

            <View style={styles.presetRow}>
                {presets.map(p => (
                    <TouchableOpacity
                        key={p}
                        style={[styles.presetBtn, { backgroundColor: activeColors.bg, borderColor: activeColors.border }]}
                        onPress={() => handlePreset(p)}
                    >
                        <Text style={[styles.presetText, { color: activeColors.textDark }]}>${p}</Text>
                    </TouchableOpacity>
                ))}
                <TouchableOpacity
                    style={[styles.clearBtn]}
                    onPress={() => handleCalcInput('')}
                >
                    <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 13 }}>LIMPIAR</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.resultContainer, { backgroundColor: theme.primarySoft, borderColor: theme.primary + '20' }]}>
                <Text style={[styles.resultLabel, { color: theme.primary }]}>Total Estimado</Text>
                <Text style={[styles.resultHighlight, { color: theme.primary }]}>{result}</Text>
            </View>

            {amount && parseFloat(amount.replace(',', '.')) > 0 && (
                <TouchableOpacity
                    style={[styles.shareBtn, { backgroundColor: STATIC_COLORS.whatsapp }]}
                    onPress={() => onShare(`Cambio: ${amount} ${title} = ${result} \nTasa: ${formatNumber(rateValue)} Bs.\nCalculado con La Tasa App.`)}
                >
                    <Ionicons name="logo-whatsapp" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.shareBtnText}>Compartir Resultado</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    calcBody: {
        marginTop: scale(15),
        paddingTop: scale(15),
        borderTopWidth: 1,
    },
    calcLabel: {
        fontSize: 14,
        marginBottom: 0,
        fontWeight: '600',
    },
    manualInput: {
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 16,
        borderWidth: 1.5,
        borderColor: 'rgba(0,0,0,0.05)',
    },
    presetRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'flex-start',
    },
    presetBtn: {
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        borderWidth: 1,
    },
    clearBtn: {
        backgroundColor: '#FEE2E2',
        paddingVertical: 10,
        paddingHorizontal: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    presetText: {
        fontWeight: '700',
        fontSize: 15,
    },
    resultContainer: {
        marginTop: 20,
        alignItems: 'center',
        padding: 24,
        borderRadius: 20,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    resultLabel: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    resultHighlight: {
        fontSize: 40,
        fontWeight: '900',
        letterSpacing: -1,
    },
    shareBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        marginTop: 20,
        borderRadius: 18,
        width: '100%',
        alignSelf: 'center',
    },
    shareBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
