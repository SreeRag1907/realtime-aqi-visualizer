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
import { Bell, Settings, Wind, Heart, Zap, MapPin, AlertTriangle, Shield, Clock } from 'lucide-react-native';
import { useNotifications } from '@/context/NotificationContext';

export default function AlertsScreen() {
  const { notifications, unreadCount } = useNotifications();
  
  const [notificationSettings, setNotificationSettings] = useState({
    aqiSpikes: true,
    healthAlerts: true,
    forecastAlerts: false,
    locationAlerts: true,
    emergencyAlerts: true,
    pushNotifications: true,
    emailAlerts: false,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const criticalCount = notifications.filter(n => n.type === 'critical').length;
  const warningCount = notifications.filter(n => n.type === 'warning').length;

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

  const deliverySettings = [
    {
      id: 'pushNotifications',
      title: 'Push Notifications',
      description: 'Receive alerts directly on your device',
      icon: <Bell size={20} color="#7C3AED" />,
    },
    {
      id: 'emailAlerts',
      title: 'Email Alerts',
      description: 'Get detailed reports via email',
      icon: <Bell size={20} color="#3B82F6" />,
    },
    {
      id: 'soundEnabled',
      title: 'Sound Alerts',
      description: 'Play notification sounds for alerts',
      icon: <Bell size={20} color="#F59E0B" />,
    },
    {
      id: 'vibrationEnabled',
      title: 'Vibration',
      description: 'Vibrate device for important alerts',
      icon: <Bell size={20} color="#10B981" />,
    },
  ];

  const SettingRow = ({ setting }: { setting: any }) => (
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
        value={notificationSettings[setting.id]}
        onValueChange={(value) => 
          setNotificationSettings(prev => ({ ...prev, [setting.id]: value }))
        }
        trackColor={{ false: '#374151', true: '#7C3AED' }}
        thumbColor={notificationSettings[setting.id] ? '#FFFFFF' : '#94A3B8'}
      />
    </View>
  );

  const RecentAlert = ({ alert }: { alert: any }) => (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      style={styles.recentAlertCard}
    >
      <View style={styles.alertHeader}>
        <View style={styles.alertIcon}>
          <AlertTriangle size={16} color="#EF4444" />
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertTitle}>{alert.title}</Text>
          <Text style={styles.alertTime}>{alert.time}</Text>
        </View>
      </View>
    </LinearGradient>
  );

  const recentAlerts = notifications.slice(0, 3);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={['#0B1426', '#1A0B2E']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Alert Settings</Text>
          <Text style={styles.headerSubtitle}>Manage your air quality notifications</Text>
        </View>
        
        <View style={styles.alertSummary}>
          <LinearGradient
            colors={['#EF4444', '#DC2626']}
            style={styles.summaryCard}
          >
            <AlertTriangle size={20} color="#FFFFFF" />
            <Text style={styles.summaryNumber}>{criticalCount}</Text>
            <Text style={styles.summaryLabel}>Critical</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#F59E0B', '#D97706']}
            style={styles.summaryCard}
          >
            <Shield size={20} color="#FFFFFF" />
            <Text style={styles.summaryNumber}>{warningCount}</Text>
            <Text style={styles.summaryLabel}>Warning</Text>
          </LinearGradient>
          
          <LinearGradient
            colors={['#7C3AED', '#6D28D9']}
            style={styles.summaryCard}
          >
            <Bell size={20} color="#FFFFFF" />
            <Text style={styles.summaryNumber}>{unreadCount}</Text>
            <Text style={styles.summaryLabel}>Total</Text>
          </LinearGradient>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Recent Alerts */}
        {recentAlerts.length > 0 && (
          <View style={styles.recentSection}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            {recentAlerts.map((alert) => (
              <RecentAlert key={alert.id} alert={alert} />
            ))}
          </View>
        )}

        {/* Alert Type Settings */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsHeader}>
            <Settings size={20} color="#7C3AED" />
            <Text style={styles.sectionTitle}>Alert Types</Text>
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

        {/* Delivery Settings */}
        <View style={styles.settingsSection}>
          <View style={styles.settingsHeader}>
            <Bell size={20} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Delivery Settings</Text>
          </View>
          
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.settingsCard}
          >
            {deliverySettings.map((setting, index) => (
              <View key={setting.id}>
                <SettingRow setting={setting} />
                {index < deliverySettings.length - 1 && <View style={styles.settingDivider} />}
              </View>
            ))}
          </LinearGradient>
        </View>

        {/* Threshold Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Alert Thresholds</Text>
          <LinearGradient
            colors={['#1E293B', '#334155']}
            style={styles.thresholdCard}
          >
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Moderate (Yellow Alert)</Text>
              <Text style={styles.thresholdValue}>AQI &gt; 100</Text>
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Unhealthy (Orange Alert)</Text>
              <Text style={styles.thresholdValue}>AQI &gt; 150</Text>
            </View>
            <View style={styles.settingDivider} />
            <View style={styles.thresholdRow}>
              <Text style={styles.thresholdLabel}>Very Unhealthy (Red Alert)</Text>
              <Text style={styles.thresholdValue}>AQI &gt; 200</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#7C3AED', '#6D28D9']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>Test Notifications</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              style={styles.actionGradient}
            >
              <Text style={styles.actionText}>Clear All Alerts</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  recentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  recentAlertCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertTime: {
    color: '#94A3B8',
    fontSize: 12,
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
  thresholdCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  thresholdLabel: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  thresholdValue: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
  },
  actionSection: {
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 12,
  },
  actionGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
