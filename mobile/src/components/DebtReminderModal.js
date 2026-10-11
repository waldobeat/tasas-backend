import React, { useEffect, useState } from 'react';
import {
    Modal, View, Text, TouchableOpacity, StyleSheet, FlatList, Animated
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const REMINDER_KEY = '@debt_reminder_last_shown';

/**
 * Returns urgency info for a due date.
 * { label, color, icon, urgent }
 */
const getUrgency = (dueDateStr) => {
    try {
        const d = new Date(dueDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: `Venció hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`, color: '#EF4444', icon: 'warning', urgent: true };
        if (diff === 0) return { label: 'Vence HOY', color: '#F59E0B', icon: 'time', urgent: true };
        if (diff <= 3) return { label: `Vence en ${diff} día${diff !== 1 ? 's' : ''}`, color: '#F59E0B', icon: 'time', urgent: true };
        if (diff <= 7) return { label: `Vence en ${diff} días`, color: '#FBBF24', icon: 'calendar', urgent: true };
        return { label: '', color: '', icon: '', urgent: false };
    } catch {
        return { label: '', color: '', icon: '', urgent: false };
    }
};

/**
 * Extracts all upcoming/overdue installments from a list of transactions
 */
export const getUrgentInstallments = (transactions) => {
    const urgent = [];
    if (!Array.isArray(transactions)) return urgent;

    for (const t of transactions) {
        if (t.type !== 'debt' || t.completed) continue;
        const installments = t.installments || [];
        for (const inst of installments) {
            if (inst.status === 'paid') continue;
            const info = getUrgency(inst.dueDate);
            if (info.urgent) {
                urgent.push({
                    provider: t.provider || t.category || 'Deuda',
                    installmentNum: inst.number,
                    totalInstallments: installments.length,
                    amount: inst.amount,
                    ...info,
                });
            }
        }
        // Also check receivables with a dueDate
        if (t.type === 'receivable' && t.dueDate) {
            const info = getUrgency(t.dueDate);
            if (info.urgent) {
                urgent.push({
                    provider: `Cobrar: ${t.category}`,
                    installmentNum: null,
                    totalInstallments: null,
                    amount: t.amount,
                    ...info,
                    icon: 'cash',
                });
            }
        }
    }

    // Sort: most urgent first (overdue, then soonest)
    return urgent.sort((a, b) => {
        const aIsOverdue = a.label.includes('Venció');
        const bIsOverdue = b.label.includes('Venció');
        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;
        return 0;
    });
};

const DebtReminderModal = ({ transactions = [], onOpenDashboard, theme, activeColors }) => {
    const [visible, setVisible] = useState(false);
    const [urgentItems, setUrgentItems] = useState([]);
    const scaleAnim = useState(new Animated.Value(0.85))[0];

    useEffect(() => {
        checkAndShow();
    }, [transactions]);

    const checkAndShow = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const lastShown = await AsyncStorage.getItem(REMINDER_KEY);
            if (lastShown === today) return; // Already shown today

            const items = getUrgentInstallments(transactions);
            if (items.length === 0) return;

            setUrgentItems(items);
            setVisible(true);

            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 100,
                friction: 8,
                useNativeDriver: true,
            }).start();
        } catch (e) {
            console.log('DebtReminderModal error:', e);
        }
    };

    const dismiss = async () => {
        const today = new Date().toISOString().split('T')[0];
        await AsyncStorage.setItem(REMINDER_KEY, today);
        setVisible(false);
    };

    const handleOpenDashboard = async () => {
        await dismiss();
        onOpenDashboard && onOpenDashboard();
    };

    if (!visible || urgentItems.length === 0) return null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={dismiss}>
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.card,
                    { backgroundColor: activeColors?.bg || '#1a1a2e', transform: [{ scale: scaleAnim }] }
                ]}>
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="notifications" size={22} color="#F59E0B" />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={[styles.title, { color: activeColors?.textDark || '#fff' }]}>
                                ⚠️ Recordatorio de Deudas
                            </Text>
                            <Text style={[styles.subtitle, { color: activeColors?.secondary || '#aaa' }]}>
                                Tienes {urgentItems.length} pago{urgentItems.length !== 1 ? 's' : ''} próximo{urgentItems.length !== 1 ? 's' : ''}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={dismiss} style={styles.closeBtn}>
                            <Ionicons name="close" size={20} color={activeColors?.secondary || '#aaa'} />
                        </TouchableOpacity>
                    </View>

                    {/* List */}
                    <FlatList
                        data={urgentItems.slice(0, 5)}
                        keyExtractor={(_, i) => i.toString()}
                        scrollEnabled={false}
                        style={{ marginTop: 12, marginBottom: 4 }}
                        renderItem={({ item }) => (
                            <View style={[styles.itemRow, { backgroundColor: activeColors?.cardCtx || '#222' }]}>
                                <View style={[styles.dot, { backgroundColor: item.color }]} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemProvider, { color: activeColors?.textDark || '#fff' }]}>
                                        {item.provider}
                                        {item.installmentNum != null
                                            ? ` — Cuota #${item.installmentNum}/${item.totalInstallments}`
                                            : ''}
                                    </Text>
                                    <Text style={[styles.itemLabel, { color: item.color }]}>{item.label}</Text>
                                </View>
                                <Text style={[styles.itemAmt, { color: activeColors?.textDark || '#fff' }]}>
                                    ${item.amount?.toFixed(2)}
                                </Text>
                            </View>
                        )}
                    />
                    {urgentItems.length > 5 && (
                        <Text style={{ color: activeColors?.secondary, fontSize: 12, textAlign: 'center', marginBottom: 8 }}>
                            + {urgentItems.length - 5} más...
                        </Text>
                    )}

                    {/* Buttons */}
                    <View style={styles.btnRow}>
                        <TouchableOpacity onPress={dismiss} style={[styles.btn, styles.dismissBtn, { borderColor: activeColors?.border || '#333' }]}>
                            <Text style={{ color: activeColors?.secondary || '#aaa', fontWeight: '600' }}>Ignorar hoy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleOpenDashboard}
                            style={[styles.btn, styles.primaryBtn, { backgroundColor: theme?.primary || '#6C63FF' }]}
                        >
                            <Text style={{ color: '#fff', fontWeight: '700' }}>Ver Detalles</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        borderRadius: 24,
        padding: 22,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 20,
        elevation: 20,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center' },
    iconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 16, fontWeight: '800' },
    subtitle: { fontSize: 12, marginTop: 2 },
    closeBtn: { padding: 6 },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
    itemProvider: { fontSize: 13, fontWeight: '700' },
    itemLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
    itemAmt: { fontSize: 14, fontWeight: '900', marginLeft: 8 },
    btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    btn: { flex: 1, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
    dismissBtn: { borderWidth: 1.5 },
    primaryBtn: {},
});

export default DebtReminderModal;
