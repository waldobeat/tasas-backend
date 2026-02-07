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
        <Modal visible={visible} animationType="none" transparent>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 }}>
                <View style={{ backgroundColor: activeColors.cardCtx, padding: 20, borderRadius: 20 }}>
                    <Text style={{ color: activeColors.textDark, fontSize: 18, fontWeight: 'bold' }}>MODO WIREFRAME: AÑADIR</Text>
                    <TextInput
                        style={{ backgroundColor: activeColors.bg, color: activeColors.textDark, padding: 10, marginVertical: 10, borderRadius: 10 }}
                        placeholder="Monto"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <TouchableOpacity onPress={handleSave} style={{ backgroundColor: theme.primary, padding: 15, borderRadius: 10, alignItems: 'center' }}>
                        <Text style={{ color: 'white' }}>GUARDAR (TEST)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={onClose} style={{ marginTop: 10, alignItems: 'center' }}>
                        <Text style={{ color: activeColors.secondary }}>Cerrar</Text>
                    </TouchableOpacity>
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
