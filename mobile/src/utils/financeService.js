import axios from 'axios';
import { authService } from './authService';

const API_URL = 'http://192.168.101.8:8000/api/finance';

export const financeService = {
    getAllTransactions: async () => {
        try {
            const user = await authService.getUser();
            if (!user) return [];
            const response = await axios.get(`${API_URL}/${user.id}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching transactions from API:', error.message);
            return [];
        }
    },

    addTransaction: async (transaction) => {
        try {
            const user = await authService.getUser();
            if (!user) throw new Error('Usuario no autenticado');

            const newTransaction = {
                ...transaction,
                userId: user.id,
            };
            const response = await axios.post(API_URL, newTransaction);
            return response.data;
        } catch (error) {
            console.error('Error adding transaction to API:', error.message);
            throw error;
        }
    },

    updateTransaction: async (id, updatedData) => {
        try {
            const response = await axios.put(`${API_URL}/${id}`, updatedData);
            return response.data;
        } catch (error) {
            console.error('Error updating transaction in API:', error.message);
            throw error;
        }
    },

    deleteTransaction: async (id) => {
        try {
            const response = await axios.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting transaction in API:', error.message);
            throw error;
        }
    },

    getStats: async () => {
        const transactions = await financeService.getAllTransactions();
        const stats = {
            totalIncome: 0,
            totalExpense: 0,
            totalDebt: 0,
            totalReceivable: 0,
            categories: {},
            history: [] // Added for line chart
        };

        // Sort by date for history
        const sorted = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        let runningBalance = 0;

        sorted.forEach(t => {
            const amount = parseFloat(t.amount);
            if (t.type === 'income') {
                stats.totalIncome += amount;
                runningBalance += amount;
            }
            if (t.type === 'expense') {
                stats.totalExpense += amount;
                runningBalance -= amount;
                stats.categories[t.category] = (stats.categories[t.category] || 0) + amount;
            }
            if (t.type === 'debt') {
                stats.totalDebt += amount;
                runningBalance -= amount;
            }
            if (t.type === 'receivable') {
                stats.totalReceivable += amount;
                runningBalance += amount;
            }

            stats.history.push({
                date: new Date(t.date).toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' }),
                balance: runningBalance
            });
        });

        // Limit history for chart readability
        if (stats.history.length > 7) {
            stats.history = stats.history.slice(-7);
        }

        return stats;
    }
};
