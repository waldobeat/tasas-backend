// import { LogLevel, OneSignal } from 'react-native-onesignal';
import Constants from 'expo-constants';

// ... other imports

export default function App() {
  const { rates, loading, history, date, valueDate, lastUpdated, refreshing, onRefresh } = useRates();

  // ... (existing state)

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

  // Show name modal only when app is ready AND name is checked AND missing
  useEffect(() => {
    if (isAppReady && userNameLoaded && !userName) {
      setShowNameModal(true);
    }
  }, [isAppReady, userNameLoaded, userName]);

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
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        theme={currentTheme}
        activeColors={activeColors}
        onShowPrivacy={() => setShowPrivacy(true)}
      />
    );
  }

  if (showFinancial) {
    return (
      <FinancialDashboard
        theme={currentTheme}
        activeColors={activeColors}
        isPremium={true} // For now, assume premium to test
        user={user}
        portfolio={portfolio}
        onClose={handleCloseFinancial}
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
          onOpenFinancial={handleOpenFinancial}
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

        <FeatureAnnouncement
          visible={showFeatureAnnouncement}
          onClose={() => setShowFeatureAnnouncement(false)}
          onTryNow={() => {
            setShowFeatureAnnouncement(false);
            if (user) {
              setShowFinancial(true);
            } else {
              setShowAuth(true); // Ask to login/register to use it
            }
          }}
          activeColors={activeColors}
          theme={activeColors}
        />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}
