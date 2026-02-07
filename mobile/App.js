import React, { useState, useEffect, useRef } from 'react';
import { Platform, Animated, Easing, SafeAreaView, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUpdates } from 'expo-updates';

// UI Components (Minimal set)
import AppHeader from './src/components/AppHeader';
import Rates from './src/components/Rates';
import Portfolio from './src/components/Portfolio'; // Used for the chart
import PrivacyModal from './src/components/PrivacyModal';
import CookieBanner from './src/components/CookieBanner';
import UpdateModal from './src/components/UpdateModal';

// Hooks
import { useRates } from './src/hooks/useRates';
import { DARK_PALETTE, LIGHT_PALETTE } from './src/styles/theme';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';

export default function App() {
  // --- DATA ---
  const { rates, loading, history, date, valueDate, lastUpdated, refreshing, onRefresh } = useRates();

  // --- UI STATE ---
  const [darkMode, setDarkMode] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [activeCalc, setActiveCalc] = useState(null);

  // OTA Updates
  const { isDownloading, downloadProgress, isUpdatePending, isUpdateAvailable } = useUpdates();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const activeColors = darkMode ? DARK_PALETTE : LIGHT_PALETTE;

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      const [pPrivacy, pCookies] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY)
      ]);
      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);
    })();
  }, []);

  // --- OTA ---
  useEffect(() => {
    if (isUpdateAvailable || isDownloading || isUpdatePending) setShowUpdateModal(true);
  }, [isUpdateAvailable, isDownloading, isUpdatePending]);

  // --- ACTIONS ---
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

  // --- RENDER ---
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.bg }} edges={['top']}>
      <StatusBar style={darkMode ? "light" : "dark"} />

      <AppHeader
        date={date}
        activeColors={activeColors}
        setMenuVisible={() => setShowPrivacy(true)} // Button now opens policy
        updateTag="NUCLEAR V1"
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={activeColors.secondary} />}
      >
        <View style={{ padding: 20 }}>
          {loading ? (
            <ActivityIndicator size="large" color={activeColors.secondary} style={{ marginTop: 50 }} />
          ) : (
            <>
              {/* Tasas en Vivo */}
              <Rates
                rates={rates}
                activeCalc={activeCalc}
                toggleCalc={(id) => setActiveCalc(activeCalc === id ? null : id)}
                activeColors={activeColors}
              />

              {/* Gráfica */}
              {history && history.length > 0 && (
                <View style={{ marginTop: 30 }}>
                  <Text style={{ color: activeColors.textDark, fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Histórico BCV</Text>
                  <Portfolio
                    history={history}
                    activeColors={activeColors}
                    hideList={true} // New prop to only show chart
                  />
                </View>
              )}

              {/* Footer Info */}
              <View style={{ marginTop: 50, marginBottom: 50, alignItems: 'center', opacity: 0.6 }}>
                <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Última actualización: {lastUpdated || 'Calculando...'}</Text>
                <TouchableOpacity onPress={() => setShowPrivacy(true)} style={{ marginTop: 15 }}>
                  <Text style={{ color: activeColors.secondary, textDecorationLine: 'underline', fontSize: 14 }}>Políticas de Privacidad</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* MODALS */}
      <PrivacyModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        onAccept={handleAcceptPrivacy}
      />

      <UpdateModal
        visible={showUpdateModal}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        isUpdatePending={isUpdatePending}
        progressAnim={progressAnim}
        activeColors={activeColors}
      />

      {showCookies && <CookieBanner onAccept={handleAcceptCookies} />}

    </SafeAreaView>
  );
}
