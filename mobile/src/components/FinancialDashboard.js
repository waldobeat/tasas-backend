import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Vibration, Alert, Modal, TextInput, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { formatNumber } from '../utils/helpers';
import { financeService } from '../utils/financeService';
import { PieChart, LineChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const FinancialDashboard = ({ theme, activeColors, isPremium, premiumType, onOpenPremium, refreshKey, user, onClose }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [localStats, setLocalStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        totalDebt: 0,
        balance: 0,
        // Safe defaults to prevent Chart Kit crash on initial render
        categories: [{ name: 'Cargando...', population: 1, color: '#E5E7EB', legendFontColor: '#7F7F7F', legendFontSize: 10 }],
        history: { labels: ['Inicio'], data: [0] }
    });

    // Action Modal State
    const [actionModalVisible, setActionModalVisible] = useState(false);
    const [actionType, setActionType] = useState(null); // 'income', 'expense', 'debt'
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');

    // Debt State
    const [debtProvider, setDebtProvider] = useState('Cashea');
    const [installments, setInstallments] = useState('1');
    const [generatedInstallments, setGeneratedInstallments] = useState([]);

    // Providers List
    const PROVIDERS = ['Cashea', 'Krece', 'TDC', 'Prestame', 'Bodegas', 'Panas', 'Otro'];

    // Debt Details Modal State
    const [debtDetailVisible, setDebtDetailVisible] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);

    const openDebtDetails = (debt) => {
        setSelectedDebt(debt);
        setDebtDetailVisible(true);
    };

    const handlePayInstallment = async (debt, installment) => {
        if (installment.status === 'paid') return;

        Alert.alert(
            "Pagar Cuota",
            `¿Confirmas el pago de la cuota #${installment.number} por $${installment.amount.toFixed(2)}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Pagar",
                    onPress: async () => {
                        try {
                            setLoading(true);
                            // Create copy of installments
                            const updatedInstallments = debt.installments.map(i => {
                                if (i.number === installment.number) {
                                    return { ...i, status: 'paid', paidDate: new Date() };
                                }
                                return i;
                            });

                            // Check if all paid
                            const allPaid = updatedInstallments.every(i => i.status === 'paid');

                            const updatedDebt = {
                                ...debt,
                                installments: updatedInstallments,
                                completed: allPaid
                            };

                            await financeService.updateTransaction(debt._id, updatedDebt);

                            setDebtDetailVisible(false);
                            loadData();
                            Alert.alert("Éxito", "Cuota marcada como pagada");
                        } catch (e) {
                            Alert.alert("Error", "No se pudo actualizar la deuda");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    const loadData = async () => {
        setLoading(true);
        try {
            const transData = await financeService.getAllTransactions();
            const validTrans = Array.isArray(transData) ? transData : [];
            setTransactions(validTrans);
            calculateStats(validTrans);
        } catch (e) {
            console.error("Error loading finance data", e);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        let income = 0;
        let expense = 0;
        let debt = 0;
        const catMap = {};

        // Sort by date asc for graph
        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        // History Logic (Running Balance)
        const historyLabels = [];
        const historyData = [];
        let runningBalance = 0;

        sortedData.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                income += amt;
                runningBalance += amt;
            }
            else if (t.type === 'expense') {
                expense += amt;
                runningBalance -= amt;
                // Category Logic
                const cat = t.category || 'Otros';
                catMap[cat] = (catMap[cat] || 0) + amt;
            }
            else if (t.type === 'debt' && !t.completed) {
                // Check for new installments structure or fallback to old payments array
                let paid = 0;
                if (t.installments) {
                    paid = t.installments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
                } else {
                    paid = (t.payments || []).reduce((s, p) => s + p.amount, 0);
                }
                debt += Math.max(0, amt - paid);
            }

            // Push to history if date is new or update last
            const dateLabel = formatDate(t.date);
            if (historyLabels[historyLabels.length - 1] !== dateLabel) {
                if (historyLabels.length < 6) { // Limit points
                    historyLabels.push(dateLabel);
                    historyData.push(runningBalance);
                }
            } else {
                historyData[historyData.length - 1] = runningBalance;
            }
        });

        // Format Categories for Pie Chart
        const catColors = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#8B5CF6'];
        const categories = Object.keys(catMap).map((key, index) => ({
            name: key,
            population: catMap[key],
            color: catColors[index % catColors.length],
            legendFontColor: activeColors.secondary,
            legendFontSize: 10
        }));

        setLocalStats({
            totalIncome: income,
            totalExpense: expense,
            totalDebt: debt,
            balance: income - expense,
            categories: categories.length > 0 ? categories : [{ name: 'Sin Gastos', population: 1, color: activeColors.border, legendFontColor: activeColors.secondary, legendFontSize: 10 }],
            history: {
                labels: historyLabels.length > 0 ? historyLabels : ['Hoy'],
                data: historyData.length > 0 ? historyData : [0]
            }
        });
    };

    const handleAddTransaction = async () => {
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
            Alert.alert("Error", "Monto inválido");
            return;
        }
        if (!category) {
            Alert.alert("Error", "La categoría es obligatoria");
            return;
        }

        try {
            setLoading(true);
            let newTrans = {
                type: actionType,
                amount: parseFloat(amount),
                category: category,
                note: note,
                date: new Date()
            };

            if (actionType === 'debt') {
                const count = parseInt(installments) || 1;
                const portion = parseFloat(amount) / count;
                const debtInstallments = [];

                for (let i = 0; i < count; i++) {
                    const d = new Date();
                    d.setMonth(d.getMonth() + i); // Auto-increment month
                    debtInstallments.push({
                        number: i + 1,
                        amount: portion,
                        dueDate: d, // We store full date object, backend/service handles it
                        status: 'pending'
                    });
                }

                newTrans = {
                    ...newTrans,
                    provider: debtProvider,
                    installments: debtInstallments,
                    completed: false
                };
            }

            await financeService.addTransaction(newTrans);
            setActionModalVisible(false);
            setAmount('');
            setCategory('');
            setNote('');
            setInstallments('1'); // Reset
            loadData(); // Refresh
            Alert.alert("Éxito", "Movimiento registrado");
        } catch (e) {
            Alert.alert("Error", "No se pudo guardar");
        } finally {
            setLoading(false);
        }
    };

    const openActionModal = (type) => {
        setActionType(type);
        setActionModalVisible(true);
    };

    const formatDate = (dateStr) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' });
        } catch (e) { return "N/A"; }
    };

    // Group transactions by Date
    const groupedTransactions = transactions.reduce((acc, curr) => {
        const dateKey = formatDate(curr.date);
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(curr);
        return acc;
    }, {});

    if (!isPremium) {
        return (
            <Modal visible={true} animationType="slide">
                <View style={[styles.container, { backgroundColor: activeColors.bg, justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="lock-closed" size={80} color={theme.primary} />
                    <Text style={[styles.premiumTitle, { color: activeColors.textDark }]}>Acceso Premium</Text>
                    <Text style={[styles.premiumText, { color: activeColors.secondary }]}>Gestiona tus finanzas como un experto.</Text>
                    <TouchableOpacity onPress={onOpenPremium} style={[styles.premiumBtn, { backgroundColor: theme.primary }]}>
                        <Text style={styles.premiumBtnText}>Desbloquear Ahora</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 20 }}>
                        <Text style={{ color: activeColors.secondary }}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }

    const chartConfig = {
        backgroundGradientFrom: activeColors.cardCtx,
        backgroundGradientTo: activeColors.cardCtx,
        color: (opacity = 1) => theme.primary,
        labelColor: (opacity = 1) => activeColors.secondary,
        strokeWidth: 2,
        barPercentage: 0.5,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
    };

    return (
        <View style={[styles.container, { backgroundColor: activeColors.bg }]}>
            {/* --- HEADER --- */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: activeColors.secondary }]}>Hola, {user?.name?.split(' ')[0] || 'Usuario'}</Text>
                    <Text style={[styles.title, { color: activeColors.textDark }]}>Tu Balance</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: activeColors.cardCtx }]}>
                    <Ionicons name="close" size={24} color={activeColors.textDark} />
                </TouchableOpacity>
            </View>

            <FlatList
                contentContainerStyle={{ paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                data={Object.keys(groupedTransactions)} // Using this just to render the list at the bottom, but adding header component for charts
                keyExtractor={(item) => item}
                ListHeaderComponent={
                    <>
                        {/* --- CREDIT CARD SUMMARY --- */}
                        <View style={[styles.creditCard, { backgroundColor: theme.primary }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>Balance Total</Text>
                                <Ionicons name="wallet" size={20} color="white" />
                            </View>
                            <Text style={styles.cardBalance}>${formatNumber(localStats.balance)}</Text>

                            <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
                                <View>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Ingresos</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>+${formatNumber(localStats.totalIncome)}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>Gastos</Text>
                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>-${formatNumber(localStats.totalExpense)}</Text>
                                </View>
                            </View>
                        </View>

                        {/* --- ACTION BUTTONS --- */}
                        <View style={styles.actionContainer}>
                            <ActionButton icon="arrow-up" label="Ingreso" color="#10B981" onPress={() => openActionModal('income')} activeColors={activeColors} />
                            <ActionButton icon="arrow-down" label="Gasto" color="#EF4444" onPress={() => openActionModal('expense')} activeColors={activeColors} />
                            <ActionButton icon="alert-circle" label="Deuda" color="#F59E0B" onPress={() => openActionModal('debt')} activeColors={activeColors} />
                        </View>

                        {/* --- CHARTS SECTION (POWER BI STYLE) --- */}
                        {!loading && localStats.categories.length > 0 && (
                            <>
                                <Text style={[styles.sectionTitle, { color: activeColors.textDark, marginBottom: 10 }]}>Analíticas</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                                    {/* Expense Pie Chart */}
                                    <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx }]}>
                                        <Text style={[styles.chartTitle, { color: activeColors.textDark }]}>Gastos por Categoría</Text>
                                        <PieChart
                                            data={localStats.categories}
                                            width={screenWidth * 0.7}
                                            height={150}
                                            chartConfig={chartConfig}
                                            accessor={"population"}
                                            backgroundColor={"transparent"}
                                            paddingLeft={"15"}
                                            absolute={false}
                                            hasLegend={true}
                                        />
                                    </View>

                                    {/* Balance History Line Chart */}
                                    <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, marginLeft: 15 }]}>
                                        <Text style={[styles.chartTitle, { color: activeColors.textDark }]}>Historial de Balance</Text>
                                        <LineChart
                                            data={{
                                                labels: localStats.history.labels,
                                                datasets: [{ data: localStats.history.data }]
                                            }}
                                            width={screenWidth * 0.7}
                                            height={150}
                                            chartConfig={{
                                                ...chartConfig,
                                                width: screenWidth * 0.7,
                                                strokeWidth: 2,
                                                propsForDots: {
                                                    r: "4",
                                                    strokeWidth: "2",
                                                    stroke: theme.primary
                                                }
                                            }}
                                            bezier
                                            style={{ borderRadius: 16 }}
                                        />
                                    </View>
                                </ScrollView>
                            </>
                        )}

                        {/* --- TRANSACTIONS LIST HEADER --- */}
                        <Text style={[styles.sectionTitle, { color: activeColors.textDark }]}>Movimientos Recientes</Text>

                        {loading && <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 20 }} />}
                    </>
                }
                renderItem={({ item: date }) => (
                    <View style={{ marginBottom: 15 }}>
                        <Text style={[styles.dateHeader, { color: activeColors.secondary }]}>{date}</Text>
                        {groupedTransactions[date].map((t, index) => (
                            <TouchableOpacity
                                key={index}
                                onPress={() => t.type === 'debt' ? openDebtDetails(t) : null}
                                activeOpacity={t.type === 'debt' ? 0.7 : 1}
                                style={[styles.transRow, { backgroundColor: activeColors.cardCtx }]}
                            >
                                <View style={[styles.iconBox, { backgroundColor: t.type === 'income' ? '#DCFCE7' : t.type === 'debt' ? '#FEF3C7' : '#FEE2E2' }]}>
                                    <Ionicons
                                        name={t.type === 'income' ? 'arrow-up' : t.type === 'debt' ? 'alert-circle' : 'arrow-down'}
                                        size={18}
                                        color={t.type === 'income' ? '#10B981' : t.type === 'debt' ? '#F59E0B' : '#EF4444'}
                                    />
                                </View>
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.transCat, { color: activeColors.textDark }]}>
                                        {t.type === 'debt' ? (t.provider || t.category) : t.category}
                                    </Text>
                                    {t.type === 'debt' && t.installments ? (
                                        <Text style={{ fontSize: 10, color: activeColors.secondary }}>
                                            {t.installments.filter(i => i.status === 'paid').length}/{t.installments.length} Cuotas pagadas
                                        </Text>
                                    ) : t.note ? <Text style={{ fontSize: 10, color: activeColors.secondary }}>{t.note}</Text> : null}
                                </View>
                                <Text style={[styles.transAmt, { color: t.type === 'income' ? '#10B981' : t.type === 'debt' ? '#F59E0B' : '#EF4444' }]}>
                                    {t.type === 'income' ? '+' : '-'}${formatNumber(t.amount)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
                ListEmptyComponent={
                    !loading && (
                        <View style={{ alignItems: 'center', marginTop: 40 }}>
                            <Text style={{ color: activeColors.secondary }}>No hay movimientos aún.</Text>
                        </View>
                    )
                }
            />

            {/* --- DEBT DETAILS MODAL --- */}
            <Modal visible={debtDetailVisible} transparent animationType="slide">
                <View style={[styles.modalOverlay, { justifyContent: 'flex-end', padding: 0 }]}>
                    <View style={[styles.container, { backgroundColor: activeColors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, height: '70%', width: '100%' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Text style={[styles.modalTitle, { color: activeColors.textDark }]}>Detalle de Deuda</Text>
                            <TouchableOpacity onPress={() => setDebtDetailVisible(false)} style={styles.closeBtn}>
                                <Ionicons name="close" size={24} color={activeColors.textDark} />
                            </TouchableOpacity>
                        </View>

                        {selectedDebt && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={{ alignItems: 'center', marginBottom: 20 }}>
                                    <View style={[styles.iconBox, { backgroundColor: '#FEF3C7', width: 60, height: 60, borderRadius: 30 }]}>
                                        <Ionicons name="alert-circle" size={30} color="#F59E0B" />
                                    </View>
                                    <Text style={[styles.transCat, { color: activeColors.textDark, fontSize: 22, marginTop: 10 }]}>{selectedDebt.provider || 'Deuda'}</Text>
                                    <Text style={[styles.transAmt, { color: '#F59E0B', fontSize: 28 }]}>${formatNumber(selectedDebt.amount)}</Text>
                                    <Text style={{ color: activeColors.secondary }}>{selectedDebt.category}</Text>
                                </View>

                                <Text style={{ color: activeColors.textDark, fontWeight: 'bold', marginBottom: 10, fontSize: 16 }}>Plan de Pagos</Text>

                                {(selectedDebt.installments || []).map((inst, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => handlePayInstallment(selectedDebt, inst)}
                                        style={[styles.transRow, { backgroundColor: activeColors.cardCtx, opacity: inst.status === 'paid' ? 0.6 : 1 }]}
                                    >
                                        <View style={{ width: 40, alignItems: 'center' }}>
                                            <Text style={{ fontWeight: 'bold', color: activeColors.secondary }}>#{inst.number}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ color: activeColors.textDark, fontWeight: 'bold' }}>${inst.amount.toFixed(2)}</Text>
                                            <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Vence: {formatDate(inst.dueDate)}</Text>
                                        </View>
                                        <View style={{ alignItems: 'center' }}>
                                            {inst.status === 'paid' ? (
                                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                                    <Text style={{ color: '#10B981', fontSize: 12, marginRight: 5, fontWeight: 'bold' }}>PAGADO</Text>
                                                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                                                </View>
                                            ) : (
                                                <View style={{ backgroundColor: theme.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>PAGAR</Text>
                                                </View>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>

            {/* --- ADD TRANSACTION MODAL (Existing) --- */}
            <Modal visible={actionModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx }]}>
                        <Text style={[styles.modalTitle, { color: activeColors.textDark }]}>
                            {actionType === 'income' ? 'Nuevo Ingreso' : actionType === 'expense' ? 'Nuevo Gasto' : 'Nueva Deuda'}
                        </Text>

                        <TextInput
                            placeholder="Monto ($)"
                            placeholderTextColor={activeColors.secondary}
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />
                        <TextInput
                            placeholder="Categoría (ej: Comida, Sueldo)"
                            placeholderTextColor={activeColors.secondary}
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            value={category}
                            onChangeText={setCategory}
                        />
                        <TextInput
                            placeholder="Nota (opcional)"
                            placeholderTextColor={activeColors.secondary}
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            value={note}
                            onChangeText={setNote}
                        />

                        {actionType === 'debt' && (
                            <View style={{ marginTop: 10 }}>
                                <Text style={{ color: activeColors.textDark, marginBottom: 5, fontWeight: 'bold' }}>Proveedor:</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                                    {PROVIDERS.map(p => (
                                        <TouchableOpacity
                                            key={p}
                                            onPress={() => setDebtProvider(p)}
                                            style={{
                                                padding: 8,
                                                marginRight: 8,
                                                borderRadius: 15,
                                                backgroundColor: debtProvider === p ? theme.primary : activeColors.bg
                                            }}
                                        >
                                            <Text style={{ color: debtProvider === p ? 'white' : activeColors.secondary }}>{p}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={{ color: activeColors.textDark, marginBottom: 5, fontWeight: 'bold' }}>Cuotas:</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <TextInput
                                        placeholder="1"
                                        placeholderTextColor={activeColors.secondary}
                                        style={[styles.input, { flex: 1, backgroundColor: activeColors.bg, color: activeColors.textDark, marginRight: 10 }]}
                                        keyboardType="numeric"
                                        value={installments}
                                        onChangeText={setInstallments}
                                    />
                                    <View style={{ flex: 2 }}>
                                        <Text style={{ color: activeColors.secondary, fontSize: 12 }}>
                                            {amount ? `~${(parseFloat(amount || 0) / (parseInt(installments) || 1)).toFixed(2)}$ / cuota` : ''}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        )}

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                            <TouchableOpacity onPress={() => setActionModalVisible(false)} style={{ padding: 10 }}>
                                <Text style={{ color: activeColors.secondary }}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleAddTransaction} style={[styles.saveBtn, { backgroundColor: theme.primary }]}>
                                <Text style={{ color: 'white', fontWeight: 'bold' }}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </View>
    );
};

const ActionButton = ({ icon, label, color, onPress, activeColors }) => (
    <TouchableOpacity onPress={onPress} style={{ alignItems: 'center' }}>
        <View style={[styles.actionBtnCircle, { backgroundColor: activeColors.cardCtx, shadowColor: color }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <Text style={[styles.actionLabel, { color: activeColors.secondary }]}>{label}</Text>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 },
    greeting: { fontSize: 14, fontWeight: '600' },
    title: { fontSize: 24, fontWeight: '900' },
    closeBtn: { padding: 8, borderRadius: 12 },

    creditCard: { borderRadius: 20, padding: 25, marginBottom: 25, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    cardBalance: { color: 'white', fontSize: 32, fontWeight: '900', marginTop: 10 },

    actionContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 30 },
    actionBtnCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 5, marginBottom: 8 },
    actionLabel: { fontSize: 12, fontWeight: '600' },

    sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 15 },
    dateHeader: { fontSize: 12, fontWeight: '700', marginBottom: 8, marginTop: 5 },
    transRow: { flexDirection: 'row', padding: 15, borderRadius: 16, alignItems: 'center', marginBottom: 10 },
    iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    transCat: { fontSize: 16, fontWeight: '700' },
    transAmt: { fontSize: 16, fontWeight: '900' },

    // Charts
    chartCard: { padding: 15, borderRadius: 20, marginRight: 15, width: Dimensions.get('window').width * 0.75, alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 },
    chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { borderRadius: 20, padding: 25, elevation: 10 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    input: { padding: 15, borderRadius: 12, marginBottom: 15 },
    saveBtn: { paddingVertical: 12, paddingHorizontal: 30, borderRadius: 12 },

    premiumTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20 },
    premiumText: { textAlign: 'center', marginVertical: 10 },
    premiumBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 25, marginTop: 20 },
    premiumBtnText: { color: 'white', fontWeight: 'bold' }
});

export default FinancialDashboard;
