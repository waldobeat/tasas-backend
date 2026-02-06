import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, ActivityIndicator, LayoutAnimation, Platform, UIManager, TextInput, Alert, LogBox, Animated, Easing, Image, Switch, RefreshControl, Dimensions, SafeAreaView, Vibration } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Updates from 'expo-updates';
import { useUpdates } from 'expo-updates';
import Constants from 'expo-constants';
import RateCard from './src/components/RateCard';
import Portfolio from './src/components/Portfolio';
import IntroScreen from './src/components/IntroScreen';
import { COLORS, THEMES, STATIC_COLORS, LIGHT_PALETTE, DARK_PALETTE, scale, verticalScale, moderateScale } from './src/styles/theme';
import { formatNumber } from './src/utils/helpers';
import { Linking } from 'react-native';
import FinancialDashboard from './src/components/FinancialDashboard';
import AddTransactionModal from './src/components/AddTransactionModal';
import AuthScreen from './src/components/AuthScreen';
import { financeService } from './src/utils/financeService';
import { authService } from './src/utils/authService';

// API URL
const API_URL = 'https://tasas-backend.onrender.com/api/rates'; // PRODUCTION
// { const API_URL = 'http://localhost:8000/api/rates'; }
// const API_URL = 'http://192.168.101.8:8000/api/rates'; // LOCAL IP FOR EMULATOR

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';



// Ignore "no-op" warning
LogBox.ignoreLogs(['setLayoutAnimationEnabledExperimental']);
LogBox.ignoreLogs(['Warning:']);

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// --- PALETTES & THEMES MOVED TO src/styles/theme.js ---

