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
  Cloud,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  Zap,
  TrendingUp,
  Calendar,
  Clock,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function ForecastScreen() {
  const [selectedDay, setSelectedDay] = useState(0);

  const forecastData = [
    {
      date: 'Today',
      day: 'Mon',
      weather: 'Cloudy',
      icon: <Cloud size={24} color="#94A3B8" />,
      aqi: 89,
      aqiTrend: 'improving',
      pm25: 42,
      temperature: 28,
      humidity: 65,
      windSpeed: 12,
      hourlyForecast: [
        { time: '6 AM', aqi: 78, weather: 'Clear' },
        { time: '9 AM', aqi: 85, weather: 'Cloudy' },
        { time: '12 PM', aqi: 92, weather: 'Cloudy' },
        { time: '3 PM', aqi: 95, weather: 'Hazy' },
        { time: '6 PM', aqi: 88, weather: 'Cloudy' },
        { time: '9 PM', aqi: 82, weather: 'Clear' },
      ],
    },
    {
      date: 'Tomorrow',
      day: 'Tue',
      weather: 'Partly Cloudy',
      icon: <Sun size={24} color="#F59E0B" />,
      aqi: 76,
      aqiTrend: 'improving',
      pm25: 38,
      temperature: 30,
      humidity: 58,
      windSpeed: 15,
      hourlyForecast: [
        { time: '6 AM', aqi: 65, weather: 'Clear' },
        { time: '9 AM', aqi: 72, weather: 'Clear' },
        { time: '12 PM', aqi: 78, weather: 'Partly Cloudy' },
        { time: '3 PM', aqi: 82, weather: 'Partly Cloudy' },
        { time: '6 PM', aqi: 75, weather: 'Clear' },
        { time: '9 PM', aqi: 68, weather: 'Clear' },
      ],
    },
    {
      date: 'Wednesday',
      day: 'Wed',
      weather: 'Rainy',
      icon: <CloudRain size={24} color="#3B82F6" />,
      aqi: 58,
      aqiTrend: 'improving',
      pm25: 28,
      temperature: 25,
      humidity: 85,
      windSpeed: 18,
      hourlyForecast: [
        { time: '6 AM', aqi: 52, weather: 'Rainy' },
        { time: '9 AM', aqi: 48, weather: 'Rainy' },
        { time: '12 PM', aqi: 55, weather: 'Rainy' },
        { time: '3 PM', aqi: 62, weather: 'Cloudy' },
        { time: '6 PM', aqi: 58, weather: 'Cloudy' },
        { time: '9 PM', aqi: 54, weather: 'Clear' },
      ],
    },
  ];

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#F59E0B';
    if (aqi <= 150) return '#F97316';
    if (aqi <= 200) return '#EF4444';
    return '#8B5CF6';
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    return 'Very Unhealthy';
  };

  const selectedForecast = forecastData[selectedDay];

  const PredictionCard = ({ title, value, unit, trend, icon }) => (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      style={styles.predictionCard}
    >
      <View style={styles.predictionHeader}>
        {icon}
        <Text style={styles.predictionTitle}>{title}</Text>
      </View>
      <Text style={styles.predictionValue}>{value} {unit}</Text>
      <View style={styles.predictionTrend}>
        <TrendingUp size={12} color={trend === 'improving' ? '#10B981' : '#EF4444'} />
        <Text style={[
          styles.predictionTrendText,
          { color: trend === 'improving' ? '#10B981' : '#EF4444' }
        ]}>
          {trend}
        </Text>
      </View>
    </LinearGradient>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Air Quality Forecast</Text>
        <Text style={styles.headerSubtitle}>72-hour prediction powered by AI</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.daySelector}>
          {forecastData.map((forecast, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayButton,
                selectedDay === index && styles.activeDayButton,
              ]}
              onPress={() => setSelectedDay(index)}
            >
              <Text style={[
                styles.dayButtonDate,
                selectedDay === index && styles.activeDayButtonText,
              ]}>
                {forecast.date}
              </Text>
              <Text style={[
                styles.dayButtonDay,
                selectedDay === index && styles.activeDayButtonText,
              ]}>
                {forecast.day}
              </Text>
              {forecast.icon}
              <Text style={[
                styles.dayButtonAqi,
                { color: getAQIColor(forecast.aqi) },
                selectedDay === index && styles.activeDayButtonText,
              ]}>
                {forecast.aqi}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.mainForecastCard}
        >
          <View style={styles.mainForecastHeader}>
            <View>
              <Text style={styles.mainForecastDate}>{selectedForecast.date}</Text>
              <Text style={styles.mainForecastWeather}>{selectedForecast.weather}</Text>
            </View>
            {selectedForecast.icon}
          </View>

          <View style={styles.mainForecastContent}>
            <View style={styles.aqiMainDisplay}>
              <Text style={styles.aqiMainLabel}>Air Quality Index</Text>
              <Text style={[
                styles.aqiMainValue,
                { color: getAQIColor(selectedForecast.aqi) }
              ]}>
                {selectedForecast.aqi}
              </Text>
              <Text style={[
                styles.aqiMainStatus,
                { color: getAQIColor(selectedForecast.aqi) }
              ]}>
                {getAQIStatus(selectedForecast.aqi)}
              </Text>
            </View>

            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetailItem}>
                <Droplets size={16} color="#94A3B8" />
                <Text style={styles.weatherDetailValue}>{selectedForecast.humidity}%</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Wind size={16} color="#94A3B8" />
                <Text style={styles.weatherDetailValue}>{selectedForecast.windSpeed} km/h</Text>
              </View>
              <View style={styles.weatherDetailItem}>
                <Zap size={16} color="#94A3B8" />
                <Text style={styles.weatherDetailValue}>{selectedForecast.pm25} μg/m³</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Hourly Breakdown</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hourlyContainer}>
          {selectedForecast.hourlyForecast.map((hour, index) => (
            <LinearGradient
              key={index}
              colors={['#1E293B', '#334155']}
              style={styles.hourlyCard}
            >
              <Text style={styles.hourlyTime}>{hour.time}</Text>
              <Text style={styles.hourlyWeather}>{hour.weather}</Text>
              <View style={[
                styles.hourlyAqiCircle,
                { backgroundColor: getAQIColor(hour.aqi) }
              ]}>
                <Text style={styles.hourlyAqi}>{hour.aqi}</Text>
              </View>
            </LinearGradient>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Key Predictions</Text>
        <View style={styles.predictionsGrid}>
          <PredictionCard
            title="Peak AQI"
            value="95"
            unit="at 3 PM"
            trend="worsening"
            icon={<TrendingUp size={16} color="#EF4444" />}
          />
          <PredictionCard
            title="Best Time"
            value="6 AM"
            unit="AQI 78"
            trend="improving"
            icon={<Clock size={16} color="#10B981" />}
          />
          <PredictionCard
            title="Visibility"
            value="8.5"
            unit="km"
            trend="stable"
            icon={<Cloud size={16} color="#94A3B8" />}
          />
          <PredictionCard
            title="UV Index"
            value="7"
            unit="High"
            trend="increasing"
            icon={<Sun size={16} color="#F59E0B" />}
          />
        </View>

        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.recommendationsCard}
        >
          <Text style={styles.recommendationsTitle}>Forecast-Based Recommendations</Text>
          <View style={styles.recommendationsList}>
            <Text style={styles.recommendationItem}>
              🌅 Best outdoor activity window: 6-8 AM
            </Text>
            <Text style={styles.recommendationItem}>
              ⚠️ Avoid outdoor exercise after 2 PM today
            </Text>
            <Text style={styles.recommendationItem}>
              🌧️ Air quality will improve significantly on Wednesday due to rain
            </Text>
            <Text style={styles.recommendationItem}>
              😷 Sensitive individuals should wear masks during afternoon hours
            </Text>
          </View>
        </LinearGradient>

        <LinearGradient
          colors={['#7C3AED', '#3B82F6']}
          style={styles.actionButton}
        >
          <TouchableOpacity style={styles.buttonContent}>
            <Calendar size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Set Forecast Alerts</Text>
          </TouchableOpacity>
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
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  content: {
    padding: 20,
  },
  daySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  dayButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeDayButton: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  dayButtonDate: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 2,
  },
  dayButtonDay: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  dayButtonAqi: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  activeDayButtonText: {
    color: '#FFFFFF',
  },
  mainForecastCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mainForecastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainForecastDate: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mainForecastWeather: {
    color: '#94A3B8',
    fontSize: 14,
  },
  mainForecastContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aqiMainDisplay: {
    alignItems: 'center',
  },
  aqiMainLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  aqiMainValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aqiMainStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  weatherDetails: {
    gap: 12,
  },
  weatherDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weatherDetailValue: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  hourlyContainer: {
    marginBottom: 24,
  },
  hourlyCard: {
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hourlyTime: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 4,
  },
  hourlyWeather: {
    color: '#E2E8F0',
    fontSize: 12,
    marginBottom: 8,
  },
  hourlyAqiCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hourlyAqi: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  predictionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  predictionCard: {
    width: '48%',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  predictionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  predictionTitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  predictionValue: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  predictionTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  predictionTrendText: {
    fontSize: 10,
    fontWeight: '500',
  },
  recommendationsCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recommendationsTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recommendationsList: {
    gap: 8,
  },
  recommendationItem: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});