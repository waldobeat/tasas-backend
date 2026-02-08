import React, { useState, useEffect, useRef } from 'react';
import { Platform, Animated, Easing, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Linking } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUpdates } from 'expo-updates';
// AdMob - REMOVED (Simulation Mode)

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

import { LogLevel, OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';

// Initialize OneSignal
// Reemplaza esto con tu App ID real de OneSignal
const ONESIGNAL_APP_ID = "0898149e-1a1e-44cf-9807-5b0088bfe32c";
OneSignal.Debug.setLogLevel(LogLevel.Verbose);
OneSignal.initialize(ONESIGNAL_APP_ID);

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

  // --- NOTIFICATIONS STATE ---
  /* OneSignal maneja el estado internamente, pero podemos guardar 
     el ID de usuario si quisiéramos enviarlo al backend */
  const [onesignalId, setOnesignalId] = useState('');

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      const [pPrivacy, pCookies] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY)
      ]);
      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);

      // OneSignal Permission Request
      OneSignal.Notifications.requestPermission(true);

      // Listeners de OneSignal
      const handleNotificationClick = (event) => {
        console.log('OneSignal: notification clicked:', event);
      };

      const handleNotificationWillDisplay = (event) => {
        console.log('OneSignal: notification will display:', event);
      };

      OneSignal.Notifications.addEventListener('click', handleNotificationClick);
      OneSignal.Notifications.addEventListener('foregroundWillDisplay', handleNotificationWillDisplay);

      return () => {
        OneSignal.Notifications.removeEventListener('click', handleNotificationClick);
        OneSignal.Notifications.removeEventListener('foregroundWillDisplay', handleNotificationWillDisplay);
      };
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

  // --- AD LOGIC (SIMULATION) ---
  const [adFreeUntil, setAdFreeUntil] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const AD_FREE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

  useEffect(() => {
    (async () => {
      const savedTime = await AsyncStorage.getItem('ad_free_until');
      if (savedTime) {
        const time = parseInt(savedTime, 10);
        if (time > Date.now()) {
          setAdFreeUntil(time);
        }
      }
    })();
  }, []);

  const handleWatchAd = () => {
    setIsWatchingAd(true);
    // Simulate Ad Viewing (2 seconds)
    setTimeout(async () => {
      const newTime = Date.now() + AD_FREE_DURATION;
      setAdFreeUntil(newTime);
      await AsyncStorage.setItem('ad_free_until', newTime.toString());
      setIsWatchingAd(false);
      alert("¡Gracias! Has desbloqueado 6 horas sin publicidad (Simulacro).");
    }, 2000);
  };



  // --- RENDER ---
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.bg }} edges={['top']}>
        <StatusBar style={darkMode ? "light" : "dark"} />

        <AppHeader
          date={date}
          valueDate={valueDate}
          activeColors={activeColors}
          setMenuVisible={() => setShowPrivacy(true)} // Button now opens policy
          updateTag="NUCLEAR V1"
          isAdFree={Date.now() < adFreeUntil}
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
                <View style={{ marginTop: 20 }}>
                  <Rates
                    rates={rates}
                    activeCalc={activeCalc}
                    toggleCalc={(id) => setActiveCalc(activeCalc === id ? null : id)}
                    activeColors={activeColors}
                  />
                </View>



                {/* Gráfica */}
                {history && history.length > 0 && (
                  <View style={{ marginTop: 30 }}>
                    <Portfolio
                      history={history}
                      activeColors={activeColors}
                      hideList={true} // New prop to only show chart
                    />
                  </View>
                )}

                {/* Fecha Valor - MOVED BELOW CHART */}
                <View style={{ alignItems: 'center', marginVertical: 20 }}>
                  <Text style={{ color: activeColors.textDark, fontSize: 14, fontWeight: '700', opacity: 1 }}>
                    {valueDate ? `Fecha Valor: ${valueDate}` : date}
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openURL('http://www.bcv.org.ve/')} style={{ marginTop: 8 }}>
                    <Text style={{ color: '#1D4ED8', fontSize: 13, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                      Comprobar información aquí (BCV)
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Footer Info */}
                <View style={{ marginTop: 30, marginBottom: 50, alignItems: 'center' }}>

                  {/* AD SECTION */}
                  {Date.now() > adFreeUntil ? (
                    <View style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}>


                      <TouchableOpacity
                        onPress={handleWatchAd}
                        style={{
                          flexDirection: 'row',
                          backgroundColor: activeColors.primary,
                          paddingHorizontal: 20,
                          paddingVertical: 10,
                          borderRadius: 20,
                          alignItems: 'center',
                          shadowColor: activeColors.primary,
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 5
                        }}
                      >
                        {isWatchingAd ? (
                          <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                        ) : (
                          <Text style={{ fontSize: 18, marginRight: 8 }}>🎥</Text>
                        )}
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Quitar anuncios (6h)</Text>
                      </TouchableOpacity>

                    </View>
                  ) : null}

                  <Text style={{ color: activeColors.secondary, fontSize: 12, marginTop: 10, fontWeight: '600' }}>Última actualización: {lastUpdated || 'Calculando...'}</Text>
                  <TouchableOpacity onPress={() => setShowPrivacy(true)} style={{ marginTop: 15 }}>
                    <Text style={{ color: '#1D4ED8', textDecorationLine: 'underline', fontSize: 14, fontWeight: 'bold' }}>Políticas de Privacidad</Text>
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
          theme={activeColors}
        />

        <UpdateModal
          visible={showUpdateModal}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          isUpdatePending={isUpdatePending}
          progressAnim={progressAnim}
          activeColors={activeColors}
          theme={activeColors}
        />





      </SafeAreaView>
    </SafeAreaProvider>
  );
}
