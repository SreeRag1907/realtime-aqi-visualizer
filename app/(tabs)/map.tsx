import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Activity,
} from 'lucide-react-native';
import SimpleGoogleMap from '@/components/SimpleGoogleMap';
import { aqiDataService, AQIStation } from '@/services/aqiDataService';

export default function MapScreen() {
  const [selectedLocation, setSelectedLocation] = useState<AQIStation | null>(null);
  const [dataStats, setDataStats] = useState({
    totalStations: 0,
    lastUpdate: new Date(),
  });

  useEffect(() => {
    loadDataStats();
  }, []);

  const loadDataStats = async () => {
    try {
      console.log('Loading AQI data stats...');
      const stations = await aqiDataService.fetchRealTimeAQI();
      
      console.log(`Loaded ${stations.length} AQI stations`);
      
      // Log data sources
      const sources = {
        waqi: stations.filter(s => s.id.startsWith('waqi-')).length,
        dataGov: stations.filter(s => s.id.startsWith('datagov-')).length,
        openWeather: stations.filter(s => s.id.startsWith('ow-')).length,
        mock: stations.filter(s => s.id.startsWith('rural-')).length,
      };
      
      console.log('Data sources:', sources);
      
      setDataStats({
        totalStations: stations.length,
        lastUpdate: new Date(),
      });
    } catch (error) {
      console.error('Error loading data stats:', error);
    }
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#F59E0B';
    if (aqi <= 150) return '#F97316';
    if (aqi <= 200) return '#EF4444';
    if (aqi <= 300) return '#8B5CF6';
    return '#7C2D12';
  };

  const getAQIStatus = (aqi: number) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const handleMarkerClick = (station: AQIStation) => {
    setSelectedLocation(station);
  };

  return (
    <View style={styles.container}>
      {/* Compact Header */}
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.compactHeader}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Rural India AQI Monitor</Text>
            <Text style={styles.headerSubtitle}>
              {dataStats.totalStations} locations • Updated {dataStats.lastUpdate.toLocaleTimeString()}
            </Text>
            <Text style={styles.dataQuality}>
              Live data from WAQI, Indian Government & OpenWeather
            </Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Full Screen Map */}
      <View style={styles.mapContainer}>
        <SimpleGoogleMap 
          showAQIData={true} 
          onMarkerClick={handleMarkerClick}
        />
      </View>

      {/* Google Maps Style Bottom Sheet */}
      {selectedLocation && (
        <View style={styles.bottomSheet}>
          <LinearGradient
            colors={['#FFFFFF', '#F8FAFC']}
            style={styles.bottomSheetContent}
          >
            {/* Handle */}
            <View style={styles.bottomSheetHandle} />
            
            {/* Header */}
            <View style={styles.locationHeader}>
              <View style={styles.locationTitleContainer}>
                <MapPin size={20} color="#7C3AED" />
                <View>
                  <Text style={styles.locationTitle}>{selectedLocation.name}</Text>
                  <Text style={styles.dataSource}>
                    {selectedLocation.id.startsWith('waqi-') ? '🌍 WAQI Global Network' :
                     selectedLocation.id.startsWith('datagov-') ? '🇮🇳 Indian Government' :
                     selectedLocation.id.startsWith('ow-') ? '🌤️ OpenWeather' : '📍 Local Data'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={() => setSelectedLocation(null)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* AQI Summary */}
            <View style={styles.aqiSummary}>
              <View style={styles.aqiMain}>
                <Text style={styles.aqiLabel}>Air Quality Index</Text>
                <Text style={[styles.aqiValue, { color: getAQIColor(selectedLocation.aqi) }]}>
                  {selectedLocation.aqi}
                </Text>
                <Text style={[styles.aqiStatus, { color: getAQIColor(selectedLocation.aqi) }]}>
                  {getAQIStatus(selectedLocation.aqi)}
                </Text>
                <Text style={styles.lastUpdated}>
                  Updated: {new Date(selectedLocation.lastUpdated).toLocaleTimeString()}
                </Text>
              </View>
            </View>
            
            {/* Detailed Pollutant Grid */}
            <View style={styles.pollutantGrid}>
              <View style={styles.pollutantRow}>
                <View style={styles.pollutantCard}>
                  <Text style={styles.pollutantLabel}>PM2.5</Text>
                  <Text style={[styles.pollutantValue, { color: selectedLocation.pm25 > 60 ? '#EF4444' : '#10B981' }]}>
                    {selectedLocation.pm25.toFixed(1)}
                  </Text>
                  <Text style={styles.pollutantUnit}>μg/m³</Text>
                </View>
                <View style={styles.pollutantCard}>
                  <Text style={styles.pollutantLabel}>PM10</Text>
                  <Text style={[styles.pollutantValue, { color: selectedLocation.pm10 > 100 ? '#EF4444' : '#10B981' }]}>
                    {selectedLocation.pm10.toFixed(1)}
                  </Text>
                  <Text style={styles.pollutantUnit}>μg/m³</Text>
                </View>
                <View style={styles.pollutantCard}>
                  <Text style={styles.pollutantLabel}>NO₂</Text>
                  <Text style={[styles.pollutantValue, { color: selectedLocation.no2 > 80 ? '#EF4444' : '#10B981' }]}>
                    {selectedLocation.no2.toFixed(1)}
                  </Text>
                  <Text style={styles.pollutantUnit}>μg/m³</Text>
                </View>
              </View>
              <View style={styles.pollutantRow}>
                <View style={styles.pollutantCard}>
                  <Text style={styles.pollutantLabel}>SO₂</Text>
                  <Text style={[styles.pollutantValue, { color: selectedLocation.so2 > 80 ? '#EF4444' : '#10B981' }]}>
                    {selectedLocation.so2.toFixed(1)}
                  </Text>
                  <Text style={styles.pollutantUnit}>μg/m³</Text>
                </View>
                <View style={styles.pollutantCard}>
                  <Text style={styles.pollutantLabel}>CO</Text>
                  <Text style={[styles.pollutantValue, { color: selectedLocation.co > 4 ? '#EF4444' : '#10B981' }]}>
                    {selectedLocation.co.toFixed(1)}
                  </Text>
                  <Text style={styles.pollutantUnit}>mg/m³</Text>
                </View>
                <View style={styles.pollutantCard}>
                  <Text style={styles.pollutantLabel}>O₃</Text>
                  <Text style={[styles.pollutantValue, { color: selectedLocation.o3 > 120 ? '#EF4444' : '#10B981' }]}>
                    {selectedLocation.o3.toFixed(1)}
                  </Text>
                  <Text style={styles.pollutantUnit}>μg/m³</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  compactHeader: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
  },
  dataQuality: {
    color: '#10B981',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#10B981',
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  liveText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '40%',
  },
  bottomSheetContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationTitleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  locationTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dataSource: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: 'bold',
  },
  aqiSummary: {
    marginBottom: 20,
  },
  aqiMain: {
    alignItems: 'center',
    marginBottom: 16,
  },
  aqiLabel: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 4,
  },
  aqiValue: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aqiStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastUpdated: {
    color: '#9CA3AF',
    fontSize: 10,
    fontStyle: 'italic',
  },
  pollutantGrid: {
    gap: 12,
  },
  pollutantRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pollutantCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pollutantLabel: {
    color: '#6B7280',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  pollutantValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  pollutantUnit: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '400',
  },
});
