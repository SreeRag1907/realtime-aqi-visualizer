import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  MapPin,
  Layers,
  Filter,
  Zap,
  Wind,
  Factory,
  Car,
  Flame,
  Satellite,
  Globe,
  Activity,
} from 'lucide-react-native';
import SimpleGoogleMap from '@/components/SimpleGoogleMap';
import { aqiDataService, AQIStation } from '@/services/aqiDataService';

export default function MapScreen() {
  const [selectedLayer, setSelectedLayer] = useState('aqi');
  const [selectedLocation, setSelectedLocation] = useState<AQIStation | null>(null);
  const [isRealTimeActive, setIsRealTimeActive] = useState(true);
  const [dataStats, setDataStats] = useState({
    totalStations: 0,
    satellitePoints: 0,
    lastUpdate: new Date(),
  });

  const layers = [
    { id: 'aqi', name: 'AQI Stations', icon: <Wind size={16} color="#FFFFFF" />, color: '#7C3AED' },
    { id: 'satellite', name: 'Satellite Data', icon: <Satellite size={16} color="#FFFFFF" />, color: '#3B82F6' },
    { id: 'heat', name: 'Heat Map', icon: <Zap size={16} color="#FFFFFF" />, color: '#EF4444' },
  ];

  const pollutionSources = [
    { id: 1, name: 'Industrial Zones', type: 'factory', count: 45, impact: 'High', color: '#EF4444' },
    { id: 2, name: 'Traffic Corridors', type: 'traffic', count: 128, impact: 'Medium', color: '#F59E0B' },
    { id: 3, name: 'Agricultural Burning', type: 'fire', count: 23, impact: 'Very High', color: '#DC2626' },
    { id: 4, name: 'Construction Sites', type: 'construction', count: 67, impact: 'Medium', color: '#F97316' },
  ];

  useEffect(() => {
    loadDataStats();
  }, []);

  const loadDataStats = async () => {
    try {
      const [stations, satelliteData] = await Promise.all([
        aqiDataService.fetchRealTimeAQI(),
        aqiDataService.fetchSatelliteData(),
      ]);
      
      setDataStats({
        totalStations: stations.length,
        satellitePoints: satelliteData.length,
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

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'factory': return <Factory size={16} color="#FFFFFF" />;
      case 'traffic': return <Car size={16} color="#FFFFFF" />;
      case 'fire': return <Flame size={16} color="#FFFFFF" />;
      default: return <MapPin size={16} color="#FFFFFF" />;
    }
  };

  type PollutionSource = {
    id: number;
    name: string;
    type: string;
    count: number;
    impact: string;
    color: string;
  };

  const DataSourceCard = ({ source }: { source: PollutionSource }) => (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      style={styles.sourceCard}
    >
      <View style={styles.sourceHeader}>
        <View style={[styles.sourceIcon, { backgroundColor: source.color }]}>
          {getSourceIcon(source.type)}
        </View>
        <View style={styles.sourceInfo}>
          <Text style={styles.sourceName}>{source.name}</Text>
          <Text style={styles.sourceCount}>{source.count} locations</Text>
        </View>
        <View style={styles.impactBadge}>
          <Text style={[styles.impactText, { color: source.color }]}>
            {source.impact}
          </Text>
        </View>
      </View>
    </LinearGradient>
  );

  const RealTimeIndicator = () => (
    <LinearGradient
      colors={isRealTimeActive ? ['#10B981', '#059669'] : ['#6B7280', '#4B5563']}
      style={styles.realTimeIndicator}
    >
      <Activity size={16} color="#FFFFFF" />
      <Text style={styles.realTimeText}>
        {isRealTimeActive ? 'Live Data' : 'Offline'}
      </Text>
      <View style={[styles.statusDot, { 
        backgroundColor: isRealTimeActive ? '#FFFFFF' : '#94A3B8' 
      }]} />
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Live AQI Heat Map</Text>
            <Text style={styles.headerSubtitle}>OpenWeatherMap Global Air Quality Network</Text>
          </View>
          <RealTimeIndicator />
        </View>
        
        <View style={styles.layerControls}>
          {layers.map((layer) => (
            <TouchableOpacity
              key={layer.id}
              style={[
                styles.layerButton,
                selectedLayer === layer.id && { backgroundColor: layer.color },
              ]}
              onPress={() => setSelectedLayer(layer.id)}
            >
              {layer.icon}
              <Text style={[
                styles.layerButtonText,
                selectedLayer === layer.id && styles.activeLayerButtonText,
              ]}>
                {layer.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.dataStats}>
          <View style={styles.statItem}>
            <Globe size={16} color="#7C3AED" />
            <Text style={styles.statValue}>{dataStats.totalStations}</Text>
            <Text style={styles.statLabel}>Ground Stations</Text>
          </View>
          <View style={styles.statItem}>
            <Satellite size={16} color="#3B82F6" />
            <Text style={styles.statValue}>{dataStats.satellitePoints}</Text>
            <Text style={styles.statLabel}>Satellite Points</Text>
          </View>
          <View style={styles.statItem}>
            <Activity size={16} color="#10B981" />
            <Text style={styles.statValue}>
              {dataStats.lastUpdate.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            <Text style={styles.statLabel}>Last Update</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.mapWrapper}>
        <SimpleGoogleMap />
      </View>

      {selectedLocation && (
        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.locationDetails}
        >
          <View style={styles.detailsHeader}>
            <MapPin size={20} color="#7C3AED" />
            <Text style={styles.detailsTitle}>{selectedLocation.name}</Text>
            <TouchableOpacity onPress={() => setSelectedLocation(null)}>
              <Text style={styles.closeButton}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsContent}>
            <View style={styles.mainAQI}>
              <Text style={styles.aqiLabel}>Current AQI</Text>
              <Text style={[
                styles.aqiValue,
                { color: getAQIColor(selectedLocation.aqi) }
              ]}>
                {selectedLocation.aqi}
              </Text>
              <Text style={[
                styles.aqiStatus,
                { color: getAQIColor(selectedLocation.aqi) }
              ]}>
                {selectedLocation.status.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
            
            <View style={styles.pollutantGrid}>
              <View style={styles.pollutantItem}>
                <Text style={styles.pollutantLabel}>PM2.5</Text>
                <Text style={styles.pollutantValue}>{selectedLocation.pm25.toFixed(1)}</Text>
              </View>
              <View style={styles.pollutantItem}>
                <Text style={styles.pollutantLabel}>PM10</Text>
                <Text style={styles.pollutantValue}>{selectedLocation.pm10.toFixed(1)}</Text>
              </View>
              <View style={styles.pollutantItem}>
                <Text style={styles.pollutantLabel}>NO₂</Text>
                <Text style={styles.pollutantValue}>{selectedLocation.no2.toFixed(1)}</Text>
              </View>
              <View style={styles.pollutantItem}>
                <Text style={styles.pollutantLabel}>O₃</Text>
                <Text style={styles.pollutantValue}>{selectedLocation.o3.toFixed(1)}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      )}

      <ScrollView style={styles.bottomPanel} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Pollution Sources</Text>
        <Text style={styles.sectionSubtitle}>
          Real-time tracking of major pollution contributors
        </Text>
        
        <View style={styles.sourcesGrid}>
          {pollutionSources.map((source) => (
            <DataSourceCard key={source.id} source={source} />
          ))}
        </View>

        <LinearGradient
          colors={['#1E293B', '#334155']}
          style={styles.legendCard}
        >
          <Text style={styles.legendTitle}>AQI Color Scale</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>Good (0-50)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.legendText}>Moderate (51-100)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#F97316' }]} />
              <Text style={styles.legendText}>Unhealthy for Sensitive (101-150)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
              <Text style={styles.legendText}>Unhealthy (151-200)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
              <Text style={styles.legendText}>Very Unhealthy (201-300)</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendColor, { backgroundColor: '#7C2D12' }]} />
              <Text style={styles.legendText}>Hazardous (300+)</Text>
            </View>
          </View>
        </LinearGradient>
      </ScrollView>
    </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
  realTimeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  realTimeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  layerControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  layerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    gap: 4,
    flex: 1,
  },
  layerButtonText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  activeLayerButtonText: {
    color: '#FFFFFF',
  },
  dataStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 4,
  },
  statValue: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },
  mapWrapper: {
    flex: 1,
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  locationDetails: {
    position: 'absolute',
    bottom: 200,
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
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  closeButton: {
    color: '#94A3B8',
    fontSize: 24,
    fontWeight: 'bold',
  },
  detailsContent: {
    flexDirection: 'row',
    gap: 16,
  },
  mainAQI: {
    alignItems: 'center',
    flex: 1,
  },
  aqiLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 4,
  },
  aqiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aqiStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  pollutantGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pollutantItem: {
    alignItems: 'center',
    width: '45%',
  },
  pollutantLabel: {
    color: '#94A3B8',
    fontSize: 10,
    marginBottom: 2,
  },
  pollutantValue: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomPanel: {
    maxHeight: 180,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
  },
  sourcesGrid: {
    gap: 8,
    marginBottom: 16,
  },
  sourceCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sourceInfo: {
    flex: 1,
  },
  sourceName: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sourceCount: {
    color: '#94A3B8',
    fontSize: 12,
  },
  impactBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  impactText: {
    fontSize: 10,
    fontWeight: '600',
  },
  legendCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  legendTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  legendItems: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 12,
  },
});