import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import RateCard from './RateCard';

const Rates = ({ rates, activeCalc, toggleCalc, activeColors, onShare, theme }) => {
    return (
        <View>
            {rates && rates.bdv ? (
                <RateCard
                    id="bcv-usd"
                    title="BCV"
                    subtitle="Dólar Oficial"
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
                    title="BCV"
                    subtitle="Euro Oficial"
                    rateValue={rates.bdv.eur.rate}
                    isActive={activeCalc === 'bcv-eur'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={{ ...theme, primary: '#EA580C', primarySoft: '#FFF7ED' }}
                    activeColors={activeColors}
                    delay={200}
                />
            )}

            <TouchableOpacity onPress={() => Linking.openURL('http://bcv.org.ve')} style={{ paddingVertical: 5, width: '100%', alignItems: 'center' }}>
                <Text style={{
                    color: activeColors.primary,
                    fontSize: 11,
                    textAlign: 'center',
                    fontStyle: 'italic',
                    textDecorationLine: 'underline'
                }}>
                    Para validar su información consulte bcv.org.ve
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Rates;
