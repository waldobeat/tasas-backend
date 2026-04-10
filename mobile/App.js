import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, Animated, TouchableOpacity, RefreshControl, ActivityIndicator, StatusBar, Share, Linking, Alert, NetInfo, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
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
import { formatNumber } from './src/utils/helpers';

const PRIVACY_KEY = 'privacy_accepted_v1';
const COOKIE_KEY = 'cookies_accepted_v1';
const THEME_KEY = 'app_theme_v1';
const DARK_MODE_KEY = 'app_dark_mode_v1';

const TABS = {
    RATES: 'rates',
    HISTORY: 'history',
    SETTINGS: 'settings'
};

function SkeletonCard({ theme }) {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(animatedValue, { toValue: 0, duration: 1000, useNativeDriver: true })
            ])
        ).start();
    }, []);

    const opacity = animatedValue.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.7] });

    return (
        <View style={[styles.skeletonCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', opacity }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Animated.View style={[styles.skeletonIcon, { backgroundColor: theme.primary + '30' }]} />
                    <View>
                        <Animated.View style={[styles.skeletonText, { width: 80, opacity }]} />
                        <Animated.View style={[styles.skeletonTextSmall, { width: 120, opacity, marginTop: 4 }]} />
                    </View>
                </View>
                <Animated.View style={[styles.skeletonButton, { opacity }]} />
            </Animated.View>
            <Animated.View style={[styles.skeletonRate, { opacity, marginTop: 20 }]} />
        </View>
    );
}

function ConnectionStatus({ isConnected, activeColors }) {
    if (isConnected === null || isConnected === true) return null;
    
    return (
        <View style={[styles.connectionBanner, { backgroundColor: '#EF4444' }]}>
            <Ionicons name="cloud-offline" size={14} color="white" />
            <Text style={styles.connectionText}>Sin conexión - Modo offline</Text>
        </View>
    );
}

function FloatingRefreshButton({ onPress, refreshing, theme, activeColors }) {
    return (
        <TouchableOpacity 
            style={[styles.floatingButton, { backgroundColor: theme.primary, shadowColor: theme.primary }]} 
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Animated.View style={{ transform: [{ rotate: refreshing ? '360deg' : '0deg' }] }}>
                <Ionicons name="refresh" size={24} color="#000" />
            </Animated.View>
        </TouchableOpacity>
    );
}

function TabBar({ activeTab, setActiveTab, theme, activeColors }) {
    const tabs = [
        { key: TABS.RATES, label: 'Tasas', icon: 'trending-up' },
        { key: TABS.HISTORY, label: 'Historial', icon: 'analytics' },
        { key: TABS.SETTINGS, label: 'Ajustes', icon: 'settings' }
    ];

    return (
        <View style={[styles.tabBar, { backgroundColor: activeColors.bg, borderTopColor: activeColors.border }]}>
            {tabs.map((tab) => (
                <TouchableOpacity
                    key={tab.key}
                    style={styles.tabItem}
                    onPress={() => setActiveTab(tab.key)}
                >
                    <Ionicons 
                        name={tab.icon} 
                        size={24} 
                        color={activeTab === tab.key ? theme.primary : activeColors.secondary} 
                    />
                    <Text style={[
                        styles.tabLabel, 
                        { color: activeTab === tab.key ? theme.primary : activeColors.secondary }
                    ]}>
                        {tab.label}
                    </Text>
                    {activeTab === tab.key && (
                        <View style={[styles.tabIndicator, { backgroundColor: theme.primary }]} />
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );
}

function LastUpdatedBadge({ lastUpdated, activeColors, onPress }) {
    return (
        <TouchableOpacity 
            onPress={onPress}
            style={[styles.lastUpdatedBadge, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}
        >
            <Ionicons name="time-outline" size={12} color={activeColors.secondary} />
            <Text style={styles.lastUpdatedText}>
                {lastUpdated ? `Actualizado: ${lastUpdated}` : 'Cargando...'}
            </Text>
        </TouchableOpacity>
    );
}

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
    const [isConnected, setIsConnected] = useState(true);
    const [activeTab, setActiveTab] = useState(TABS.RATES);

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
            ]);

            if (!pPrivacy) setShowPrivacy(true);
            else if (!pCookies) setShowCookies(true);

            if (savedTheme && THEMES[savedTheme]) setActiveThemeKey(savedTheme);
            if (savedDarkMode !== null) setDarkMode(savedDarkMode === 'true');

            if (!__DEV__) {
                try {
                    console.log("[OTA] Checking for updates...");
                    const update = await Updates.checkForUpdateAsync();
                    console.log("[OTA] Update available:", update.isAvailable);
                    if (update.isAvailable) {
                        setShowUpdateModal(true);
                        setIsDownloading(true);
                        console.log("[OTA] Downloading update...");
                        await Promise.all([
                            Updates.fetchUpdateAsync(),
                            new Promise(resolve => setTimeout(resolve, 5000))
                        ]);
                        setDownloadProgress(1);
                        Animated.timing(progressAnim, { toValue: 1, duration: 500, useNativeDriver: false }).start();
                        setIsDownloading(false);
                        setIsUpdatePending(true);
                        console.log("[OTA] Update ready to install");
                    }
                } catch (e) {
                    console.log("Update check error:", e);
                }
            }
        })();

        Animated.loop(
            Animated.timing(auroraAnim, { toValue: 1, duration: 20000, useNativeDriver: true })
        ).start();

        const unsubscribe = NetInfo.addEventListener(state => {
            setIsConnected(state.isConnected);
        });

        return () => unsubscribe();
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

    const handleRefresh = useCallback(() => {
        onRefresh();
    }, [onRefresh]);

    const renderContent = useCallback(() => {
        switch (activeTab) {
            case TABS.RATES:
                return (
                    <View style={{ paddingHorizontal: 15, paddingTop: 20 }}>
                        {loading && !refreshing ? (
                            <>
                                <SkeletonCard theme={currentTheme} />
                                <SkeletonCard theme={currentTheme} />
                                <SkeletonCard theme={currentTheme} />
                            </>
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
                            </>
                        )}
                        {valueDate ? (
                            <Text style={{ color: activeColors.secondary, fontSize: 12, textAlign: 'center', marginTop: 20, marginBottom: 5 }}>
                                Fecha Valor: {valueDate}
                            </Text>
                        ) : null}
                        <TouchableOpacity onPress={() => setShowPrivacy(true)} style={{ marginBottom: 30, padding: 10 }}>
                            <Text style={{ color: activeColors.secondary, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>
                                Términos y Condiciones
                            </Text>
                        </TouchableOpacity>
                    </View>
                );
            case TABS.HISTORY:
                return (
                    <View style={{ paddingHorizontal: 15, paddingTop: 20 }}>
                        <Portfolio
                            activeColors={activeColors}
                            history={history}
                            theme={currentTheme}
                        />
                    </View>
                );
            case TABS.SETTINGS:
                return (
                    <View style={{ paddingHorizontal: 15, paddingTop: 20 }}>
                        <TouchableOpacity 
                            style={[styles.settingsCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}
                            onPress={() => setShowPrivacy(true)}
                        >
                            <Ionicons name="shield-checkmark" size={24} color={currentTheme.primary} />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Text style={[styles.settingsTitle, { color: activeColors.textDark }]}>Privacidad</Text>
                                <Text style={[styles.settingsSubtitle, { color: activeColors.secondary }]}>Términos y condiciones</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={activeColors.secondary} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.settingsCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}
                            onPress={() => Linking.openURL('https://www.bcv.org.ve')}
                        >
                            <Ionicons name="globe" size={24} color={currentTheme.primary} />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Text style={[styles.settingsTitle, { color: activeColors.textDark }]}>Fuente Oficial</Text>
                                <Text style={[styles.settingsSubtitle, { color: activeColors.secondary }]}>bcv.org.ve</Text>
                            </View>
                            <Ionicons name="open-in-new" size={20} color={activeColors.secondary} />
                        </TouchableOpacity>

                        <View style={[styles.settingsCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}>
                            <Ionicons name="moon" size={24} color={currentTheme.primary} />
                            <View style={{ marginLeft: 15, flex: 1 }}>
                                <Text style={[styles.settingsTitle, { color: activeColors.textDark }]}>Modo Oscuro</Text>
                                <Text style={[styles.settingsSubtitle, { color: activeColors.secondary }]}>Cambiar apariencia</Text>
                            </View>
                            <Switch value={darkMode} onValueChange={handleToggleDarkMode} theme={currentTheme} activeColors={activeColors} />
                        </View>

                        <View style={{ marginTop: 20, paddingHorizontal: 10 }}>
                            <Text style={{ color: activeColors.secondary, fontSize: 11, textAlign: 'center' }}>
                                La Tasa V2 • Versión 1.2
                            </Text>
                        </View>
                    </View>
                );
            default:
                return null;
        }
    }, [activeTab, loading, refreshing, rates, activeCalc, history, valueDate, currentTheme, activeColors, darkMode]);

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
                <Animated.View style={{
                    position: 'absolute', bottom: -100, left: 50, width: 250, height: 250,
                    borderRadius: 125, backgroundColor: currentTheme.primary, opacity: 0.12, filter: 'blur(40px)',
                    transform: [
                        { scale: auroraAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1.8, 1.4, 1.8] }) },
                        { translateX: auroraAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -40, 0] }) }
                    ]
                }} />

                <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                    <ConnectionStatus isConnected={isConnected} activeColors={activeColors} />

                    <AppHeader
                        date={date}
                        valueDate={valueDate}
                        activeColors={activeColors}
                        setMenuVisible={() => setActiveTab(TABS.SETTINGS)}
                        theme={currentTheme}
                    />

                    <LastUpdatedBadge 
                        lastUpdated={lastUpdated} 
                        activeColors={activeColors}
                        onPress={handleRefresh}
                    />

                    <ScrollView
                        key={activeThemeKey}
                        contentContainerStyle={{ paddingBottom: 100 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={handleRefresh}
                                tintColor={activeColors.textDark}
                                colors={[currentTheme.primary]}
                            />
                        }
                    >
                        {renderContent()}
                    </ScrollView>

                    <FloatingRefreshButton 
                        onPress={handleRefresh} 
                        refreshing={refreshing}
                        theme={currentTheme}
                        activeColors={activeColors}
                    />

                    <TabBar 
                        activeTab={activeTab} 
                        setActiveTab={setActiveTab} 
                        theme={currentTheme}
                        activeColors={activeColors}
                    />
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

function Switch({ value, onValueChange, theme, activeColors }) {
    const [animValue] = useState(new Animated.Value(value ? 1 : 0));

    useEffect(() => {
        Animated.timing(animValue, {
            toValue: value ? 1 : 0,
            duration: 200,
            useNativeDriver: false
        }).start();
    }, [value]);

    const translateX = animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [2, 22]
    });

    return (
        <TouchableOpacity 
            onPress={() => onValueChange(!value)}
            style={[
                styles.switch, 
                { 
                    backgroundColor: value ? theme.primary : activeColors.border,
                    borderColor: value ? theme.primary : 'transparent'
                }
            ]}
        >
            <Animated.View style={[styles.switchThumb, { transform: [{ translateX }] }]} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    skeletonCard: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
    },
    skeletonIcon: {
        width: 48,
        height: 48,
        borderRadius: 16,
        marginRight: 14,
    },
    skeletonText: {
        height: 16,
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    skeletonTextSmall: {
        height: 12,
        backgroundColor: '#fff',
        borderRadius: 4,
    },
    skeletonButton: {
        width: 80,
        height: 40,
        borderRadius: 16,
        backgroundColor: '#fff',
    },
    skeletonRate: {
        height: 40,
        backgroundColor: '#fff',
        borderRadius: 8,
        width: '60%',
    },
    connectionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    connectionText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 6,
    },
    floatingButton: {
        position: 'absolute',
        bottom: 90,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    tabBar: {
        flexDirection: 'row',
        borderTopWidth: 1,
        paddingVertical: 8,
        paddingHorizontal: 10,
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 4,
    },
    tabIndicator: {
        position: 'absolute',
        top: 0,
        width: 40,
        height: 3,
        borderRadius: 2,
    },
    lastUpdatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 10,
    },
    lastUpdatedText: {
        color: '#8B9BB4',
        fontSize: 11,
        fontWeight: '600',
        marginLeft: 6,
    },
    settingsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    settingsTitle: {
        fontSize: 15,
        fontWeight: '700',
    },
    settingsSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    switch: {
        width: 48,
        height: 28,
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    switchThumb: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#fff',
    },
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
