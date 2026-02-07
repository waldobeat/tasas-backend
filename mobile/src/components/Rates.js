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
            {rates && rates.bdv && (
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
            )}
        </View>
    );
};

export default Rates;
