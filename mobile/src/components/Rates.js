import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RateCard from './RateCard';

const Rates = ({ rates, activeCalc, toggleCalc, activeColors, onShare, theme }) => {
    return (
        <View style={styles.container}>
            {rates && rates.bdv ? (
                <RateCard
                    id="bcv-usd"
                    title="Dólar"
                    subtitle="Dólar Oficial (USD)"
                    rateValue={rates.bdv.usd.rate}
                    isActive={activeCalc === 'bcv-usd'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={theme}
                    activeColors={activeColors}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="cloud-offline-outline" size={28} color="#64748B" style={{ marginBottom: 6 }} />
                    <Text style={styles.emptyText}>No se pudo cargar la tasa</Text>
                    <Text style={styles.emptySubtext}>Desliza hacia abajo para reintentar</Text>
                </View>
            )}

            {rates && rates.bdv && rates.bdv.eur && (
                <RateCard
                    id="bcv-eur"
                    title="Euro"
                    subtitle="Euro Oficial (EUR)"
                    rateValue={rates.bdv.eur.rate}
                    isActive={activeCalc === 'bcv-eur'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={{ ...theme, primary: '#3B82F6', primarySoft: 'rgba(59, 130, 246, 0.15)' }}
                    activeColors={activeColors}
                    delay={100}
                />
            )}

            {rates && rates.binance && rates.binance.usd && (
                <RateCard
                    id="binance-usd"
                    title="USDT"
                    subtitle="Binance P2P (Mercado)"
                    rateValue={rates.binance.usd.rate}
                    isActive={activeCalc === 'binance-usd'}
                    onToggle={toggleCalc}
                    onShare={onShare}
                    theme={{ ...theme, primary: '#F0B90B', primarySoft: 'rgba(240, 185, 11, 0.15)' }}
                    activeColors={activeColors}
                    delay={200}
                />
            )}

            <TouchableOpacity
                onPress={() => Linking.openURL('https://www.bcv.org.ve')}
                activeOpacity={0.7}
                style={styles.sourceBtn}
            >
                <Ionicons name="information-circle-outline" size={14} color="#64748B" style={{ marginRight: 5 }} />
                <Text style={styles.sourceText}>
                    Fuente oficial: Banco Central de Venezuela (bcv.org.ve)
                </Text>
            </TouchableOpacity>
        </View>
    );
};

export default Rates;

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
    emptyContainer: {
        padding: 30,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111726',
        borderRadius: 20,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    emptyText: {
        color: '#E2E8F0',
        fontSize: 14,
        fontWeight: '600',
    },
    emptySubtext: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 2,
    },
    sourceBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        marginTop: 2,
    },
    sourceText: {
        color: '#64748B',
        fontSize: 11,
        fontWeight: '500',
    },
});
