import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';
import { formatNumber } from '../utils/helpers';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

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

            {/* Premium JS Line Chart */}
            <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border, padding: scale(5), overflow: 'hidden' }]}>
                {hasData ? (
                    <LineChart
                        data={{
                            labels: chartData.items.map(i => i.label),
                            datasets: [{
                                data: chartData.items.map(i => i.rate)
                            }]
                        }}
                        width={screenWidth - scale(60)}
                        height={verticalScale(160)}
                        chartConfig={{
                            backgroundColor: activeColors.cardCtx,
                            backgroundGradientFrom: activeColors.cardCtx,
                            backgroundGradientTo: activeColors.cardCtx,
                            decimalPlaces: 2,
                            color: (opacity = 1) => theme.primary,
                            labelColor: (opacity = 1) => activeColors.secondary,
                            style: {
                                borderRadius: 16
                            },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: theme.primary
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16,
                            marginLeft: -scale(15)
                        }}
                        withInnerLines={false}
                        withOuterLines={false}
                    />
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
