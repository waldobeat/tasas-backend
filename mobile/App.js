import React, { useState, useEffect, useRef } from 'react';
import { Platform, Animated, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Share } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen'; // Make sure this is imported if used

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// UI Components
import AppHeader from './src/components/AppHeader';
import Rates from './src/components/Rates';
import Portfolio from './src/components/Portfolio';
import CookieBanner from './src/components/CookieBanner';
import { THEMES, LIGHT_PALETTE, DARK_PALETTE } from './src/styles/theme';
import UpdateModal from './src/components/UpdateModal';
import SettingsMenu from './src/components/SettingsMenu';
import PrivacyModal from './src/components/PrivacyModal';
// Hooks
import { useRates } from './src/hooks/useRates';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';
const THEME_KEY = 'app_theme_v1';

import CustomSplash from './src/components/CustomSplash';

export default function App() {
  const { rates, loading, history, date, valueDate, lastUpdated, refreshing, onRefresh } = useRates();

  // --- UI STATE ---
  const [activeThemeKey, setActiveThemeKey] = useState('DEFAULT');
  const [darkMode, setDarkMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [isSplashVisible, setIsSplashVisible] = useState(true); // New Splash State
  const [showSettings, setShowSettings] = useState(false);
  const [activeCalc, setActiveCalc] = useState(null);

  // Update Modal State
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const DARK_MODE_KEY = 'app_dark_mode_v1';

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      const [pPrivacy, pCookies, savedTheme, savedDarkMode] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(DARK_MODE_KEY)
      ]);

      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);

      if (savedTheme && THEMES[savedTheme]) setActiveThemeKey(savedTheme);
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');

      // Check for updates (simplified for now)
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          console.log("Update available");
        }
      } catch (e) {
        // Ignore update errors in dev
      }
    })();
  }, []);

  // --- ACTIONS ---
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
    setActiveCalc(prev => prev === id ? null : id);
  };

  const onShare = async (title, rate) => {
    try {
      await Share.share({
        message: `${title}: ${rate} Bs.\nConsulta más en La Tasa App.`,
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

  // Hide splash screen immediately when layout is ready so CustomSplash is visible
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  // --- RENDER ---
  if (showPrivacy) {
    return <PrivacyModal visible={true} onAccept={handleAcceptPrivacy} theme={activeColors} />;
  }

  if (activeThemeKey === 'DEFAULT' && !darkMode && isSplashVisible) {
    // Basic check to show splash only once per load, mostly.
    // Ideally we track this separately, but state init handles it.
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: activeColors.bg }}
        edges={['top']}
        onLayout={onLayoutRootView}
      >
        <StatusBar style={darkMode ? 'light' : 'dark'} backgroundColor={activeColors.bg} />

        {isSplashVisible && (
          <CustomSplash
            onFinish={() => setIsSplashVisible(false)}
            theme={activeColors}
          />
        )}

        {!isSplashVisible && (
          <>
            <AppHeader
              date={date}
              valueDate={valueDate}
              activeColors={activeColors}
              setMenuVisible={() => setShowSettings(true)}
            />

            <ScrollView
              key={activeThemeKey}
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
              <View style={{ paddingHorizontal: 15, paddingTop: 30 }}>
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
                    />

                    {valueDate ? (
                      <Text style={{
                        color: activeColors.secondary,
                        fontSize: 12,
                        textAlign: 'center',
                        marginTop: 20,
                        marginBottom: 5
                      }}>
                        Fecha Valor: {valueDate}
                      </Text>
                    ) : null}

                    <TouchableOpacity onPress={() => setShowPrivacy(true)} style={{ marginBottom: 30, padding: 10 }}>
                      <Text style={{
                        color: activeColors.secondary,
                        fontSize: 12,
                        textAlign: 'center',
                        textDecorationLine: 'underline'
                      }}>
                        Términos y Condiciones
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </ScrollView>
          </>
        )}

        {/* MODALS */}
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

        {showCookies && (
          <CookieBanner onAccept={handleAcceptCookies} />
        )}

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
