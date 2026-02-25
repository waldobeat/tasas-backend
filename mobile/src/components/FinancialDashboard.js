import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Dimensions, ActivityIndicator, Alert, Modal, TextInput,
    FlatList, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { formatNumber } from '../utils/helpers';
import { financeService } from '../utils/financeService';
import { PieChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

// ─── Helper Functions ─────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
    } catch { return 'N/A'; }
};

const formatDueDate = (dateStr) => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', year: '2-digit' });
    } catch { return 'N/A'; }
};

const daysUntil = (dateStr) => {
    try {
        const d = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { label: `Venció hace ${Math.abs(diff)}d`, color: '#EF4444' };
        if (diff === 0) return { label: 'Vence HOY', color: '#F59E0B' };
        if (diff <= 7) return { label: `Vence en ${diff}d`, color: '#F59E0B' };
        return { label: `Vence el ${formatDueDate(dateStr)}`, color: '#10B981' };
    } catch { return { label: '', color: '#6B7280' }; }
};

const getNextPendingInstallment = (t) => {
    if (!t.installments?.length) return null;
    return t.installments.find(i => i.status !== 'paid') || null;
};

// ─── Stats Calculator ─────────────────────────────────────────────────────────
const calculateStats = (data, activeColors, themePrimary) => {
    let income = 0, expense = 0, debt = 0, receivable = 0;
    const catMap = {};
    const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
    const historyLabels = [];
    const historyData = [];
    let runningBalance = 0;

    sortedData.forEach(t => {
        const amt = parseFloat(t.amount) || 0;
        if (t.type === 'income') { income += amt; runningBalance += amt; }
        else if (t.type === 'expense') {
            expense += amt; runningBalance -= amt;
            const cat = t.category || 'Otros';
            catMap[cat] = (catMap[cat] || 0) + amt;
        } else if (t.type === 'receivable') { receivable += amt; runningBalance += amt; }
        else if (t.type === 'debt' && !t.completed) {
            let paid = 0;
            if (t.installments) paid = t.installments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
            else paid = (t.payments || []).reduce((s, p) => s + p.amount, 0);
            debt += Math.max(0, amt - paid);
        }

        const dateLabel = formatDate(t.date);
        if (historyLabels[historyLabels.length - 1] !== dateLabel) {
            if (historyLabels.length < 7) {
                historyLabels.push(dateLabel);
                historyData.push(parseFloat(runningBalance.toFixed(2)));
            }
        } else {
            historyData[historyData.length - 1] = parseFloat(runningBalance.toFixed(2));
        }
    });

    const catColors = ['#6C63FF', '#EF4444', '#10B981', '#F59E0B', '#3B82F6', '#8B5CF6'];
    const categories = Object.keys(catMap).map((key, index) => ({
        name: key,
        population: catMap[key],
        color: catColors[index % catColors.length],
        legendFontColor: activeColors.secondary,
        legendFontSize: 10,
    }));

    return {
        totalIncome: income,
        totalExpense: expense,
        totalDebt: debt,
        totalReceivable: receivable,
        balance: income + receivable - expense,
        categories: categories.length > 0
            ? categories
            : [{ name: 'Sin Gastos', population: 1, color: activeColors.border || '#333', legendFontColor: activeColors.secondary, legendFontSize: 10 }],
        history: {
            labels: historyLabels.length > 0 ? historyLabels : ['Hoy'],
            data: historyData.length > 0 ? historyData : [0],
        },
    };
};

