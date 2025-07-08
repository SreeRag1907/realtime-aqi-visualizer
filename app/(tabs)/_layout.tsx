import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Home, Map, TrendingUp, Zap, Bell } from 'lucide-react-native';
import FloatingNotification from '@/components/FloatingNotification';

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#0B1426',
            borderTopColor: '#2D1B69',
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
          },
          tabBarActiveTintColor: '#7C3AED',
          tabBarInactiveTintColor: '#64748B',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ size, color }) => (
              <Home size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'AQI Map',
            tabBarIcon: ({ size, color }) => (
              <Map size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'Trends',
            tabBarIcon: ({ size, color }) => (
              <TrendingUp size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="forecast"
          options={{
            title: 'Forecast',
            tabBarIcon: ({ size, color }) => (
              <Zap size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="alerts"
          options={{
            title: 'Alerts',
            tabBarIcon: ({ size, color }) => (
              <Bell size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <FloatingNotification />
    </View>
  );
}