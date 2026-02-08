import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// API URL - Keep consistent with original
const API_URL = 'https://tasas-backend.onrender.com/api/rates';

const RATES_CACHE_KEY = 'rates_cache_v2';
const CACHE_TTL = 60 * 60 * 1000; // 1 Hora

export const useRates = () => {
    const [loading, setLoading] = useState(true);
    const [rates, setRates] = useState(null);
    const [history, setHistory] = useState([]);
    const [date, setDate] = useState('');
    const [valueDate, setValueDate] = useState('');
    const [lastUpdated, setLastUpdated] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    const updateDate = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        setDate(now.toLocaleDateString('es-ES', options).toUpperCase());
    };

    async function fetchRates(forceRefresh = false) {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            // 1. Intentar cargar del caché local (Solo si no es refresh forzado)
            if (!forceRefresh) {
                const cached = await AsyncStorage.getItem(RATES_CACHE_KEY);
                if (cached) {
                    const { rates: cachedRates, timestamp } = JSON.parse(cached);
                    const age = Date.now() - timestamp;

                    if (age < CACHE_TTL) {
                        setRates(cachedRates);

                        if (cachedRates.bdv) {
                            if (cachedRates.bdv.last_updated) {
                                const d = new Date(cachedRates.bdv.last_updated);
                                setLastUpdated(d.toLocaleString('es-VE', { hour: 'numeric', minute: 'numeric', hour12: true }));
                            }
                            if (cachedRates.bdv.value_date) {
                                setValueDate(cachedRates.bdv.value_date);
                            }
                        }
                        setLoading(false);
                        return;
                    }
                }
            }

            // 2. Si no hay caché o expiró (o forzamos), buscar del servidor
            const response = await axios.get(API_URL, { timeout: 30000 });
            const newRates = response.data.rates;

            setRates(newRates);

            if (response.data.timestamp) {
                const d = new Date(response.data.timestamp);
                setLastUpdated(d.toLocaleString('es-VE', { hour: 'numeric', minute: 'numeric', hour12: true }));
            }

            if (newRates && newRates.bdv && newRates.bdv.value_date) {
                setValueDate(newRates.bdv.value_date);
            }

            // 3. Guardar en caché local
            await AsyncStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
                rates: newRates,
                timestamp: Date.now()
            }));

        } catch (e) {
            console.log('Error fetching rates:', e);
            const cached = await AsyncStorage.getItem(RATES_CACHE_KEY);
            if (cached) {
                const { rates: cachedRates } = JSON.parse(cached);
                setRates(cachedRates);
                if (cachedRates.bdv && cachedRates.bdv.value_date) {
                    setValueDate(cachedRates.bdv.value_date);
                }
            }
        } finally {
            setLoading(false);
        }
    }

    async function fetchHistory() {
        try {
            const url = `${API_URL.replace('/rates', '/history')}`;
            const response = await axios.get(url);
            setHistory(response.data);
        } catch (e) {
            console.log('Error fetching history:', e.message);
        }
    }

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchRates(true);
        await fetchHistory();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchRates();
        fetchHistory();
        updateDate();
    }, []);

    return {
        rates,
        loading,
        history,
        date,
        valueDate,
        lastUpdated,
        refreshing,
        onRefresh
    };
};
