import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Dimensions, ActivityIndicator, Alert, Modal, TextInput,
    FlatList, Animated, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatNumber } from '../utils/helpers';
import { financeService } from '../utils/financeService';
import { PieChart } from 'react-native-chart-kit';

const { width: SCREEN_W } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
// CUSTOM CALENDAR — pure RN, no external deps
// ═══════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════
// ACCOUNTING ENGINE — Senior Financial Logic
// ═══════════════════════════════════════════════════════════════
/**
 * Balance Rules (accrual accounting):
 * + Income        → adds to balance when recorded
 * - Expense       → subtracts from balance when recorded
 * - Debt installment → subtracts ONLY when status === 'paid'
 * + Receivable      → adds ONLY when status === 'collected'
 *
 * Pending values are shown as separate KPIs, not included in balance.
 */
const buildLedger = (transactions) => {
    let balance = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    let totalPaidDebt = 0;       // debt installments already paid
    let totalPendingDebt = 0;    // debt installments yet to pay
    let totalCollected = 0;      // receivables already collected
    let totalPending = 0;        // receivables not yet collected

    const expenseByCategory = {};

    for (const t of transactions) {
        if (!t) continue;
        const amt = parseFloat(t.amount) || 0;

        if (t.type === 'income') {
            totalIncome += amt;
            balance += amt;
        } else if (t.type === 'expense') {
            totalExpense += amt;
            balance -= amt;
            const cat = t.category || 'Otros';
            expenseByCategory[cat] = (expenseByCategory[cat] || 0) + amt;
        } else if (t.type === 'debt') {
            // Each paid installment reduces balance; pending ones are just a liability
            for (const inst of (t.installments || [])) {
                const iAmt = parseFloat(inst.amount) || 0;
                if (inst.status === 'paid') {
                    totalPaidDebt += iAmt;
                    balance -= iAmt;
                } else {
                    totalPendingDebt += iAmt;
                }
            }
        } else if (t.type === 'receivable') {
            // Only collected receivables count as income
            if (t.status === 'collected') {
                totalCollected += amt;
                balance += amt;
            } else {
                totalPending += amt;
            }
        }
    }

    return {
        balance,
        totalIncome,
        totalExpense,
        totalPaidDebt,
        totalPendingDebt,
        totalCollected,
        totalPending,
        expenseByCategory,
    };
};

// ═══════════════════════════════════════════════════════════════
// HELPER FORMATTERS
// ═══════════════════════════════════════════════════════════════
const formatDateShort = (d) => {
    try {
        return new Date(d).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    } catch { return '—'; }
};

