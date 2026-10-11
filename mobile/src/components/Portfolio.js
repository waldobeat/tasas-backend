import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { scale, moderateScale, verticalScale } from '../styles/theme';

const screenWidth = Dimensions.get('window').width;

const Portfolio = ({ activeColors, history, theme }) => {
    const [selectedPoint, setSelectedPoint] = useState(null);

    const processData = () => {
        if (!history || history.length === 0) return { items: [], max: 0, min: 0 };

        const now = new Date();
        const currentHour = now.getHours();
        let effectiveToday = now.toISOString().split('T')[0];
        if (currentHour < 7) {
            const d = new Date(now);
            d.setDate(d.getDate() - 1);
            effectiveToday = d.toISOString().split('T')[0];
        }

        const getMonday = (d) => {
            d = new Date(d);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff));
        };

        const uniqueDataMap = new Map();
        history.forEach(item => {
            const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
            if (dateSource) {
                uniqueDataMap.set(dateSource, item);
            }
        });

        const uniqueHistory = Array.from(uniqueDataMap.values());
        const mondayDate = getMonday(new Date(effectiveToday));
        const mondayString = mondayDate.toISOString().split('T')[0];

        let data = uniqueHistory.filter(item => {
            const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
            return dateSource && dateSource >= mondayString && dateSource <= effectiveToday;
        });

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

        const chartItems = data.map(item => {
            const dateSource = item.date || (item.timestamp ? item.timestamp.split('T')[0] : null);
            const rate = item?.rates?.bdv?.usd?.rate ? parseFloat(item.rates.bdv.usd.rate) : 0;
            const fullDate = item.value_date || dateSource;

            if (rate > maxRate) maxRate = rate;
            if (rate > 0 && rate < minRate) minRate = rate;

            return { date: dateSource, fullDate, rate, label: "" };
        });

        let activeIndex = -1;
        for (let i = chartItems.length - 1; i >= 0; i--) {
            if (chartItems[i].date && chartItems[i].date <= effectiveToday) {
                activeIndex = i;
                break;
            }
        }

        chartItems.forEach((item, index) => {
            if (index === activeIndex) {
                item.label = "Hoy";
            } else if (activeIndex !== -1 && index === activeIndex - 1) {
                item.label = "Ayer";
            } else if (item.date && item.date.includes('-')) {
                const parts = item.date.split('-');
                if (parts.length >= 3) {
                    const monthIdx = parseInt(parts[1], 10) - 1;
                    item.label = `${months[monthIdx] || ''} ${parts[2]}`;
                } else {
                    item.label = "";
                }
            } else {
                item.label = "";
            }
        });

        return {
            items: chartItems,
            max: maxRate > 0 ? maxRate * 1.005 : 100,
            min: minRate < Infinity ? minRate * 0.995 : 0
        };
    };

    const chartData = processData();
    const hasData = chartData.items && chartData.items.length > 0;
    const accentColor = theme?.primary || '#00E5FF';

    return (
        <View style={styles.container}>
            <View style={styles.chartCard}>
                {hasData ? (
                    <View>
                        <View style={styles.header}>
                            <View>
                                <View style={styles.titleRow}>
                                    <Ionicons name="stats-chart" size={16} color={accentColor} style={{ marginRight: 6 }} />
                                    <Text style={styles.titleText}>HISTORIAL BCV USD</Text>
                                </View>
                                <Text style={styles.subtitleText}>
                                    {chartData.items.length < 3 ? "Últimos 5 registros" : "Evolución de la semana"}
                                </Text>
                            </View>

                            {selectedPoint && (
                                <View style={[styles.tooltip, { borderColor: accentColor + '60' }]}>
                                    <Text style={styles.tooltipLabel}>{selectedPoint.label}: </Text>
                                    <Text style={[styles.tooltipValue, { color: accentColor }]}>{selectedPoint.value} Bs</Text>
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
                            width={screenWidth - scale(40)}
                            height={180}
                            chartConfig={{
                                backgroundColor: 'transparent',
                                backgroundGradientFrom: '#111726',
                                backgroundGradientTo: '#111726',
                                backgroundGradientFromOpacity: 0,
                                backgroundGradientToOpacity: 0,
                                decimalPlaces: 2,
                                color: (opacity = 1) => accentColor,
                                labelColor: () => '#64748B',
                                style: { borderRadius: 16 },
                                propsForDots: {
                                    r: "4",
                                    strokeWidth: "2",
                                    stroke: accentColor,
                                    fill: '#111726'
                                },
                                fillShadowGradientFrom: accentColor,
                                fillShadowGradientFromOpacity: 0.25,
                                fillShadowGradientTo: '#111726',
                                fillShadowGradientToOpacity: 0.0,
                                propsForLabels: {
                                    fontSize: 10,
                                    fontWeight: '700',
                                    fill: '#64748B'
                                },
                                propsForBackgroundLines: {
                                    strokeDasharray: "4, 4",
                                    strokeWidth: 0.8,
                                    stroke: 'rgba(255,255,255,0.06)'
                                }
                            }}
                            onDataPointClick={({ value, index }) => {
                                const item = chartData.items[index];
                                setSelectedPoint({ value: value.toFixed(2), label: item.label, date: item.fullDate });
                            }}
                            bezier
                            style={{
                                marginVertical: 6,
                                borderRadius: 16,
                                paddingRight: 35,
                            }}
                            withInnerLines={true}
                            withOuterLines={false}
                            withVerticalLines={false}
                            withHorizontalLabels={true}
                        />
                    </View>
                ) : (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Cargando historial...</Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export default Portfolio;

const styles = StyleSheet.create({
    container: {
        marginBottom: verticalScale(14),
    },
    chartCard: {
        backgroundColor: '#111726',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        paddingTop: 16,
        paddingBottom: 8,
        paddingHorizontal: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 8,
        marginBottom: 8,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleText: {
        color: '#FFFFFF',
        fontSize: moderateScale(13),
        fontWeight: '800',
        letterSpacing: 0.8,
    },
    subtitleText: {
        color: '#64748B',
        fontSize: moderateScale(11),
        fontWeight: '500',
        marginTop: 2,
    },
    tooltip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
    },
    tooltipLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '600',
    },
    tooltipValue: {
        fontSize: 12,
        fontWeight: '800',
    },
    loadingContainer: {
        height: 140,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#64748B',
        fontSize: 13,
    },
});
