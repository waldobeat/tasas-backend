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
                        // We still check cache but don't setLoading(false) here.
                        // History will take over shortly.
                        return;
                    }
                }
            }

            // 2. Si no hay caché o expiró (o forzamos), buscar del servidor
            const response = await axios.get(API_URL, { timeout: 30000 });
            const newRates = response.data.rates;

            // Consistency is now handled by the history-based 7 AM logic.

            if (response.data.timestamp) {
                const d = new Date(response.data.timestamp);
                setLastUpdated(d.toLocaleString('es-VE', { hour: 'numeric', minute: 'numeric', hour12: true }));
            }

            // 3. Guardar en caché local
            await AsyncStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
                rates: newRates,
                timestamp: Date.now()
            }));

        } catch (e) {
            console.log('Error fetching rates:', e);
        } finally {
            // No setLoading(false) here either.
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

    // Process active rate when history updates
    useEffect(() => {
        if (!history || history.length === 0) return;

        // --- 7:00 AM Logic ---
        const now = new Date();
        const currentHour = now.getHours();
        let effectiveToday = now.toISOString().split('T')[0];

        // If before 7 AM, we are still on the "previous" active date in terms of market opening
        if (currentHour < 7) {
            const d = new Date(now);
            d.setDate(d.getDate() - 1);
            effectiveToday = d.toISOString().split('T')[0];
        }

        // Find latest where date <= effectiveToday
        const activeItem = [...history]
            .filter(item => {
                const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
                return dateSource && dateSource <= effectiveToday;
            })
            .pop();

        if (activeItem && activeItem.rates) {
            setRates(activeItem.rates);
            if (activeItem.value_date) setValueDate(activeItem.value_date);
            if (activeItem.timestamp) {
                const d = new Date(activeItem.timestamp);
                setLastUpdated(d.toLocaleString('es-VE', { hour: 'numeric', minute: 'numeric', hour12: true }));
            }
        }

        // Finalize loading once we have processed history
        setLoading(false);
    }, [history]);

    useEffect(() => {
        fetchRates();
        fetchHistory();
        updateDate();

        // Safety fallback: if history fails or is slow, don't leave user hanging forever
        const timer = setTimeout(() => {
            setLoading(false);
        }, 10000);

        return () => clearTimeout(timer);
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