const formatDateFull = (d) => {
    try {
        return new Date(d).toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch { return '—'; }
};

const dueBadge = (dateStr) => {
    try {
        const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000);
        if (diff < 0) return { label: `Vencida hace ${Math.abs(diff)}d`, color: '#EF4444' };
        if (diff === 0) return { label: 'Vence HOY', color: '#F59E0B' };
        if (diff <= 7) return { label: `Vence en ${diff}d`, color: '#F59E0B' };
        return { label: `${formatDateFull(dateStr)}`, color: '#10B981' };
    } catch { return { label: '', color: '#9CA3AF' }; }
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════
const KpiCard = ({ label, value, color, icon, note, activeColors }) => (
    <View style={[kpiStyles.card, { backgroundColor: activeColors.cardCtx }]}>
        <View style={[kpiStyles.icon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={[kpiStyles.label, { color: activeColors.secondary }]}>{label}</Text>
        <Text style={[kpiStyles.value, { color }]} numberOfLines={1}>${formatNumber(value)}</Text>
        {note ? <Text style={[kpiStyles.note, { color: activeColors.secondary }]}>{note}</Text> : null}
    </View>
);

const kpiStyles = StyleSheet.create({
    card: { flex: 1, borderRadius: 16, padding: 12, marginHorizontal: 3, alignItems: 'flex-start', minHeight: 90 },
    icon: { width: 30, height: 30, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    label: { fontSize: 10, fontWeight: '700', marginBottom: 2 },
    value: { fontSize: 13, fontWeight: '900' },
    note: { fontSize: 9, marginTop: 3 },
});

const ActionBtn = ({ icon, label, color, onPress, activeColors }) => (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: color + '18', borderWidth: 1.5, borderColor: color + '40', justifyContent: 'center', alignItems: 'center', marginBottom: 5 }}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={{ fontSize: 10, fontWeight: '700', color: activeColors.secondary }}>{label}</Text>
    </TouchableOpacity>
);

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
const FinancialDashboard = ({ theme, activeColors, user, onClose, onLogout }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const balAnim = useState(new Animated.Value(0.95))[0];

    // ── Add Transaction Modal
    const [modal, setModal] = useState(false);
    const [txType, setTxType] = useState('income');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [provider, setProvider] = useState('Cashea');
    const [numInst, setNumInst] = useState('1');
    const [firstDate, setFirstDate] = useState('');
    const [showCalendar, setShowCalendar] = useState(false); // for receivable due date
    const [showInstCal, setShowInstCal] = useState(false);  // for debt first installment

    // ── Debt Detail modal
    const [debtModal, setDebtModal] = useState(false);
    const [selDebt, setSelDebt] = useState(null);

    // ── Delete confirm
    const [delTarget, setDelTarget] = useState(null);

    const PROVIDERS = ['Cashea', 'Krece', 'TDC', 'Préstamo', 'Amigos', 'Tienda', 'Otro'];
    const EXPENSE_CATS = ['Comida', 'Transporte', 'Servicios', 'Salud', 'Ropa', 'Entretenimiento', 'Educación', 'Otro'];
    const INCOME_CATS = ['Sueldo', 'Freelance', 'Ventas', 'Bono', 'Dividendos', 'Otro'];

    // ── Load
    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        try {
            const data = await financeService.getAllTransactions();
            const valid = Array.isArray(data) ? data : [];
            setTransactions(valid);
            animBalance();
        } catch (e) {
            console.error('[Finance] load error:', e);
        } finally { setLoading(false); }
    };

    const animBalance = () => {
        balAnim.setValue(0.93);
        Animated.spring(balAnim, { toValue: 1, tension: 90, friction: 8, useNativeDriver: true }).start();
    };

    // ── Accounting
    const ledger = useMemo(() => buildLedger(transactions), [transactions]);

    // ── Grouped for list
    const grouped = useMemo(() => {
        const map = {};
        [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(t => {
                const k = formatDateShort(t.date);
                if (!map[k]) map[k] = [];
                map[k].push(t);
            });
        return map;
    }, [transactions]);

    // ── Pie chart data
    const pieData = useMemo(() => {
        const colors = ['#6C63FF', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];
        const entries = Object.entries(ledger.expenseByCategory);
        if (!entries.length) return [{ name: 'Sin gastos', population: 1, color: '#374151', legendFontColor: activeColors.secondary, legendFontSize: 10 }];
        return entries.map(([name, val], i) => ({
            name, population: val, color: colors[i % colors.length],
            legendFontColor: activeColors.secondary, legendFontSize: 10
        }));
    }, [ledger]);

    // ── Open modal helpers
    const openModal = (type) => {
        setTxType(type); setAmount(''); setCategory(''); setNote('');
        setProvider('Cashea'); setNumInst('1'); setFirstDate('');
        setShowCalendar(false); setShowInstCal(false); setModal(true);
    };

    // ── Save transaction
    const save = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) { Alert.alert('Error', 'Monto inválido'); return; }
        if (!category) { Alert.alert('Error', 'Selecciona una categoría'); return; }

        try {
            setLoading(true);
            let body = { type: txType, amount: amt, category, note, date: new Date() };

            if (txType === 'receivable') {
                body.status = 'pending';
                if (firstDate) body.dueDate = new Date(firstDate);
            }

            if (txType === 'debt') {
                const count = Math.max(1, parseInt(numInst) || 1);
                const base = firstDate ? new Date(firstDate) : new Date();
                // Cashea and Krece: installments every 15 days; others: monthly
                const isBiweekly = provider === 'Cashea' || provider === 'Krece';
                const installments = Array.from({ length: count }, (_, i) => {
                    const d = new Date(base);
                    if (isBiweekly) {
                        d.setDate(d.getDate() + (i * 15));
                    } else {
                        d.setMonth(d.getMonth() + i);
                    }
                    return { number: i + 1, amount: parseFloat((amt / count).toFixed(2)), dueDate: d, status: 'pending' };
                });
                body = { ...body, provider, installments, completed: false };
            }

            const saved = await financeService.addTransaction(body);
            const next = [saved, ...transactions];
            setTransactions(next);
            animBalance();
            setModal(false);
        } catch (e) {
            Alert.alert('Error', 'No se pudo guardar. Verifica la conexión.');
        } finally { setLoading(false); }
    };

    // ── Mark receivable as collected
    const markCollected = async (t) => {
        Alert.alert('Confirmar', `¿Marcar $${formatNumber(t.amount)} como cobrado?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: '✓ Cobrado', onPress: async () => {
                    try {
                        const updated = { ...t, status: 'collected', collectedDate: new Date() };
                        await financeService.updateTransaction(t._id, updated);
                        const next = transactions.map(x => x._id === t._id ? updated : x);
                        setTransactions(next);
                        animBalance();
                    } catch { Alert.alert('Error', 'No se pudo actualizar'); }
                }
            }
        ]);
    };

    // ── Pay debt installment
    const payInstallment = async (debt, inst) => {
        if (inst.status === 'paid') return;
        Alert.alert('Pagar Cuota', `¿Pagar cuota #${inst.number} → $${formatNumber(inst.amount)}?`, [
            { text: 'Cancelar', style: 'cancel' },
            {
                text: 'Pagar ✓', onPress: async () => {
                    try {
                        const updInst = debt.installments.map(i =>
                            i.number === inst.number ? { ...i, status: 'paid', paidDate: new Date() } : i
                        );
                        const allPaid = updInst.every(i => i.status === 'paid');
                        const updDebt = { ...debt, installments: updInst, completed: allPaid };
                        await financeService.updateTransaction(debt._id, updDebt);
                        const next = transactions.map(t => t._id === debt._id ? updDebt : t);
                        setTransactions(next);
                        setSelDebt(updDebt);
                        animBalance();
                    } catch { Alert.alert('Error', 'No se pudo actualizar'); }
                }
            }
        ]);
    };

    // ── Delete
    const doDelete = async () => {
        if (!delTarget) return;
        try {
            await financeService.deleteTransaction(delTarget._id);
            const next = transactions.filter(t => t._id !== delTarget._id);
            setTransactions(next);
            animBalance();
        } catch { Alert.alert('Error', 'No se pudo eliminar'); }
        finally { setDelTarget(null); }
    };

    // ── Category chips
    const cats = txType === 'income' ? INCOME_CATS : txType === 'expense' ? EXPENSE_CATS : [];

    // ─── RENDER ───────────────────────────────────────────────
    const balColor = ledger.balance >= 0 ? '#10B981' : '#EF4444';

    return (
        <View style={[S.root, { backgroundColor: activeColors.bg }]}>

            {/* ── HEADER ── */}
            <View style={S.header}>
                <TouchableOpacity
                    onPress={onClose}
                    style={[S.backBtn, { backgroundColor: activeColors.cardCtx }]}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="chevron-back" size={22} color={activeColors.textDark} />
                    <Text style={[S.backBtnText, { color: activeColors.textDark }]}>Tasas</Text>
                </TouchableOpacity>

                <View style={S.headerCenter}>
                    <Text style={[S.appTitle, { color: activeColors.textDark }]}>Mis Finanzas</Text>
                </View>

                <TouchableOpacity
                    onPress={() => Alert.alert('Cerrar sesión', '¿Deseas cerrar tu sesión?', [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Salir', style: 'destructive', onPress: onLogout }
                    ])}
                    style={[S.logoutBtn, { backgroundColor: activeColors.cardCtx }]}
                    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                    <Ionicons name="log-out-outline" size={20} color={activeColors.textDark} />
                </TouchableOpacity>
            </View>

            <FlatList
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                data={Object.keys(grouped)}
                keyExtractor={k => k}
                ListHeaderComponent={<>
                    {/* ── BALANCE CARD ── */}
                    <Animated.View style={[S.balCard, { backgroundColor: theme?.primary || '#6C63FF', transform: [{ scale: balAnim }] }]}>
                        {user?.name && (
                            <Text style={S.walletOwner}>Billetera de {user.name.split(' ')[0]}</Text>
                        )}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View>
                                <Text style={S.balLabel}>Balance Real</Text>
                                <Text style={S.balAmt} numberOfLines={1}>
                                    {loading ? '...' : `$${formatNumber(ledger.balance)}`}
                                </Text>
                                <Text style={S.balSub}>Ingresos − Gastos − Deuda pagada + Cobros recibidos</Text>
                            </View>
                            <View style={S.liveBadge}>
                                <View style={S.liveDot} />
                                <Text style={S.liveText}>WALLET</Text>
                            </View>
                        </View>

                        <View style={S.balRow}>
                            <View style={S.balCol}><Text style={S.balColLabel}>↑ Ingresos</Text><Text style={S.balColVal}>${formatNumber(ledger.totalIncome)}</Text></View>
                            <View style={S.balDivider} />
                            <View style={S.balCol}><Text style={S.balColLabel}>↓ Gastos</Text><Text style={S.balColVal}>${formatNumber(ledger.totalExpense)}</Text></View>
                            <View style={S.balDivider} />
                            <View style={S.balCol}><Text style={S.balColLabel}>⚠ Deuda paid</Text><Text style={S.balColVal}>${formatNumber(ledger.totalPaidDebt)}</Text></View>
                        </View>
                    </Animated.View>

                    {/* ── KPIs ── */}
                    <View style={{ flexDirection: 'row', marginBottom: 18 }}>
                        <KpiCard label="Por cobrar" value={ledger.totalPending} color="#3B82F6" icon="hourglass-outline" note="Pendiente de cobro" activeColors={activeColors} />
                        <KpiCard label="Deuda pend." value={ledger.totalPendingDebt} color="#F59E0B" icon="alert-circle-outline" note="Cuotas sin pagar" activeColors={activeColors} />
                        <KpiCard label="Cobrado ✓" value={ledger.totalCollected} color="#10B981" icon="checkmark-circle-outline" note="Incluido en balance" activeColors={activeColors} />
                    </View>

                    {/* ── ACTION BUTTONS ── */}
                    <View style={{ flexDirection: 'row', marginBottom: 22 }}>
                        <ActionBtn icon="trending-up" label="Ingreso" color="#10B981" onPress={() => openModal('income')} activeColors={activeColors} />
                        <ActionBtn icon="trending-down" label="Gasto" color="#EF4444" onPress={() => openModal('expense')} activeColors={activeColors} />
                        <ActionBtn icon="alert-circle" label="Deuda" color="#F59E0B" onPress={() => openModal('debt')} activeColors={activeColors} />
                        <ActionBtn icon="cash" label="Cobrar" color="#3B82F6" onPress={() => openModal('receivable')} activeColors={activeColors} />
                    </View>

                    {/* ── PIE CHART ── */}
                    {!loading && ledger.totalExpense > 0 && (
                        <View style={{ marginBottom: 20 }}>
                            <Text style={[S.secTitle, { color: activeColors.textDark }]}>Distribución de Gastos</Text>
                            <View style={[S.chartCard, { backgroundColor: activeColors.cardCtx }]}>
                                <PieChart
                                    data={pieData}
                                    width={SCREEN_W - 52}
                                    height={150}
                                    chartConfig={{ color: () => '#fff', labelColor: () => activeColors.secondary }}
                                    accessor="population"
                                    backgroundColor="transparent"
                                    paddingLeft="10"
                                    hasLegend
                                    absolute={false}
                                />
                            </View>
                        </View>
                    )}

                    {/* ── UPCOMING PAYMENTS ── */}
                    {ledger.totalPendingDebt > 0 && (() => {
                        const upcoming = transactions
                            .filter(t => t.type === 'debt' && !t.completed)
                            .flatMap(t => (t.installments || [])
                                .filter(i => i.status !== 'paid')
                                .slice(0, 1)
                                .map(i => ({ ...i, provider: t.provider || t.category }))
                            )
                            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                            .slice(0, 5);
                        if (!upcoming.length) return null;
                        return (
                            <View style={{ marginBottom: 20 }}>
                                <Text style={[S.secTitle, { color: activeColors.textDark }]}>Próximos Pagos</Text>
                                <View style={[S.chartCard, { backgroundColor: activeColors.cardCtx }]}>
                                    {upcoming.map((item, i) => {
                                        const bd = dueBadge(item.dueDate);
                                        return (
                                            <View key={i} style={[S.upRow, i < upcoming.length - 1 && { borderBottomWidth: 1, borderBottomColor: activeColors.bg + 'aa' }]}>
                                                <View style={[S.upDot, { backgroundColor: bd.color }]} />
                                                <View style={{ flex: 1 }}>
                                                    <Text style={{ color: activeColors.textDark, fontWeight: '700', fontSize: 13 }}>{item.provider}</Text>
                                                    <Text style={{ color: bd.color, fontSize: 11, marginTop: 1 }}>{bd.label}</Text>
                                                </View>
                                                <Text style={{ color: activeColors.textDark, fontWeight: '900', fontSize: 13 }}>${formatNumber(item.amount)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })()}

                    <Text style={[S.secTitle, { color: activeColors.textDark }]}>
                        Movimientos {transactions.length > 0 ? `(${transactions.length})` : ''}
                    </Text>
                    {loading && <ActivityIndicator color={theme?.primary} style={{ marginTop: 20 }} />}
                </>}

                renderItem={({ item: dateKey }) => (
                    <View style={{ marginBottom: 14 }}>
                        <Text style={[S.dateHdr, { color: activeColors.secondary }]}>{dateKey}</Text>
                        {grouped[dateKey].map((t, i) => {
                            const isDebt = t.type === 'debt';
                            const isReceiv = t.type === 'receivable';
                            const isIncome = t.type === 'income';
                            const collected = isReceiv && t.status === 'collected';

                            const iconName = isIncome ? 'trending-up' : isDebt ? 'alert-circle' : isReceiv ? 'cash' : 'trending-down';
                            const iconColor = isIncome ? '#10B981' : isDebt ? '#F59E0B' : isReceiv ? (collected ? '#10B981' : '#3B82F6') : '#EF4444';
                            const iconBg = isIncome ? '#DCFCE7' : isDebt ? '#FEF3C7' : isReceiv ? (collected ? '#DCFCE7' : '#DBEAFE') : '#FEE2E2';
                            const amtSign = (isIncome || (isReceiv && collected)) ? '+' : '';
                            const instNext = isDebt ? (t.installments || []).find(x => x.status !== 'paid') : null;
                            const bd = instNext ? dueBadge(instNext.dueDate) : isReceiv && t.dueDate ? dueBadge(t.dueDate) : null;

                            return (
                                <TouchableOpacity
                                    key={i}
                                    onPress={() => isDebt ? (setSelDebt(t), setDebtModal(true)) : null}
                                    onLongPress={() => setDelTarget(t)}
                                    activeOpacity={0.75}
                                    style={[S.txRow, { backgroundColor: activeColors.cardCtx }]}
                                >
                                    <View style={[S.txIcon, { backgroundColor: iconBg }]}>
                                        <Ionicons name={iconName} size={18} color={iconColor} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[S.txCat, { color: activeColors.textDark }]}>
                                            {isDebt ? (t.provider || t.category) : t.category}
                                        </Text>
                                        {isDebt && t.installments && (
                                            <Text style={{ color: activeColors.secondary, fontSize: 10 }}>
                                                {t.installments.filter(x => x.status === 'paid').length}/{t.installments.length} cuotas pagadas
                                            </Text>
                                        )}
                                        {bd && <Text style={{ color: bd.color, fontSize: 10, fontWeight: '700', marginTop: 1 }}>📅 {bd.label}</Text>}
                                        {isReceiv && !collected && (
                                            <Text style={{ color: '#3B82F6', fontSize: 10, fontWeight: '700' }}>⏳ Pendiente de cobro</Text>
                                        )}
                                        {isReceiv && collected && (
                                            <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>✓ Cobrado el {formatDateShort(t.collectedDate)}</Text>
                                        )}
                                        {t.note ? <Text style={{ color: activeColors.secondary, fontSize: 10 }}>{t.note}</Text> : null}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[S.txAmt, { color: iconColor }]}>{amtSign}${formatNumber(t.amount)}</Text>
                                        {isReceiv && !collected && (
                                            <TouchableOpacity
                                                onPress={() => markCollected(t)}
                                                style={[S.collectBtn, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}
                                            >
                                                <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '800' }}>✓ Cobrado</Text>
                                            </TouchableOpacity>
                                        )}
                                        {isDebt && <Text style={{ color: activeColors.secondary, fontSize: 9, marginTop: 2 }}>Mantén para eliminar</Text>}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                ListEmptyComponent={!loading && (
                    <View style={{ alignItems: 'center', paddingTop: 40 }}>
                        <Ionicons name="wallet-outline" size={52} color={activeColors.secondary + '80'} />
                        <Text style={{ color: activeColors.secondary, marginTop: 14, fontSize: 15, fontWeight: '700' }}>Sin movimientos</Text>
                        <Text style={{ color: activeColors.secondary, fontSize: 12, marginTop: 4 }}>Usa los botones de arriba para registrar</Text>
                    </View>
                )}
            />

            {/* ══════════════════════════════════════════════════
                 MODAL: ADD TRANSACTION
            ══════════════════════════════════════════════════ */}
            <Modal visible={modal} transparent animationType="slide" onRequestClose={() => setModal(false)}>
                <View style={S.modalBg}>
                    <View style={[S.sheet, { backgroundColor: activeColors.bg }]}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Title */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <Text style={[S.sheetTitle, { color: activeColors.textDark }]}>
                                    {txType === 'income' ? '💚 Nuevo Ingreso'
                                        : txType === 'expense' ? '❤️ Nuevo Gasto'
                                            : txType === 'receivable' ? '💙 Por Cobrar'
                                                : '🟡 Nueva Deuda'}
                                </Text>
                                <TouchableOpacity onPress={() => setModal(false)}>
                                    <Ionicons name="close-circle" size={26} color={activeColors.secondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Amount */}
                            <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>Monto ($)</Text>
                            <TextInput
                                placeholder="0.00"
                                placeholderTextColor={activeColors.secondary}
                                style={[S.input, { backgroundColor: activeColors.cardCtx, color: activeColors.textDark }]}
                                keyboardType="numeric"
                                value={amount}
                                onChangeText={setAmount}
                            />

                            {/* Category chips or free-text */}
                            <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>Categoría</Text>
                            {cats.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                    {cats.map(c => (
                                        <TouchableOpacity key={c} onPress={() => setCategory(c)}
                                            style={[S.chip, { backgroundColor: category === c ? (theme?.primary || '#6C63FF') : activeColors.cardCtx }]}>
                                            <Text style={{ color: category === c ? '#fff' : activeColors.secondary, fontSize: 12, fontWeight: '600' }}>{c}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            ) : (
                                <TextInput placeholder="Describe la categoría" placeholderTextColor={activeColors.secondary}
                                    style={[S.input, { backgroundColor: activeColors.cardCtx, color: activeColors.textDark }]}
                                    value={category} onChangeText={setCategory} />
                            )}

                            {/* Note */}
                            <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>Nota (opcional)</Text>
                            <TextInput placeholder="Añade un comentario..." placeholderTextColor={activeColors.secondary}
                                style={[S.input, { backgroundColor: activeColors.cardCtx, color: activeColors.textDark }]}
                                value={note} onChangeText={setNote} />

                            {/* RECEIVABLE: due date */}
                            {txType === 'receivable' && (
                                <>
                                    <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>📅 Fecha esperada de cobro</Text>
                                    <TouchableOpacity onPress={() => setShowCalendar(!showCalendar)}
                                        style={[S.input, S.datePickerBtn, { backgroundColor: activeColors.cardCtx }]}>
                                        <Text style={{ color: firstDate ? activeColors.textDark : activeColors.secondary }}>
                                            {firstDate || 'Seleccionar fecha (opcional)'}
                                        </Text>
                                        <Ionicons name="calendar" size={18} color={activeColors.secondary} />
                                    </TouchableOpacity>
                                    {showCalendar && (
                                        <CalendarPicker
                                            value={firstDate}
                                            onSelect={d => setFirstDate(d)}
                                            onClose={() => setShowCalendar(false)}
                                            activeColors={activeColors}
                                            theme={theme}
                                        />
                                    )}
                                </>
                            )}

                            {/* DEBT: provider + installments + first date */}
                            {txType === 'debt' && (
                                <>
                                    <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>Proveedor / Acreedor</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                        {PROVIDERS.map(p => (
                                            <TouchableOpacity key={p} onPress={() => setProvider(p)}
                                                style={[S.chip, { backgroundColor: provider === p ? (theme?.primary || '#6C63FF') : activeColors.cardCtx }]}>
                                                <Text style={{ color: provider === p ? '#fff' : activeColors.secondary, fontSize: 12, fontWeight: '600' }}>{p}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>

                                    <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>Número de Cuotas</Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                                        <TextInput placeholder="1" placeholderTextColor={activeColors.secondary}
                                            style={[S.input, { flex: 1, marginBottom: 0, backgroundColor: activeColors.cardCtx, color: activeColors.textDark }]}
                                            keyboardType="numeric" value={numInst} onChangeText={setNumInst} />
                                        {amount && parseInt(numInst) > 0 && (
                                            <Text style={{ flex: 2, color: activeColors.secondary, fontSize: 12 }}>
                                                ≈ ${parseFloat((parseFloat(amount) / (parseInt(numInst) || 1)).toFixed(2))} / cuota
                                            </Text>
                                        )}
                                    </View>

                                    <Text style={[S.fieldLabel, { color: activeColors.secondary }]}>📅 Fecha primera cuota</Text>
                                    <TouchableOpacity onPress={() => setShowInstCal(!showInstCal)}
                                        style={[S.input, S.datePickerBtn, { backgroundColor: activeColors.cardCtx }]}>
                                        <Text style={{ color: firstDate ? activeColors.textDark : activeColors.secondary }}>
                                            {firstDate || 'Seleccionar (por defecto: hoy)'}
                                        </Text>
                                        <Ionicons name="calendar" size={18} color={activeColors.secondary} />
                                    </TouchableOpacity>
                                    {showInstCal && (
                                        <CalendarPicker
                                            value={firstDate}
                                            onSelect={d => setFirstDate(d)}
                                            onClose={() => setShowInstCal(false)}
                                            activeColors={activeColors}
                                            theme={theme}
                                        />
                                    )}
                                    {firstDate && parseInt(numInst) > 1 && (
                                        <Text style={{ color: activeColors.secondary, fontSize: 11, marginBottom: 8 }}>
                                            ℹ️ Las siguientes cuotas se programarán automáticamente cada 15 días.
                                        </Text>
                                    )}
                                </>
                            )}

                            {/* Save / Cancel */}
                            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                                <TouchableOpacity onPress={() => setModal(false)} style={[S.btn, { borderWidth: 1.5, borderColor: activeColors.secondary + '60' }]}>
                                    <Text style={{ color: activeColors.secondary, fontWeight: '700' }}>Cancelar</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={save} style={[S.btn, { backgroundColor: theme?.primary || '#6C63FF' }]}>
                                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: '800' }}>Guardar</Text>}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* ══════════════════════════════════════════════════
                 MODAL: DEBT DETAIL
            ══════════════════════════════════════════════════ */}
            <Modal visible={debtModal} transparent animationType="slide" onRequestClose={() => setDebtModal(false)}>
                <View style={[S.modalBg, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[S.sheet, { backgroundColor: activeColors.bg, borderRadius: 28, maxHeight: '78%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={[S.sheetTitle, { color: activeColors.textDark }]}>Detalle de Deuda</Text>
                            <TouchableOpacity onPress={() => setDebtModal(false)}>
                                <Ionicons name="close-circle" size={26} color={activeColors.secondary} />
                            </TouchableOpacity>
                        </View>

                        {selDebt && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Summary */}
                                <View style={[S.chartCard, { backgroundColor: activeColors.cardCtx, marginBottom: 16 }]}>
                                    <Text style={{ color: activeColors.textDark, fontWeight: '900', fontSize: 18 }}>{selDebt.provider || selDebt.category}</Text>
                                    <Text style={{ color: '#F59E0B', fontWeight: '900', fontSize: 26, marginTop: 4 }}>${formatNumber(selDebt.amount)}</Text>
                                    <Text style={{ color: activeColors.secondary, marginTop: 2 }}>{selDebt.category}</Text>

                                    {/* Progress */}
                                    {(() => {
                                        const paid = (selDebt.installments || []).filter(x => x.status === 'paid').length;
                                        const total = (selDebt.installments || []).length;
                                        const pct = total ? paid / total : 0;
                                        const paidAmt = (selDebt.installments || []).filter(x => x.status === 'paid').reduce((s, x) => s + x.amount, 0);
                                        return (
                                            <View style={{ marginTop: 14 }}>
                                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Pagado: {paid}/{total} cuotas</Text>
                                                    <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 12 }}>${formatNumber(paidAmt)}</Text>
                                                </View>
                                                <View style={S.progBg}>
                                                    <View style={[S.progFill, { width: `${pct * 100}%`, backgroundColor: pct === 1 ? '#10B981' : (theme?.primary || '#6C63FF') }]} />
                                                </View>
                                            </View>
                                        );
                                    })()}
                                </View>

                                <Text style={{ color: activeColors.textDark, fontWeight: '800', fontSize: 15, marginBottom: 10 }}>Plan de Pagos</Text>

                                {(selDebt.installments || []).map((inst, idx) => {
                                    const bd = inst.status !== 'paid' ? dueBadge(inst.dueDate) : null;
                                    return (
                                        <TouchableOpacity key={idx}
                                            onPress={() => payInstallment(selDebt, inst)}
                                            style={[S.txRow, { backgroundColor: activeColors.cardCtx, opacity: inst.status === 'paid' ? 0.55 : 1 }]}
                                        >
                                            <View style={{ width: 32, alignItems: 'center' }}>
                                                {inst.status === 'paid'
                                                    ? <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                                    : <Text style={{ color: activeColors.secondary, fontWeight: '900' }}>#{inst.number}</Text>}
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <Text style={{ color: activeColors.textDark, fontWeight: '800', fontSize: 14 }}>${formatNumber(inst.amount)}</Text>
                                                {bd && <Text style={{ color: bd.color, fontSize: 11, marginTop: 1 }}>{bd.label}</Text>}
                                                {inst.status === 'paid' && inst.paidDate && (
                                                    <Text style={{ color: '#10B981', fontSize: 11 }}>Pagada el {formatDateShort(inst.paidDate)}</Text>
                                                )}
                                            </View>
                                            {inst.status !== 'paid' && (
                                                <View style={[S.payChip, { backgroundColor: (theme?.primary || '#6C63FF') + '20', borderColor: theme?.primary || '#6C63FF' }]}>
                                                    <Text style={{ color: theme?.primary || '#6C63FF', fontSize: 11, fontWeight: '800' }}>PAGAR</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        <TouchableOpacity onPress={() => setDebtModal(false)} style={[S.btn, { marginTop: 12, backgroundColor: activeColors.cardCtx }]}>
                            <Text style={{ color: activeColors.textDark, fontWeight: '700', fontSize: 15 }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ══════════════════════════════════════════════════
                 MODAL: DELETE CONFIRM
            ══════════════════════════════════════════════════ */}
            <Modal visible={!!delTarget} transparent animationType="fade" onRequestClose={() => setDelTarget(null)}>
                <View style={S.modalBg}>
                    <View style={[S.sheet, { backgroundColor: activeColors.cardCtx, borderRadius: 24, paddingVertical: 28 }]}>
                        <Ionicons name="trash" size={36} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
                        <Text style={[S.sheetTitle, { color: activeColors.textDark }]}>¿Eliminar?</Text>
                        <Text style={{ color: activeColors.secondary, textAlign: 'center', marginBottom: 20 }}>
                            {delTarget?.category} — ${formatNumber(delTarget?.amount)}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setDelTarget(null)} style={[S.btn, { borderWidth: 1.5, borderColor: activeColors.secondary + '60' }]}>
                                <Text style={{ color: activeColors.secondary, fontWeight: '600' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={doDelete} style={[S.btn, { backgroundColor: '#EF4444' }]}>
                                <Text style={{ color: '#fff', fontWeight: '800' }}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════
const S = StyleSheet.create({
    root: { flex: 1, paddingHorizontal: 16 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 45,
        paddingBottom: 16
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 10,
    },
    appTitle: {
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.3
    },
    userGreet: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 6,
        paddingRight: 14,
        height: 44,
        borderRadius: 22,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2
    },
    backBtnText: {
        fontWeight: '700',
        fontSize: 14,
        marginLeft: 2,
    },
    logoutBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2
    },

    // Balance card
    balCard: { borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 16, elevation: 10 },
    walletOwner: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '800', marginBottom: 10 },
    balLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' },
    balAmt: { color: '#fff', fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 4 },
    balSub: { color: 'rgba(255,255,255,0.55)', fontSize: 9, marginTop: 3, fontStyle: 'italic' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
    liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 5 },
    liveText: { color: '#fff', fontSize: 10, fontWeight: '900' },
    balRow: { flexDirection: 'row', marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 14 },
    balCol: { flex: 1, alignItems: 'center' },
    balColLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '700', marginBottom: 3 },
    balColVal: { color: '#fff', fontSize: 12, fontWeight: '900' },
    balDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },

    // Section
    secTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
    chartCard: { borderRadius: 18, padding: 14, marginBottom: 4 },

    // Upcoming
    upRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    upDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },

    // Transaction row
    dateHdr: { fontSize: 11, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
    txRow: { flexDirection: 'row', padding: 12, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
    txIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    txCat: { fontSize: 14, fontWeight: '700' },
    txAmt: { fontSize: 15, fontWeight: '900' },
    collectBtn: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },

    // Modal
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 },
    sheetTitle: { fontSize: 18, fontWeight: '900', textAlign: 'center' },

    // Form
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 6, marginTop: 4 },
    input: { padding: 14, borderRadius: 14, marginBottom: 12, fontSize: 14 },
    datePickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    payChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },

    // Progress
    progBg: { height: 7, borderRadius: 4, backgroundColor: '#374151', overflow: 'hidden' },
    progFill: { height: 7, borderRadius: 4 },
});

export default FinancialDashboard;