export default function App() {
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState(null);
  const [history, setHistory] = useState([]); // New History State
  const [date, setDate] = useState(''); // Fecha del sistema (HOY)
  const [valueDate, setValueDate] = useState(''); // Fecha Valor del BCV
  const [lastUpdated, setLastUpdated] = useState(''); // Hora de actualización técnica

  // Theme State
  const [activeThemeKey, setActiveThemeKey] = useState('DEFAULT');
  const [darkMode, setDarkMode] = useState(true); // Default Oscuro
  const [menuVisible, setMenuVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // TUTORIAL STATE


  // INTRO SCREEN STATE
  const [showIntro, setShowIntro] = useState(true);




  // --- AUTH STATE ---
  const [user, setUser] = useState(null);

  const theme = THEMES[activeThemeKey];
  const activeColors = darkMode ? DARK_PALETTE : LIGHT_PALETTE;

  // Refs for capturing screenshots
  const cardRefs = useRef({});

  // Modals
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);

  // Calculator State
  const [activeCalc, setActiveCalc] = useState(null);

  // --- FINANCIAL MODULE STATES ---
  const [portfolio, setPortfolio] = useState([]);
  const [newTrans, setNewTrans] = useState({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
  const [activeTransId, setActiveTransId] = useState(null);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeModule, setActiveModule] = useState('rates'); // 'rates' or 'finance'
  const [showAddFinance, setShowAddFinance] = useState(false);
  const [financeRefreshKey, setFinanceRefreshKey] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumType, setPremiumType] = useState(null); // 'plus', '30', 'free'
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // NEW: Debt Payment Linking States
  const [isDebtPayment, setIsDebtPayment] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null);

  // --- OTA UPDATE STATES ---
  const { isDownloading, downloadProgress, isUpdatePending, isUpdateAvailable } = useUpdates();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isUpdateAvailable || isDownloading || isUpdatePending) {
      setShowUpdateModal(true);
    }
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  useEffect(() => {
    if (isDownloading) {
      Animated.timing(progressAnim, {
        toValue: downloadProgress || 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [isDownloading, downloadProgress]);

  useEffect(() => {
    if (isUpdatePending) {
      // Ensure bar is full
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isUpdatePending]);

  useEffect(() => {
    checkAuth();
  }, []);
  const checkAuth = async () => {
    const activeUser = await authService.getUser();
    if (activeUser) {
      setUser(activeUser);
      setIsPremium(activeUser.isPremium);
      setPremiumType(activeUser.premiumType);
      // Actualizar finanzas si es premium
      if (activeUser.isPremium) {
        setFinanceRefreshKey(prev => prev + 1);
      }
    } else {
      setIsPremium(false);
      setPremiumType(null);
      setUser(null);
    }
  };

  const activatePremiumAction = (type, codeInput = null) => {
    if (!user) return;
    // Logic for paid plans
    if (type === 'buy' || type === 'monthly') {
      const planName = type === 'buy' ? 'Premium Plus 365 días' : 'Premium Plata 30 Días';
      const price = type === 'buy' ? '9.99' : '2.99';

      Alert.alert(
        "Confirmar Suscripción",
        `Has seleccionado ${planName} ($${price}).\n\n¿Deseas pagar con PayPal?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Ir a PayPal",
            onPress: () => {
              // Open PayPal Link
              Linking.openURL('https://paypal.me/latasave?country.x=VE&locale.x=es_XC');
              // Optionally show a message that validation is manual for now or automatic if integrated
              Alert.alert("Pago Iniciado", "Una vez realizado el pago, tu cuenta será activada en breve.");
            }
          }
        ]
      );
    }
  };

  // --- ACCESS CONTROL & ADS ---
  const [sessionLocked, setSessionLocked] = useState(false);

  // Grant 6 hours of access (Reusable)
  const grantPremiumAccess = async (onSuccess, customMessage) => {
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    try {
      let userId = user?.id || user?._id;
      if (userId) {
        const result = await authService.updatePremiumStatus(userId, true, expiresAt, 'free');
        setUser({ ...user, ...result });
        setIsPremium(result.isPremium);
      }
      setSessionLocked(false);
      if (onSuccess) onSuccess(expiresAt);

      Alert.alert(
        "Acceso por Cortesía",
        "Te hemos concedido 6 horas de acceso libre para probar las funciones."
      );

      setShowPremiumModal(false);
      setFinanceRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error("Access sync error:", error);
      setSessionLocked(false);
      if (onSuccess) onSuccess(expiresAt);
      Alert.alert("Acceso Concedido", "Disfruta de tus 6 horas de acceso.");
    }
  };



  // Check Session Expiry every minute
  useEffect(() => {
    if (!user) return;
    const checkExpiry = () => {
      if (!user.expiresAt) return;
      const now = new Date();
      const expiry = new Date(user.expiresAt);
      if (now > expiry) {
        setSessionLocked(true);
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handlePremiumOption = (type) => {
    if (type === 'ad') {
      grantPremiumAccess();
    }
  };


  const handleAuthSuccess = (u) => {
    setUser(u);
    setIsPremium(u.isPremium);
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres salir?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: 'destructive',
          onPress: async () => {
            Alert.alert("¡Hasta pronto!", "Espero verte de vuelta 👋");
            await authService.logout();
            setUser(null);
            setIsPremium(false);
            setActiveModule('rates');
            setMenuVisible(false);
          }
        }
      ]
    );
  };


  // Renamed from checkLegalStatus to checkCookies for clarity
  const checkCookies = async () => {
    try {
      const privacy = await AsyncStorage.getItem(PRIVACY_KEY);
      const cookies = await AsyncStorage.getItem(COOKIE_KEY);
      if (!privacy) setShowPrivacy(true);
      else if (!cookies) setShowCookies(true);
    } catch (e) { console.error(e); }
  };

  const toggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem('dark_mode_pref', next.toString());
  };




  const updateDate = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    setDate(now.toLocaleDateString('es-ES', options).toUpperCase());
  };

  const acceptPrivacy = async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, 'true');
    setShowPrivacy(false);
    const cookies = await AsyncStorage.getItem(COOKIE_KEY);
    if (!cookies) setShowCookies(true);
  };

  const acceptCookies = async () => {
    await AsyncStorage.setItem(COOKIE_KEY, 'true');
    setShowCookies(false);
  };

  const changeTheme = async (key) => {
    setActiveThemeKey(key);
    await AsyncStorage.setItem('theme_preference', key);
  };

  // --- PORTFOLIO LOGIC ---
  const PORTFOLIO_KEY = 'portfolio_v1';

  const loadPortfolio = async () => {
    try {
      // 1. Load from local first for speed
      const stored = await AsyncStorage.getItem(PORTFOLIO_KEY);
      if (stored) setPortfolio(JSON.parse(stored));

      // 2. If authenticated, sync from backend
      const user = await authService.getUser();
      if (user) {
        const backendTransactions = await financeService.getAllTransactions();
        if (backendTransactions && backendTransactions.length > 0) {
          // Map backend _id to id for compatibility
          const mapped = backendTransactions.map(t => ({ ...t, id: t._id }));
          setPortfolio(mapped);
          await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(mapped));
        }
      }
    } catch (e) {
      console.error('Error synchronizing portfolio:', e);
    }
  };

  const savePortfolio = async (newData) => {
    setPortfolio(newData);
    await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(newData));
  };

  useEffect(() => {
    loadPortfolio();
  }, [financeRefreshKey]);

  const addTransaction = async () => {
    if (!newTrans.title || !newTrans.amount || !newTrans.date) {
      if (!isDebtPayment) { // Title not needed if it's just a payment
        Alert.alert("Faltan Datos", "Por favor completa todos los campos.");
        return;
      }
    }

    const amountVal = parseFloat(newTrans.amount.replace(',', '.'));
    if (isNaN(amountVal)) {
      Alert.alert("Error", "Monto inválido");
      return;
    }

    const itemsDate = new Date(newTrans.date);
    itemsDate.setHours(12, 0, 0, 0); // Noon to avoid timezone shifts

    // NEW LEGACY LOGIC: Check if it's a linked payment
    if (isDebtPayment && selectedDebtId) {
      const debt = portfolio.find(d => d.id === selectedDebtId || d._id === selectedDebtId);
      if (debt) {
        const paid = (debt.payments || []).reduce((s, p) => s + p.amount, 0);
        const remaining = Math.max(0, debt.amount - paid);

        if (amountVal > remaining) {
          // EXCEDENTE DETECTADO
          Alert.alert(
            "Monto Excede la Deuda",
            `Ingresaste $${amountVal.toFixed(2)}, pero solo restan $${remaining.toFixed(2)}. ¿Qué deseas realizar?`,
            [
              {
                text: `Solo pagar los $${remaining.toFixed(2)}`,
                onPress: async () => {
                  await addPartialPayment(selectedDebtId, remaining, itemsDate);
                  setNewTrans({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
                  setIsDebtPayment(false);
                  setSelectedDebtId(null);
                }
              },
              {
                text: `Pagar e Independizar Resto ($${(amountVal - remaining).toFixed(2)})`,
                onPress: async () => {
                  // 1. Pagar el resto de la deuda
                  const targetId = debt._id || debt.id;
                  const newPayments = [...(debt.payments || []), {
                    id: Date.now().toString(),
                    amount: remaining,
                    date: itemsDate.toISOString()
                  }];
                  const updatedDebt = { ...debt, payments: newPayments, completed: true };

                  // 2. Crear nueva transacción con el sobrante
                  const surplusItem = {
                    title: (debt.category || debt.title) + " (Excedente)",
                    amount: amountVal - remaining,
                    type: 'pay',
                    currency: debt.currency || 'USD',
                    date: itemsDate.toISOString(),
                    payments: [],
                    completed: false
                  };

                  try {
                    setLoading(true);
                    // 1. Pagar el resto de la deuda
                    const targetId = debt._id || debt.id;
                    const newPayments = [...(debt.payments || []), {
                      id: Date.now().toString(),
                      amount: remaining,
                      date: itemsDate.toISOString()
                    }];
                    const updatedDebt = { ...debt, id: targetId, payments: newPayments, completed: true };

                    // 2. Crear nueva transacción con el sobrante
                    const surplusItem = {
                      title: (debt.category || debt.title) + " (Excedente)",
                      amount: amountVal - remaining,
                      type: 'pay',
                      currency: debt.currency || 'USD',
                      date: itemsDate.toISOString(),
                      payments: [],
                      completed: false
                    };

                    // Optimistic update
                    const tempId = Date.now().toString();
                    const newPortfolio = portfolio.map(d => (d.id === targetId || d._id === targetId) ? updatedDebt : d);
                    const finalPortfolio = [...newPortfolio, { ...surplusItem, id: tempId }];
                    setPortfolio(finalPortfolio);
                    await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(finalPortfolio));

                    await financeService.updateTransaction(targetId, updatedDebt);
                    const savedSurplus = await financeService.addTransaction(surplusItem);

                    // Sync with actual server ID for surplus
                    const syncedPortfolio = finalPortfolio.map(item => item.id === tempId ? { ...item, id: savedSurplus._id, _id: savedSurplus._id } : item);
                    setPortfolio(syncedPortfolio);
                    await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(syncedPortfolio));

                    setFinanceRefreshKey(prev => prev + 1);
                    Alert.alert("Éxito", "Deuda saldada y resto registrado correctamente.");
                  } catch (e) {
                    Alert.alert("Error", "No se pudo sincronizar el excedente. Refrescando...");
                    loadPortfolio();
                  } finally {
                    setLoading(false);
                  }

                  setNewTrans({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
                  setIsDebtPayment(false);
                  setSelectedDebtId(null);
                }
              },
              {
                text: "Abonar todo (Sobrepago)",
                onPress: async () => {
                  await addPartialPayment(selectedDebtId, amountVal, itemsDate);
                  setNewTrans({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
                  setIsDebtPayment(false);
                  setSelectedDebtId(null);
                }
              },
              { text: "Cancelar", style: "cancel" }
            ]
          );
          return;
        }
      }

      await addPartialPayment(selectedDebtId, amountVal, itemsDate);
      setNewTrans({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
      setIsDebtPayment(false);
      setSelectedDebtId(null);
      return;
    }

    const newItem = {
      title: newTrans.title,
      amount: amountVal,
      type: newTrans.type,
      currency: newTrans.currency,
      date: itemsDate.toISOString(),
      category: newTrans.title,
      payments: [],
      completed: false
    };

    try {
      setLoading(true);
      const tempId = Date.now().toString();
      const itemWithTempId = { ...newItem, id: tempId };

      // Optimistic update
      const updated = [...portfolio, itemWithTempId];
      setPortfolio(updated);
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated));

      const saved = await financeService.addTransaction(newItem);

      // Update with server ID
      const synced = updated.map(item => item.id === tempId ? { ...item, ...saved, id: saved._id } : item);
      setPortfolio(synced);
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(synced));

      setFinanceRefreshKey(prev => prev + 1);
      setNewTrans({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
    } catch (e) {
      Alert.alert("Error de Sincronización", "La transacción se guardará solo localmente por ahora.");
      // Portfolio already has the temp item from optimistic update
    } finally {
      setLoading(false);
    }
  };

  const addPartialPayment = async (transactionId, amount, date) => {
    const debt = portfolio.find(d => d.id === transactionId || d._id === transactionId);
    if (!debt) {
      Alert.alert("Error", "No se encontró la deuda original.");
      return;
    }

    const newPayments = [...(debt.payments || []), {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      date: new Date(date).toISOString()
    }];
    const totalPaid = newPayments.reduce((s, p) => s + p.amount, 0);
    const isNowCompleted = totalPaid >= debt.amount;

    const updatedDebt = {
      ...debt,
      payments: newPayments,
      completed: isNowCompleted
    };

    try {
      setLoading(true);
      // Optimistic update
      const updated = portfolio.map(d => (d.id === transactionId || d._id === transactionId) ? updatedDebt : d);
      setPortfolio(updated);
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated));

      await financeService.updateTransaction(debt._id || debt.id, updatedDebt);
      setFinanceRefreshKey(prev => prev + 1);
      Alert.alert("Éxito", "Abono registrado correctamente");
    } catch (e) {
      Alert.alert("Error", "No se pudo sincronizar el abono. Refrescando...");
      loadPortfolio();
    } finally {
      setLoading(false);
    }
  };

  const toggleTransactionCompletion = async (id) => {
    const item = portfolio.find(i => i.id === id || i._id === id);
    if (!item) return;

    const updatedItem = { ...item, completed: !item.completed };

    try {
      setLoading(true);
      await financeService.updateTransaction(item._id || item.id, updatedItem);
      await loadPortfolio();
      setFinanceRefreshKey(prev => prev + 1);
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar el estado en el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id) => {
    Alert.alert(
      "Confirmar Eliminación",
      "¿Estás seguro de que deseas eliminar este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const item = portfolio.find(i => i.id === id || i._id === id);
            if (!item) return;

            try {
              setLoading(true);
              // Optimistic delete
              const updated = portfolio.filter(item => item.id !== id && item._id !== id);
              setPortfolio(updated);
              await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated));

              await financeService.deleteTransaction(item._id || item.id);
              setFinanceRefreshKey(prev => prev + 1);
              Alert.alert("Éxito", "Registro eliminado");
            } catch (e) {
              Alert.alert("Error", "No se pudo eliminar el registro en el servidor. Refrescando...");
              loadPortfolio();
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleSaveTransaction = async (transaction) => {
    try {
      setLoading(true);
      const tempId = Date.now().toString();
      const itemWithTempId = { ...transaction, id: tempId };

      // Optimistic update
      const updated = [...portfolio, itemWithTempId];
      setPortfolio(updated);
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(updated));

      setShowAddFinance(false);
      const saved = await financeService.addTransaction(transaction);

      // Update with server ID
      const synced = updated.map(item => item.id === tempId ? { ...item, ...saved, id: saved._id, _id: saved._id } : item);
      setPortfolio(synced);
      await AsyncStorage.setItem(PORTFOLIO_KEY, JSON.stringify(synced));

      setFinanceRefreshKey(prev => prev + 1);
      Alert.alert("Éxito", "Transacción guardada correctamente.");
    } catch (error) {
      Alert.alert("Error de Sincronización", "La transacción se guardará solo localmente por ahora.");
      // Portfolio already has the temp item
    } finally {
      setLoading(false);
    }
  };

  const getTotals = () => {
    const bcvRate = rates?.bdv?.usd?.rate || 1;
    let payUSD = 0, payVES = 0, collectUSD = 0, collectVES = 0;

    portfolio.forEach(item => {
      if (item.completed) return;

      const paid = (item.payments || []).reduce((sum, p) => sum + p.amount, 0);
      const remaining = Math.max(0, item.amount - paid);

      if (item.type === 'pay') {
        if (item.currency === 'USD') payUSD += remaining;
        else payVES += remaining;
      } else {
        if (item.currency === 'USD') collectUSD += remaining;
        else collectVES += remaining;
      }
    });

    const totalPayUSD = payUSD + (payVES / bcvRate);
    const totalPayVES = (payUSD * bcvRate) + payVES;
    const totalCollectUSD = collectUSD + (collectVES / bcvRate);
    const totalCollectVES = (collectUSD * bcvRate) + collectVES;

    return { totalPayUSD, totalPayVES, totalCollectUSD, totalCollectVES };
  };

  const getDaysDiff = (dateStr) => {
    const target = new Date(dateStr);
    const now = new Date();
    // Reset hours for pure day calc
    target.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = target.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const RATES_CACHE_KEY = 'rates_cache_v2'; // Cambiamos a v2 para invalidar caché previo
  const CACHE_TTL = 60 * 60 * 1000; // 1 Hora

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

            // Actualizar textos con datos de cache
            if (cachedRates.bdv) {
              if (cachedRates.bdv.last_updated) {
                const d = new Date(cachedRates.bdv.last_updated);
                setLastUpdated(d.toLocaleString('es-VE', { hour: 'numeric', minute: 'numeric', hour12: true }));
              }
              // USAR FECHA VALOR OFICIAL SI EXISTE
              if (cachedRates.bdv.value_date) {
                setValueDate(cachedRates.bdv.value_date); // Solo actualizamos valueDate
              }
            }

            setLoading(false);
            return; // Usamos caché y terminamos
          }
        }
      }

      // 2. Si no hay caché o expiró (o forzamos), buscar del servidor
      const response = await axios.get(API_URL, { timeout: 5000 }); // 5 segundos max
      const newRates = response.data.rates;

      setRates(newRates);

      if (response.data.timestamp) {
        const d = new Date(response.data.timestamp);
        setLastUpdated(d.toLocaleString('es-VE', { hour: 'numeric', minute: 'numeric', hour12: true }));
      }

      // USAR FECHA VALOR OFICIAL SI EXISTE (Desde red)
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
      // Fallback: Si falla la red, intentar usar caché viejo si existe
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
      console.log('Fetching history from:', url);
      const response = await axios.get(url);
      console.log('History fetched items:', response.data.length);
      setHistory(response.data);
    } catch (e) {
      console.log('Error fetching history:', e.message);
    }
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRates(true);
    await fetchHistory(); // Refresh history too
    setRefreshing(false);
  };

  const toggleCalc = (id) => {
    Vibration.vibrate(50);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCalc(activeCalc === id ? null : id);
  };

  // handleCalcInput and handlePreset moved to Calculator component

  const handleShare = async (id) => {
    try {
      const viewRef = cardRefs.current[id];
      if (!viewRef) return;

      const uri = await captureRef(viewRef, {
        format: 'png',
        quality: 1,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Error', 'No compatible');
        return;
      }
      await Sharing.shareAsync(uri);
    } catch (e) {
      Alert.alert('Error', 'Falló al compartir');
    }
  };

  // renderCard logic moved to RateCard component

  // RENDER INTRO SCREEN
  useEffect(() => {
    fetchRates();
    checkCookies();
    fetchHistory();
    updateDate();
  }, []);

  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeColors.bg }]} edges={['top']}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <View style={[styles.centerHeader, {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: scale(15),
        paddingTop: Platform.OS === 'ios' ? verticalScale(40) : verticalScale(50),
        paddingBottom: verticalScale(10),
        backgroundColor: activeColors.cardCtx,
        borderBottomWidth: 1,
        borderBottomColor: activeColors.border,
        borderBottomLeftRadius: 15,
        borderBottomRightRadius: 15,
        shadowColor: activeColors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
        zIndex: 10,
      }]}>
        <Image
          source={require('./assets/icon.png')}
          style={{ width: scale(30), height: scale(30), borderRadius: 8 }}
        />

        <View style={{ flex: 1, marginLeft: scale(10) }}>
          <Text style={[styles.appTitle, { color: activeColors.textDark, fontSize: moderateScale(14), letterSpacing: -0.5, fontWeight: '900' }]}>La Tasa <Text style={{ color: 'red' }}>PRUEBA</Text></Text>
          <Text style={[styles.appDate, { color: activeColors.secondary, fontSize: scale(8), opacity: 0.8 }]}>{date}</Text>
        </View>

        <TouchableOpacity
          onPress={() => {
            Vibration.vibrate(50);
            setMenuVisible(true);
          }}
          style={{
            backgroundColor: activeColors.bg,
            padding: scale(6),
            borderRadius: 10,
            borderWidth: 1,
            borderColor: activeColors.border
          }}
        >
          <Ionicons name="options-outline" size={scale(18)} color={activeColors.textDark} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.primary]} // Android
            tintColor={theme.primary} // iOS
          />
        }
      >
        {loading && !rates ? (
          <ActivityIndicator size="large" color={theme.primary} />
        ) : activeModule === 'rates' ? (
          <>
            {rates && rates.bdv && (
              <>
                <RateCard
                  id="bdv-usd"
                  title="USD"
                  subtitle="Tasa Oficial"
                  rateValue={rates.bdv.usd.rate}
                  isActive={activeCalc === 'bdv-usd'}
                  onToggle={toggleCalc}
                  onShare={handleShare}
                  theme={theme}
                  activeColors={activeColors}
                  ref={(el) => (cardRefs.current['bdv-usd'] = el)}
                />
                <RateCard
                  id="bdv-eur"
                  title="EUR"
                  subtitle="Tasa Oficial"
                  rateValue={rates.bdv.eur.rate}
                  isActive={activeCalc === 'bdv-eur'}
                  onToggle={toggleCalc}
                  onShare={handleShare}
                  theme={theme}
                  activeColors={activeColors}
                  ref={(el) => (cardRefs.current['bdv-eur'] = el)}
                  delay={500}
                />

                {valueDate ? (
                  <View style={{ alignItems: 'center', marginBottom: scale(15), marginTop: scale(-5) }}>
                    <Text style={{
                      color: activeColors.secondary,
                      fontSize: scale(12),
                      fontWeight: '600',
                      backgroundColor: activeColors.cardCtx,
                      paddingVertical: 4,
                      paddingHorizontal: 12,
                      borderRadius: 10,
                      overflow: 'hidden'
                    }}>
                      Fecha Valor: {valueDate}
                    </Text>
                  </View>
                ) : null}
              </>
            )}

            {/* CHART RESTORED - HISTORY (Closing 7 PM) */}
            {/* CHART RESTORED - HISTORY (Closing 7 PM) */}
            {/* CHART RESTORED - HISTORY (Closing 7 PM) */}
            <Portfolio portfolio={portfolio} theme={theme} activeColors={activeColors} rates={rates} history={history} />

            {/* Wortise Banners placeholder or logic here if ID provided */}
            {/* 
            {!isPremium && (
              <View style={{ alignItems: 'center', marginVertical: scale(20) }}>
                <BannerAd
                  unitId={bannerUnitId}
                  size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
                  requestOptions={{
                    requestNonPersonalizedAdsOnly: false,
                  }}
                />
              </View>
            )}
            */}

            <View style={{ alignItems: 'center', marginTop: scale(10), marginBottom: scale(30) }}>
              <TouchableOpacity onPress={() => setShowPrivacy(true)}>
                <Text style={{ fontSize: scale(11), fontWeight: 'bold', textDecorationLine: 'underline', color: theme.primary }}>
                  Aviso Legal y Privacidad
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : !user ? (
          <AuthScreen
            onAuthSuccess={handleAuthSuccess}
            theme={theme}
            activeColors={activeColors}
            valueDate={valueDate}
            date={date}
            lastUpdated={lastUpdated}
            onShowPrivacy={() => setShowPrivacy(true)}
            onUnlockRegister={(callback) => {
              callback();
            }}
          />
        ) : (
          <FinancialDashboard
            user={user}
            theme={theme}
            activeColors={activeColors}
            isPremium={isPremium}
            premiumType={premiumType}
            refreshKey={financeRefreshKey}
            onAddPress={() => setShowAddFinance(true)}
            onOpenPremium={() => setShowPremiumModal(true)}
            portfolio={portfolio}
            setNewTrans={setNewTrans}
            setIsDebtPayment={setIsDebtPayment}
            setSelectedDebtId={setSelectedDebtId}
            addPartialPayment={addPartialPayment}
          />
        )}

        <View style={{ height: verticalScale(40) }} />
      </ScrollView >



      {/* Cookie Banner */}
      {
        showCookies && (
          <View style={styles.cookieBanner}>
            <Text style={styles.cookieText}>
              Usamos cookies para mejorar tu experiencia.
            </Text>
            <TouchableOpacity style={styles.cookieBtn} onPress={acceptCookies}>
              <Text style={styles.cookieBtnText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        )
      }

      {/* PRIVACY MODAL */}
      <Modal visible={showPrivacy} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Aviso Legal</Text>
              <TouchableOpacity onPress={() => setShowPrivacy(false)}>
                <Ionicons name="close-circle" size={28} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalBold}>1. Naturaleza Informativa y Acceso Gratis</Text>
              <Text style={styles.modalP}>
                Esta aplicación tiene como único propósito facilitar cálculos referenciales basados en las tasas de cambio públicas.
                Los datos mostrados (Tasa BCV) son obtenidos del Banco Central de Venezuela (bcv.org.ve).
                <Text style={{ fontWeight: 'bold' }}> El acceso a la consulta de tasas y gráficas referenciales es totalmente gratuito.</Text>
              </Text>

              <Text style={styles.modalBold}>2. Mejoras Premium y Desarrolladores</Text>
              <Text style={styles.modalP}>
                Las compras dentro de la aplicación corresponden exclusivamente a "Mejoras Premium" de herramientas financieras y gestión personal.
                Estos pagos NO están vinculados a la venta de información oficial del BCV.
                Los fondos recaudados son destinados a los desarrolladores como compensación por el trabajo de creación y mantenimiento de las herramientas de finanzas.
              </Text>

              <Text style={styles.modalBold}>3. Exención de Responsabilidad</Text>
              <Text style={styles.modalP}>
                Esta aplicación NO es una entidad financiera ni representa al BCV.
                <Text style={{ fontWeight: 'bold' }}>NO vendemos divisas, criptoactivos ni ningún activo financiero.</Text>
                Los desarrolladores no se hacen responsables por decisiones tomadas con base en la información mostrada.
              </Text>

              <Text style={styles.modalBold}>4. Privacidad Total</Text>
              <Text style={styles.modalP}>
                Respetamos su privacidad al 100%. <Text style={{ fontWeight: 'bold' }}>Esta aplicación NO recopila, almacena ni transmite datos personales de los usuarios.</Text>
                Los únicos datos guardados son preferencias locales en su dispositivo (cookies técnicas) para su comodidad.
              </Text>
            </ScrollView>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.primary }]} onPress={acceptPrivacy}>
              <Text style={styles.modalBtnText}>He leído y Acepto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>




      {/* CONFIGURATION MENU MODAL - COMPACT REDESIGN */}
      <Modal visible={menuVisible} animationType="slide" transparent>
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.modalContent, {
            backgroundColor: activeColors.cardCtx,
            width: '100%',
            height: 'auto',
            maxHeight: '80%',
            position: 'absolute',
            bottom: 0,
            borderTopLeftRadius: scale(30),
            borderTopRightRadius: scale(30),
            paddingTop: scale(20),
            paddingHorizontal: scale(20),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -5 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 25
          }]}>

            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(20) }}>
              <Text style={{ fontSize: moderateScale(20), fontWeight: '900', color: activeColors.textDark }}>Ajustes</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)} style={{ padding: scale(5) }}>
                <Ionicons name="close" size={scale(24)} color={activeColors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: verticalScale(40) }}>



              {/* SETTINGS LIST (Compact) */}
              <View style={{ backgroundColor: activeColors.bg, borderRadius: 16, overflow: 'hidden', paddingVertical: scale(5) }}>

                {/* Dark Mode */}
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                  <Ionicons name="moon" size={18} color={activeColors.textDark} style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '600', color: activeColors.textDark }}>Modo Oscuro</Text>
                  <Switch
                    value={darkMode}
                    onValueChange={toggleDarkMode}
                    trackColor={{ false: '#CBD5E1', true: theme.primary }}
                    thumbColor="white"
                    size="small"
                  />
                </View>

                {/* THEME SELECTOR - PREMIUM ONLY */}
                {isPremium && (
                  <View style={{ padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <Ionicons name="color-palette" size={18} color={theme.primary} style={{ marginRight: 12 }} />
                      <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '600', color: activeColors.textDark }}>Tema de la App</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                      {Object.values(THEMES).map((t) => (
                        <TouchableOpacity
                          key={t.key}
                          onPress={() => changeTheme(t.key)}
                          style={{
                            width: scale(30),
                            height: scale(30),
                            borderRadius: scale(15),
                            backgroundColor: t.primary,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: activeThemeKey === t.key ? 2 : 0,
                            borderColor: activeColors.textDark,
                            elevation: 2
                          }}
                        >
                          {activeThemeKey === t.key && <Ionicons name="checkmark" size={16} color="white" />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Premium Button */}
                <TouchableOpacity
                  onPress={() => { setShowPremiumModal(true); setMenuVisible(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}
                >
                  <Ionicons name="star" size={18} color="#F59E0B" style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '600', color: activeColors.textDark }}>
                    {isPremium ? 'Mi Membresía' : 'Obtener Acceso Premium'}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color={activeColors.secondary} />
                </TouchableOpacity>

                {/* Modules Section */}
                <TouchableOpacity
                  onPress={() => { setActiveModule('rates'); setMenuVisible(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                  <Ionicons name="stats-chart-outline" size={18} color={activeColors.textDark} style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '600', color: activeColors.textDark }}>Tasas y Calculadora</Text>
                  {activeModule === 'rates' && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => { setActiveModule('finance'); setMenuVisible(false); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12), borderBottomWidth: 1, borderBottomColor: activeColors.border }}>
                  <Ionicons name="wallet-outline" size={18} color={activeColors.textDark} style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '600', color: activeColors.textDark }}>Gestión Financiera</Text>
                  {activeModule === 'finance' && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                </TouchableOpacity>


                {/* Logout Button */}
                <TouchableOpacity
                  onPress={() => { handleLogout(); }}
                  style={{ flexDirection: 'row', alignItems: 'center', padding: scale(12) }}
                >
                  <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 12 }} />
                  <Text style={{ flex: 1, fontSize: scale(13), fontWeight: '600', color: "#EF4444" }}>Cerrar Sesión</Text>
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: 'center', marginTop: scale(20) }}>
                <Text style={{ fontSize: scale(10), color: activeColors.secondary, fontWeight: '700' }}>v1.0.0 • BETA</Text>
              </View>

            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PORTFOLIO MODAL - PROFESSIONAL REDESIGN */}
      <Modal visible={showPortfolio} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.container, { backgroundColor: activeColors.bg }]}>
          {Platform.OS === 'android' && <View style={{ height: 20 }} />}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: scale(20), paddingHorizontal: scale(25) }}>
            <View>
              <Text style={{ fontSize: moderateScale(28), fontWeight: '900', color: activeColors.textDark, letterSpacing: -1 }}>Mis Finanzas</Text>
              <View style={{ width: scale(40), height: 4, backgroundColor: theme.primary, borderRadius: 2, marginTop: 4 }} />
            </View>
            <TouchableOpacity
              onPress={() => setShowPortfolio(false)}
              style={{ backgroundColor: activeColors.cardCtx, padding: scale(8), borderRadius: scale(15), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 }}
            >
              <Ionicons name="close" size={scale(24)} color={activeColors.textDark} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: scale(20), paddingBottom: scale(40) }}>
            {/* QUICK PAY SECTION (PENDIENTES DE PAGO) - MOVED TO TOP */}
            {portfolio.filter(i => i.type === 'pay' && !i.completed).length > 0 && (
              <View style={{ marginBottom: scale(20), marginTop: scale(10) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: scale(12) }}>
                  <Text style={{ color: activeColors.textDark, fontWeight: '900', fontSize: scale(13), letterSpacing: 0.5 }}>DEUDAS PENDIENTES</Text>
                  <TouchableOpacity
                    onPress={() => Vibration.vibrate(10)}
                    style={{ backgroundColor: '#EF4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ color: 'white', fontSize: 10, fontWeight: '900' }}>{portfolio.filter(i => i.type === 'pay' && !i.completed).length} POR PAGAR</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {portfolio.filter(i => i.type === 'pay' && !i.completed).map(debt => {
                    const paid = (debt.payments || []).reduce((s, p) => s + p.amount, 0);
                    const remaining = Math.max(0, debt.amount - paid);
                    return (
                      <TouchableOpacity
                        key={debt.id}
                        onPress={() => {
                          setNewTrans({
                            ...newTrans,
                            type: 'pay',
                            amount: remaining.toString(),
                            title: '',
                            currency: debt.currency
                          });
                          setIsDebtPayment(true);
                          setSelectedDebtId(debt.id);
                          Vibration.vibrate(20);
                        }}
                        style={{
                          backgroundColor: activeColors.cardCtx,
                          padding: scale(15),
                          borderRadius: scale(20),
                          marginRight: scale(12),
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
                        <Text numberOfLines={1} style={{ color: activeColors.textDark, fontWeight: '800', fontSize: scale(12), marginBottom: 4 }}>{debt.title}</Text>
                        <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: scale(15), marginBottom: 10 }}>
                          ${formatNumber(remaining)}
                        </Text>
                        <View style={{ backgroundColor: theme.primarySoft, paddingVertical: scale(5), borderRadius: scale(8), alignItems: 'center' }}>
                          <Text style={{ color: theme.primary, fontWeight: '900', fontSize: scale(9) }}>PAGAR</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* DASHBOARD TOTALS */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: scale(25) }}>
              <View style={[styles.cardContainer, { flex: 1, backgroundColor: activeColors.cardCtx, marginRight: scale(8), padding: scale(15), flexDirection: 'column', alignItems: 'flex-start', borderLeftWidth: 4, borderLeftColor: '#EF4444' }]}>
                <Text style={{ color: activeColors.secondary, fontSize: scale(9), fontWeight: '800', letterSpacing: 0.5, marginBottom: scale(5) }}>DE DEUDA</Text>
                <Text style={{ fontSize: moderateScale(20), fontWeight: '900', color: '#EF4444' }}>
                  {formatNumber(getTotals().totalPayUSD)} $
                </Text>
              </View>
              <View style={[styles.cardContainer, { flex: 1, backgroundColor: activeColors.cardCtx, marginLeft: scale(8), padding: scale(15), flexDirection: 'column', alignItems: 'flex-start', borderLeftWidth: 4, borderLeftColor: '#10B981' }]}>
                <Text style={{ color: activeColors.secondary, fontSize: scale(9), fontWeight: '800', letterSpacing: 0.5, marginBottom: scale(5) }}>POR COBRAR</Text>
                <Text style={{ fontSize: moderateScale(20), fontWeight: '900', color: '#10B981' }}>
                  {formatNumber(getTotals().totalCollectUSD)} $
                </Text>
              </View>
            </View>

            {/* MONTHLY CHART (ONLY IF DATA EXISTS) */}
            {portfolio.length > 0 && (
              <View style={{ marginBottom: scale(25) }}>
                <Portfolio
                  portfolio={portfolio}
                  theme={theme}
                  activeColors={activeColors}
                  rates={rates}
                  history={history}
                />
              </View>
            )}

            {/* ADD NEW FORM - PROFESSIONAL BOX */}
            <View style={{ backgroundColor: activeColors.cardCtx, padding: scale(24), borderRadius: scale(30), marginBottom: scale(30), shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 5, borderWidth: 1, borderColor: activeColors.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(20) }}>
                <View style={{ backgroundColor: theme.primarySoft, padding: scale(8), borderRadius: scale(12), marginRight: scale(12) }}>
                  <Ionicons name="add-circle" size={scale(20)} color={theme.primary} />
                </View>
                <Text style={{ color: activeColors.textDark, fontWeight: '900', fontSize: moderateScale(18) }}>Nuevo Registro</Text>
              </View>

              <View style={{ flexDirection: 'row', backgroundColor: activeColors.bg, borderRadius: scale(15), padding: 4, marginBottom: scale(20) }}>
                <TouchableOpacity
                  onPress={() => setNewTrans({ ...newTrans, type: 'pay' })}
                  style={{ flex: 1, paddingVertical: scale(12), backgroundColor: newTrans.type === 'pay' ? '#EF4444' : 'transparent', alignItems: 'center', borderRadius: scale(12) }}>
                  <Text style={{ color: newTrans.type === 'pay' ? 'white' : activeColors.secondary, fontWeight: '800', fontSize: scale(13) }}>DEBO</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setNewTrans({ ...newTrans, type: 'collect' })}
                  style={{ flex: 1, paddingVertical: scale(12), backgroundColor: newTrans.type === 'collect' ? '#10B981' : 'transparent', alignItems: 'center', borderRadius: scale(12) }}>
                  <Text style={{ color: newTrans.type === 'collect' ? 'white' : activeColors.secondary, fontWeight: '800', fontSize: scale(13) }}>ME DEBEN</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: scale(20), justifyContent: 'space-between' }}>
                <Text style={{ color: activeColors.secondary, fontWeight: '800', fontSize: scale(12), letterSpacing: 0.5 }}>MONEDA:</Text>
                <View style={{ flexDirection: 'row', backgroundColor: activeColors.bg, borderRadius: scale(12), padding: 4 }}>
                  <TouchableOpacity
                    onPress={() => setNewTrans({ ...newTrans, currency: 'USD' })}
                    style={{ paddingHorizontal: scale(18), paddingVertical: scale(8), backgroundColor: newTrans.currency === 'USD' ? theme.primary : 'transparent', borderRadius: scale(10) }}
                  >
                    <Text style={{ color: newTrans.currency === 'USD' ? 'white' : activeColors.secondary, fontWeight: '800', fontSize: scale(12) }}>USD ($)</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setNewTrans({ ...newTrans, currency: 'VES' })}
                    style={{ paddingHorizontal: scale(18), paddingVertical: scale(8), backgroundColor: newTrans.currency === 'VES' ? theme.primary : 'transparent', borderRadius: scale(10) }}
                  >
                    <Text style={{ color: newTrans.currency === 'VES' ? 'white' : activeColors.secondary, fontWeight: '800', fontSize: scale(12) }}>VES (Bs)</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* NEW: Debt Payment Toggle */}
              {newTrans.type === 'pay' && (
                <View style={{ marginBottom: scale(20) }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ color: activeColors.textDark, fontWeight: '700', fontSize: scale(13) }}>¿Es un Abono a Deuda?</Text>
                    <Switch
                      value={isDebtPayment}
                      onValueChange={(val) => {
                        setIsDebtPayment(val);
                        if (!val) setSelectedDebtId(null);
                      }}
                      trackColor={{ false: '#CBD5E1', true: theme.primary }}
                      thumbColor="white"
                    />
                  </View>

                  {isDebtPayment && (
                    <View>
                      <Text style={{ color: activeColors.secondary, fontSize: scale(11), marginBottom: 8 }}>Selecciona la deuda a pagar:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {portfolio.filter(i => i.type === 'pay' && !i.completed).map(debt => (
                          <TouchableOpacity
                            key={debt.id}
                            onPress={() => setSelectedDebtId(debt.id)}
                            style={{
                              backgroundColor: selectedDebtId === debt.id ? theme.primary : activeColors.bg,
                              padding: scale(10),
                              borderRadius: scale(12),
                              marginRight: scale(10),
                              borderWidth: 1,
                              borderColor: selectedDebtId === debt.id ? theme.primary : activeColors.border
                            }}
                          >
                            <Text style={{ color: selectedDebtId === debt.id ? 'white' : activeColors.textDark, fontWeight: '700', fontSize: scale(12) }}>{debt.title}</Text>
                            <Text style={{ color: selectedDebtId === debt.id ? 'rgba(255,255,255,0.8)' : activeColors.secondary, fontSize: scale(10) }}>
                              Restan: {formatNumber(Math.max(0, debt.amount - (debt.payments || []).reduce((s, p) => s + p.amount, 0)))}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {portfolio.filter(i => i.type === 'pay' && !i.completed).length === 0 && (
                          <Text style={{ color: activeColors.secondary, fontStyle: 'italic', fontSize: scale(12) }}>No tienes deudas pendientes.</Text>
                        )}
                      </ScrollView>
                    </View>
                  )}
                </View>
              )}

              {/* Title Field - Only showed if NOT a debt payment */}
              {!isDebtPayment && (
                <TextInput
                  placeholder="Título de la transacción..."
                  placeholderTextColor={activeColors.secondary}
                  style={{ backgroundColor: activeColors.bg, color: activeColors.textDark, padding: scale(16), borderRadius: scale(15), marginBottom: scale(15), fontWeight: '700', fontSize: scale(15), borderWidth: 1, borderColor: activeColors.border }}
                  value={newTrans.title}
                  onChangeText={t => setNewTrans({ ...newTrans, title: t })}
                />
              )}

              <View style={{ flexDirection: 'row', marginBottom: scale(20) }}>
                <View style={{ flex: 1.5, marginRight: scale(10) }}>
                  <TextInput
                    placeholder="Monto"
                    keyboardType="numeric"
                    placeholderTextColor={activeColors.secondary}
                    style={{ backgroundColor: activeColors.bg, color: activeColors.textDark, padding: scale(16), borderRadius: scale(15), fontWeight: '900', fontSize: moderateScale(20), borderWidth: 1, borderColor: activeColors.border }}
                    value={newTrans.amount}
                    onChangeText={t => setNewTrans({ ...newTrans, amount: t })}
                  />
                </View>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(true)}
                  style={{ flex: 1, backgroundColor: activeColors.bg, borderRadius: scale(15), justifyContent: 'center', alignItems: 'center', paddingHorizontal: scale(10), borderHorizontal: 1, borderColor: activeColors.border, borderWidth: 1 }}>
                  <Ionicons name="calendar-outline" size={scale(20)} color={theme.primary} style={{ marginBottom: 2 }} />
                  <Text style={{ color: activeColors.textDark, fontWeight: '800', fontSize: scale(12) }}>
                    {new Date(newTrans.date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Vibration.vibrate(50);
                  addTransaction();
                }}
                style={{ backgroundColor: theme.primary, padding: scale(18), borderRadius: scale(18), alignItems: 'center', shadowColor: theme.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 }}
              >
                <Text style={{ color: 'white', fontWeight: '900', fontSize: moderateScale(16), letterSpacing: 0.5 }}>GUARDAR TRANSACCIÓN</Text>
              </TouchableOpacity>
            </View>

            <Text style={{ color: activeColors.secondary, marginBottom: 15, fontWeight: '800', textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 }}>Historial de Movimientos</Text>

            {portfolio.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 40, backgroundColor: activeColors.cardCtx, borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: activeColors.border }}>
                <Ionicons name="receipt-outline" size={40} color={activeColors.secondary} style={{ marginBottom: 10, opacity: 0.5 }} />
                <Text style={{ color: activeColors.secondary, textAlign: 'center', fontWeight: '600' }}>No hay movimientos registrados</Text>
              </View>
            ) : (
              portfolio.map(item => {
                const isPay = item.type === 'pay';
                const isCompleted = item.completed;
                const paidAmount = (item.payments || []).reduce((s, p) => s + p.amount, 0);
                const remaining = Math.max(0, item.amount - paidAmount);

                return (
                  <View key={item.id} style={{ marginBottom: scale(15), opacity: isCompleted ? 0.7 : 1 }}>
                    <View style={[styles.cardContainer, {
                      padding: scale(18),
                      alignItems: 'center',
                      backgroundColor: activeColors.cardCtx,
                      marginBottom: 0,
                      borderWidth: isCompleted ? 1 : 1,
                      borderColor: isCompleted ? '#10B981' : activeColors.border,
                      borderLeftWidth: 6,
                      borderLeftColor: isCompleted ? '#10B981' : (isPay ? '#EF4444' : '#10B981')
                    }]}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: activeColors.textDark, fontWeight: '800', fontSize: scale(16), textDecorationLine: isCompleted ? 'line-through' : 'none' }}>{item.title}</Text>
                          {isCompleted && <Ionicons name="checkmark-circle" size={scale(16)} color="#10B981" style={{ marginLeft: 6 }} />}
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons name="calendar-outline" size={scale(12)} color={activeColors.secondary} style={{ marginRight: 4 }} />
                          <Text style={{ color: activeColors.secondary, fontSize: scale(12), fontWeight: '600' }}>{new Date(item.date).toLocaleDateString('es-VE', { day: 'numeric', month: 'short' })}</Text>
                        </View>

                        {!isCompleted && (
                          <TouchableOpacity
                            onPress={() => setActiveTransId(activeTransId === item.id ? null : item.id)}
                            style={{ flexDirection: 'row', alignItems: 'center', marginTop: scale(12), backgroundColor: theme.primarySoft, paddingHorizontal: scale(8), paddingVertical: scale(4), borderRadius: scale(8), alignSelf: 'flex-start' }}>
                            <Ionicons name="cash-outline" size={scale(12)} color={theme.primary} style={{ marginRight: 4 }} />
                            <Text style={{ color: theme.primary, fontWeight: '800', fontSize: scale(10) }}>DETALLES / ABONOS</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: isCompleted ? '#10B981' : activeColors.textDark, fontWeight: '900', fontSize: moderateScale(18) }}>
                          {isCompleted ? 'PAGADO' : `${item.currency === 'USD' ? '$ ' : ''}${formatNumber(remaining)}${item.currency === 'VES' ? ' Bs' : ''}`}
                        </Text>
                        {!isCompleted && paidAmount > 0 && (
                          <Text style={{ fontSize: scale(10), color: activeColors.secondary, fontWeight: '700', marginTop: 2 }}>
                            Abonado: {item.currency === 'USD' ? '$' : 'Bs'}{formatNumber(paidAmount)}
                          </Text>
                        )}

                        <View style={{ flexDirection: 'row', marginTop: scale(10) }}>
                          {!isCompleted && (
                            <TouchableOpacity
                              onPress={() => toggleTransactionCompletion(item.id)}
                              style={{ backgroundColor: activeColors.bg, padding: scale(8), borderRadius: scale(10), marginRight: scale(8), borderWidth: 1, borderColor: '#DCFCE7' }}
                            >
                              <Ionicons name="checkmark" size={scale(18)} color="#10B981" />
                            </TouchableOpacity>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              Vibration.vibrate(50);
                              deleteTransaction(item.id);
                            }}
                            style={{ backgroundColor: activeColors.bg, padding: scale(8), borderRadius: scale(10), borderWidth: 1, borderColor: '#FEE2E2' }}
                          >
                            <Ionicons name="trash-outline" size={scale(18)} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    {/* ABONOS EXPANDABLE SECTION */}
                    {activeTransId === item.id && !isCompleted && (
                      <View style={{ backgroundColor: activeColors.cardCtx, borderTopWidth: 1, borderTopColor: activeColors.border, padding: 15, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 }}>
                        <Text style={{ color: activeColors.textDark, fontWeight: '800', fontSize: 14, marginBottom: 10 }}>REGISTRAR ABONO</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 15 }}>
                          <TextInput
                            placeholder="Monto"
                            placeholderTextColor={activeColors.secondary}
                            keyboardType="numeric"
                            style={{ flex: 1, backgroundColor: activeColors.bg, color: activeColors.textDark, padding: 12, borderRadius: 10, marginRight: 10, fontWeight: '700' }}
                            value={abonoAmount}
                            onChangeText={setAbonoAmount}
                          />
                          <TouchableOpacity
                            onPress={() => {
                              if (!abonoAmount) return;
                              addPartialPayment(item.id, abonoAmount, new Date());
                              setAbonoAmount('');
                            }}
                            style={{ backgroundColor: theme.primary, paddingHorizontal: 20, borderRadius: 10, justifyContent: 'center' }}>
                            <Text style={{ color: 'white', fontWeight: '900' }}>OK</Text>
                          </TouchableOpacity>
                        </View>

                        {(item.payments || []).length > 0 && (
                          <View>
                            <Text style={{ color: activeColors.secondary, fontWeight: '700', fontSize: 11, marginBottom: 8 }}>HISTORIAL DE ABONOS</Text>
                            {item.payments.map(p => (
                              <View key={p.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: activeColors.border }}>
                                <Text style={{ color: activeColors.textDark, fontWeight: '600', fontSize: 13 }}>{new Date(p.date).toLocaleDateString()}</Text>
                                <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 13 }}>- {item.currency === 'USD' ? '$' : ''}{formatNumber(p.amount)}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal >

      {/* CALENDAR DATE PICKER MODAL */}
      < CalendarModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)
        }
        selectedDate={newTrans.date}
        onSelect={(date) => {
          setNewTrans({ ...newTrans, date });
          setShowDatePicker(false);
        }}
        theme={theme}
        activeColors={activeColors}
      />

      {/* OTA UPDATE PROGRESS MODAL */}
      <Modal visible={showUpdateModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 25 }}>
          <View style={{ backgroundColor: activeColors.cardCtx, borderRadius: 25, padding: 30, width: '100%', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15 }}>

            <View style={{ backgroundColor: theme.primary + '15', padding: 20, borderRadius: 50, marginBottom: 20 }}>
              <MaterialCommunityIcons
                name={isUpdatePending ? "check-decagram" : "cloud-download"}
                size={60}
                color={theme.primary}
              />
            </View>

            <Text style={{ fontSize: 22, fontWeight: '900', color: activeColors.textDark, textAlign: 'center', marginBottom: 10 }}>
              {isUpdatePending ? "¡Nueva Versión Lista!" : "Actualización Disponible"}
            </Text>

            <Text style={{ fontSize: 15, color: activeColors.secondary, textAlign: 'center', marginBottom: 30, lineHeight: 22 }}>
              {isUpdatePending
                ? "La descarga ha finalizado correctamente. Reinicia la app para aplicar los cambios."
                : "Estamos descargando las últimas mejoras para brindarte una mejor experiencia."}
            </Text>

            {!isUpdatePending && (
              <View style={{ width: '100%', marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Descargando...</Text>
                  <Text style={{ color: activeColors.secondary }}>{Math.round((downloadProgress || 0) * 100)}%</Text>
                </View>
                <View style={{ height: 10, width: '100%', backgroundColor: activeColors.border, borderRadius: 5, overflow: 'hidden' }}>
                  <Animated.View style={{
                    height: '100%',
                    backgroundColor: theme.primary,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    })
                  }} />
                </View>
              </View>
            )}

            {isUpdatePending && (
              <TouchableOpacity
                onPress={() => Updates.reloadAsync()}
                style={{
                  backgroundColor: theme.primary,
                  paddingVertical: 18,
                  paddingHorizontal: 30,
                  borderRadius: 15,
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  justifyContent: 'center',
                  shadowColor: theme.primary,
                  shadowOffset: { width: 0, height: 5 },
                  shadowOpacity: 0.4,
                  shadowRadius: 10,
                  elevation: 5
                }}
              >
                <Ionicons name="refresh-circle" size={26} color="white" style={{ marginRight: 10 }} />
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 18 }}>Reiniciar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>



      <AddTransactionModal
        visible={showAddFinance}
        onClose={() => setShowAddFinance(false)}
        onSave={handleSaveTransaction}
        activeColors={activeColors}
        theme={theme}
      />

      {/* PREMIUM MODAL */}
      <Modal visible={showPremiumModal} animationType="slide" transparent={true}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: activeColors.bg, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: scale(25), minHeight: '60%' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(20) }}>
              <Text style={{ fontSize: moderateScale(22), fontWeight: '900', color: activeColors.textDark }}>Acceso Premium</Text>
              <TouchableOpacity onPress={() => setShowPremiumModal(false)}>
                <Ionicons name="close-circle" size={scale(28)} color={activeColors.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ backgroundColor: theme.primarySoft, padding: scale(15), borderRadius: 15, marginBottom: scale(20), borderLeftWidth: 4, borderLeftColor: theme.primary }}>
                {premiumType === 'plus' ? (
                  <Text style={{ fontSize: scale(13), color: theme.primary, fontWeight: '700' }}>
                    ¡Eres Premium +! Disfrutas de acceso vitalicio ilimitado.
                  </Text>
                ) : isPremium ? (
                  <Text style={{ fontSize: scale(13), color: theme.primary, fontWeight: '700' }}>
                    Tienes acceso Premium activo. Puedes mejorar tu plan si lo deseas.
                  </Text>
                ) : (
                  <Text style={{ fontSize: scale(13), color: theme.primary, fontWeight: '700' }}>
                    Desbloquea la Gestión Financiera completa, gráficos avanzados y sin límites.
                  </Text>
                )}
              </View>

              {/* Opción 1: Premium Plus 365 días */}
              {!isPremium && (
                <TouchableOpacity
                  onPress={() => activatePremiumAction('buy')}
                  style={{ backgroundColor: activeColors.cardCtx, padding: scale(18), borderRadius: 15, marginBottom: scale(15), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: activeColors.border }}
                >
                  <View style={{ backgroundColor: '#F59E0B', padding: 10, borderRadius: 12, marginRight: 15 }}>
                    <Ionicons name="star" size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(15), fontWeight: '800', color: activeColors.textDark }}>Premium Plus 365 días</Text>
                    <Text style={{ fontSize: scale(11), color: activeColors.secondary }}>Acceso total por 1 año</Text>
                  </View>
                  <Text style={{ fontSize: scale(14), fontWeight: '900', color: theme.primary }}>$9.99</Text>
                </TouchableOpacity>
              )}

              {/* Opción 2: Premium Plata 30 Días */}
              {!isPremium && (
                <TouchableOpacity
                  onPress={() => activatePremiumAction('monthly')}
                  style={{ backgroundColor: activeColors.cardCtx, padding: scale(18), borderRadius: 15, marginBottom: scale(15), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: activeColors.border }}
                >
                  <View style={{ backgroundColor: '#3B82F6', padding: 10, borderRadius: 12, marginRight: 15 }}>
                    <Ionicons name="calendar" size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(15), fontWeight: '800', color: activeColors.textDark }}>Premium Plata 30 Dias</Text>
                    <Text style={{ fontSize: scale(11), color: activeColors.secondary }}>Suscripción por 30 días</Text>
                  </View>
                  <Text style={{ fontSize: scale(14), fontWeight: '900', color: theme.primary }}>$2.99</Text>
                </TouchableOpacity>
              )}

              {/* Opción 3: Premium Gratis 24 H */}
              {!isPremium && (
                <TouchableOpacity
                  onPress={() => grantPremiumAccess()}
                  style={{ backgroundColor: activeColors.cardCtx, padding: scale(18), borderRadius: 15, marginBottom: scale(15), flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: activeColors.border }}
                >
                  <View style={{ backgroundColor: '#10B981', padding: 10, borderRadius: 12, marginRight: 15 }}>
                    <Ionicons name="time" size={24} color="white" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: scale(15), fontWeight: '800', color: activeColors.textDark }}>Prueba Gratis 6 H</Text>
                    <Text style={{ fontSize: scale(11), color: activeColors.secondary }}>Activar acceso temporal</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={activeColors.secondary} />
                </TouchableOpacity>
              )}




              {/* Mensaje Informativo si ya es Premium */}
              {isPremium && (
                <View style={{ alignItems: 'center', marginTop: scale(20) }}>
                  <Ionicons name="checkmark-circle" size={scale(60)} color="#10B981" />
                  <Text style={{ fontSize: scale(16), fontWeight: '800', color: activeColors.textDark, marginTop: scale(10) }}>Suscripción Activa</Text>
                  <Text style={{ fontSize: scale(13), color: activeColors.secondary, textAlign: 'center', marginTop: scale(5) }}>
                    Gracias por confiar en nosotros. Tienes todas las funciones desbloqueadas.
                  </Text>
                  {user?.expiresAt && (
                    <Text style={{ fontSize: scale(11), color: theme.primary, marginTop: scale(15), fontWeight: '700' }}>
                      Expira: {new Date(user.expiresAt).toLocaleString()}
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => setShowPremiumModal(false)}
                    style={{ backgroundColor: theme.primary, paddingVertical: scale(12), paddingHorizontal: scale(40), borderRadius: scale(20), marginTop: scale(25) }}
                  >
                    <Text style={{ color: 'white', fontWeight: '800' }}>Cerrar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SESSION LOCKED MODAL */}
      <Modal visible={sessionLocked} animationType="fade" transparent={false}>
        <View style={{ flex: 1, backgroundColor: activeColors.bg, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: activeColors.cardCtx, padding: 30, borderRadius: 20, width: '100%', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 }}>
            <Ionicons name="time" size={80} color={theme.primary} style={{ marginBottom: 20 }} />
            <Text style={{ fontSize: 24, fontWeight: '900', color: activeColors.textDark, textAlign: 'center', marginBottom: 10 }}>Sesión Expirada</Text>
            <Text style={{ fontSize: 16, color: activeColors.secondary, textAlign: 'center', marginBottom: 30, lineHeight: 24 }}>
              Tus 6 horas de acceso gratuito han terminado. Para continuar usando la app sin perder tu progreso, por favor ve un video corto.
            </Text>

            <TouchableOpacity
              onPress={() => grantPremiumAccess()}
              style={{ backgroundColor: theme.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12, flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'center' }}
            >
              <Ionicons name="time" size={24} color="white" style={{ marginRight: 10 }} />
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>Extender 6 Horas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setSessionLocked(false);
                authService.logout().then(() => setUser(null));
              }}
              style={{ marginTop: 20 }}
            >
              <Text style={{ color: activeColors.secondary, fontWeight: '600' }}>Cerrar Sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </SafeAreaView >
  );
}
const CalendarModal = ({ visible, onClose, selectedDate, onSelect, theme, activeColors }) => {
  const [currentView, setCurrentView] = useState(new Date(selectedDate));

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const days = [];
  const totalDays = getDaysInMonth(currentView.getMonth(), currentView.getFullYear());
  const startDay = firstDayOfMonth(currentView.getMonth(), currentView.getFullYear());

  // Padding for start of month
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= totalDays; i++) days.push(i);

  const changeMonth = (offset) => {
    const next = new Date(currentView);
    next.setMonth(next.getMonth() + offset);
    setCurrentView(next);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={[styles.modalContent, { backgroundColor: activeColors.cardCtx, width: '90%', padding: 20 }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <TouchableOpacity onPress={() => changeMonth(-1)}>
              <Ionicons name="chevron-back" size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '800', color: activeColors.textDark }}>
              {currentView.toLocaleString('es-VE', { month: 'long', year: 'numeric' }).toUpperCase()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)}>
              <Ionicons name="chevron-forward" size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
              <Text key={i} style={{ width: '14.28%', textAlign: 'center', color: activeColors.secondary, fontWeight: '700', fontSize: 12, marginBottom: 10 }}>{d}</Text>
            ))}
            {days.map((day, i) => {
              const isSelected = day &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentView.getMonth() &&
                selectedDate.getFullYear() === currentView.getFullYear();

              return (
                <TouchableOpacity
                  key={i}
                  disabled={!day}
                  onPress={() => {
                    const selected = new Date(currentView);
                    selected.setDate(day);
                    onSelect(selected);
                  }}
                  style={{
                    width: '14.28%',
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: isSelected ? theme.primary : 'transparent',
                    borderRadius: 20,
                    marginBottom: 5
                  }}>
                  <Text style={{ color: isSelected ? 'white' : (day ? activeColors.textDark : 'transparent'), fontWeight: isSelected ? '900' : '600' }}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={onClose} style={{ marginTop: 15, padding: 12, alignItems: 'center' }}>
            <Text style={{ color: theme.primary, fontWeight: '800' }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};
// MonthlyHistoryChart moved to Portfolio component



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  centerHeader: {
    alignItems: 'center',
    marginBottom: verticalScale(25),
  },
  appTitle: {
    fontSize: 28,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    fontWeight: '800',
    color: COLORS.textDark,
    letterSpacing: -0.5,
  },
  appDate: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingHorizontal: scale(20),
    paddingBottom: verticalScale(50),
    flexGrow: 1,
    justifyContent: 'center',
  },
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardCtx,
    borderRadius: scale(20),
    marginBottom: verticalScale(20),
    // overflow: 'hidden', // REMOVED TO ALLOW TOOLTIPS
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardAccent: {
    width: 6,
    backgroundColor: COLORS.primary,
  },
  cardContent: {
    flex: 1,
    padding: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  cardSubtitle: {
    fontSize: 13,
    color: COLORS.secondary,
    fontWeight: '500',
    marginTop: 4,
  },
  rateText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: -0.5,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  calcIconBtn: {
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
  },
  calcIconBtnActive: {
    // backgroundColor handled dynamically now
  },
  calcBody: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calcLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  manualInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  presetBtn: {
    backgroundColor: COLORS.primarySoft,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(37,99,235,0.1)',
  },
  clearBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  resultContainer: {
    marginTop: 25,
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  resultLabel: {
    fontSize: 14,
    color: '#15803D',
    fontWeight: '800',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  resultHighlight: {
    fontSize: 40,
    fontWeight: '900',
    color: COLORS.success,
    letterSpacing: -1,
  },
  shareBtn: {
    backgroundColor: COLORS.whatsapp,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 20,
    borderRadius: 18,
    width: '90%',
    alignSelf: 'center',
    shadowColor: COLORS.whatsapp,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  shareBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  footerDocs: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 50,
  },
  lastUpdateText: {
    color: COLORS.secondary,
    fontSize: 13,
    fontWeight: '500',
  },
  legalLinksText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  modalBold: {
    fontWeight: '700',
    fontSize: 16,
    color: COLORS.textDark,
    marginTop: 15,
    marginBottom: 6,
  },
  modalP: {
    fontSize: 15,
    color: COLORS.secondary,
    lineHeight: 24,
  },
  modalBtn: {
    backgroundColor: COLORS.textDark,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  modalBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  cookieBanner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: COLORS.textDark,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookieText: {
    color: '#E2E8F0',
    fontSize: 14,
    flex: 1,
    fontWeight: '500',
  },
  cookieBtn: {
    backgroundColor: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  cookieBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  }
});
