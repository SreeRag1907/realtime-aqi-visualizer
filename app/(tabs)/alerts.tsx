import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, TriangleAlert as AlertTriangle, Shield, MapPin, Clock, Settings, Zap, Wind, Heart, Users, Satellite, Target } from 'lucide-react-native';

export default function AlertsScreen() {
  const [notifications, setNotifications] = useState({
    aqiSpikes: true,
    healthAlerts: true,
    forecastAlerts: false,
    locationAlerts: true,
    emergencyAlerts: true,
  });

  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const activeAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'Severe Air Quality Alert',
      message: 'AQI has reached 185 (Unhealthy) in your area. Immediate protective measures recommended.',
      location: 'New Delhi',
      time: '5 min ago',
      icon: <AlertTriangle size={24} color="#EF4444" />,
      action: 'View Details',
    },
    {
      id: 2,
      type: 'warning',
      title: 'Forecast Alert',
      message: 'Air quality expected to deteriorate significantly over next 24 hours due to calm weather conditions.',
      location: 'Current Location',
      time: '15 min ago',
      icon: <Zap size={24} color="#F59E0B" />,
      action: 'View Forecast',
    },
    {
      id: 3,
      type: 'info',
      title: 'Health Recommendation',
      message: 'Sensitive individuals should avoid outdoor activities between 2-6 PM today.',
      location: 'New Delhi',
      time: '1 hour ago',
      icon: <Heart size={24} color="#3B82F6" />,
      action: 'View Tips',
    },
    {
      id: 4,
      type: 'satellite',
      title: 'Satellite Data Update',
      message: 'New ISRO satellite imagery shows pollution plume moving northeast. Updated forecasts available.',
      location: 'Regional',
      time: '2 hours ago',
      icon: <Satellite size={24} color="#7C3AED" />,
      action: 'View Map',
    },
  ];

  const recentAlerts = [
    {
      id: 5,
      title: 'Air Quality Improved',
      message: 'AQI dropped to 78 (Moderate) after rainfall',
      time: 'Yesterday',
      severity: 'good',
    },
    {
      id: 6,
      title: 'Pollution Source Detected',
      message: 'Industrial emissions spike detected 2km northwest',
      time: '2 days ago',
      severity: 'warning',
    },
    {
      id: 7,
      title: 'Weekly Summary',
      message: 'Average AQI was 15% better than last week',
      time: '3 days ago',
      severity: 'info',
    },
  ];

  const alertSettings = [
    {
      id: 'aqiSpikes',
      title: 'AQI Threshold Alerts',
      description: 'Get notified when AQI exceeds your set limits',
      icon: <Wind size={20} color="#7C3AED" />,
    },
    {
      id: 'healthAlerts',
      title: 'Health Recommendations',
      description: 'Personalized health advice based on air quality',
      icon: <Heart size={20} color="#EF4444" />,
    },
    {
      id: 'forecastAlerts',
      title: 'Forecast Warnings',
      description: 'Advanced warnings for predicted air quality changes',
      icon: <Zap size={20} color="#F59E0B" />,
    },
    {
      id: 'locationAlerts',
      title: 'Location-Based Alerts',
      description: 'Alerts for your saved locations and routes',
      icon: <MapPin size={20} color="#10B981" />,
    },
    {
      id: 'emergencyAlerts',
      title: 'Emergency Notifications',
      description: 'Critical air quality emergencies and advisories',
      icon: <AlertTriangle size={20} color="#EF4444" />,
    },
  ];

  const severityFilters = [
    { id: 'all', name: 'All', color: '#94A3B8' },
    { id: 'critical', name: 'Critical', color: '#EF4444' },
    { id: 'warning', name: 'Warning', color: '#F59E0B' },
    { id: 'info', name: 'Info', color: '#3B82F6' },
  ];

  const getSeverityColor = (type: string) => {
    switch (type) {
      case 'critical': return '#EF4444';
      case 'warning': return '#F59E0B';
      case 'info': return '#3B82F6';
      case 'satellite': return '#7C3AED';
      case 'good': return '#10B981';
      default: return '#94A3B8';
    }
  };

  const filteredAlerts = selectedSeverity === 'all' 
    ? activeAlerts 
    : activeAlerts.filter(alert => alert.type === selectedSeverity);

  const AlertCard = ({ alert, isRecent = false }) => (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      style={[styles.alertCard, isRecent && styles.recentAlertCard]}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          {alert.icon || <Bell size={20} color={getSeverityColor(alert.severity || alert.type)} />}
        </View>
        <View style={styles.alertInfo}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <View style={styles.alertMeta}>
            <Clock size={12} color="#94A3B8" />
            <Text style={styles.alertTime}>{alert.time}</Text>
            {alert.location && (
              <>
                <Text style={styles.alertDivider}>•</Text>
                <MapPin size={12} color="#94A3B8" />
                <Text style={styles.alertLocation}>{alert.location}</Text>
              </>
            )}
          </View>
        </View>
      </View>
      
      <Text style={styles.alertMessage}>{alert.message}</Text>
      
      {alert.action && (
        <TouchableOpacity style={styles.alertAction}>
          <Text style={styles.alertActionText}>{alert.action}</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );

  const SettingRow = ({ setting }) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <View style={styles.settingIcon}>
          {setting.icon}
        </View>
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{setting.title}</Text>
          <Text style={styles.settingDescription}>{setting.description}</Text>
        </View>
      </View>
      <Switch
        value={notifications[setting.id]}
        onValueChange={(value) => 
          setNotifications(prev => ({ ...prev, [setting.id]: value }))
        }
        trackColor={{ false: '#374151', true: '#7C3AED' }}
        thumbColor={notifications[setting.id] ? '#FFFFFF' : '#94A3B8'}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Air Quality Alerts</Text>
          <Text style={styles.headerSubtitle}>ISRO Satellite & Ground Station Network</Text>
        </View>
        
        <View style={styles.alertSummary}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.summaryCard}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.summaryNumber}>2</Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.summaryCard}
          >
            <Shield size={20} color="#FFFFFF" />
            <Text style={styles.summaryNumber}>1</Text>
            <Text style={styles.summaryLabel}>Warning</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#7C3AED', '#6D28D9']}
            style={styles.summaryCard}
          >
            <Satellite size={20} color="#FFFFFF" />
            <Text style={styles.summaryNumber}>4</Text>
            <Text style={styles.summaryLabel}>Active</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.filterSection}>
          <Text style={styles.sectionTitle}>Filter by Severity</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterButtons}>
            {severityFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterButton,
                  selectedSeverity === filter.id && {
                    backgroundColor: filter.color,
                    borderColor: filter.color,
                  },
                ]}
                onPress={() => setSelectedSeverity(filter.id)}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedSeverity === filter.id && styles.activeFilterText,
                ]}>
                  {filter.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.alertsSection}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {filteredAlerts.length > 0 ? (
            filteredAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))
          ) : (
            <LinearGradient
              colors={['#1E293B', '#334155']}
              style={styles.emptyState}
            >
              <Target size={32} color="#94A3B8" />
              <Text style={styles.emptyStateTitle}>No alerts for this filter</Text>
              <Text style={styles.emptyStateText}>
                Try changing the severity filter to view more alerts
              </Text>
            </LinearGradient>
          )}
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {recentAlerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} isRecent={true} />
          ))}
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingsHeader}>
            <Settings size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Notification Settings</Text>
          </View>
          
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.settingsCard}
          >
            {alertSettings.map((setting, index) => (
              <View key={setting.id}>
                <SettingRow setting={setting} />
                {index < alertSettings.length - 1 && <View style={styles.settingDivider} />}
              </View>
            ))}
          </LinearGradient>
        </View>

        <LinearGradient
          colors={['#7C3AED', '#3B82F6']}
          style={styles.actionButton}
        >
          <TouchableOpacity style={styles.buttonContent}>
            <Users size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Emergency Contacts</Text>
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
  headerContent: {
    marginBottom: 20,
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
  alertSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  summaryNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  filterButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  alertsSection: {
    marginBottom: 24,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recentAlertCard: {
    opacity: 0.8,
  },
  alertHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  alertIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  alertTime: {
    color: '#94A3B8',
    fontSize: 12,
  },
  alertDivider: {
    color: '#94A3B8',
    fontSize: 12,
  },
  alertLocation: {
    color: '#94A3B8',
    fontSize: 12,
  },
  alertMessage: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  alertAction: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#7C3AED',
  },
  alertActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  recentSection: {
    marginBottom: 24,
  },
  settingsSection: {
    marginBottom: 24,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  settingsCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  settingDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginLeft: 48,
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyStateTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
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