import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://tasas-backend.onrender.com/api/auth';
const USER_KEY = '@auth_user_v1';

export const authService = {
    login: async (email, password) => {
        try {
            const response = await axios.post(`${API_URL}/login`, { email, password });
            if (response.data) {
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(response.data));
            }
            return response.data;
        } catch (error) {
            const errStatus = error.response?.data?.status;
            const errMsg = error.response?.data?.error || error.message;
            if (errStatus === 'pendiente') {
                throw { message: errMsg, status: 'pendiente' };
            }
            console.error('Login error:', errMsg);
            throw errMsg;
        }
    },

    register: async (name, email, password, premiumCode) => {
        try {
            const response = await axios.post(`${API_URL}/register`, {
                name,
                email,
                password,
                premiumCode
            });
            return response.data;
        } catch (error) {
            console.error('Register error:', error.response?.data?.error || error.message);
            throw error.response?.data?.error || 'Error al registrarse';
        }
    },

    verify: async (email, code) => {
        try {
            const response = await axios.post(`${API_URL}/verify`, { email, code });
            return response.data;
        } catch (error) {
            console.error('Verify error:', error.response?.data?.error || error.message);
            throw error.response?.data?.error || 'Error al verificar código';
        }
    },

    logout: async () => {
        await AsyncStorage.removeItem(USER_KEY);
    },

    updatePremiumStatus: async (userId, isPremium, expiresAt = null, premiumType = null) => {
        try {
            const baseUrl = API_URL.replace('/auth', '');
            const response = await axios.post(`${baseUrl}/auth/premium`, { userId, isPremium, expiresAt, premiumType });
            if (response.data) {
                const currentUser = await authService.getUser();
                if (currentUser && currentUser.id === userId) {
                    const updatedUser = {
                        ...currentUser,
                        isPremium: response.data.isPremium,
                        premiumType: response.data.premiumType,
                        expiresAt: response.data.expiresAt
                    };
                    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
                }
            }
            return response.data;
        } catch (error) {
            console.error('Update premium error:', error.response?.data?.error || error.message);
            throw error.response?.data?.error || 'Error al actualizar premium';
        }
    },

    getUser: async () => {
        const userStr = await AsyncStorage.getItem(USER_KEY);
        if (!userStr) return null;

        const user = JSON.parse(userStr);

        // Check for expiration (specifically for 'free' or '30' types)
        if (user.isPremium && user.expiresAt) {
            const expiration = new Date(user.expiresAt);
            if (new Date() > expiration) {
                // Premium expired
                user.isPremium = false;
                user.premiumType = null;
                user.expiresAt = null;
                await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
            }
        }

        return user;
    }
};
