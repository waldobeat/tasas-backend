import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNumber } from '../utils/helpers';

export const KpiCard = React.memo(({ label, value, color, icon, note, activeColors }) => (
    <View style={[kpiStyles.card, { backgroundColor: activeColors.cardCtx }]}>
        <View style={[kpiStyles.icon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[kpiStyles.label, { color: activeColors.secondary }]}>{label}</Text>
        <Text style={[kpiStyles.value, { color }]} numberOfLines={1}>${formatNumber(value)}</Text>
        {note ? <Text style={[kpiStyles.note, { color: activeColors.secondary }]}>{note}</Text> : null}
    </View>
));

const kpiStyles = StyleSheet.create({
    card: { flex: 1, borderRadius: 16, padding: 12, marginHorizontal: 3, alignItems: 'flex-start', minHeight: 90 },
    icon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    label: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
    value: { fontSize: 13, fontWeight: '900' },
    note: { fontSize: 9, marginTop: 3 },
});

export const ActionBtn = React.memo(({ icon, label, color, onPress, activeColors }) => (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color + '18', borderWidth: 1.5, borderColor: color + '40', justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: activeColors.secondary }}>{label}</Text>
    </TouchableOpacity>
));
