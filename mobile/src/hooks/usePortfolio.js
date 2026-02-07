import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { financeService } from '../utils/financeService';

const PORTFOLIO_KEY = 'portfolio_v1';

export const usePortfolio = (user) => {
    const [portfolio, setPortfolio] = useState([]);
    const [loading, setLoading] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const loadPortfolio = async () => {
        try {
            const stored = await AsyncStorage.getItem(PORTFOLIO_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    if (Array.isArray(parsed)) setPortfolio(parsed);
                } catch (e) {
                    console.error("Error parsing stored portfolio", e);
                }
            }

            if (user) {
                const backendTransactions = await financeService.getAllTransactions();
                if (Array.isArray(backendTransactions) && backendTransactions.length > 0) {
                    const mapped = backendTransactions.map(t => ({ ...t, id: t._id }));
                    setPortfolio(mapped);
                    await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(mapped));
                }
            }
        } catch (e) {
            console.error('Error synchronizing portfolio:', e);
        }
    };

    useEffect(() => {
        loadPortfolio();
    }, [user, refreshKey]);

    const savePortfolio = async (newData) => {
        const dataToSave = Array.isArray(newData) ? newData : [];
        setPortfolio(dataToSave);
        await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(dataToSave));
    };

    // Generic Add
    const addTransaction = async (newItem) => {
        try {
            setLoading(true);
            const tempId = Date.now().toString();
            const itemWithTempId = { ...newItem, id: tempId };

            const updated = [...portfolio, itemWithTempId];
            await savePortfolio(updated);

            const saved = await financeService.addTransaction(newItem);

            const synced = updated.map(item => item.id === tempId ? { ...item, ...saved, id: saved._id, _id: saved._id } : item);
            await savePortfolio(synced);

            setRefreshKey(p => p + 1);
            return saved;
        } catch (e) {
            Alert.alert("Error de Sincronización", "Guardado localmente.");
            return { ...newItem, id: Date.now().toString() };
        } finally {
            setLoading(false);
        }
    };

    // Generic Update
    const updateTransaction = async (id, updatedItem) => {
        try {
            setLoading(true);
            const updated = portfolio.map(item => (item.id === id || item._id === id) ? updatedItem : item);
            await savePortfolio(updated);

            await financeService.updateTransaction(id, updatedItem);
            setRefreshKey(p => p + 1);
        } catch (e) {
            console.error("Update error:", e);
        } finally {
            setLoading(false);
        }
    };

    const deleteTransaction = async (id) => {
        const item = portfolio.find(i => i.id === id || i._id === id);
        if (!item) return;

        try {
            setLoading(true);
            const updated = portfolio.filter(item => item.id !== id && item._id !== id);
            await savePortfolio(updated);
            await financeService.deleteTransaction(item._id || item.id);
            setRefreshKey(p => p + 1);
        } catch (e) {
            Alert.alert("Error", "No se pudo eliminar.");
            loadPortfolio();
        } finally {
            setLoading(false);
        }
    };

    const toggleTransactionCompletion = async (id) => {
        const item = portfolio.find(i => i.id === id || i._id === id);
        if (!item) return;
        const updated = { ...item, completed: !item.completed };
        await updateTransaction(id, updated);
    };

    const addPartialPayment = async (debtId, amount, date) => {
        try {
            setLoading(true);
            const res = await financeService.updateTransaction(debtId, {
                addPayment: { amount, date }
            });
            setRefreshKey(p => p + 1);
            return res;
        } catch (e) {
            Alert.alert("Error", "No se pudo registrar el abono.");
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const getTotals = () => {
        let income = 0;
        let expense = 0;
        let debt = 0;
        let receivable = 0;

        portfolio.forEach(t => {
            const amt = parseFloat(t.amount) || 0;
            if (t.type === 'income') income += amt;
            else if (t.type === 'expense') expense += amt;
            else if (t.type === 'debt') debt += amt;
            else if (t.type === 'receivable') receivable += amt;
        });

        return { income, expense, debt, receivable };
    };

    return {
        portfolio,
        loading,
        refreshKey,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        toggleTransactionCompletion,
        addPartialPayment,
        getTotals,
        setPortfolio,
        loadPortfolio
    };
};
