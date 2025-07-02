import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  RefreshControl,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Wind, Eye, Thermometer, Droplets, Shield, TriangleAlert as AlertTriangle, Heart, Leaf, Satellite, Activity, TrendingUp, TrendingDown, ChevronDown } from 'lucide-react-native';
import { aqiDataService, AQIStation, WeatherData } from '@/services/aqiDataService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [currentStation, setCurrentStation] = useState<AQIStation | null>(null);
  const [allStations, setAllStations] = useState<AQIStation[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [selectedCity, setSelectedCity] = useState('Delhi');
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const availableCities = [
    { name: 'Delhi', coordinates: { lat: 28.6139, lng: 77.2090 } },
    { name: 'Mumbai', coordinates: { lat: 19.0760, lng: 72.8777 } },
    { name: 'Pune', coordinates: { lat: 18.5204, lng: 73.8567 } },
    { name: 'Chennai', coordinates: { lat: 13.0827, lng: 80.2707 } },
  ];

  useEffect(() => {
    loadInitialData();
    setupRealTimeUpdates();
  }, []);

  useEffect(() => {
    if (allStations.length > 0) {
      // Update current station when city selection changes
      const selectedStation = allStations.find(s => 
        s.name.toLowerCase().includes(selectedCity.toLowerCase())
      ) || allStations[0];
      setCurrentStation(selectedStation);
      
      // Load weather data for the new city
      const cityCoords = availableCities.find(city => city.name === selectedCity)?.coordinates;
      if (cityCoords) {
        aqiDataService.fetchWeatherData(cityCoords.lat, cityCoords.lng)
          .then(setWeather)
          .catch(console.error);
      }
    }
  }, [selectedCity, allStations]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [stations, weatherData] = await Promise.all([
        aqiDataService.fetchRealTimeAQI(),
        aqiDataService.fetchWeatherData(
          availableCities.find(city => city.name === selectedCity)?.coordinates.lat || 28.6139,
          availableCities.find(city => city.name === selectedCity)?.coordinates.lng || 77.2090
        ),
      ]);
      
      setAllStations(stations);
      
      // Get the station for the selected city
      const selectedStation = stations.find(s => 
        s.name.toLowerCase().includes(selectedCity.toLowerCase())
      ) || stations[0];
      
      setCurrentStation(selectedStation);
      setWeather(weatherData);
      setLastUpdated(new Date());
      
      // Calculate trend (mock calculation)
      const previousAQI = selectedStation?.aqi - Math.floor(Math.random() * 20 - 10);
      if (selectedStation && previousAQI) {
        if (selectedStation.aqi > previousAQI + 5) setTrend('up');
        else if (selectedStation.aqi < previousAQI - 5) setTrend('down');
        else setTrend('stable');
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    return aqiDataService.setupRealTimeUpdates((newData) => {
      setAllStations(newData);
      const selectedStation = newData.find(s => 
        s.name.toLowerCase().includes(selectedCity.toLowerCase())
      ) || newData[0];
      setCurrentStation(selectedStation);
      setLastUpdated(new Date());
    });
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return { status: 'Good', color: '#10B981', bg: '#064E3B' };
    if (aqi <= 100) return { status: 'Moderate', color: '#F59E0B', bg: '#92400E' };
    if (aqi <= 150) return { status: 'Unhealthy for Sensitive', color: '#F97316', bg: '#9A3412' };
    if (aqi <= 200) return { status: 'Unhealthy', color: '#EF4444', bg: '#991B1B' };
    if (aqi <= 300) return { status: 'Very Unhealthy', color: '#8B5CF6', bg: '#5B21B6' };
    return { status: 'Hazardous', color: '#7C2D12', bg: '#451A03' };
  };

  const CitySelector = () => (
    <View style={styles.citySelectorContainer}>
      <TouchableOpacity 
        style={styles.citySelector}
        onPress={() => setShowDropdown(true)}
      >
        <MapPin size={18} color="#94A3B8" />
        <Text style={styles.cityText}>{selectedCity}, India</Text>
        <ChevronDown size={16} color="#94A3B8" />
      </TouchableOpacity>
      
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={styles.dropdownContainer}>
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.dropdown}
            >
              <Text style={styles.dropdownTitle}>Select City</Text>
              {availableCities.map((city) => (
                <TouchableOpacity
                  key={city.name}
                  style={[
                    styles.dropdownItem,
                    selectedCity === city.name && styles.selectedDropdownItem
                  ]}
                  onPress={() => {
                    setSelectedCity(city.name);
                    setShowDropdown(false);
                  }}
                >
                  <MapPin size={16} color={selectedCity === city.name ? "#7C3AED" : "#94A3B8"} />
                  <Text style={[
                    styles.dropdownItemText,
                    selectedCity === city.name && styles.selectedDropdownItemText
                  ]}>
                    {city.name}, India
                  </Text>
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const aqiStatus = currentStation ? getAQIStatus(currentStation.aqi) : null;

  const pollutants = currentStation ? [
    { name: 'PM2.5', value: currentStation.pm25, unit: 'μg/m³', safe: 25 },
    { name: 'PM10', value: currentStation.pm10, unit: 'μg/m³', safe: 50 },
    { name: 'NO₂', value: currentStation.no2, unit: 'ppb', safe: 40 },
    { name: 'O₃', value: currentStation.o3, unit: 'ppb', safe: 70 },
    { name: 'SO₂', value: currentStation.so2, unit: 'ppb', safe: 20 },
    { name: 'CO', value: currentStation.co, unit: 'ppm', safe: 2.0 },
  ] : [];

  const healthRecommendations = currentStation ? [
    {
      icon: <Shield size={20} color="#10B981" />,
      title: currentStation.aqi > 100 ? 'Use Air Purifier' : 'Good Air Quality',
      description: currentStation.aqi > 100 
        ? 'Keep windows closed, use air purifier indoors'
        : 'Enjoy outdoor activities safely',
    },
    {
      icon: <Heart size={20} color={currentStation.aqi > 150 ? '#EF4444' : '#F59E0B'} />,
      title: currentStation.aqi > 150 ? 'Avoid Outdoor Exercise' : 'Light Exercise OK',
      description: currentStation.aqi > 150
        ? 'Avoid strenuous outdoor activities'
        : 'Light outdoor exercise is acceptable',
    },
    {
      icon: <AlertTriangle size={20} color={currentStation.aqi > 100 ? '#EF4444' : '#10B981'} />,
      title: currentStation.aqi > 100 ? 'Wear N95 Mask' : 'No Mask Needed',
      description: currentStation.aqi > 100
        ? 'Essential for sensitive groups when outdoors'
        : 'Air quality is good for all groups',
    },
  ] : [];

  const TrendIndicator = () => {
    if (!currentStation) return null;
    
    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Activity;
    const trendColor = trend === 'up' ? '#EF4444' : trend === 'down' ? '#10B981' : '#94A3B8';
    
    return (
      <View style={styles.trendIndicator}>
        <TrendIcon size={16} color={trendColor} />
        <Text style={[styles.trendText, { color: trendColor }]}>
          {trend === 'up' ? 'Rising' : trend === 'down' ? 'Improving' : 'Stable'}
        </Text>
      </View>
    );
  };

  const LiveDataIndicator = () => (
    <View style={styles.liveIndicator}>
      <View style={styles.liveDot} />
      <Text style={styles.liveText}>Live Data</Text>
      <Satellite size={12} color="#7C3AED" />
    </View>
  );

  if (!currentStation || !weather) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0B1426', '#1A0B2E', '#2D1B69']}
          style={styles.loadingGradient}
        >
          <Activity size={32} color="#7C3AED" />
          <Text style={styles.loadingText}>Loading real-time data...</Text>
          <Text style={styles.loadingSubtext}>Connecting to OpenWeatherMap API</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadInitialData}
          tintColor="#7C3AED"
        />
      }
    >
      <LinearGradient
        colors={['#0B1426', '#1A0B2E', '#2D1B69']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <CitySelector />
          <LiveDataIndicator />
        </View>
        
        <View style={styles.aqiContainer}>
          <LinearGradient
            colors={aqiStatus ? [aqiStatus.bg, aqiStatus.color + '20'] : ['#1E293B', '#334155']}
            style={styles.aqiCard}
          >
            <View style={styles.aqiHeader}>
              <Text style={styles.aqiLabel}>Air Quality Index</Text>
              <TrendIndicator />
            </View>
            <Text style={[styles.aqiValue, { color: aqiStatus?.color || '#E2E8F0' }]}>
              {currentStation?.aqi || '--'}
            </Text>
            <Text style={[styles.aqiStatus, { color: aqiStatus?.color || '#E2E8F0' }]}>
              {aqiStatus?.status || 'Loading...'}
            </Text>
            <Text style={styles.lastUpdatedText}>
              Updated: {lastUpdated.toLocaleTimeString()}
            </Text>
          </LinearGradient>
        </View>

        <View style={styles.weatherContainer}>
          <View style={styles.weatherItem}>
            <Thermometer size={16} color="#94A3B8" />
            <Text style={styles.weatherValue}>{weather.temperature.toFixed(1)}°C</Text>
          </View>
          <View style={styles.weatherItem}>
            <Droplets size={16} color="#94A3B8" />
            <Text style={styles.weatherValue}>{weather.humidity}%</Text>
          </View>
          <View style={styles.weatherItem}>
            <Wind size={16} color="#94A3B8" />
            <Text style={styles.weatherValue}>{weather.windSpeed.toFixed(1)} km/h</Text>
          </View>
          <View style={styles.weatherItem}>
            <Eye size={16} color="#94A3B8" />
            <Text style={styles.weatherValue}>{weather.visibility.toFixed(1)} km</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Real-time Pollutant Levels</Text>
          <Text style={styles.sectionSubtitle}>OpenWeatherMap Air Quality Data</Text>
        </View>
        
        <View style={styles.pollutantsGrid}>
          {pollutants.map((pollutant, index) => (
            <LinearGradient
              key={index}
              colors={['#1E293B', '#334155']}
              style={styles.pollutantCard}
            >
              <Text style={styles.pollutantName}>{pollutant.name}</Text>
              <Text style={styles.pollutantValue}>
                {pollutant.value.toFixed(1)} {pollutant.unit}
              </Text>
              <View style={styles.pollutantBar}>
                <View
                  style={[
                    styles.pollutantProgress,
                    {
                      width: `${Math.min((pollutant.value / pollutant.safe) * 100, 100)}%`,
                      backgroundColor: pollutant.value > pollutant.safe ? '#EF4444' : '#10B981',
                    },
                  ]}
                />
              </View>
              <Text style={styles.pollutantSafe}>
                Safe: ≤{pollutant.safe} {pollutant.unit}
              </Text>
            </LinearGradient>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Health Recommendations</Text>
          <Text style={styles.sectionSubtitle}>Based on current air quality</Text>
        </View>
        
        <View style={styles.recommendationsContainer}>
          {healthRecommendations.map((rec, index) => (
            <LinearGradient
              key={index}
              colors={['#1E293B', '#334155']}
              style={styles.recommendationCard}
            >
              <View style={styles.recommendationHeader}>
                {rec.icon}
                <Text style={styles.recommendationTitle}>{rec.title}</Text>
              </View>
              <Text style={styles.recommendationDescription}>
                {rec.description}
              </Text>
            </LinearGradient>
          ))}
        </View>

        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.dataSourceCard}
        >
          <View style={styles.dataSourceHeader}>
            <Satellite size={20} color="#7C3AED" />
            <Text style={styles.dataSourceTitle}>Data Sources</Text>
          </View>
          <Text style={styles.dataSourceText}>
            • OpenWeatherMap Air Pollution API{'\n'}
            • Real-time Global Air Quality Data{'\n'}
            • Meteorological & Weather Information{'\n'}
            • Multi-city AQI Monitoring
          </Text>
        </LinearGradient>

        <LinearGradient
          colors={['#7C3AED', '#3B82F6']}
          style={styles.actionButton}
        >
          <TouchableOpacity style={styles.buttonContent}>
            <Leaf size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>View Detailed Analysis</Text>
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  citySelectorContainer: {
    flex: 1,
    paddingRight: 12,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cityText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: width * 0.8,
    maxWidth: 300,
  },
  dropdown: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dropdownTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedDropdownItem: {
    backgroundColor: '#7C3AED20',
  },
  dropdownItemText: {
    color: '#E2E8F0',
    fontSize: 16,
    marginLeft: 8,
  },
  selectedDropdownItemText: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    color: '#E2E8F0',
    fontSize: 10,
    fontWeight: '600',
  },
  aqiContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  aqiCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: width * 0.7,
    borderWidth: 1,
    borderColor: '#334155',
  },
  aqiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  aqiLabel: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  trendIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aqiValue: {
    fontSize: 56,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aqiStatus: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  lastUpdatedText: {
    color: '#94A3B8',
    fontSize: 10,
  },
  weatherContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  weatherItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  weatherValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: 20,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  pollutantsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  pollutantCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pollutantName: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  pollutantValue: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pollutantBar: {
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    marginBottom: 4,
  },
  pollutantProgress: {
    height: '100%',
    borderRadius: 2,
  },
  pollutantSafe: {
    color: '#94A3B8',
    fontSize: 10,
  },
  recommendationsContainer: {
    marginBottom: 30,
  },
  recommendationCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  recommendationDescription: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
  },
  dataSourceCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dataSourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataSourceTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  dataSourceText: {
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