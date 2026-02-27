import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const CalendarPicker = ({ value, onSelect, onClose, activeColors, theme }) => {
    const initial = value ? new Date(value) : new Date();
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    const [selected, setSelected] = useState(value || null);

    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const todayStr = new Date().toISOString().split('T')[0];
    const selectedStr = selected;

    const toISO = (d) => {
        const m = String(viewMonth + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        return `${viewYear}-${m}-${dd}`;
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    return (
        <View style={[calStyles.wrap, { backgroundColor: activeColors.cardCtx }]}>
            {/* Month nav */}
            <View style={calStyles.nav}>
                <TouchableOpacity onPress={prevMonth} style={calStyles.navBtn}>
                    <Ionicons name="chevron-back" size={20} color={activeColors.textDark} />
                </TouchableOpacity>
                <Text style={[calStyles.monthLabel, { color: activeColors.textDark }]}>
                    {MONTHS[viewMonth]} {viewYear}
                </Text>
                <TouchableOpacity onPress={nextMonth} style={calStyles.navBtn}>
                    <Ionicons name="chevron-forward" size={20} color={activeColors.textDark} />
                </TouchableOpacity>
            </View>

            {/* Week headers */}
            <View style={calStyles.row}>
                {DAYS.map(d => (
                    <Text key={d} style={[calStyles.dayLabel, { color: activeColors.secondary }]}>{d}</Text>
                ))}
            </View>

            {/* Grid */}
            {Array.from({ length: cells.length / 7 }, (_, wi) => (
                <View key={wi} style={calStyles.row}>
                    {cells.slice(wi * 7, wi * 7 + 7).map((day, ci) => {
                        if (!day) return <View key={ci} style={calStyles.cell} />;
                        const iso = toISO(day);
                        const isSelected = iso === selectedStr;
                        const isToday = iso === todayStr;
                        return (
                            <TouchableOpacity
                                key={ci}
                                onPress={() => setSelected(iso)}
                                style={[
                                    calStyles.cell,
                                    isSelected && { backgroundColor: theme?.primary || '#6C63FF', borderRadius: 20 },
                                    !isSelected && isToday && { borderWidth: 1.5, borderRadius: 20, borderColor: theme?.primary || '#6C63FF' }
                                ]}
                            >
                                <Text style={[
                                    calStyles.dayNum,
                                    { color: isSelected ? '#fff' : activeColors.textDark },
                                    isToday && !isSelected && { color: theme?.primary || '#6C63FF', fontWeight: '800' }
                                ]}>
                                    {day}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity onPress={onClose} style={[calStyles.calBtn, { borderWidth: 1, borderColor: activeColors.secondary }]}>
                    <Text style={{ color: activeColors.secondary, fontWeight: '600' }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => { onSelect(selected); onClose(); }}
                    style={[calStyles.calBtn, { backgroundColor: theme?.primary || '#6C63FF' }]}
                    disabled={!selected}
                >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>
                        {selected ? `Seleccionar ${selected}` : 'Sin fecha'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const calStyles = StyleSheet.create({
    wrap: { borderRadius: 20, padding: 16, marginTop: 8, marginBottom: 4 },
    nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    navBtn: { padding: 6 },
    monthLabel: { fontSize: 16, fontWeight: '800' },
    row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 4 },
    dayLabel: { width: 34, textAlign: 'center', fontSize: 11, fontWeight: '700' },
    cell: { width: 34, height: 34, justifyContent: 'center', alignItems: 'center' },
    dayNum: { fontSize: 13 },
    calBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
});

export default React.memo(CalendarPicker);
