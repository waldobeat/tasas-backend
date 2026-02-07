import axios from 'axios';
import { authService } from './authService';

const API_URL = 'https://tasas-backend.onrender.com/api/finance';

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
            if (!t) return;
            const amount = parseFloat(t.amount) || 0;
            if (t.type === 'income') {
                stats.totalIncome += amount;
                runningBalance += amount;
            }
            if (t.type === 'expense') {
                stats.totalExpense += amount;
                runningBalance -= amount;
                if (t.category) {
                    stats.categories[t.category] = (stats.categories[t.category] || 0) + amount;
                }
            }
            if (t.type === 'debt') {
                stats.totalDebt += amount;
                runningBalance -= amount;
            }
            if (t.type === 'receivable') {
                stats.totalReceivable += amount;
                runningBalance += amount;
            }

            let dateLabel = "N/A";
            try {
                if (t && t.date) {
                    const d = new Date(t.date);
                    if (!isNaN(d.getTime())) {
                        try {
                            dateLabel = d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
                        } catch (formatError) {
                            console.warn("Error formatting date with toLocaleDateString:", formatError);
                            dateLabel = "Fecha Inválida";
                        }
                    }
                }
            } catch (e) {
                console.log("Stats date error", e);
            }

            stats.history.push({
                date: dateLabel,
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
