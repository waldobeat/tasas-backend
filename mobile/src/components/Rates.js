import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import RateCard from './RateCard';

const Rates = ({ rates, activeCalc, toggleCalc, activeColors, onShare, theme }) => {
    return (
        <View>
            {rates && rates.bdv ? (
                <RateCard
                    id="bcv-usd"
                    title="DOLAR"
                    subtitle="Tasa Oficial"
                    rateValue={rates.bdv.usd.rate}
                    isActive={activeCalc === 'bcv-usd'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={theme}
                    activeColors={activeColors}
                />
            ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: activeColors.secondary }}>No se pudo cargar la tasa.</Text>
                    <Text style={{ color: activeColors.secondary, fontSize: 10 }}>Verifique su conexión</Text>
                </View>
            )}

            {rates && rates.bdv && rates.bdv.eur && (
                <RateCard
                    id="bcv-eur"
                    title="EURO"
                    subtitle="Tasa Oficial"
                    rateValue={rates.bdv.eur.rate}
                    isActive={activeCalc === 'bcv-eur'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={{ ...theme, primary: '#EA580C', primarySoft: '#FFF7ED' }}
                    activeColors={activeColors}
                    delay={200}
                />
            )}

            {rates && rates.binance && rates.binance.usd && (
                <RateCard
                    id="binance-usd"
                    title="BINANCE P2P"
                    subtitle="USDT"
                    rateValue={rates.binance.usd.rate}
                    isActive={activeCalc === 'binance-usd'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={{ ...theme, primary: '#F0B90B', primarySoft: '#FEF9C3' }} // Binance Yellow theme
                    activeColors={activeColors}
                    delay={400}
                />
            )}

            <TouchableOpacity onPress={() => Linking.openURL('https://www.bcv.org.ve')} style={{ paddingVertical: 5, width: '100%', alignItems: 'center' }}>
                <Text style={{
                    color: activeColors.primary,
                    fontSize: 12,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    textDecorationLine: 'underline'
                }}>
                    Para validar su información consulte la fuente oficial aquí
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Rates;
