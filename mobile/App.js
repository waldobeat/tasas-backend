import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, Animated, ScrollView, View, Text, TouchableOpacity, ActivityIndicator, RefreshControl, Linking, Share } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';

// UI Components
import AppHeader from './src/components/AppHeader';
import Rates from './src/components/Rates';
import Portfolio from './src/components/Portfolio';
import CookieBanner from './src/components/CookieBanner';
import { THEMES, LIGHT_PALETTE, DARK_PALETTE } from './src/styles/theme';
import SettingsMenu from './src/components/SettingsMenu';
import PrivacyModal from './src/components/PrivacyModal';
import CustomSplash from './src/components/CustomSplash';
import UpdateModal from './src/components/UpdateModal';
import NameModal from './src/components/NameModal';
import HolidayModal from './src/components/HolidayModal';
import BannerPopup from './src/components/BannerPopup';
import ValentineRain from './src/components/ValentineRain';

// Hooks
import { useRates } from './src/hooks/useRates';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';
const THEME_KEY = 'app_theme_v1';
const DARK_MODE_KEY = 'app_dark_mode_v1';
const USER_NAME_KEY = 'user_name_v1';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { rates, loading, history, date, valueDate, lastUpdated, refreshing, onRefresh } = useRates();

  // --- UI STATE ---
  const [activeThemeKey, setActiveThemeKey] = useState('DEFAULT');
  const [darkMode, setDarkMode] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCookies, setShowCookies] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeCalc, setActiveCalc] = useState(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [userName, setUserName] = useState(null);
  const [userNameLoaded, setUserNameLoaded] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayModalClosed, setHolidayModalClosed] = useState(false);
  const [showBinanceBanner, setShowBinanceBanner] = useState(false);

  // --- UPDATE STATE ---
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      const [pPrivacy, pCookies, savedTheme, savedDarkMode, savedName] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(DARK_MODE_KEY),
        AsyncStorage.getItem(USER_NAME_KEY)
      ]);

      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);

      if (savedTheme && THEMES[savedTheme]) setActiveThemeKey(savedTheme);
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');

      if (savedName) {
        setUserName(savedName);
      }
      setUserNameLoaded(true);

      // --- OTA UPDATES LOGIC (NON-BLOCKING) ---
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setShowUpdateModal(true);
            setIsDownloading(true);

            await Updates.fetchUpdateAsync();

            setDownloadProgress(1);
            Animated.timing(progressAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false
            }).start();

            setIsDownloading(false);
            setIsUpdatePending(true);

            // Do not force reload, just let the user know it's ready
            console.log("Update fetched and ready.");
          }
        } catch (e) {
          console.log("Update check error:", e);
        }
      }
    })();
  }, []);

  const onSplashFinish = useCallback(async () => {
    setIsAppReady(true);
    setShowHolidayModal(true);
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      console.log('Error hiding splash:', e);
    }
  }, []);

  // Show name modal only when app is ready AND name is checked AND missing AND holiday modal is closed
  useEffect(() => {
    if (isAppReady && userNameLoaded && !userName && holidayModalClosed) {
      setShowNameModal(true);
    }
  }, [isAppReady, userNameLoaded, userName, holidayModalClosed]);

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

  const handleSaveName = async (name) => {
    await AsyncStorage.setItem(USER_NAME_KEY, name);
    setUserName(name);
    setShowNameModal(false);
  };

  const toggleCalc = (id) => {
    const isActivating = activeCalc !== id;

    if (isActivating && id === 'binance-usd') {
      setShowBinanceBanner(true);
    }

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

  if (!isAppReady) {
    return <CustomSplash onFinish={onSplashFinish} theme={activeColors} />;
  }

  if (showPrivacy) {
    return <PrivacyModal visible={true} onAccept={handleAcceptPrivacy} theme={activeColors} />;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: activeColors.bg }}
        edges={['top']}
      >
        <StatusBar style={darkMode ? 'light' : 'dark'} backgroundColor={activeColors.bg} />

        <AppHeader
          date={date}
          valueDate={valueDate}
          activeColors={activeColors}
          setMenuVisible={() => setShowSettings(true)}
          userName={userName}
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

        <NameModal
          visible={showNameModal}
          onSave={handleSaveName}
          activeColors={activeColors}
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
          <CookieBanner onAccept={handleAcceptCookies} />
        )}

        <HolidayModal
          visible={showHolidayModal}
          onClose={() => {
            setShowHolidayModal(false);
            setHolidayModalClosed(true);
          }}
          activeColors={activeColors}
          theme={currentTheme}
        />
        <ValentineRain />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
