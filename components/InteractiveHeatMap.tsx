import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Layers,
  Zap,
  Wind,
  Factory,
  Car,
  Flame,
  Satellite,
  RefreshCw,
  Target,
  Info,
} from 'lucide-react-native';
import { aqiDataService, AQIStation, SatelliteData } from '@/services/aqiDataService';

const { width, height } = Dimensions.get('window');

interface HeatMapProps {
  onLocationSelect?: (location: AQIStation) => void;
  selectedLayer?: string;
}

export default function InteractiveHeatMap({ onLocationSelect, selectedLayer = 'aqi' }: HeatMapProps) {
  const [stations, setStations] = useState<AQIStation[]>([]);
  const [satelliteData, setSatelliteData] = useState<SatelliteData[]>([]);
  const [selectedStation, setSelectedStation] = useState<AQIStation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.2090 });
  const [zoomLevel, setZoomLevel] = useState(1);

  const mapTranslateX = useRef(new Animated.Value(0)).current;
  const mapTranslateY = useRef(new Animated.Value(0)).current;
  const mapScale = useRef(new Animated.Value(1)).current;

  // Pan responder for map interaction
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gestureState) => {
      mapTranslateX.setValue(gestureState.dx);
      mapTranslateY.setValue(gestureState.dy);
    },
    onPanResponderRelease: (evt, gestureState) => {
      Animated.spring(mapTranslateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      Animated.spring(mapTranslateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    },
  });

  useEffect(() => {
    loadInitialData();
    setupRealTimeUpdates();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [aqiData, satData] = await Promise.all([
        aqiDataService.fetchRealTimeAQI(),
        aqiDataService.fetchSatelliteData(),
      ]);
      
      setStations(aqiData);
      setSatelliteData(satData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealTimeUpdates = () => {
    return aqiDataService.setupRealTimeUpdates((newData) => {
      setStations(newData);
      setLastUpdated(new Date());
    });
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadInitialData();
  };

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return '#10B981';
    if (aqi <= 100) return '#F59E0B';
    if (aqi <= 150) return '#F97316';
    if (aqi <= 200) return '#EF4444';
    if (aqi <= 300) return '#8B5CF6';
    return '#7C2D12';
  };

  const getAQIIntensity = (aqi: number) => {
    return Math.min(aqi / 300, 1); // Normalize to 0-1 for opacity
  };

  const handleStationPress = (station: AQIStation) => {
    setSelectedStation(station);
    onLocationSelect?.(station);
  };

  const StationMarker = ({ station, index }: { station: AQIStation; index: number }) => {
    const markerSize = 30 + (station.aqi / 300) * 20; // Size based on AQI
    const pulseAnimation = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }, []);

    return (
      <TouchableOpacity
        style={[
          styles.stationMarker,
          {
            left: (station.longitude - mapCenter.lng + 2) * (width / 4) + width / 2 - markerSize / 2,
            top: (mapCenter.lat - station.latitude + 2) * (height / 4) + height / 2 - markerSize / 2,
            width: markerSize,
            height: markerSize,
            backgroundColor: getAQIColor(station.aqi),
          },
        ]}
        onPress={() => handleStationPress(station)}
      >
        <Animated.View
          style={[
            styles.markerPulse,
            {
              transform: [{ scale: pulseAnimation }],
              backgroundColor: getAQIColor(station.aqi),
              opacity: 0.3,
            },
          ]}
        />
        <Text style={styles.markerText}>{station.aqi}</Text>
      </TouchableOpacity>
    );
  };

  const SatelliteMarker = ({ data, index }: { data: SatelliteData; index: number }) => (
    <View
      style={[
        styles.satelliteMarker,
        {
          left: (data.coordinates.lng - mapCenter.lng + 2) * (width / 4) + width / 2 - 8,
          top: (mapCenter.lat - data.coordinates.lat + 2) * (height / 4) + height / 2 - 8,
          opacity: getAQIIntensity(data.pollutionLevel),
        },
      ]}
    >
      <Satellite size={16} color="#7C3AED" />
    </View>
  );

  const HeatZone = ({ station, index }: { station: AQIStation; index: number }) => {
    const intensity = getAQIIntensity(station.aqi);
    const radius = 40 + (station.aqi / 300) * 60;

    return (
      <View
        style={[
          styles.heatZone,
          {
            left: (station.longitude - mapCenter.lng + 2) * (width / 4) + width / 2 - radius / 2,
            top: (mapCenter.lat - station.latitude + 2) * (height / 4) + height / 2 - radius / 2,
            width: radius,
            height: radius,
            borderRadius: radius / 2,
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${getAQIColor(station.aqi)}${Math.floor(intensity * 80).toString(16).padStart(2, '0')}`,
            'transparent',
          ]}
          style={styles.heatGradient}
        />
      </View>
    );
  };

  const LayerControls = () => (
    <View style={styles.layerControls}>
      <TouchableOpacity
        style={[styles.layerButton, selectedLayer === 'aqi' && styles.activeLayerButton]}
      >
        <Wind size={16} color="#FFFFFF" />
        <Text style={styles.layerButtonText}>AQI</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.layerButton, selectedLayer === 'satellite' && styles.activeLayerButton]}
      >
        <Satellite size={16} color="#FFFFFF" />
        <Text style={styles.layerButtonText}>Satellite</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.layerButton, selectedLayer === 'heat' && styles.activeLayerButton]}
      >
        <Zap size={16} color="#FFFFFF" />
        <Text style={styles.layerButtonText}>Heat Map</Text>
      </TouchableOpacity>
    </View>
  );

  const MapControls = () => (
    <View style={styles.mapControls}>
      <TouchableOpacity style={styles.controlButton} onPress={refreshData}>
        <RefreshCw size={20} color={isLoading ? '#7C3AED' : '#FFFFFF'} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setZoomLevel(prev => Math.min(prev + 0.5, 3))}
      >
        <Text style={styles.controlText}>+</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.controlButton}
        onPress={() => setZoomLevel(prev => Math.max(prev - 0.5, 0.5))}
      >
        <Text style={styles.controlText}>-</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.controlButton}>
        <Target size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const StationDetails = () => {
    if (!selectedStation) return null;

    return (
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.stationDetails}
      >
        <View style={styles.detailsHeader}>
          <MapPin size={20} color="#7C3AED" />
          <Text style={styles.detailsTitle}>{selectedStation.name}</Text>
          <TouchableOpacity onPress={() => setSelectedStation(null)}>
            <Text style={styles.closeButton}>×</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>AQI</Text>
            <Text style={[styles.detailValue, { color: getAQIColor(selectedStation.aqi) }]}>
              {selectedStation.aqi}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PM2.5</Text>
            <Text style={styles.detailValue}>{selectedStation.pm25.toFixed(1)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>PM10</Text>
            <Text style={styles.detailValue}>{selectedStation.pm10.toFixed(1)}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>NO₂</Text>
            <Text style={styles.detailValue}>{selectedStation.no2.toFixed(1)}</Text>
          </View>
        </View>
        
        <Text style={styles.lastUpdated}>
          Last updated: {new Date(selectedStation.lastUpdated).toLocaleTimeString()}
        </Text>
      </LinearGradient>
    );
  };

  const DataSourceInfo = () => (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      style={styles.dataSourceInfo}
    >
      <View style={styles.infoHeader}>
        <Info size={16} color="#7C3AED" />
        <Text style={styles.infoTitle}>Live Data Sources</Text>
      </View>
      <Text style={styles.infoText}>
        CPCB Ground Stations • ISRO Satellite Data • IMD Weather
      </Text>
      <Text style={styles.infoTimestamp}>
        Updated: {lastUpdated.toLocaleTimeString()}
      </Text>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.mapContainer,
          {
            transform: [
              { translateX: mapTranslateX },
              { translateY: mapTranslateY },
              { scale: mapScale },
            ],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Background grid */}
        <View style={styles.mapGrid}>
          {Array.from({ length: 20 }, (_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, { top: i * 30 }]} />
          ))}
          {Array.from({ length: 20 }, (_, i) => (
            <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * 30 }]} />
          ))}
        </View>

        {/* Heat zones */}
        {selectedLayer === 'heat' && stations.map((station, index) => (
          <HeatZone key={`heat-${station.id}`} station={station} index={index} />
        ))}

        {/* Station markers */}
        {(selectedLayer === 'aqi' || selectedLayer === 'heat') && stations.map((station, index) => (
          <StationMarker key={station.id} station={station} index={index} />
        ))}

        {/* Satellite markers */}
        {selectedLayer === 'satellite' && satelliteData.map((data, index) => (
          <SatelliteMarker key={data.id} data={data} index={index} />
        ))}
      </Animated.View>

      <LayerControls />
      <MapControls />
      <StationDetails />
      <DataSourceInfo />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <LinearGradient
            colors={['#7C3AED', '#3B82F6']}
            style={styles.loadingIndicator}
          >
            <RefreshCw size={24} color="#FFFFFF" />
            <Text style={styles.loadingText}>Updating live data...</Text>
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
    position: 'relative',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#1E293B',
    position: 'relative',
    overflow: 'hidden',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#374151',
    opacity: 0.3,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#374151',
    opacity: 0.3,
  },
  stationMarker: {
    position: 'absolute',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  markerPulse: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  satelliteMarker: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heatZone: {
    position: 'absolute',
  },
  heatGradient: {
    flex: 1,
    borderRadius: 50,
  },
  layerControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    gap: 4,
  },
  activeLayerButton: {
    backgroundColor: '#7C3AED',
  },
  layerButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  mapControls: {
    position: 'absolute',
    top: 60,
    right: 20,
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stationDetails: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    color: '#94A3B8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastUpdated: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },
  dataSourceInfo: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 2,
  },
  infoTimestamp: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 20, 38, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
});