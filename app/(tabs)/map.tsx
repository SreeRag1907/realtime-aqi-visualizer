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
      const stations = await aqiDataService.fetchRealTimeAQI();
      
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
                <Text style={styles.locationTitle}>{selectedLocation.name}</Text>
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
              </View>
              
              {/* Pollutant Details */}
              <View style={styles.pollutantMini}>
                <View style={styles.pollutantItem}>
                  <Text style={styles.pollutantLabel}>PM2.5</Text>
                  <Text style={styles.pollutantValue}>{selectedLocation.pm25.toFixed(1)} μg/m³</Text>
                </View>
                <View style={styles.pollutantItem}>
                  <Text style={styles.pollutantLabel}>PM10</Text>
                  <Text style={styles.pollutantValue}>{selectedLocation.pm10.toFixed(1)} μg/m³</Text>
                </View>
                <View style={styles.pollutantItem}>
                  <Text style={styles.pollutantLabel}>NO₂</Text>
                  <Text style={styles.pollutantValue}>{selectedLocation.no2.toFixed(1)} μg/m³</Text>
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
    alignItems: 'center',
    flex: 1,
  },
  locationTitle: {
    color: '#1F2937',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
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
    flexDirection: 'row',
    gap: 20,
  },
  aqiMain: {
    alignItems: 'center',
    flex: 1,
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
  },
  pollutantMini: {
    flex: 1,
    gap: 8,
  },
  pollutantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  pollutantLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontWeight: '500',
  },
  pollutantValue: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
