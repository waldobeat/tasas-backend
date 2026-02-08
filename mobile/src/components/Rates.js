import React from 'react';
import { View } from 'react-native';
import RateCard from './RateCard';

const Rates = ({ rates, activeCalc, toggleCalc, activeColors }) => {
    // Current theme fallback if not provided
    const theme = {
        primary: '#3498db',
        primarySoft: 'rgba(52, 152, 219, 0.1)'
    };

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
                    onShare={() => { }} // Removed for simplification
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
                    onShare={() => { }}
                    theme={{ ...theme, primary: '#EA580C', primarySoft: '#FFF7ED' }} // Orange for Euro to distinguish
                    activeColors={activeColors}
                    delay={200}
                />
            )}
        </View>
    );
};

export default Rates;
