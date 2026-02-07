import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const Portfolio = ({ activeColors, history }) => {
    // Process history data for chart
    const processData = () => {
        if (!history || history.length === 0) return { items: [], max: 0, min: 0 };

        // Take last 7 entries
        let data = history.slice(-7);

        let maxRate = 0;
        let minRate = Infinity;

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const chartItems = data.map(item => {
            let label = "???";
            const timestamp = item.timestamp || item.date;

            if (timestamp) {
                try {
                    const date = new Date(timestamp);
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
                } catch (e) {
                    console.log("Error parsing items timestamp:", e.message);
                }
            }

            const rate = item?.rates?.bdv?.usd?.rate ? parseFloat(item.rates.bdv.usd.rate) : 0;
            if (rate > maxRate) maxRate = rate;
            if (rate > 0 && rate < minRate) minRate = rate;

            return { label, rate };
        });

        return { items: chartItems, max: maxRate * 1.05, min: minRate * 0.95 };
    };

    const chartData = processData();
    const hasData = chartData.items && chartData.items.length > 0;

    return (
        <View style={styles.container}>
            <View style={[styles.chartCard, { backgroundColor: activeColors.cardCtx, borderColor: activeColors.border }]}>
                {hasData ? (
                    <LineChart
                        data={{
                            labels: chartData.items.map(i => i.label),
                            datasets: [{
                                data: chartData.items.map(i => i.rate)
                            }]
                        }}
                        width={screenWidth - 70}
                        height={160}
                        chartConfig={{
                            backgroundColor: activeColors.cardCtx,
                            backgroundGradientFrom: activeColors.cardCtx,
                            backgroundGradientTo: activeColors.cardCtx,
                            decimalPlaces: 2,
                            color: (opacity = 1) => activeColors.secondary,
                            labelColor: (opacity = 1) => activeColors.secondary,
                            style: { borderRadius: 16 },
                            propsForDots: {
                                r: "4",
                                strokeWidth: "2",
                                stroke: activeColors.secondary
                            }
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16,
                            marginLeft: -30
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
