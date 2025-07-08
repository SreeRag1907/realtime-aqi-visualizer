import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Globe, Database, Cloud, RefreshCw } from 'lucide-react-native';
import { aqiDataService, AQIStation } from '@/services/aqiDataService';

interface DataSourceStats {
  waqi: number;
  dataGov: number;
  openWeather: number;
  mock: number;
  total: number;
}

interface APIStatus {
  waqi: 'online' | 'offline' | 'testing';
  dataGov: 'online' | 'offline' | 'testing';
  openWeather: 'online' | 'offline' | 'testing';
}

export default function AQIStatusDashboard() {
  const [stations, setStations] = useState<AQIStation[]>([]);
  const [stats, setStats] = useState<DataSourceStats>({
    waqi: 0,
    dataGov: 0,
    openWeather: 0,
    mock: 0,
    total: 0,
  });
  const [apiStatus, setApiStatus] = useState<APIStatus>({
    waqi: 'testing',
    dataGov: 'testing',
    openWeather: 'testing',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadAQIData();
  }, []);

  const loadAQIData = async () => {
    setIsLoading(true);
    try {
      console.log('Loading comprehensive AQI data...');
      const data = await aqiDataService.fetchRealTimeAQI();
      
      setStations(data);
      
      // Calculate stats by data source
      const newStats = {
        waqi: data.filter(s => s.id.startsWith('waqi-')).length,
        dataGov: data.filter(s => s.id.startsWith('datagov-')).length,
        openWeather: data.filter(s => s.id.startsWith('ow-')).length,
        mock: data.filter(s => s.id.startsWith('rural-')).length,
        total: data.length,
      };
      
      setStats(newStats);
      
      // Update API status based on data received
      setApiStatus({
        waqi: newStats.waqi > 0 ? 'online' : 'offline',
        dataGov: newStats.dataGov > 0 ? 'online' : 'offline',
        openWeather: newStats.openWeather > 0 ? 'online' : 'offline',
      });
      
      setLastUpdate(new Date());
      
      console.log('AQI Data Summary:', {
        total: newStats.total,
        sources: {
          'WAQI (Global)': newStats.waqi,
          'Data.gov.in (Indian Gov)': newStats.dataGov,
          'OpenWeather': newStats.openWeather,
          'Mock/Local': newStats.mock,
        }
      });
      
    } catch (error) {
      console.error('Error loading AQI data:', error);
      Alert.alert('Error', 'Failed to load AQI data. Check console for details.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10B981';
      case 'offline': return '#EF4444';
      case 'testing': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getAQIQuality = () => {
    const realStations = stats.total - stats.mock;
    const percentage = stats.total > 0 ? (realStations / stats.total) * 100 : 0;
    
    if (percentage > 80) return { label: 'Excellent', color: '#10B981' };
    if (percentage > 60) return { label: 'Good', color: '#F59E0B' };
    if (percentage > 40) return { label: 'Fair', color: '#F97316' };
    return { label: 'Limited', color: '#EF4444' };
  };

  const showStationDetails = () => {
    const sampleStations = stations.slice(0, 5).map(s => 
      `${s.name}: AQI ${s.aqi} (${s.id.split('-')[0]})`
    ).join('\n');
    
    Alert.alert(
      'Sample Stations',
      sampleStations || 'No stations loaded',
      [{ text: 'OK' }]
    );
  };

  const quality = getAQIQuality();

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.header}
      >
        <Text style={styles.title}>AQI Data Status</Text>
        <Text style={styles.subtitle}>Real-time monitoring dashboard</Text>
      </LinearGradient>

      {/* Overall Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Activity size={24} color="#7C3AED" />
          <Text style={styles.cardTitle}>Data Coverage</Text>
        </View>
        <View style={styles.overallStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Stations</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: quality.color }]}>{quality.label}</Text>
            <Text style={styles.statLabel}>Data Quality</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.total - stats.mock}</Text>
            <Text style={styles.statLabel}>Live Sources</Text>
          </View>
        </View>
      </View>

      {/* API Status */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Globe size={24} color="#7C3AED" />
          <Text style={styles.cardTitle}>API Sources</Text>
        </View>
        
        <View style={styles.apiList}>
          <View style={styles.apiItem}>
            <View style={styles.apiInfo}>
              <Database size={20} color="#0EA5E9" />
              <View>
                <Text style={styles.apiName}>WAQI Global Network</Text>
                <Text style={styles.apiDesc}>World Air Quality Index</Text>
              </View>
            </View>
            <View style={styles.apiStats}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(apiStatus.waqi) }]} />
              <Text style={styles.stationCount}>{stats.waqi} stations</Text>
            </View>
          </View>

          <View style={styles.apiItem}>
            <View style={styles.apiInfo}>
              <Database size={20} color="#10B981" />
              <View>
                <Text style={styles.apiName}>Data.gov.in</Text>
                <Text style={styles.apiDesc}>Indian Government AQI</Text>
              </View>
            </View>
            <View style={styles.apiStats}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(apiStatus.dataGov) }]} />
              <Text style={styles.stationCount}>{stats.dataGov} stations</Text>
            </View>
          </View>

          <View style={styles.apiItem}>
            <View style={styles.apiInfo}>
              <Cloud size={20} color="#F59E0B" />
              <View>
                <Text style={styles.apiName}>OpenWeather</Text>
                <Text style={styles.apiDesc}>Weather & Air Pollution</Text>
              </View>
            </View>
            <View style={styles.apiStats}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(apiStatus.openWeather) }]} />
              <Text style={styles.stationCount}>{stats.openWeather} stations</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={[styles.actionButton, isLoading && styles.actionButtonDisabled]}
          onPress={loadAQIData}
          disabled={isLoading}
        >
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>
            {isLoading ? 'Refreshing...' : 'Refresh Data'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButtonSecondary}
          onPress={showStationDetails}
        >
          <Text style={styles.actionButtonSecondaryText}>View Sample Stations</Text>
        </TouchableOpacity>
      </View>

      {/* Last Update */}
      <Text style={styles.lastUpdate}>
        Last updated: {lastUpdate.toLocaleString()}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: '#E2E8F0',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7C3AED',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  apiList: {
    gap: 16,
  },
  apiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  apiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  apiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  apiDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  apiStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationCount: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonSecondaryText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  lastUpdate: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 32,
  },
});
