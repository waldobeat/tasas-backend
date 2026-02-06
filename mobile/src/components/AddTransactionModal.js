import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';

const AddTransactionModal = ({ visible, onClose, onSave, activeColors, theme }) => {
    const [type, setType] = useState('expense'); // income, expense, debt, receivable
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [note, setNote] = useState('');
    // New Debt States
    const [debtType, setDebtType] = useState('loan'); // loan, credit
    const [obtainedDate, setObtainedDate] = useState(new Date().toISOString().split('T')[0]);
    const [numInstallments, setNumInstallments] = useState('');
    const [installmentDates, setInstallmentDates] = useState([]);

    const categories = {
        expense: ['Comida', 'Transporte', 'Servicios', 'Ocio', 'Salud', 'Otros'],
        income: ['Salario', 'Freelance', 'Venta', 'Inversión', 'Otros'],
        debt: ['Préstamo Personal', 'Banco', 'Tarjeta', 'Otros'],
        receivable: ['Amigos', 'Trabajo', 'Deuda Pendiente', 'Otros']
    };

    const handleSave = () => {
        if (!amount || !category) {
            Alert.alert("Faltan datos", "Por favor ingresa el monto y la categoría.");
            return;
        }

        const transaction = {
            type,
            amount: parseFloat(amount.replace(',', '.')),
            category,
            note,
            status: type === 'debt' || type === 'receivable' ? 'pending' : 'completed',
            debtType: type === 'debt' ? debtType : null,
            obtainedDate: type === 'debt' ? obtainedDate : null,
            installments: type === 'debt' ? installmentDates.map(d => ({ date: d, amount: parseFloat(amount.replace(',', '.')) / (parseInt(numInstallments) || 1), paid: false })) : []
        };

        if (isNaN(transaction.amount)) {
            Alert.alert("Error", "Monto inválido");
            return;
        }

        onSave(transaction);
        resetForm();
    };

    const resetForm = () => {
        setType('expense');
        setAmount('');
        setCategory('');
        setNote('');
        setDebtType('loan');
        setObtainedDate(new Date().toISOString().split('T')[0]);
        setNumInstallments('');
        setInstallmentDates([]);
    };

    const handleNumInstallmentsChange = (val) => {
        setNumInstallments(val);
        const num = parseInt(val);
        if (!isNaN(num) && num > 0) {
            const dates = [];
            for (let i = 1; i <= num; i++) {
                const d = new Date();
                d.setMonth(d.getMonth() + i);
                dates.push(d.toISOString().split('T')[0]);
            }
            setInstallmentDates(dates);
        } else {
            setInstallmentDates([]);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={styles.overlay}>
                <View style={[styles.content, { backgroundColor: activeColors.cardCtx }]}>
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: activeColors.textDark }]}>Nueva Transacción</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={28} color={activeColors.secondary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {/* Type Selection */}
                        <View style={styles.typeContainer}>
                            {['income', 'expense', 'debt', 'receivable'].map((t) => (
                                <TouchableOpacity
                                    key={t}
                                    onPress={() => { setType(t); setCategory(''); }}
                                    style={[
                                        styles.typeBtn,
                                        { backgroundColor: type === t ? theme.primary : activeColors.bg }
                                    ]}
                                >
                                    <Text style={{
                                        color: type === t ? 'white' : activeColors.secondary,
                                        fontSize: scale(11),
                                        fontWeight: 'bold',
                                        textTransform: 'capitalize'
                                    }}>
                                        {t === 'income' ? 'Ingreso' : t === 'expense' ? 'Gasto' : t === 'debt' ? 'Deuda' : 'Por Cobrar'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Amount Input */}
                        <Text style={[styles.label, { color: activeColors.secondary }]}>Monto ($)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark }]}
                            placeholder="0.00"
                            placeholderTextColor={activeColors.secondary}
                            keyboardType="numeric"
                            value={amount}
                            onChangeText={setAmount}
                        />

                        {/* Category Selection */}
                        <Text style={[styles.label, { color: activeColors.secondary }]}>Categoría</Text>
                        <View style={styles.categoryContainer}>
                            {categories[type].map((cat) => (
                                <TouchableOpacity
                                    key={cat}
                                    onPress={() => setCategory(cat)}
                                    style={[
                                        styles.catBtn,
                                        {
                                            backgroundColor: category === cat ? theme.primarySoft : activeColors.bg,
                                            borderColor: category === cat ? theme.primary : 'transparent',
                                            borderWidth: 1
                                        }
                                    ]}
                                >
                                    <Text style={{ color: category === cat ? theme.primary : activeColors.secondary }}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Debt Specific Fields */}
                        {type === 'debt' && (
                            <View style={{ marginTop: 20, backgroundColor: activeColors.bg, padding: 15, borderRadius: 15 }}>
                                <Text style={[styles.label, { color: activeColors.secondary, marginTop: 0 }]}>Tipo de Deuda</Text>
                                <View style={styles.debtTypeRow}>
                                    <TouchableOpacity
                                        onPress={() => setDebtType('loan')}
                                        style={[styles.smallBtn, { backgroundColor: debtType === 'loan' ? theme.primary : activeColors.cardCtx }]}
                                    >
                                        <Text style={{ color: debtType === 'loan' ? 'white' : activeColors.secondary }}>Préstamo</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={() => setDebtType('credit')}
                                        style={[styles.smallBtn, { backgroundColor: debtType === 'credit' ? theme.primary : activeColors.cardCtx }]}
                                    >
                                        <Text style={{ color: debtType === 'credit' ? 'white' : activeColors.secondary }}>Crédito</Text>
                                    </TouchableOpacity>
                                </View>

                                <Text style={[styles.label, { color: activeColors.secondary }]}>Fecha Obtención (YYYY-MM-DD)</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: activeColors.cardCtx, color: activeColors.textDark, fontSize: 14 }]}
                                    value={obtainedDate}
                                    onChangeText={setObtainedDate}
                                    placeholder="2024-01-01"
                                />

                                <Text style={[styles.label, { color: activeColors.secondary }]}>Número de Cuotas</Text>
                                <TextInput
                                    style={[styles.input, { backgroundColor: activeColors.cardCtx, color: activeColors.textDark, fontSize: 14 }]}
                                    keyboardType="numeric"
                                    value={numInstallments}
                                    onChangeText={handleNumInstallmentsChange}
                                    placeholder="Ej. 12"
                                />

                                {installmentDates.length > 0 && (
                                    <View style={{ marginTop: 15 }}>
                                        <Text style={[styles.label, { color: theme.primary, fontSize: 12 }]}>Fechas estimadas de pago:</Text>
                                        {installmentDates.map((d, idx) => (
                                            <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
                                                <Text style={{ color: activeColors.secondary, width: 80 }}>Cuota {idx + 1}:</Text>
                                                <TextInput
                                                    style={{ flex: 1, backgroundColor: activeColors.cardCtx, color: activeColors.textDark, borderRadius: 8, padding: 5, fontSize: 12 }}
                                                    value={d}
                                                    onChangeText={(newVal) => {
                                                        const newDates = [...installmentDates];
                                                        newDates[idx] = newVal;
                                                        setInstallmentDates(newDates);
                                                    }}
                                                />
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Note */}
                        <Text style={[styles.label, { color: activeColors.secondary }]}>Nota (Opcional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: activeColors.bg, color: activeColors.textDark, height: 80 }]}
                            placeholder="Ej. Pago de cena"
                            placeholderTextColor={activeColors.secondary}
                            multiline
                            value={note}
                            onChangeText={setNote}
                        />

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                            onPress={handleSave}
                        >
                            <Text style={styles.saveBtnText}>Guardar Transacción</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    content: {
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 25,
        maxHeight: '85%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: '900',
    },
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    typeBtn: {
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 10,
        width: '23%',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        marginTop: 10,
    },
    input: {
        borderRadius: 12,
        padding: 15,
        fontSize: 18,
        fontWeight: 'bold',
    },
    categoryContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 5,
    },
    catBtn: {
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginRight: 10,
        marginBottom: 10,
    },
    saveBtn: {
        padding: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 20,
    },
    saveBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '900',
    },
    debtTypeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    smallBtn: {
        width: '48%',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
    }
});

export default AddTransactionModal;
