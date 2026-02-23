import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Share, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import { LogLevel, OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';

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
import HolidayModal from './src/components/HolidayModal';
import BannerPopup from './src/components/BannerPopup';
import ValentineRain from './src/components/ValentineRain';
import RegistrationModal from './src/components/RegistrationModal';
import FeatureAnnouncement from './src/components/FeatureAnnouncement';
import AuthScreen from './src/components/AuthScreen';
import FinancialDashboard from './src/components/FinancialDashboard';
import CommentsModal from './src/components/CommentsModal';

// Utils
import { authService } from './src/utils/authService';

// Hooks
import { useRates } from './src/hooks/useRates';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';
const THEME_KEY = 'app_theme_v1';
const DARK_MODE_KEY = 'app_dark_mode_v1';
const USER_NAME_KEY = 'user_name_v1';

// SplashScreen.preventAutoHideAsync();

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
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayModalClosed, setHolidayModalClosed] = useState(false);
  const [showBinanceBanner, setShowBinanceBanner] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // --- FINANCIAL & AUTH STATE ---
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showFinancial, setShowFinancial] = useState(false);

  const [showFeatureAnnouncement, setShowFeatureAnnouncement] = useState(false);

  // --- UPDATE STATE ---
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isUpdatePending, setIsUpdatePending] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;

  // --- INITIALIZATION ---
  useEffect(() => {
    (async () => {
      // OneSignal Initialization REVERTED due to missing native module in production build
      // const oneSignalAppId = Constants.expoConfig?.extra?.onesignalAppId || "d2b69155-b19c-4d4f-a417-b7f2dfd63fe8";
      // OneSignal.Debug.setLogLevel(LogLevel.Verbose);
      // OneSignal.initialize(oneSignalAppId);

      // Request Permission
      // OneSignal.Notifications.requestPermission(true);

      const [pPrivacy, pCookies, savedTheme, savedDarkMode, savedName] = await Promise.all([
        AsyncStorage.getItem(PRIVACY_KEY),
        AsyncStorage.getItem(COOKIE_KEY),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(DARK_MODE_KEY),
        AsyncStorage.getItem(USER_NAME_KEY)
      ]);

      // ... (rest of init)


      if (!pPrivacy) setShowPrivacy(true);
      else if (!pCookies) setShowCookies(true);

      if (savedTheme && THEMES[savedTheme]) setActiveThemeKey(savedTheme);
      if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');

      if (savedName) {
        setUserName(savedName);
      }
      setUserNameLoaded(true);

      // --- SESSION & FEATURE ANNOUNCEMENT ---
      const storedUser = await authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      }

      // Show Feature Announcement on EVERY startup as requested
      setTimeout(() => setShowFeatureAnnouncement(true), 1500);

      // --- OTA UPDATES LOGIC (NON-BLOCKING) ---
      // --- OTA UPDATES LOGIC (NON-BLOCKING) ---
      if (!__DEV__) {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            setShowUpdateModal(true);
            setIsDownloading(true);

            // Parallel execution: Fetch update AND wait 5 seconds min
            await Promise.all([
              Updates.fetchUpdateAsync(),
              new Promise(resolve => setTimeout(resolve, 5000))
            ]);

            setDownloadProgress(1);
            Animated.timing(progressAnim, {
              toValue: 1, // Fill bar
              duration: 500,
              useNativeDriver: false
            }).start();

            // Show Restart Button
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
    // Removed Holiday Modal trigger
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      console.log('Error hiding splash:', e);
    }
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
    const isActivating = activeCalc !== id;

    if (isActivating && id === 'binance-usd') {
      setShowBinanceBanner(true);
    }

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

  // --- FINANCIAL ENGINE LOGIC ---
  const handleOpenFinancial = () => {
    if (user) {
      setShowFinancial(true);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setShowAuth(false);
    setShowFinancial(true);
  };

  const handleLogout = async () => {
    await authService.logout();
    setUser(null);
    setShowFinancial(false);
  };

  const handleCloseFinancial = () => {
    setShowFinancial(false);
  };

  if (!isAppReady) {
    return <CustomSplash onFinish={onSplashFinish} theme={activeColors} />;
  }

  if (showPrivacy) {
    return <PrivacyModal visible={true} onAccept={handleAcceptPrivacy} theme={activeColors} />;
  }

  if (showAuth) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: activeColors.bg }} edges={['top']}>
          <AuthScreen
            onAuthSuccess={handleAuthSuccess}
            theme={currentTheme}
            activeColors={activeColors}
            onShowPrivacy={() => setShowPrivacy(true)}
            onClose={() => setShowAuth(false)}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (showFinancial) {
    return (
      <FinancialDashboard
        theme={currentTheme}
        activeColors={activeColors}
        isPremium={user?.isPremium || false} // Use real user premium status
        user={user}
        portfolio={portfolio}
        onClose={handleCloseFinancial}
        onLogout={handleLogout}
        onAddPress={() => console.log("Add transaction")}
        onOpenPremium={() => console.log("Open Premium")}
      />
    );
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
          onOpenRegistration={() => setShowRegistrationModal(true)}
          onOpenComments={() => setShowComments(true)}
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

        <FeatureAnnouncement
          visible={showFeatureAnnouncement}
          onClose={() => setShowFeatureAnnouncement(false)}
          onTryNow={() => {
            setShowFeatureAnnouncement(false);
            if (user) setShowFinancial(true);
            else setShowAuth(true); // Or registration
          }}
          theme={currentTheme}
          activeColors={activeColors}
        />

        <RegistrationModal
          visible={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onAuthSuccess={(user) => {
            setUserName(user.name);
            AsyncStorage.setItem(USER_NAME_KEY, user.name);
            setShowRegistrationModal(false);
          }}
          theme={currentTheme}
          activeColors={activeColors}
        />

        <CommentsModal
          visible={showComments}
          onClose={() => setShowComments(false)}
          theme={currentTheme}
          activeColors={activeColors}
        />
        {/* <ValentineRain /> */}
      </SafeAreaView >
    </SafeAreaProvider >
  );
}
