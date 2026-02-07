import React from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import RateCard from '../components/RateCard';
import Portfolio from '../components/Portfolio';
import AuthScreen from '../components/AuthScreen';
import FinancialDashboard from '../components/FinancialDashboard';
import { verticalScale, scale } from '../styles/theme';

const MainNavigator = ({
    activeModule,
    user,
    rates,
    ratesLoading,
    history,
    portfolio,
    activeCalc,
    valueDate,
    date,
    lastUpdated,
    refreshing,
    onRefresh,
    toggleCalc,
    handleShare,
    handleAuthSuccessExtended,
    onShowPrivacy,
    financialDashboardProps, // Bundle these for cleanliness
    theme,
    activeColors,
    cardRefs
}) => {

    // View 1: Rates or Auth
    if (activeModule === 'rates' || !user) {
        return (
            <ScrollView
                contentContainerStyle={{
                    paddingHorizontal: scale(20),
                    paddingBottom: verticalScale(50),
                    flexGrow: 1,
                    justifyContent: 'center'
                }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[theme.primary]}
                        tintColor={theme.primary}
                    />
                }
            >
                {ratesLoading && !rates ? (
                    <ActivityIndicator size="large" color={theme.primary} />
                ) : activeModule === 'rates' ? (
                    <>
                        {rates?.bdv && rates.bdv.usd && rates.bdv.eur && (
                            <>
                                <RateCard
                                    id="bdv-usd"
                                    title="USD"
                                    subtitle="Tasa Oficial"
                                    rateValue={rates.bdv.usd.rate || 0}
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
                                    rateValue={rates.bdv.eur.rate || 0}
                                    isActive={activeCalc === 'bdv-eur'}
                                    onToggle={toggleCalc}
                                    onShare={handleShare}
                                    theme={theme}
                                    activeColors={activeColors}
                                    ref={(el) => (cardRefs.current['bdv-eur'] = el)}
                                    delay={500}
                                />
                                {valueDate && (
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
                                )}
                            </>
                        )}
                        {Array.isArray(history) && history.length > 0 && (
                            <Portfolio
                                portfolio={Array.isArray(portfolio) ? portfolio : []}
                                theme={theme}
                                activeColors={activeColors}
                                rates={rates}
                                history={history}
                            />
                        )}
                        <View style={{ alignItems: 'center', marginTop: scale(10), marginBottom: scale(30) }}>
                            <TouchableOpacity onPress={onShowPrivacy}>
                                <Text style={{ fontSize: scale(11), fontWeight: 'bold', textDecorationLine: 'underline', color: theme.primary }}>
                                    Aviso Legal y Privacidad
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <AuthScreen
                        onAuthSuccess={handleAuthSuccessExtended}
                        theme={theme}
                        activeColors={activeColors}
                        valueDate={valueDate}
                        date={date}
                        lastUpdated={lastUpdated}
                        onShowPrivacy={onShowPrivacy}
                        onUnlockRegister={(cb) => cb()}
                    />
                )}
                <View style={{ height: verticalScale(40) }} />
            </ScrollView>
        );
    }

    // View 2: Financial Dashboard
    return (
        <FinancialDashboard
            user={user}
            theme={theme}
            activeColors={activeColors}
            {...financialDashboardProps}
            portfolio={portfolio}
        />
    );
};

export default MainNavigator;