// ─── Mini Stat Card ───────────────────────────────────────────────────────────
const StatCard = ({ label, amount, color, icon, activeColors }) => (
    <View style={[miniStyles.card, { backgroundColor: activeColors.cardCtx }]}>
        <View style={[miniStyles.iconBox, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={[miniStyles.label, { color: activeColors.secondary }]}>{label}</Text>
        <Text style={[miniStyles.amount, { color }]}>${formatNumber(amount)}</Text>
    </View>
);

const miniStyles = StyleSheet.create({
    card: { flex: 1, borderRadius: 16, padding: 12, marginHorizontal: 4, alignItems: 'flex-start' },
    iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    label: { fontSize: 10, fontWeight: '600', marginBottom: 4 },
    amount: { fontSize: 14, fontWeight: '900' },
});

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionButton = ({ icon, label, color, onPress, activeColors }) => (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
        <View style={[styles.actionBtnCircle, { backgroundColor: color + '18', borderWidth: 1.5, borderColor: color + '40' }]}>
            <Ionicons name={icon} size={22} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color: activeColors.secondary }]}>{label}</Text>
    </TouchableOpacity>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FinancialDashboard = ({ theme, activeColors, isPremium, premiumType, onOpenPremium, refreshKey, user, onClose, onLogout }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const balanceAnim = useState(new Animated.Value(0))[0];

    // Action Modal
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionType, setActionType] = useState(null);
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [debtProvider, setDebtProvider] = useState('Cashea');
    const [installments, setInstallments] = useState('1');
    // First installment start date (YYYY-MM-DD) — subsequent ones auto-increment monthly
    const [firstInstallmentDate, setFirstInstallmentDate] = useState('');

    const PROVIDERS = ['Cashea', 'Krece', 'TDC', 'Prestame', 'Bodegas', 'Panas', 'Otro'];

    // Debt Detail Modal
    const [debtDetailVisible, setDebtDetailVisible] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);

    // Delete confirm modal
    const [deleteTarget, setDeleteTarget] = useState(null);

    useEffect(() => { loadData(); }, [refreshKey]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await financeService.getAllTransactions();
            const valid = Array.isArray(data) ? data : [];
            setTransactions(valid);
            updateStats(valid);
        } catch (e) {
            console.error('Finance load error:', e);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const updateStats = useCallback((data) => {
        const newStats = calculateStats(data, activeColors, theme?.primary);
        setStats(newStats);
        // Animate balance change
        Animated.spring(balanceAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    }, [activeColors, theme]);

    const openActionModal = (type) => {
        setActionType(type);
        setAmount('');
        setCategory('');
        setNote('');
        setDueDate('');
        setInstallments('1');
        setFirstInstallmentDate('');
        setDebtProvider('Cashea');
        setActionModalVisible(true);
    };

    const openDebtDetails = (debt) => { setSelectedDebt(debt); setDebtDetailVisible(true); };
    const closeDebtDetails = () => { setDebtDetailVisible(false); setSelectedDebt(null); };

    const handleAddTransaction = async () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert('Error', 'Monto inválido'); return;
        }
        if (!category) { Alert.alert('Error', 'La categoría es obligatoria'); return; }

        try {
            setLoading(true);
            let newTrans = { type: actionType, amount: parseFloat(amount), category, note, date: new Date() };

            if (actionType === 'receivable' && dueDate) {
                newTrans.dueDate = new Date(dueDate);
            }

            if (actionType === 'debt') {
                const count = parseInt(installments) || 1;
                const portion = parseFloat(amount) / count;
                const debtInstallments = [];
                // Use firstInstallmentDate if provided, otherwise default to today
                const baseDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();
                for (let i = 0; i < count; i++) {
                    const d = new Date(baseDate);
                    d.setMonth(d.getMonth() + i);
                    debtInstallments.push({ number: i + 1, amount: portion, dueDate: d, status: 'pending' });
                }
                newTrans = { ...newTrans, provider: debtProvider, installments: debtInstallments, completed: false };
            }

            const saved = await financeService.addTransaction(newTrans);
            // Real-time update: add to state directly
            const updated = [saved, ...transactions];
            setTransactions(updated);
            updateStats(updated);

            setActionModalVisible(false);
            Alert.alert('✅ Éxito', 'Movimiento registrado');
        } catch (e) {
            Alert.alert('Error', 'No se pudo guardar');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        try {
            await financeService.deleteTransaction(id);
            const updated = transactions.filter(t => t._id !== id);
            setTransactions(updated);
            updateStats(updated); // Real-time balance update
            setDeleteTarget(null);
            Alert.alert('✅ Eliminado');
        } catch {
            Alert.alert('Error', 'No se pudo eliminar');
        }
    };

    const handlePayInstallment = async (debt, installment) => {
        if (installment.status === 'paid') return;
        Alert.alert(
            'Pagar Cuota',
            `¿Confirmas el pago de la cuota #${installment.number} por $${installment.amount.toFixed(2)}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Pagar', onPress: async () => {
                        try {
                            setLoading(true);
                            const updatedInst = debt.installments.map(i =>
                                i.number === installment.number ? { ...i, status: 'paid', paidDate: new Date() } : i
                            );
                            const allPaid = updatedInst.every(i => i.status === 'paid');
                            const updatedDebt = { ...debt, installments: updatedInst, completed: allPaid };
                            await financeService.updateTransaction(debt._id, updatedDebt);

                            // Real-time update
                            const updated = transactions.map(t => t._id === debt._id ? updatedDebt : t);
                            setTransactions(updated);
                            updateStats(updated);

                            // Refresh selected debt view
                            setSelectedDebt(updatedDebt);
                            Alert.alert('✅ Éxito', 'Cuota marcada como pagada');
                        } catch { Alert.alert('Error', 'No se pudo actualizar la deuda'); }
                        finally { setLoading(false); }
                    }
                }
            ]
        );
    };

    const groupedTransactions = transactions.reduce((acc, curr) => {
        if (!curr) return acc;
        const key = formatDate(curr.date);
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
    }, {});

    const chartConfig = {
        backgroundGradientFrom: activeColors.cardCtx,
        backgroundGradientTo: activeColors.cardCtx,
        color: () => theme?.primary || '#6C63FF',
        labelColor: () => activeColors.secondary,
        strokeWidth: 2,
        decimalPlaces: 0,
        propsForDots: { r: '4', strokeWidth: '2', stroke: theme?.primary || '#6C63FF' },
    };

    const pendingDebt = stats?.totalDebt || 0;
    const balanceColor = (stats?.balance || 0) >= 0 ? '#10B981' : '#EF4444';

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg }]}>
            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: activeColors.secondary }]}>Hola, {user?.name?.split(' ')[0] || 'Usuario'} 👋</Text>
                    <Text style={[styles.title, { color: activeColors.textDark }]}>Mis Finanzas</Text>
                </View>
                {/* Only Close button in header — Logout moved to bottom bar */}
                <TouchableOpacity onPress={onClose} style={[styles.headerBtn, { backgroundColor: activeColors.cardCtx }]}>
                    <Ionicons name="close" size={22} color={activeColors.textDark} />
                </TouchableOpacity>
            </View>

            <FlatList
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                data={Object.keys(groupedTransactions)}
                keyExtractor={item => item}
                ListHeaderComponent={
                    <>
                        {/* MAIN BALANCE CARD */}
                        <Animated.View style={[styles.balanceCard, {
                            backgroundColor: theme?.primary || '#6C63FF',
                            transform: [{ scale: balanceAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }]
                        }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <View>
                                    <Text style={styles.balanceLabel}>Balance Neto</Text>
                                    <Text style={styles.balanceAmount}>
                                        {loading ? '...' : `$${formatNumber(stats?.balance || 0)}`}
                                    </Text>
                                </View>
                                <View style={styles.cardBadge}>
                                    <Ionicons name="wallet" size={18} color="white" />
                                    <Text style={styles.cardBadgeText}>EN VIVO</Text>
                                </View>
                            </View>

                            {/* quick stats row */}
                            <View style={styles.cardStatsRow}>
                                <View style={styles.cardStat}>
                                    <Ionicons name="arrow-up-circle" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.cardStatLabel}>Ingresos</Text>
                                    <Text style={styles.cardStatAmt}>${formatNumber(stats?.totalIncome || 0)}</Text>
                                </View>
                                <View style={styles.cardStatDivider} />
                                <View style={styles.cardStat}>
                                    <Ionicons name="arrow-down-circle" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.cardStatLabel}>Gastos</Text>
                                    <Text style={styles.cardStatAmt}>${formatNumber(stats?.totalExpense || 0)}</Text>
                                </View>
                                <View style={styles.cardStatDivider} />
                                <View style={styles.cardStat}>
                                    <Ionicons name="cash-outline" size={14} color="rgba(255,255,255,0.8)" />
                                    <Text style={styles.cardStatLabel}>Por cobrar</Text>
                                    <Text style={styles.cardStatAmt}>${formatNumber(stats?.totalReceivable || 0)}</Text>
                                </View>
                            </View>

                            {/* Debt bar */}
                            {pendingDebt > 0 && (
                                <View style={{ marginTop: 14 }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                                        <Text style={styles.debtBarLabel}>⚠️ Deuda pendiente</Text>
                                        <Text style={styles.debtBarLabel}>${formatNumber(pendingDebt)}</Text>
                                    </View>
                                    <View style={styles.debtBarBg}>
                                        <View style={[styles.debtBarFill, {
                                            width: `${Math.min(100, (pendingDebt / Math.max(stats?.totalIncome || 1, 1)) * 100)}%`
                                        }]} />
                                    </View>
                                </View>
                            )}
                        </Animated.View>

                        {/* MINI STAT CARDS */}
                        {stats && (
                            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                                <StatCard label="Ingresos" amount={stats.totalIncome} color="#10B981" icon="trending-up" activeColors={activeColors} />
                                <StatCard label="Gastos" amount={stats.totalExpense} color="#EF4444" icon="trending-down" activeColors={activeColors} />
                                <StatCard label="Deudas" amount={stats.totalDebt} color="#F59E0B" icon="alert-circle" activeColors={activeColors} />
                            </View>
                        )}

                        {/* ACTION BUTTONS */}
                        <View style={styles.actionContainer}>
                            <ActionButton icon="arrow-up" label="Ingreso" color="#10B981" onPress={() => openActionModal('income')} activeColors={activeColors} />
                            <ActionButton icon="arrow-down" label="Gasto" color="#EF4444" onPress={() => openActionModal('expense')} activeColors={activeColors} />
                            <ActionButton icon="alert-circle" label="Deuda" color="#F59E0B" onPress={() => openActionModal('debt')} activeColors={activeColors} />
                            <ActionButton icon="cash-outline" label="Cobrar" color="#3B82F6" onPress={() => openActionModal('receivable')} activeColors={activeColors} />
                        </View>

                        {/* CHARTS */}
                        {!loading && stats && (
                            <>
                                <Text style={[styles.sectionTitle, { color: activeColors.textDark, marginBottom: 12 }]}>Analíticas</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                    {/* Pie */}
                                    <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx }]}>
                                        <Text style={[styles.chartTitle, { color: activeColors.textDark }]}>Gastos</Text>
                                        <PieChart
                                            data={stats.categories}
                                            width={screenWidth * 0.65}
                                            height={140}
                                            chartConfig={chartConfig}
                                            accessor="population"
                                            backgroundColor="transparent"
                                            paddingLeft="10"
                                            absolute={false}
                                            hasLegend={true}
                                        />
                                    </View>
                                    {/* Line */}
                                    {stats.history.data.length > 1 && (
                                        <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, marginLeft: 12 }]}>
                                            <Text style={[styles.chartTitle, { color: activeColors.textDark }]}>Historial Balance</Text>
                                            <LineChart
                                                data={{ labels: stats.history.labels, datasets: [{ data: stats.history.data }] }}
                                                width={screenWidth * 0.65}
                                                height={140}
                                                chartConfig={chartConfig}
                                                bezier
                                                style={{ borderRadius: 12 }}
                                                withDots={true}
                                                withShadow={false}
                                            />
                                        </View>
                                    )}
                                    {/* Upcoming payments summary */}
                                    <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, marginLeft: 12, minWidth: screenWidth * 0.55 }]}>
                                        <Text style={[styles.chartTitle, { color: activeColors.textDark }]}>Próximos Pagos</Text>
                                        {transactions
                                            .filter(t => t.type === 'debt' && !t.completed)
                                            .flatMap(t => (t.installments || [])
                                                .filter(i => i.status !== 'paid')
                                                .slice(0, 1)
                                                .map(i => ({ ...i, provider: t.provider || t.category }))
                                            )
                                            .slice(0, 4)
                                            .map((item, idx) => {
                                                const info = daysUntil(item.dueDate);
                                                return (
                                                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                                        <View style={[{ width: 8, height: 8, borderRadius: 4, marginRight: 8, backgroundColor: info.color }]} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={{ color: activeColors.textDark, fontSize: 11, fontWeight: '700' }}>{item.provider}</Text>
                                                            <Text style={{ color: info.color, fontSize: 10 }}>{info.label}</Text>
                                                        </View>
                                                        <Text style={{ color: activeColors.textDark, fontSize: 11, fontWeight: '900' }}>${item.amount?.toFixed(2)}</Text>
                                                    </View>
                                                );
                                            })
                                        }
                                        {transactions.filter(t => t.type === 'debt' && !t.completed).length === 0 && (
                                            <Text style={{ color: activeColors.secondary, fontSize: 12, marginTop: 10 }}>Sin deudas pendientes 🎉</Text>
                                        )}
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        <Text style={[styles.sectionTitle, { color: activeColors.textDark }]}>Movimientos Recientes</Text>
                        {loading && <ActivityIndicator size="large" color={theme?.primary} style={{ marginTop: 20 }} />}
                    </>
                }
                renderItem={({ item: date }) => (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={[styles.dateHeader, { color: activeColors.secondary }]}>{date}</Text>
                        {groupedTransactions[date].map((t, index) => {
                            const isDebt = t.type === 'debt';
                            const isReceivable = t.type === 'receivable';
                            const nextInst = isDebt ? getNextPendingInstallment(t) : null;
                            const dueDateInfo = nextInst ? daysUntil(nextInst.dueDate) : (isReceivable && t.dueDate ? daysUntil(t.dueDate) : null);

                            const iconName = t.type === 'income' ? 'arrow-up'
                                : t.type === 'debt' ? 'alert-circle'
                                    : t.type === 'receivable' ? 'cash-outline'
                                        : 'arrow-down';
                            const iconColor = t.type === 'income' ? '#10B981' : t.type === 'debt' ? '#F59E0B' : t.type === 'receivable' ? '#3B82F6' : '#EF4444';
                            const iconBg = t.type === 'income' ? '#DCFCE7' : t.type === 'debt' ? '#FEF3C7' : t.type === 'receivable' ? '#DBEAFE' : '#FEE2E2';
                            const amtSign = (t.type === 'income' || t.type === 'receivable') ? '+' : '-';

                            return (
                                <TouchableOpacity
                                    key={index}
                                    onPress={() => isDebt ? openDebtDetails(t) : null}
                                    onLongPress={() => setDeleteTarget(t)}
                                    activeOpacity={0.75}
                                    style={[styles.transRow, { backgroundColor: activeColors.cardCtx }]}
                                >
                                    <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                                        <Ionicons name={iconName} size={18} color={iconColor} />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text style={[styles.transCat, { color: activeColors.textDark }]}>
                                            {isDebt ? (t.provider || t.category) : t.category}
                                        </Text>
                                        {isDebt && t.installments ? (
                                            <View>
                                                <Text style={{ fontSize: 10, color: activeColors.secondary }}>
                                                    {t.installments.filter(i => i.status === 'paid').length}/{t.installments.length} Cuotas pagadas
                                                </Text>
                                                {dueDateInfo && (
                                                    <Text style={{ fontSize: 10, color: dueDateInfo.color, fontWeight: '700', marginTop: 1 }}>
                                                        📅 {dueDateInfo.label}
                                                    </Text>
                                                )}
                                            </View>
                                        ) : isReceivable && dueDateInfo ? (
                                            <Text style={{ fontSize: 10, color: dueDateInfo.color, fontWeight: '700' }}>
                                                💰 {dueDateInfo.label}
                                            </Text>
                                        ) : t.note ? (
                                            <Text style={{ fontSize: 10, color: activeColors.secondary }}>{t.note}</Text>
                                        ) : null}
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[styles.transAmt, { color: iconColor }]}>
                                            {amtSign}${formatNumber(t.amount)}
                                        </Text>
                                        {isDebt && (
                                            <Text style={{ fontSize: 9, color: activeColors.secondary, marginTop: 2 }}>Toca para detalle</Text>
                                        )}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
                ListEmptyComponent={
                    !loading && (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Ionicons name="wallet-outline" size={48} color={activeColors.secondary} />
                            <Text style={{ color: activeColors.secondary, marginTop: 12, fontSize: 15 }}>No hay movimientos aún.</Text>
                            <Text style={{ color: activeColors.secondary, fontSize: 12, marginTop: 4 }}>Usa los botones de arriba para comenzar.</Text>
                        </View>
                    )
                }
            />

            {/* ── DEBT DETAIL MODAL ── */}
            <Modal visible={debtDetailVisible} transparent animationType="slide" onRequestClose={closeDebtDetails}>
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[styles.modalSheet, { backgroundColor: activeColors.bg }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[styles.modalTitle, { color: activeColors.textDark }]}>Detalle de Deuda</Text>
                            <TouchableOpacity onPress={closeDebtDetails} style={[styles.headerBtn, { backgroundColor: activeColors.cardCtx }]}>
                                <Ionicons name="close" size={20} color={activeColors.textDark} />
                            </TouchableOpacity>
                        </View>

                        {selectedDebt && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                    <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', width: 56, height: 56, borderRadius: 28 }]}>
                                        <Ionicons name="alert-circle" size={28} color="#F59E0B" />
                                    </View>
                                    <Text style={[styles.transCat, { color: activeColors.textDark, fontSize: 20, marginTop: 10 }]}>{selectedDebt.provider || 'Deuda'}</Text>
                                    <Text style={[styles.transAmt, { color: '#F59E0B', fontSize: 26 }]}>${formatNumber(selectedDebt.amount)}</Text>
                                    <Text style={{ color: activeColors.secondary, marginTop: 4 }}>{selectedDebt.category}</Text>
                                </View>

                                {/* Progress bar for paid installments */}
                                {selectedDebt.installments?.length > 0 && (() => {
                                    const paid = selectedDebt.installments.filter(i => i.status === 'paid').length;
                                    const total = selectedDebt.installments.length;
                                    const pct = paid / total;
                                    return (
                                        <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                                <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Progreso de pago</Text>
                                                <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 12 }}>{paid}/{total} cuotas</Text>
                                            </View>
                                            <View style={styles.debtBarBg}>
                                                <View style={[styles.debtBarFill, { width: `${pct * 100}%`, backgroundColor: '#10B981' }]} />
                                            </View>
                                        </View>
                                    );
                                })()}

                                <Text style={{ color: activeColors.textDark, fontWeight: 'bold', marginBottom: 10, fontSize: 15 }}>Plan de Pagos</Text>

                                {(selectedDebt.installments || []).map((inst, index) => {
                                    const info = daysUntil(inst.dueDate);
                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            onPress={() => handlePayInstallment(selectedDebt, inst)}
                                            style={[styles.transRow, { backgroundColor: activeColors.cardCtx, opacity: inst.status === 'paid' ? 0.6 : 1 }]}
                                        >
                                            <View style={{ width: 36, alignItems: 'center' }}>
                                                <Text style={{ fontWeight: '900', color: activeColors.secondary, fontSize: 13 }}>#{inst.number}</Text>
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 8 }}>
                                                <Text style={{ color: activeColors.textDark, fontWeight: '700' }}>${inst.amount.toFixed(2)}</Text>
                                                {inst.status !== 'paid' && (
                                                    <Text style={{ color: info.color, fontSize: 11, marginTop: 2 }}>{info.label || formatDueDate(inst.dueDate)}</Text>
                                                )}
                                                {inst.status === 'paid' && inst.paidDate && (
                                                    <Text style={{ color: '#10B981', fontSize: 11 }}>Pagado el {formatDate(inst.paidDate)}</Text>
                                                )}
                                            </View>
                                            {inst.status === 'paid' ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '800', marginRight: 4 }}>PAGADO</Text>
                                                    <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                                </View>
                                            ) : (
                                                <View style={[styles.payBtn, { backgroundColor: theme?.primary || '#6C63FF' }]}>
                                                    <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>PAGAR</Text>
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        )}

                        <TouchableOpacity onPress={closeDebtDetails} style={[styles.closeSheetBtn, { backgroundColor: activeColors.cardCtx }]}>
                            <Text style={{ color: activeColors.textDark, fontWeight: '700', fontSize: 15 }}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* ── ADD TRANSACTION MODAL ── */}
            <Modal visible={actionModalVisible} transparent animationType="fade" onRequestClose={() => setActionModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx }]}>
                        <Text style={[styles.modalTitle, { color: activeColors.textDark }]}>
                            {actionType === 'income' ? '💚 Nuevo Ingreso'
                                : actionType === 'expense' ? '❤️ Nuevo Gasto'
                                    : actionType === 'receivable' ? '💙 Por Cobrar'
                                        : '🟡 Nueva Deuda'}
                        </Text>

                        <TextInput placeholder="Monto ($)" placeholderTextColor={activeColors.secondary}
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            keyboardType="numeric" value={amount} onChangeText={setAmount} />
                        <TextInput placeholder="Categoría (ej: Comida, Sueldo)" placeholderTextColor={activeColors.secondary}
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            value={category} onChangeText={setCategory} />
                        <TextInput placeholder="Nota (opcional)" placeholderTextColor={activeColors.secondary}
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            value={note} onChangeText={setNote} />

                        {actionType === 'receivable' && (
                            <TextInput placeholder="Fecha de cobro (AAAA-MM-DD, opcional)" placeholderTextColor={activeColors.secondary}
                                style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                                value={dueDate} onChangeText={setDueDate} />
                        )}

                        {actionType === 'debt' && (
                            <View style={{ marginTop: 4 }}>
                                <Text style={{ color: activeColors.textDark, marginBottom: 6, fontWeight: '700', fontSize: 13 }}>Proveedor:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                                    {PROVIDERS.map(p => (
                                        <TouchableOpacity key={p} onPress={() => setDebtProvider(p)}
                                            style={{
                                                paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, borderRadius: 20,
                                                backgroundColor: debtProvider === p ? (theme?.primary || '#6C63FF') : activeColors.bg
                                            }}>
                                            <Text style={{ color: debtProvider === p ? 'white' : activeColors.secondary, fontWeight: '600', fontSize: 12 }}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={{ color: activeColors.textDark, marginBottom: 6, fontWeight: '700', fontSize: 13 }}>Número de Cuotas:</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInput placeholder="1" placeholderTextColor={activeColors.secondary}
                                        style={[styles.input, { flex: 1, marginRight: 10, backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                                        keyboardType="numeric" value={installments} onChangeText={setInstallments} />
                                    <Text style={{ flex: 2, color: activeColors.secondary, fontSize: 12 }}>
                                        {amount ? `≈ $${(parseFloat(amount || 0) / (parseInt(installments) || 1)).toFixed(2)} / cuota` : ''}
                                    </Text>
                                </View>

                                {/* First installment date */}
                                <Text style={{ color: activeColors.textDark, marginBottom: 6, fontWeight: '700', fontSize: 13, marginTop: 4 }}>
                                    📅 Fecha primera cuota:
                                </Text>
                                <TextInput
                                    placeholder="AAAA-MM-DD (ej: 2025-03-01)"
                                    placeholderTextColor={activeColors.secondary}
                                    style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                                    value={firstInstallmentDate}
                                    onChangeText={setFirstInstallmentDate}
                                />
                                {firstInstallmentDate && parseInt(installments) > 1 && (
                                    <Text style={{ color: activeColors.secondary, fontSize: 11, marginTop: -8, marginBottom: 8 }}>
                                        Las siguientes cuotas se asignan mes a mes automáticamente.
                                    </Text>
                                )}
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                            <TouchableOpacity onPress={() => setActionModalVisible(false)}
                                style={[styles.btn, { borderWidth: 1.5, borderColor: activeColors.border || '#333' }]}>
                                <Text style={{ color: activeColors.secondary, fontWeight: '600' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddTransaction}
                                style={[styles.btn, { backgroundColor: theme?.primary || '#6C63FF' }]}>
                                <Text style={{ color: 'white', fontWeight: '700' }}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── DELETE CONFIRM MODAL ── */}
            <Modal visible={!!deleteTarget} transparent animationType="fade" onRequestClose={() => setDeleteTarget(null)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx }]}>
                        <Ionicons name="trash" size={32} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
                        <Text style={[styles.modalTitle, { color: activeColors.textDark }]}>¿Eliminar movimiento?</Text>
                        <Text style={{ color: activeColors.secondary, textAlign: 'center', marginBottom: 20 }}>
                            {deleteTarget?.category} — ${formatNumber(deleteTarget?.amount)}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity onPress={() => setDeleteTarget(null)}
                                style={[styles.btn, { borderWidth: 1.5, borderColor: activeColors.border || '#333' }]}>
                                <Text style={{ color: activeColors.secondary, fontWeight: '600' }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDelete(deleteTarget?._id)}
                                style={[styles.btn, { backgroundColor: '#EF4444' }]}>
                                <Text style={{ color: 'white', fontWeight: '700' }}>Eliminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* ── BOTTOM LOGOUT BAR ── */}
            <View style={[styles.bottomBar, { backgroundColor: activeColors.cardCtx, borderTopColor: activeColors.border || '#2a2a2a' }]}>
                <TouchableOpacity onPress={onLogout} style={styles.logoutBarBtn}>
                    <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                    <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13, marginLeft: 8 }}>Cerrar sesión</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 18 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, paddingBottom: 12 },
    greeting: { fontSize: 13, fontWeight: '600' },
    title: { fontSize: 26, fontWeight: '900' },
    headerBtn: { width: 38, height: 38, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },

    // Balance Card
    balanceCard: { borderRadius: 24, padding: 22, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 18, elevation: 12 },
    balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: '600', marginBottom: 4 },
    balanceAmount: { color: 'white', fontSize: 38, fontWeight: '900', letterSpacing: -1 },
    cardBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
    cardBadgeText: { color: 'white', fontSize: 10, fontWeight: '800' },
    cardStatsRow: { flexDirection: 'row', marginTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: 14 },
    cardStat: { flex: 1, alignItems: 'center', gap: 2 },
    cardStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
    cardStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '600' },
    cardStatAmt: { color: 'white', fontSize: 13, fontWeight: '800' },
    debtBarBg: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
    debtBarFill: { height: 6, borderRadius: 3, backgroundColor: '#FCD34D' },
    debtBarLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },

    // Actions
    actionContainer: { flexDirection: 'row', marginBottom: 24, gap: 4 },
    actionBtnCircle: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    actionLabel: { fontSize: 11, fontWeight: '600' },

    // Charts
    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
    chartCard: { padding: 14, borderRadius: 20, marginRight: 12, alignItems: 'center' },
    chartTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10, alignSelf: 'flex-start' },

    // Transactions
    dateHeader: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
    transRow: { flexDirection: 'row', padding: 14, borderRadius: 16, alignItems: 'center', marginBottom: 8 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    transCat: { fontSize: 15, fontWeight: '700' },
    transAmt: { fontSize: 15, fontWeight: '900' },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', padding: 20 },
    modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '80%' },
    modalContent: { borderRadius: 24, padding: 24 },
    modalTitle: { fontSize: 18, fontWeight: '800', marginBottom: 16, textAlign: 'center' },
    input: { padding: 14, borderRadius: 12, marginBottom: 12, fontSize: 15 },
    btn: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
    payBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
    closeSheetBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },

    // Bottom Bar
    bottomBar: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 18, borderTopWidth: 1 },
    logoutBarBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, backgroundColor: '#FEE2E2' },
});

export default FinancialDashboard;
