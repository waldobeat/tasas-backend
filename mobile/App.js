import React, { useState, useEffect, useRef } from 'react';
import { Platform, Animated, Easing, Vibration, Linking, Alert, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUpdates } from 'expo-updates';

// UI Components
import IntroScreen from './src/components/IntroScreen';
import AppHeader from './src/components/AppHeader';
import MainNavigator from './src/navigation/MainNavigator';
import SettingsMenu from './src/components/SettingsMenu';
import PrivacyModal from './src/components/PrivacyModal';
import PremiumModal from './src/components/PremiumModal';
import CookieBanner from './src/components/CookieBanner';
import CalendarModal from './src/components/CalendarModal';
import UpdateModal from './src/components/UpdateModal';
import AddTransactionModal from './src/components/AddTransactionModal';

// Styles & Utils
import { THEMES, LIGHT_PALETTE, DARK_PALETTE } from './src/styles/theme';
import { authService } from './src/utils/authService';

// Hooks
import { useRates } from './src/hooks/useRates';
import { useAuth } from './src/hooks/useAuth';
import { usePortfolio } from './src/hooks/usePortfolio';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';

export default function App() {
  // --- CORE DATA HOOKS ---
  const { rates, loading: ratesLoading, history, date, valueDate, lastUpdated, refreshing, onRefresh } = useRates();
  const { user, isPremium, premiumType, handleAuthSuccess, handleLogout, grantPremiumAccess, setUser, setIsPremium } = useAuth();
  const { portfolio, loading: financeLoading, refreshKey: financeRefreshKey, addTransaction: saveTransaction, updateTransaction, deleteTransaction, toggleTransactionCompletion, addPartialPayment: savePartialPayment, getTotals } = usePortfolio(user);

  // --- UI STATE ---
  const [activeThemeKey, setActiveThemeKey] = useState('DEFAULT');
  const [darkMode, setDarkMode] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [activeCalc, setActiveCalc] = useState(null);
  const [activeModule, setActiveModule] = useState('rates');

  // Finance UI States
  const [newTrans, setNewTrans] = useState({ title: '', amount: '', type: 'pay', currency: 'USD', date: new Date() });
  const [showAddFinance, setShowAddFinance] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isDebtPayment, setIsDebtPayment] = useState(false);
  const [selectedDebtId, setSelectedDebtId] = useState(null);
  const [sessionLocked, setSessionLocked] = useState(false);

  // OTA Updates
  const { isDownloading, downloadProgress, isUpdatePending, isUpdateAvailable } = useUpdates();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Refs
  const cardRefs = useRef({});

  // Theme Config
  const theme = THEMES[activeThemeKey] || THEMES.DEFAULT;
  const activeColors = darkMode ? DARK_PALETTE : LIGHT_PALETTE;

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      // Load Preferences
      const [pPrivacy, pCookies, pTheme, pDark] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY),
        AsyncStorage.getItem('theme_preference'),
        AsyncStorage.getItem('dark_mode_pref')
      ]);

      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);

      if (pTheme && THEMES[pTheme]) setActiveThemeKey(pTheme);
      if (pDark !== null) setDarkMode(pDark === 'true');
    })();
  }, []);

  // --- OTA UPDATE ORCHESTRATION ---
  useEffect(() => {
    if (isUpdateAvailable || isDownloading || isUpdatePending) setShowUpdateModal(true);
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  useEffect(() => {
    if (isDownloading) {
      Animated.timing(progressAnim, { toValue: downloadProgress || 0, duration: 500, easing: Easing.out(Easing.ease), useNativeDriver: false }).start();
    }
  }, [isDownloading, downloadProgress]);

  useEffect(() => {
    if (isUpdatePending) {
      Animated.timing(progressAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    }
  }, [isUpdatePending]);

  // --- SESSION MONITOR ---
  useEffect(() => {
    if (!user) return;
    const checkExpiry = () => {
      if (!user.expiresAt) return;
      if (new Date() > new Date(user.expiresAt)) setSessionLocked(true);
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // --- BUSINESS LOGIC ACTIONS ---

  const handleAcceptPrivacy = async () => {
    await AsyncStorage.setItem(PRIVACY_KEY, 'true');
    setShowPrivacy(false);
    const cookies = await AsyncStorage.getItem(COOKIE_KEY);
    if (!cookies) setShowCookies(true);
  };

  const handleAcceptCookies = async () => {
    await AsyncStorage.setItem(COOKIE_KEY, 'true');
    setShowCookies(false);
  };

  const handleToggleDarkMode = async () => {
    const next = !darkMode;
    setDarkMode(next);
    await AsyncStorage.setItem('dark_mode_pref', next.toString());
  };

  const handleChangeTheme = async (key) => {
    setActiveThemeKey(key);
    await AsyncStorage.setItem('theme_preference', key);
  };

  const handleToggleCalc = (id) => {
    Vibration.vibrate(50);
    setActiveCalc(activeCalc === id ? null : id);
  };

  const handleShareResult = async (id) => {
    // Logic kept but isolated in Navigator via ref
    const { captureRef } = require('react-native-view-shot');
    const Sharing = require('expo-sharing');
    try {
      const viewRef = cardRefs.current[id];
      if (!viewRef) return;
      const uri = await captureRef(viewRef, { format: 'png', quality: 1 });
      if (!(await Sharing.isAvailableAsync())) return;
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert('Error', 'Falló al compartir'); }
  };

  const handleActivatePremium = (type) => {
    if (!user) return;
    const planName = type === 'buy' ? 'Premium Plus 365 días' : 'Premium Plata 30 Días';
    const price = type === 'buy' ? '9.99' : '2.99';
    Alert.alert(
      "Confirmar Suscripción",
      `Has seleccionado ${planName} ($${price}).\n\n¿Deseas pagar con PayPal?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Ir a PayPal", onPress: () => Linking.openURL('https://paypal.me/latasave') }
      ]
    );
  };

  const handleAuthSuccessExtended = (u) => {
    handleAuthSuccess(u);
    setActiveModule('finance');
  };

  // --- RENDER ---

  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.bg }} edges={['top']}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <AppHeader
        date={date}
        activeColors={activeColors}
        setMenuVisible={setMenuVisible}
        updateTag="CLEAN START (V12)"
      />

      <MainNavigator
        activeModule={activeModule}
        user={user}
        rates={rates}
        ratesLoading={ratesLoading}
        history={history}
        portfolio={portfolio}
        activeCalc={activeCalc}
        valueDate={valueDate}
        date={date}
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
        toggleCalc={handleToggleCalc}
        handleShare={handleShareResult}
        handleAuthSuccessExtended={handleAuthSuccessExtended}
        onShowPrivacy={() => setShowPrivacy(true)}
        financialDashboardProps={{
          isPremium,
          premiumType,
          refreshKey: financeRefreshKey,
          onAddPress: () => setShowAddFinance(true),
          onOpenPremium: () => setShowPremiumModal(true),
          setNewTrans,
          setIsDebtPayment,
          setSelectedDebtId,
          addPartialPayment: savePartialPayment
        }}
        theme={theme}
        activeColors={activeColors}
        cardRefs={cardRefs}
      />

      {/* MODAL ORCHESTRATION */}
      <SettingsMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        activeColors={activeColors}
        darkMode={darkMode}
        toggleDarkMode={handleToggleDarkMode}
        isPremium={isPremium}
        activeThemeKey={activeThemeKey}
        changeTheme={handleChangeTheme}
        setActiveModule={setActiveModule}
        handleLogout={handleLogout}
        theme={theme}
      />

      <PrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        onAccept={handleAcceptPrivacy}
        theme={theme}
      />

      <PremiumModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        activeColors={activeColors}
        isPremium={isPremium}
        premiumType={premiumType}
        activatePremiumAction={handleActivatePremium}
        grantPremiumAccess={grantPremiumAccess}
      />

      <UpdateModal
        visible={showUpdateModal}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        isUpdatePending={isUpdatePending}
        progressAnim={progressAnim}
        activeColors={activeColors}
        theme={theme}
      />

      <CalendarModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        selectedDate={newTrans.date}
        onSelect={(d) => { setNewTrans({ ...newTrans, date: d }); setShowDatePicker(false); }}
        theme={theme}
        activeColors={activeColors}
      />

      <AddTransactionModal
        visible={showAddFinance}
        onClose={() => setShowAddFinance(false)}
        onSave={async (t) => { await saveTransaction(t); setShowAddFinance(false); }}
        activeColors={activeColors}
        theme={theme}
      />

      {showCookies && <CookieBanner onAccept={handleAcceptCookies} />}

      {/* SESSION EXPIRED SCREEN */}
      <Modal visible={sessionLocked} animationType="fade">
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: activeColors.bg }}>
          <Text style={{ fontSize: 24, marginBottom: 20, color: activeColors.textDark, fontWeight: 'bold' }}>Sesión Expirada</Text>
          <Text style={{ color: activeColors.secondary, textAlign: 'center', paddingHorizontal: 40, marginBottom: 30 }}>Tu acceso temporal ha terminado.</Text>
          <TouchableOpacity
            onPress={() => { grantPremiumAccess(); setSessionLocked(false); }}
            style={{ backgroundColor: theme.primary, paddingVertical: 15, paddingHorizontal: 30, borderRadius: 12 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Extender 6 Horas GRATIS</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}
