import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator, Vibration, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { formatNumber } from '../utils/helpers';
import { financeService } from '../utils/financeService';
import { PieChart, LineChart, BarChart } from 'react-native-chart-kit';


const screenWidth = Dimensions.get('window').width;

const FinancialDashboard = ({ theme, activeColors, isPremium, premiumType, onOpenPremium, onAddPress, refreshKey, user, portfolio, setNewTrans, setIsDebtPayment, setSelectedDebtId, addPartialPayment }) => {
    const [localStats, setLocalStats] = useState({
        totalIncome: 0,
        totalExpense: 0,
        totalDebt: 0,
        totalReceivable: 0,
        categories: {},
        history: []
    });
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [selectedDebt, setSelectedDebt] = useState(null);


    useEffect(() => {
        calculateLocalStats();
    }, [portfolio]);

    const calculateLocalStats = () => {
        const stats = {
            totalIncome: 0,
            totalExpense: 0,
            totalDebt: 0,
            totalReceivable: 0,
            categories: {},
            history: []
        };

        const sorted = [...(portfolio || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
        let runningBalance = 0;

        sorted.forEach(t => {
            const amount = parseFloat(t.amount);
            const type = t.type;
            const category = t.category || t.title;

            // Handle Debt Payments (Abonos) found inside debt objects
            const paymentsTotal = (t.payments || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);

            if (type === 'income') {
                stats.totalIncome += amount;
                runningBalance += amount;
            } else if (type === 'expense') {
                stats.totalExpense += amount;
                runningBalance -= amount;
                stats.categories[category] = (stats.categories[category] || 0) + amount;
            } else if (type === 'debt' || type === 'DEBO') {
                const remaining = Math.max(0, amount - paymentsTotal);
                if (!t.completed && remaining > 0) {
                    stats.totalDebt += remaining;
                }

                // Every payment made to a debt is an expense
                if (paymentsTotal > 0) {
                    stats.totalExpense += paymentsTotal;
                    runningBalance -= paymentsTotal;
                    stats.categories['Abonos/Deudas'] = (stats.categories['Abonos/Deudas'] || 0) + paymentsTotal;
                }
            } else if (type === 'pay' || type === 'Gasto (Deuda)') {
                // If it's a standalone 'pay' type (not inside a debt's payments array)
                stats.totalExpense += amount;
                runningBalance -= amount;
                stats.categories['Abonos/Deudas'] = (stats.categories['Abonos/Deudas'] || 0) + amount;
            } else if (type === 'receivable') {
                stats.totalReceivable += amount;
                runningBalance += amount;
            }

            stats.history.push({
                date: new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }),
                balance: runningBalance
            });
        });

        if (stats.history.length > 7) stats.history = stats.history.slice(-7);
        setLocalStats(stats);
    };

    useEffect(() => {
        loadData();
    }, [refreshKey]);

    const loadData = async () => {
        // We still load server data but prioritize local for UI if needed
        setLoading(true);
        try {
            const transData = await financeService.getAllTransactions();
            setTransactions(transData);
        } catch (e) {
            console.error("Scale sync error", e);
        } finally {
            setLoading(false);
        }
    };

    if (!isPremium) {
        return (
            <View style={[styles.premiumOverlay, { backgroundColor: activeColors.bg }]}>
                <Ionicons name="lock-closed" size={scale(60)} color={theme.primary} />
                <Text style={[styles.premiumTitle, { color: activeColors.textDark }]}>Suscripción Premium</Text>
                <Text style={[styles.premiumText, { color: activeColors.secondary }]}>
                    Esta función de gestión financiera avanzada está disponible solo para usuarios Premium.
                </Text>
                <TouchableOpacity
                    onPress={onOpenPremium}
                    style={[styles.premiumBtn, { backgroundColor: theme.primary }]}
                >
                    <Text style={styles.premiumBtnText}>Obtener Acceso Premium</Text>
                </TouchableOpacity>


            </View>
        );
    }

    if (loading || !localStats) {
        return <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 50 }} />;
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
        labelFontSize: 8,
    };

    const pieData = Object.keys(localStats.categories).map((cat, index) => ({
        name: cat,
        population: localStats.categories[cat],
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899'][index % 6],
        legendFontColor: activeColors.secondary,
        legendFontSize: 8
    }));

    if (pieData.length === 0) {
        pieData.push({
            name: 'Sin datos',
            population: 1,
            color: activeColors.border,
            legendFontColor: activeColors.secondary,
            legendFontSize: 10
        });
    }

    const lineData = {
        labels: localStats.history.slice(-5).map(h => h.date),
        datasets: [{
            data: localStats.history.slice(-5).map(h => h.balance),
            color: (opacity = 1) => theme.primary,
            strokeWidth: 3
        }]
    };

    const pendingDebts = (portfolio || []).filter(i => {
        const isDebtType = i.type === 'pay' || i.type === 'debt' || i.type === 'DEBO' || i.type === 'Gasto (Deuda)';
        const paid = (i.payments || []).reduce((s, p) => s + p.amount, 0);
        const remaining = Math.max(0, i.amount - paid);
        return isDebtType && !i.completed && remaining > 0;
    });

    const handleQuickPay = (debt) => {
        const paid = (debt.payments || []).reduce((s, p) => s + p.amount, 0);
        const remaining = Math.max(0, debt.amount - paid);
        setSelectedDebt({ ...debt, remaining });
        setPaymentModalVisible(true);
        Vibration.vibrate(20);
    };

    const confirmPayment = async (isFull, customAmount = null) => {
        const amountToPay = isFull ? selectedDebt.remaining : parseFloat(customAmount);

        if (isNaN(amountToPay) || amountToPay <= 0) {
            Alert.alert("Error", "Monto inválido");
            return;
        }

        try {
            setLoading(true);
            await addPartialPayment(selectedDebt.id || selectedDebt._id, amountToPay, new Date());
            setPaymentModalVisible(false);
            // No need to onAddPress() anymore as we handle it directly
        } catch (e) {
            Alert.alert("Error", "No se pudo procesar el pago");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* QUICK PAY SECTION (MOVED TO ABSOLUTE TOP) */}
            {pendingDebts.length > 0 && (
                <View style={{ marginBottom: scale(15), paddingHorizontal: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(8) }}>
                        <Text style={{ color: activeColors.textDark, fontWeight: '900', fontSize: scale(10), letterSpacing: 1 }}>DEUDAS PENDIENTES</Text>
                        <View style={{ backgroundColor: '#EF4444', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 5 }}>
                            <Text style={{ color: 'white', fontSize: 9, fontWeight: '900' }}>{pendingDebts.length}</Text>
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {pendingDebts.map(debt => {
                            const paid = (debt.payments || []).reduce((s, p) => s + p.amount, 0);
                            const remaining = Math.max(0, debt.amount - paid);
                            return (
                                <TouchableOpacity
                                    key={debt.id}
                                    onPress={() => handleQuickPay(debt)}
                                    style={{
                                        backgroundColor: activeColors.cardCtx,
                                        padding: scale(10),
                                        borderRadius: scale(18),
                                        marginRight: scale(10),
                                        width: scale(130),
                                        borderWidth: 1,
                                        borderColor: activeColors.border,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 2 },
                                        shadowOpacity: 0.05,
                                        shadowRadius: 5,
                                        elevation: 1
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <Text numberOfLines={1} style={{ color: activeColors.textDark, fontWeight: '800', fontSize: scale(10), flex: 1 }}>{debt.title}</Text>
                                    </View>
                                    <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: scale(16), marginVertical: 4 }}>
                                        ${formatNumber(remaining)}
                                    </Text>
                                    <View style={{ backgroundColor: theme.primary, paddingVertical: scale(5), borderRadius: scale(8), alignItems: 'center' }}>
                                        <Text style={{ color: 'white', fontWeight: '900', fontSize: scale(8) }}>PAGAR</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            <PaymentOptionsModal
                visible={paymentModalVisible}
                debt={selectedDebt}
                onClose={() => setPaymentModalVisible(false)}
                onConfirm={confirmPayment}
                activeColors={activeColors}
                theme={theme}
            />

            <View style={{ marginBottom: verticalScale(15), marginTop: scale(5) }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.welcomeText, { color: activeColors.secondary, fontSize: 12 }]}>Hola, {user?.name || 'Usuario'}</Text>
                        <Text style={[styles.dashboardTitle, { color: activeColors.textDark, fontSize: scale(18), marginTop: -2 }]}>Mi Resumen</Text>
                    </View>
                    <PremiumBadge type={premiumType} theme={theme} />
                </View>
            </View>

            {/* Header Cards (COMPACT) */}
            <View style={styles.summaryGrid}>
                <SummaryCard title="Ingresos" amount={localStats.totalIncome} icon="arrow-up" color="#10B981" activeColors={activeColors} />
                <SummaryCard title="Gastos" amount={localStats.totalExpense} icon="arrow-down" color="#EF4444" activeColors={activeColors} />
                <SummaryCard title="Deudas" amount={localStats.totalDebt} icon="alert-circle" color="#F59E0B" activeColors={activeColors} />
                <SummaryCard title="Cobros" amount={localStats.totalReceivable} icon="cash" color="#3B82F6" activeColors={activeColors} />
            </View>

            {/* CHARTS SIDE-BY-SIDE */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(15) }}>
                {/* LINE CHART */}
                <View style={[styles.chartCard, {
                    flex: 1,
                    marginRight: scale(5),
                    padding: scale(8),
                    overflow: 'hidden',
                    height: 140,
                    backgroundColor: activeColors.cardCtx,
                    borderColor: activeColors.border,
                    borderWidth: 1
                }]}>
                    <Text style={[styles.chartTitle, { fontSize: scale(9), color: activeColors.secondary, fontWeight: '800', marginBottom: 8 }]}>EVOLUCIÓN</Text>
                    {localStats.history.length > 0 ? (
                        <LineChart
                            data={lineData}
                            width={(screenWidth / 2) - scale(25)}
                            height={90}
                            chartConfig={chartConfig}
                            bezier
                            withDots={true}
                            withInnerLines={false}
                            withOuterLines={false}
                            withVerticalLines={false}
                            withHorizontalLines={false}
                            withVerticalLabels={false}
                            withHorizontalLabels={false}
                            style={{ paddingRight: 0, marginLeft: -scale(35) }}
                        />
                    ) : (
                        <Text style={{ color: activeColors.secondary, fontSize: 10 }}>Sin datos</Text>
                    )}
                </View>

                {/* PIE CHART */}
                <View style={[styles.chartCard, {
                    flex: 1,
                    marginLeft: scale(5),
                    padding: scale(8),
                    height: 140,
                    backgroundColor: activeColors.cardCtx,
                    borderColor: activeColors.border,
                    borderWidth: 1
                }]}>
                    <Text style={[styles.chartTitle, { fontSize: scale(9), color: activeColors.secondary, fontWeight: '800', marginBottom: 8 }]}>DISTRIBUCIÓN</Text>
                    <PieChart
                        data={pieData}
                        width={(screenWidth / 2) - scale(25)}
                        height={100}
                        chartConfig={chartConfig}
                        accessor={"population"}
                        backgroundColor={"transparent"}
                        paddingLeft={"15"}
                        center={[0, 0]}
                        absolute
                        hasLegend={false}
                    />
                </View>
            </View>

            {/* TRANSACTIONS LIST */}
            <View style={styles.listSection}>
                <View style={styles.listHeader}>
                    <Text style={[styles.sectionTitle, { color: activeColors.textDark, fontSize: scale(14) }]}>Transacciones Recientes</Text>
                    <TouchableOpacity onPress={loadData}>
                        <Ionicons name="refresh" size={18} color={theme.primary} />
                    </TouchableOpacity>
                </View>

                {(() => {
                    // 1. FLATTEN TRANSACTIONS AND PAYMENTS
                    let allMovements = [];

                    (portfolio || []).forEach(item => {
                        // A. Add the main item (unless it's a debt that is just a container, but usually creation is relevant too)
                        // If it's a debt, the "amount" is the total debt. We show it as the creation of the debt.
                        allMovements.push(item);

                        // B. If it has payments, add them as individual "virtual" transactions
                        if (item.payments && item.payments.length > 0) {
                            item.payments.forEach(payment => {
                                allMovements.push({
                                    id: payment.id || `pay_${item.id}_${payment.date}`, // Unique ID
                                    _id: payment.id || `pay_${item.id}_${payment.date}`,
                                    title: `Pago: ${item.title || item.category}`,
                                    category: 'Pago de Deuda',
                                    amount: payment.amount,
                                    type: 'expense', // Visualized as expense
                                    date: payment.date,
                                    isVirtualPayment: true, // Flag to identify
                                    originalDebtId: item.id || item._id
                                });
                            });
                        }
                    });

                    // 2. SORT BY DATE DESCENDING
                    allMovements.sort((a, b) => new Date(b.date) - new Date(a.date));

                    // 3. RENDER TOP 15
                    if (allMovements.length === 0) {
                        return (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="receipt-outline" size={scale(30)} color={activeColors.border} />
                                <Text style={{ color: activeColors.secondary, marginTop: 10, fontSize: 12 }}>Sin movimientos</Text>
                            </View>
                        );
                    }

                    return allMovements.slice(0, 15).map((item) => (
                        <TransactionItem
                            key={item.id || item._id}
                            item={item}
                            activeColors={activeColors}
                            onPress={() => {
                                if (item.isVirtualPayment) {
                                    // Optionally show simple alert or find parent debt to show details
                                    // For now, simpler is just to ignore or show basic info
                                    Alert.alert("Detalle de Pago", `Abono a: ${item.title}\nMonto: $${formatNumber(item.amount)}\nFecha: ${new Date(item.date).toLocaleDateString()}`);
                                } else {
                                    setSelectedTransaction(item);
                                }
                            }}
                        />
                    ));
                })()}
            </View>

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { backgroundColor: theme.primary }]}
                onPress={onAddPress}
            >
                <Ionicons name="add" size={scale(30)} color="white" />
            </TouchableOpacity>

            <View style={{ height: verticalScale(60) }} />

            {/* DETAIL MODAL */}
            <DetailModal
                visible={!!selectedTransaction}
                transaction={selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                activeColors={activeColors}
                theme={theme}
            />
        </ScrollView>
    );
};

const SummaryCard = ({ title, amount, icon, color, activeColors }) => (
    <View style={[styles.card, { backgroundColor: activeColors.cardCtx, borderLeftColor: color, borderLeftWidth: 3, padding: scale(10), borderRadius: 12, marginBottom: scale(10) }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
            <Ionicons name={icon} size={12} color={color} style={{ marginRight: 4 }} />
            <Text style={{ color: activeColors.secondary, fontSize: scale(9), fontWeight: '700' }}>{title.toUpperCase()}</Text>
        </View>
        <Text style={{ color: activeColors.textDark, fontSize: moderateScale(14), fontWeight: '900' }}>
            ${formatNumber(amount)}
        </Text>
    </View>
);

const TransactionItem = ({ item, activeColors, onPress }) => {
    const isPositive = item.type === 'income' || item.type === 'receivable';
    return (
        <TouchableOpacity
            style={[styles.transItem, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border, padding: 8, marginBottom: 6, borderRadius: 12 }]}
            onPress={onPress}
        >
            <View style={[styles.transIcon, { backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2', width: 28, height: 28, borderRadius: 6 }]}>
                <Ionicons
                    name={isPositive ? 'arrow-up' : 'arrow-down'}
                    size={scale(12)}
                    color={isPositive ? '#10B981' : '#EF4444'}
                />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
                <Text numberOfLines={1} style={[styles.transCat, { color: activeColors.textDark, fontSize: 12 }]}>{item.category}</Text>
                <Text style={{ color: activeColors.secondary, fontSize: 9 }}>{new Date(item.date).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.transAmount, { color: isPositive ? '#10B981' : '#EF4444', fontSize: 13 }]}>
                {isPositive ? '+' : '-'}${formatNumber(item.amount)}
            </Text>
        </TouchableOpacity>
    );
};

const DetailModal = ({ visible, transaction, onClose, activeColors, theme }) => {
    if (!transaction) return null;
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: activeColors.textDark }]}>Detalle Movimiento</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close-circle" size={28} color={activeColors.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ marginTop: 20 }}>
                        <DetailRow label="Categoría" value={transaction.category} activeColors={activeColors} icon="pricetag" />
                        <DetailRow label="Tipo" value={transaction.type.toUpperCase()} activeColors={activeColors} icon="list" />
                        <DetailRow label="Monto" value={`$${formatNumber(transaction.amount)}`} activeColors={activeColors} color={transaction.type === 'income' ? '#10B981' : '#EF4444'} icon="cash" />
                        <DetailRow label="Fecha" value={new Date(transaction.date).toLocaleString()} activeColors={activeColors} icon="calendar" />

                        {transaction.type === 'debt' && (
                            <>
                                <View style={{ height: 1, backgroundColor: activeColors.border, marginVertical: 15 }} />
                                <DetailRow label="Tipo de Deuda" value={transaction.debtType === 'loan' ? 'Préstamo' : 'Crédito'} activeColors={activeColors} icon="business" />
                                <DetailRow label="Fecha de Obtención" value={transaction.obtainedDate ? new Date(transaction.obtainedDate).toLocaleDateString() : 'N/A'} activeColors={activeColors} icon="calendar-outline" />

                                {transaction.installments && transaction.installments.length > 0 && (
                                    <View style={{ marginTop: 10, paddingLeft: 35 }}>
                                        <Text style={{ color: activeColors.secondary, fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Cuotas Programadas:</Text>
                                        {transaction.installments.map((inst, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, backgroundColor: activeColors.bg, padding: 8, borderRadius: 8 }}>
                                                <Text style={{ color: activeColors.textDark, fontSize: 12 }}>{new Date(inst.date).toLocaleDateString()}</Text>
                                                <Text style={{ color: theme.primary, fontWeight: 'bold', fontSize: 12 }}>${formatNumber(inst.amount)}</Text>
                                                <Text style={{ color: inst.paid ? '#10B981' : '#F59E0B', fontSize: 10, fontWeight: '900' }}>{inst.paid ? 'PAGADO' : 'PENDIENTE'}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </>
                        )}

                        <DetailRow label="Nota" value={transaction.note || 'Sin nota'} activeColors={activeColors} icon="document-text" />
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const DetailRow = ({ label, value, activeColors, color, icon }) => (
    <View style={styles.detailRow}>
        <Ionicons name={icon} size={20} color={activeColors.secondary} style={{ marginRight: 15 }} />
        <View>
            <Text style={{ color: activeColors.secondary, fontSize: 12 }}>{label}</Text>
            <Text style={{ color: color || activeColors.textDark, fontSize: 16, fontWeight: '700' }}>{value}</Text>
        </View>
    </View>
);

const PaymentOptionsModal = ({ visible, debt, onClose, onConfirm, activeColors, theme }) => {
    const [isPartial, setIsPartial] = React.useState(false);
    const [amount, setAmount] = React.useState('');

    React.useEffect(() => {
        if (visible) {
            setIsPartial(false);
            setAmount('');
        }
    }, [visible]);

    if (!debt) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx, padding: 25 }]}>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <View style={{ backgroundColor: theme.primarySoft, padding: 15, borderRadius: 20, marginBottom: 15 }}>
                            <Ionicons name="card-outline" size={30} color={theme.primary} />
                        </View>
                        <Text style={[styles.modalTitle, { color: activeColors.textDark, textAlign: 'center' }]}>Opciones de Pago</Text>
                        <Text style={{ color: activeColors.secondary, textAlign: 'center', marginTop: 8, fontSize: 13 }}>
                            ¿Cómo deseas procesar el pago para "{debt.title}"?
                        </Text>
                    </View>

                    <View style={{ backgroundColor: activeColors.bg, padding: 15, borderRadius: 15, marginBottom: 20, borderWidth: 1, borderColor: activeColors.border }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                            <Text style={{ color: activeColors.secondary, fontSize: 11 }}>Saldo Pendiente:</Text>
                            <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 14 }}>${formatNumber(debt.remaining)}</Text>
                        </View>
                        <View style={{ height: 1, backgroundColor: activeColors.border, marginVertical: 8 }} />
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Text style={{ color: activeColors.secondary, fontSize: 11 }}>Moneda:</Text>
                            <Text style={{ color: activeColors.textDark, fontWeight: '700', fontSize: 12 }}>{debt.currency || 'USD'}</Text>
                        </View>
                    </View>

                    {!isPartial ? (
                        <>
                            <TouchableOpacity
                                onPress={() => onConfirm(true)}
                                style={[styles.actionBtn, { backgroundColor: theme.primary, marginBottom: 12 }]}
                            >
                                <Ionicons name="checkmark-circle" size={20} color="white" style={{ marginRight: 10 }} />
                                <Text style={styles.actionBtnText}>PAGO COMPLETO</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setIsPartial(true)}
                                style={[styles.actionBtn, { backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.primary, marginBottom: 12 }]}
                            >
                                <Ionicons name="pencil" size={18} color={theme.primary} style={{ marginRight: 10 }} />
                                <Text style={[styles.actionBtnText, { color: theme.primary }]}>ABONO PARCIAL</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <View>
                            <TextInput
                                placeholder="Ingresa monto del abono..."
                                placeholderTextColor={activeColors.secondary}
                                keyboardType="numeric"
                                autoFocus
                                style={{
                                    backgroundColor: activeColors.bg,
                                    color: activeColors.textDark,
                                    padding: 15,
                                    borderRadius: 15,
                                    marginBottom: 15,
                                    fontWeight: '900',
                                    fontSize: 18,
                                    textAlign: 'center',
                                    borderWidth: 1,
                                    borderColor: theme.primary
                                }}
                                value={amount}
                                onChangeText={setAmount}
                            />
                            <TouchableOpacity
                                onPress={() => onConfirm(false, amount)}
                                style={[styles.actionBtn, { backgroundColor: theme.primary, marginBottom: 12 }]}
                            >
                                <Text style={styles.actionBtnText}>CONFIRMAR ABONO</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setIsPartial(false)}
                                style={{ alignSelf: 'center', marginBottom: 10 }}
                            >
                                <Text style={{ color: activeColors.secondary, fontSize: 12, fontWeight: '700' }}>VOLVER</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    <TouchableOpacity onPress={onClose} style={{ marginTop: 10, alignSelf: 'center' }}>
                        <Text style={{ color: activeColors.secondary, fontWeight: '700', fontSize: 13 }}>CANCELAR</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: scale(15) },
    welcomeSection: { marginBottom: verticalScale(15) },
    welcomeText: { fontSize: 12, fontWeight: '600' },
    dashboardTitle: { fontSize: 20, fontWeight: '900' },
    summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    card: { width: '48%', padding: scale(12), borderRadius: 12, marginBottom: scale(10), elevation: 1 },
    chartCard: { padding: scale(10), borderRadius: 16, marginBottom: scale(15), alignItems: 'center' },
    chartTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10, alignSelf: 'flex-start' },
    chart: { borderRadius: 12, marginVertical: 4 },
    listSection: { marginTop: 5 },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    sectionTitle: { fontSize: 16, fontWeight: '800' },
    transItem: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 14, marginBottom: 8, borderWidth: 1 },
    transIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    transCat: { fontSize: 15, fontWeight: '800' },
    transAmount: { fontSize: 16, fontWeight: '900' },
    emptyContainer: { alignItems: 'center', padding: 40 },
    fab: { position: 'absolute', bottom: verticalScale(30), right: scale(20), width: scale(60), height: scale(60), borderRadius: scale(30), justifyContent: 'center', alignItems: 'center', elevation: 5 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 25 },
    modalContent: { borderRadius: 30, padding: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 22, fontWeight: '900' },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, borderRadius: 18 },
    actionBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
    premiumOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
    premiumTitle: { fontSize: 24, fontWeight: '900', marginTop: 20 },
    premiumText: { textAlign: 'center', marginTop: 10, fontSize: 16 },
    premiumBtn: { marginTop: 30, paddingHorizontal: 40, paddingVertical: 15, borderRadius: 25 },
    premiumBtnText: { color: 'white', fontWeight: 'bold' }
});

const PremiumBadge = ({ type, theme }) => {
    let label = "";
    let color = theme.primary;
    let description = "";

    switch (type) {
        case 'plus':
            label = "Premium +";
            color = "#F59E0B";
            description = "De por vida";
            break;
        case '30':
            label = "Premium 30";
            color = "#3B82F6";
            description = "Plan Mensual";
            break;
        case 'free':
            label = "Premium Free";
            color = "#10B981";
            description = "Acceso 24h";
            break;
        default:
            return null;
    }

    return (
        <View style={{ alignItems: 'flex-end' }}>
            <View style={{ backgroundColor: color, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 10, flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="star" size={12} color="white" style={{ marginRight: 4 }} />
                <Text style={{ color: 'white', fontWeight: '900', fontSize: 10 }}>{label.toUpperCase()}</Text>
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: color, marginTop: 2, opacity: 0.8 }}>{description}</Text>
        </View>
    );
};

export default FinancialDashboard;
