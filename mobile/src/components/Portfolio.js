import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const Portfolio = ({ activeColors, history }) => {
    // Process history data for chart
    const processData = () => {
        if (!history || history.length === 0) return { items: [], max: 0, min: 0 };

        // Ensure we have data and sort it just in case, though usually comes sorted
        // API returns: [{ rates: { bdv: { usd: { rate: ... } } }, date: "YYYY-MM-DD", ... }]

        // Take last 7 entries
        let data = [...history].slice(-7);

        const todayStr = new Date().toISOString().split('T')[0];

        let maxRate = 0;
        let minRate = Infinity;

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // 1. Map data and identify min/max
        const chartItems = data.map(item => {
            const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
            const rate = item?.rates?.bdv?.usd?.rate ? parseFloat(item.rates.bdv.usd.rate) : 0;

            if (rate > maxRate) maxRate = rate;
            if (rate > 0 && rate < minRate) minRate = rate;

            return { date: dateSource, rate, label: "" };
        });

        // 2. Identify the "Active" rate index (latest where date <= today)
        let activeIndex = -1;
        for (let i = chartItems.length - 1; i >= 0; i--) {
            if (chartItems[i].date <= todayStr) {
                activeIndex = i;
                break;
            }
        }

        // 3. Assign labels based on proximity to active rate
        chartItems.forEach((item, index) => {
            if (index === activeIndex) {
                item.label = "Hoy";
            } else if (activeIndex !== -1 && index === activeIndex - 1) {
                item.label = "Ayer";
            } else if (index > activeIndex && activeIndex !== -1) {
                item.label = "Cierre";
            } else if (item.date) {
                const parts = item.date.split('-');
                item.label = `${months[parseInt(parts[1], 10) - 1]} ${parts[2]}`;
            } else {
                item.label = "???";
            }
        });

        // Add some padding to min/max for chart visuals
        return {
            items: chartItems,
            max: maxRate > 0 ? maxRate * 1.005 : 100,
            min: minRate < Infinity ? minRate * 0.995 : 0
        };
    };

    const chartData = processData();
    const hasData = chartData.items && chartData.items.length > 0;

    return (
        <View style={styles.container}>
            <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}>
                {hasData ? (
                    <View>
                        <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5 }}>
                            <Text style={{ color: activeColors.textDark, fontSize: 16, fontWeight: '800' }}>Gráfica Histórica</Text>
                            <Text style={{ color: activeColors.secondary, fontSize: 12 }}>Últimos 7 días</Text>
                        </View>
                        <LineChart
                            data={{
                                labels: chartData.items.map(i => i.label),
                                datasets: [{
                                    data: chartData.items.map(i => i.rate)
                                }]
                            }}
                            width={screenWidth - 60} // Adjusted width to prevent clipping
                            height={180}
                            chartConfig={{
                                backgroundColor: activeColors.cardCtx,
                                backgroundGradientFrom: activeColors.cardCtx,
                                backgroundGradientTo: activeColors.cardCtx,
                                decimalPlaces: 2,
                                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`, // Blue primary color
                                labelColor: (opacity = 1) => activeColors.textDark, // Dark text for labels
                                style: { borderRadius: 16 },
                                propsForDots: {
                                    r: "4", // Show dots slightly for better data point visibility
                                    strokeWidth: "2",
                                    stroke: activeColors.primary
                                },
                                propsForLabels: {
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    rotation: 0
                                },
                                propsForBackgroundLines: {
                                    strokeDasharray: "", // Solid lines
                                    strokeWidth: 1,
                                    stroke: activeColors.border // Subtle grid
                                }
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                                paddingRight: 50 // Increased padding
                            }}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                        />
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
        marginBottom: 10,
    },
    chartCard: {
        padding: 5,
        borderRadius: 18,
        borderWidth: 1,
        elevation: 3,
        overflow: 'hidden'
    }
});

export default Portfolio;
