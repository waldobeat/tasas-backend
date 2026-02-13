import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

const Portfolio = ({ activeColors, history }) => {
    const [selectedPoint, setSelectedPoint] = React.useState(null);

    // Process history data for chart
    const processData = () => {
        if (!history || history.length === 0) return { items: [], max: 0, min: 0 };

        // Ensure we have data and sort it just in case, though usually comes sorted
        // API returns: [{ rates: { bdv: { usd: { rate: ... } } }, date: "YYYY-MM-DD", ... }]

        // --- 7:00 AM Logic ---
        const now = new Date();
        const currentHour = now.getHours();
        let effectiveToday = now.toISOString().split('T')[0];
        if (currentHour < 7) {
            const d = new Date(now);
            d.setDate(d.getDate() - 1);
            effectiveToday = d.toISOString().split('T')[0];
        }


        // --- Monday Logic ---
        // Calculate the date of the most recent Monday
        const getMonday = (d) => {
            d = new Date(d);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            return new Date(d.setDate(diff));
        }


        // --- Deduplication Logic ---
        // Create a map to keep only the latest entry per date
        const uniqueDataMap = new Map();
        history.forEach(item => {
            const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
            if (dateSource) {
                // By setting it repeatedly, we keep the last one found in the array (assuming chronological order)
                // If history is not sorted, we might need to sort first, but usually API sends sorted.
                uniqueDataMap.set(dateSource, item);
            }
        });

        const uniqueHistory = Array.from(uniqueDataMap.values());

        // --- Monday Logic ---
        // Calculate the date of the most recent Monday
        const mondayDate = getMonday(new Date(effectiveToday));
        const mondayString = mondayDate.toISOString().split('T')[0];

        // Filter: Date >= Monday AND Date <= EffectiveToday
        let data = uniqueHistory
            .filter(item => {
                const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
                return dateSource && dateSource >= mondayString && dateSource <= effectiveToday;
            });

        // Fallback: If less than 3 points, take last 5 valid points (from unique history)
        if (data.length < 3) {
            data = uniqueHistory
                .filter(item => {
                    const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
                    return dateSource && dateSource <= effectiveToday;
                })
                .slice(-5);
        }

        let maxRate = 0;
        let minRate = Infinity;

        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        // 1. Map data and identify min/max
        const chartItems = data.map(item => {
            const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
            const rate = item?.rates?.bdv?.usd?.rate ? parseFloat(item.rates.bdv.usd.rate) : 0;
            const fullDate = item.value_date || dateSource;

            if (rate > maxRate) maxRate = rate;
            if (rate > 0 && rate < minRate) minRate = rate;

            return { date: dateSource, fullDate, rate, label: "" };
        });

        // 2. Identify the "Active" rate index (latest where date <= effectiveToday)
        let activeIndex = -1;
        for (let i = chartItems.length - 1; i >= 0; i--) {
            if (chartItems[i].date && chartItems[i].date <= effectiveToday) {
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
            } else if (item.date && item.date.includes('-')) {
                const parts = item.date.split('-');
                if (parts.length >= 3) {
                    const monthIdx = parseInt(parts[1], 10) - 1;
                    item.label = `${months[monthIdx] || '???'} ${parts[2]}`;
                } else {
                    item.label = "???";
                }
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
                        <View style={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 5, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View>
                                <Text style={{ color: activeColors.textDark, fontSize: 16, fontWeight: '800' }}>
                                    {chartData.items.length < 3 ? "Histórico Recente" : "Histórico (Semana Actual)"}
                                </Text>
                                <Text style={{ color: activeColors.secondary, fontSize: 12 }}>
                                    {chartData.items.length < 3 ? "Últimos 5 días" : "Desde el Lunes"}
                                </Text>
                            </View>
                            {selectedPoint && (
                                <View style={{ backgroundColor: activeColors.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, elevation: 4 }}>
                                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 13 }}>
                                        {selectedPoint.label}: {selectedPoint.value} Bs
                                    </Text>
                                </View>
                            )}
                        </View>
                        <LineChart
                            data={{
                                labels: chartData.items.map(i => i.label),
                                datasets: [{
                                    data: chartData.items.map(i => i.rate)
                                }]
                            }}
                            width={screenWidth - 40} // Adjusted for the 15 + 15 container padding
                            height={190}
                            chartConfig={{
                                backgroundColor: activeColors.cardCtx,
                                backgroundGradientFrom: activeColors.cardCtx,
                                backgroundGradientTo: activeColors.cardCtx,
                                decimalPlaces: 2,
                                color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
                                labelColor: (opacity = 1) => activeColors.textDark,
                                style: { borderRadius: 16 },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: activeColors.primary
                                },
                                propsForLabels: {
                                    fontSize: 11,
                                    fontWeight: 'bold'
                                },
                                propsForBackgroundLines: {
                                    strokeDasharray: "",
                                    strokeWidth: 0.5,
                                    stroke: activeColors.border
                                }
                            }}
                            onDataPointClick={({ value, index }) => {
                                const item = chartData.items[index];
                                setSelectedPoint({ value: value.toFixed(2), label: item.label, date: item.fullDate });
                            }}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                            withHorizontalLabels={true}
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
        paddingVertical: 15,
        paddingHorizontal: 15,
        borderRadius: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
        elevation: 6,
        overflow: 'hidden'
    }
});

export default Portfolio;
