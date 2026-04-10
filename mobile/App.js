import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Share, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import AppHeader from './src/components/AppHeader';
import Rates from './src/components/Rates';
import Portfolio from './src/components/Portfolio';
import { THEMES, LIGHT_PALETTE, DARK_PALETTE, scale, moderateScale, verticalScale } from './src/styles/theme';
import SettingsMenu from './src/components/SettingsMenu';
import PrivacyModal from './src/components/PrivacyModal';
import CustomSplash from './src/components/CustomSplash';
import UpdateModal from './src/components/UpdateModal';
import BannerPopup from './src/components/BannerPopup';
import { useRates } from './src/hooks/useRates';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';
const THEME_KEY = 'app_theme_v1';
const DARK_MODE_KEY = 'app_dark_mode_v1';

export default function App() {
  const { rates, loading, history, date, valueDate, lastUpdated, refreshing, onRefresh } = useRates();

  const [activeThemeKey, setActiveThemeKey] = useState('DEFAULT');
  const [darkMode, setDarkMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCalc, setActiveCalc] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showBinanceBanner, setShowBinanceBanner] = useState(false);

  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const auroraAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const [pPrivacy, pCookies, savedTheme, savedDarkMode] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(DARK_MODE_KEY),
      ]);

      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);

      if (savedTheme && THEMES[savedTheme]) setActiveThemeKey(savedTheme);
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');

      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setShowUpdateModal(true);
            setIsDownloading(true);
            await Promise.all([
              Updates.fetchUpdateAsync(),
              new Promise(resolve => setTimeout(resolve, 5000))
            ]);
            setDownloadProgress(1);
            Animated.timing(progressAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
            setIsDownloading(false);
            setIsUpdatePending(true);
          }
        } catch (e) {
          console.log("Update check error:", e);
        }
      }
    })();

    Animated.loop(
      Animated.timing(auroraAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
    ).start();
  }, []);

  const onSplashFinish = useCallback(async () => {
    setIsAppReady(true);
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      console.log('Error hiding splash:', e);
    }
  }, []);

  const handleToggleDarkMode = (value) => {
    setDarkMode(value);
    AsyncStorage.setItem(DARK_MODE_KEY, String(value));
  };

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

  const toggleCalc = (id) => {
    if (id === 'binance-usd') setShowBinanceBanner(true);
    setActiveCalc(prev => prev === id ? null : id);
  };

  const onShare = async (title, rate) => {
    try {
      await Share.share({
        message: `${title}: ${rate} Bs.\nConsulta esta y otras tasas en tiempo real.\nDescarga La Tasa V2 aquí: https://tasas-backend.onrender.com`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  const currentTheme = THEMES[activeThemeKey] || THEMES.DEFAULT;
  const activeColors = {
    ...(darkMode ? DARK_PALETTE : LIGHT_PALETTE),
    ...currentTheme
  };

  const changeTheme = (key) => {
    setActiveThemeKey(key);
    AsyncStorage.setItem(THEME_KEY, key);
  };

  if (!isAppReady) {
    return <CustomSplash onFinish={onSplashFinish} theme={activeColors} />;
  }

  if (showPrivacy) {
    return <PrivacyModal visible={true} onAccept={handleAcceptPrivacy} theme={activeColors} />;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: '#05070B' }}>
        <StatusBar style="light" backgroundColor="transparent" translucent={true} />

        <Animated.View style={{
          position: 'absolute', top: -100, left: -100, width: 300, height: 300,
          borderRadius: 150, backgroundColor: currentTheme.primary, opacity: 0.15, filter: 'blur(50px)',
          transform: [
            { scale: auroraAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.5, 2, 1.5] }) },
            { translateX: auroraAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 50, 0] }) }
          ]
        }} />
        <Animated.View style={{
          position: 'absolute', top: 200, right: -150, width: 400, height: 400,
          borderRadius: 200, backgroundColor: currentTheme.secondary, opacity: 0.1, filter: 'blur(60px)',
          transform: [
            { scale: auroraAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.2, 1.6, 1.2] }) },
            { translateY: auroraAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -60, 0] }) }
          ]
        }} />

        <SafeAreaView style={{ flex: 1 }} edges={['top']}>
          <AppHeader
            date={date}
            valueDate={valueDate}
            activeColors={activeColors}
            setMenuVisible={() => setShowSettings(true)}
            theme={currentTheme}
          />

          {lastUpdated && (
            <View style={{ alignSelf: 'center', marginBottom: 10 }}>
              <Text style={{ color: activeColors.secondary, fontSize: 11 }}>
                Actualizado: {lastUpdated}
              </Text>
            </View>
          )}

          <ScrollView
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={activeColors.textDark}
                colors={[currentTheme.primary]}
              />
            }
          >
            <View style={{ paddingHorizontal: 15, paddingTop: 20 }}>
              {loading && !refreshing ? (
                <ActivityIndicator size="large" color={currentTheme.primary} style={{ marginTop: 50 }} />
              ) : (
                <>
                  <Rates
                    rates={rates}
                    activeCalc={activeCalc}
                    toggleCalc={toggleCalc}
                    activeColors={activeColors}
                    onShare={onShare}
                    theme={currentTheme}
                  />

                  <Portfolio
                    activeColors={activeColors}
                    history={history}
                    theme={currentTheme}
                  />

                  {valueDate ? (
                    <Text style={{ color: activeColors.secondary, fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                      Fecha Valor: {valueDate}
                    </Text>
                  ) : null}

                  <TouchableOpacity onPress={() => Linking.openURL('https://www.bcv.org.ve')} style={{ marginTop: 20, padding: 10 }}>
                    <Text style={{ color: activeColors.secondary, fontSize: 11, textAlign: 'center', textDecorationLine: 'underline' }}>
                      Fuente: bcv.org.ve
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>

        <SettingsMenu
          visible={showSettings}
          onClose={() => setShowSettings(false)}
          activeColors={activeColors}
          darkMode={darkMode}
          toggleDarkMode={handleToggleDarkMode}
          activeThemeKey={activeThemeKey}
          changeTheme={changeTheme}
          theme={currentTheme}
          onOpenPrivacy={() => setShowPrivacy(true)}
        />

        <PrivacyModal
          visible={showPrivacy}
          onClose={() => setShowPrivacy(false)}
          onAccept={handleAcceptPrivacy}
          theme={activeColors}
        />

        <BannerPopup
          visible={showBinanceBanner}
          onClose={() => setShowBinanceBanner(false)}
          activeColors={activeColors}
        />

        <UpdateModal
          visible={showUpdateModal}
          isDownloading={isDownloading}
          downloadProgress={downloadProgress}
          isUpdatePending={isUpdatePending}
          progressAnim={progressAnim}
          activeColors={activeColors}
          theme={activeColors}
          onClose={() => setShowUpdateModal(false)}
        />

        {showCookies && (
          <View style={styles.cookieBanner}>
            <Text style={styles.cookieText}>Usamos cookies para mejorar tu experiencia</Text>
            <TouchableOpacity onPress={handleAcceptCookies} style={styles.cookieButton}>
              <Text style={styles.cookieButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cookieBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cookieText: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
  },
  cookieButton: {
    backgroundColor: '#00E5FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  cookieButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
});
