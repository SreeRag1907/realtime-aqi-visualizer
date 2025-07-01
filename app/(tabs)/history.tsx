import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Filter,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedPollutant, setSelectedPollutant] = useState('aqi');

  const periods = [
    { id: 'week', name: '7 Days' },
    { id: 'month', name: '30 Days' },
    { id: 'quarter', name: '3 Months' },
    { id: 'year', name: '1 Year' },
  ];

  const pollutants = [
    { id: 'aqi', name: 'AQI', color: '#7C3AED' },
    { id: 'pm25', name: 'PM2.5', color: '#EF4444' },
    { id: 'pm10', name: 'PM10', color: '#F59E0B' },
    { id: 'no2', name: 'NO₂', color: '#10B981' },
    { id: 'o3', name: 'O₃', color: '#3B82F6' },
  ];

  const weeklyData = [
    { day: 'Mon', value: 85, trend: 'up' },
    { day: 'Tue', value: 78, trend: 'down' },
    { day: 'Wed', value: 92, trend: 'up' },
    { day: 'Thu', value: 67, trend: 'down' },
    { day: 'Fri', value: 89, trend: 'up' },
    { day: 'Sat', value: 72, trend: 'down' },
    { day: 'Sun', value: 94, trend: 'up' },
  ];

  const monthlyAverages = [
    { month: 'Jan', aqi: 145, pm25: 78, trend: 'down' },
    { month: 'Feb', aqi: 132, pm25: 71, trend: 'down' },
    { month: 'Mar', aqi: 98, pm25: 54, trend: 'down' },
    { month: 'Apr', aqi: 76, pm25: 42, trend: 'down' },
    { month: 'May', aqi: 89, pm25: 48, trend: 'up' },
    { month: 'Jun', aqi: 112, pm25: 63, trend: 'up' },
  ];

  const getMaxValue = () => {
    return Math.max(...weeklyData.map(item => item.value));
  };

  const Chart = () => (
    <View style={styles.chartContainer}>
      <View style={styles.chartGrid}>
        {[100, 75, 50, 25].map((value, index) => (
          <View key={index} style={styles.gridLine}>
            <Text style={styles.gridLabel}>{value}</Text>
            <View style={styles.gridLineBar} />
          </View>
        ))}
      </View>
      
      <View style={styles.chartBars}>
        {weeklyData.map((item, index) => (
          <View key={index} style={styles.barContainer}>
            <LinearGradient
              colors={['#7C3AED', '#3B82F6']}
              style={[
                styles.bar,
                { height: (item.value / getMaxValue()) * 150 }
              ]}
            />
            <Text style={styles.barLabel}>{item.day}</Text>
            <Text style={styles.barValue}>{item.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const TrendCard = ({ title, current, previous, unit }) => {
    const change = current - previous;
    const percentage = ((change / previous) * 100).toFixed(1);
    const isUp = change > 0;

    return (
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.trendCard}
      >
        <Text style={styles.trendTitle}>{title}</Text>
        <View style={styles.trendContent}>
          <Text style={styles.trendValue}>{current} {unit}</Text>
          <View style={styles.trendChange}>
            {isUp ? (
              <TrendingUp size={16} color="#EF4444" />
            ) : (
              <TrendingDown size={16} color="#10B981" />
            )}
            <Text style={[
              styles.trendPercentage,
              { color: isUp ? '#EF4444' : '#10B981' }
            ]}>
              {Math.abs(parseFloat(percentage))}%
            </Text>
          </View>
        </View>
      </LinearGradient>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Historical Trends</Text>
        
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.activePeriodButton,
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.activePeriodButtonText,
              ]}>
                {period.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.pollutantSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pollutants.map((pollutant) => (
              <TouchableOpacity
                key={pollutant.id}
                style={[
                  styles.pollutantButton,
                  selectedPollutant === pollutant.id && {
                    backgroundColor: pollutant.color,
                  },
                ]}
                onPress={() => setSelectedPollutant(pollutant.id)}
              >
                <Text style={[
                  styles.pollutantButtonText,
                  selectedPollutant === pollutant.id && styles.activePollutantButtonText,
                ]}>
                  {pollutant.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.trendsContainer}>
          <TrendCard
            title="Weekly Average"
            current={82}
            previous={89}
            unit="AQI"
          />
          <TrendCard
            title="PM2.5 Level"
            current={45}
            previous={52}
            unit="μg/m³"
          />
        </View>

        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.chartCard}
        >
          <View style={styles.chartHeader}>
            <View style={styles.chartTitleContainer}>
              <BarChart3 size={20} color="#7C3AED" />
              <Text style={styles.chartTitle}>7-Day Trend</Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
          <Chart />
        </LinearGradient>

        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        <View style={styles.monthlyContainer}>
          {monthlyAverages.map((month, index) => (
            <LinearGradient
              key={index}
              colors={['#1E293B', '#334155']}
              style={styles.monthlyCard}
            >
              <View style={styles.monthlyHeader}>
                <Text style={styles.monthlyMonth}>{month.month}</Text>
                {month.trend === 'up' ? (
                  <TrendingUp size={16} color="#EF4444" />
                ) : (
                  <TrendingDown size={16} color="#10B981" />
                )}
              </View>
              <Text style={styles.monthlyAqi}>AQI: {month.aqi}</Text>
              <Text style={styles.monthlyPm25}>PM2.5: {month.pm25} μg/m³</Text>
            </LinearGradient>
          ))}
        </View>

        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.insightsCard}
        >
          <Text style={styles.insightsTitle}>Key Insights</Text>
          <View style={styles.insightsList}>
            <Text style={styles.insightItem}>
              • Air quality improved by 15% this month
            </Text>
            <Text style={styles.insightItem}>
              • PM2.5 levels are highest on Wednesdays
            </Text>
            <Text style={styles.insightItem}>
              • Best air quality typically between 6-8 AM
            </Text>
            <Text style={styles.insightItem}>
              • Industrial areas show 40% higher pollution
            </Text>
          </View>
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  activePeriodButton: {
    backgroundColor: '#7C3AED',
  },
  periodButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: '#FFFFFF',
  },
  pollutantSelector: {
    marginBottom: 10,
  },
  pollutantButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#334155',
    marginRight: 8,
  },
  pollutantButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  activePollutantButtonText: {
    color: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  trendsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  trendCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  trendTitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 8,
  },
  trendContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trendValue: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendPercentage: {
    fontSize: 12,
    fontWeight: '600',
  },
  chartCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  chartContainer: {
    height: 200,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 40,
  },
  gridLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  gridLabel: {
    color: '#94A3B8',
    fontSize: 10,
    width: 30,
  },
  gridLineBar: {
    flex: 1,
    height: 1,
    backgroundColor: '#374151',
    marginLeft: 8,
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    marginTop: 10,
    paddingLeft: 40,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 8,
  },
  barLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 4,
  },
  barValue: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  monthlyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  monthlyCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthlyMonth: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  monthlyAqi: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 2,
  },
  monthlyPm25: {
    color: '#94A3B8',
    fontSize: 12,
  },
  insightsCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  insightsTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
});