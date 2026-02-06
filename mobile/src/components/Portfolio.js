import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { formatNumber } from '../utils/helpers';

const Portfolio = ({ theme, activeColors, history }) => {

    // Process history data for chart
    // We want: Last 7 days, Daily Closing Rate
    const processData = () => {
        if (!history || history.length === 0) return { items: [], max: 0, min: 0 };

        // Take last 7 entries
        let data = history.slice(-7);

        // Find max and min for scaling
        let maxRate = 0;
        let minRate = Infinity;

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();
        // Reset time for accurate date comparison
        now.setHours(0, 0, 0, 0);

        const chartItems = data.map(item => {
            let label;

            if (item.date) {
                // Use the explicit date string (YYYY-MM-DD)
                // Example: "2026-02-06"
                const [y, m, d] = item.date.split('-').map(Number);
                // Create local date at midnight
                const localDate = new Date(y, m - 1, d); // Month is 0-indexed
                const compareTime = localDate.getTime();

                // Diff in days (approximation)
                const diffTime = compareTime - now.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                const dayStr = d.toString().padStart(2, '0');
                const monthStr = months[m - 1];

                if (diffDays === 0) label = "Hoy";
                else if (diffDays === -1) label = "Ayer";
                else if (diffDays === 1) label = "Mañana";
                else label = `${monthStr} ${dayStr}`;

            } else {
                // Fallback to timestamp if date key is missing (legacy)
                const date = new Date(item.timestamp);
                const compareDate = new Date(date);
                compareDate.setHours(0, 0, 0, 0);

                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);

                if (compareDate.getTime() === now.getTime()) {
                    label = "Hoy";
                } else if (compareDate.getTime() === yesterday.getTime()) {
                    label = "Ayer";
                } else {
                    const day = date.getDate().toString().padStart(2, '0');
                    const month = months[date.getMonth()];
                    label = `${month} ${day}`;
                }
            }

            // A veces el rate viene como string "381.11" o numero
            const rate = item.rates && item.rates.bdv && item.rates.bdv.usd ? parseFloat(item.rates.bdv.usd.rate) : 0;

            if (rate > maxRate) maxRate = rate;
            if (rate > 0 && rate < minRate) minRate = rate;

            return { label, rate };
        });

        // Add a buffer to max rate for visual spacing
        return { items: chartItems, max: maxRate * 1.05, min: minRate * 0.95 };
    };

    const chartData = processData();
    const hasData = chartData.items && chartData.items.length > 0;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: scale(15) }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: theme.primarySoft, padding: scale(8), borderRadius: scale(10), marginRight: scale(10) }}>
                        <Ionicons name="stats-chart" size={scale(18)} color={theme.primary} />
                    </View>
                    <Text style={{ color: activeColors.textDark, fontSize: moderateScale(16), fontWeight: '900', letterSpacing: -0.5 }}>
                        Tendencia (7 Días)
                    </Text>
                </View>
            </View>

            {/* Simple JS Bar Chart */}
            <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}>
                {hasData ? (
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: verticalScale(150), paddingTop: 20 }}>
                        {chartData.items.map((item, index) => {
                            // Calculate height relative to max (simple normalization)
                            // To make differences more visible, we can normalize based on min-max range
                            const range = chartData.max - chartData.min;
                            const normalizedHeight = range === 0 ? 0.5 : (item.rate - chartData.min) / range;
                            // Clamp between 10% and 100% height
                            const barHeight = Math.max(10, normalizedHeight * 100);

                            // Highlight the last bar (active)
                            const isLast = index === chartData.items.length - 1;

                            return (
                                <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                                    <Text style={{
                                        fontSize: scale(9),
                                        color: isLast ? theme.primary : activeColors.secondary,
                                        marginBottom: 4,
                                        fontWeight: isLast ? '900' : '700'
                                    }}>
                                        {formatNumber(item.rate)}
                                    </Text>
                                    <View style={{
                                        width: scale(12),
                                        height: `${barHeight}%`,
                                        backgroundColor: theme.primary,
                                        borderRadius: 4,
                                        opacity: isLast ? 1 : 0.4
                                    }} />
                                    <Text style={{
                                        fontSize: scale(9),
                                        color: isLast ? activeColors.textDark : activeColors.secondary,
                                        marginTop: 6
                                    }}>
                                        {item.label}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                ) : (
                    <View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={{ color: activeColors.secondary }}>Cargando historial...</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: scale(10),
    },
    chartCard: {
        padding: scale(15),
        borderRadius: scale(18),
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    }
});

export default Portfolio;
