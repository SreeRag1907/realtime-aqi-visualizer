import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { aqiDataService, AQIStation } from '@/services/aqiDataService';

export interface NotificationData {
  id: number;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
  location?: string;
  aqiValue?: number;
  station?: AQIStation;
  dismissed?: boolean;
}

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id' | 'time'>) => void;
  dismissNotification: (id: number) => void;
  clearAllNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationData[]>([
    // Sample notifications for testing
    {
      id: 1,
      type: 'critical',
      title: 'Severe Air Quality Alert',
      message: 'AQI has reached 185 (Unhealthy) in your area. Immediate protective measures recommended.',
      time: '5 min ago',
      location: 'New Delhi',
      aqiValue: 185,
    },
    {
      id: 2,
      type: 'warning',
      title: 'Forecast Alert',
      message: 'Air quality expected to deteriorate significantly over next 24 hours due to calm weather conditions.',
      time: '15 min ago',
      location: 'Current Location',
      aqiValue: 142,
    },
  ]);
  const [lastAQICheck, setLastAQICheck] = useState<{ [stationId: string]: number }>({});

  useEffect(() => {
    // Monitor AQI data for significant changes
    const checkAQIUpdates = async () => {
      try {
        const stations = await aqiDataService.fetchRealTimeAQI();
        
        stations.forEach(station => {
          const lastValue = lastAQICheck[station.id];
          const currentValue = station.aqi;
          
          // Check for significant AQI changes or high values
          if (lastValue !== undefined) {
            const change = currentValue - lastValue;
            const changePercentage = Math.abs(change) / lastValue * 100;
            
            // Alert for significant increases or critical levels
            if (change > 50 || (currentValue >= 150 && lastValue < 150)) {
              addNotification({
                type: currentValue >= 200 ? 'critical' : 'warning',
                title: change > 50 ? 'Rapid AQI Increase' : 'Air Quality Deteriorated',
                message: `AQI increased from ${Math.round(lastValue)} to ${Math.round(currentValue)} in ${station.name}. Take protective measures.`,
                location: station.name,
                aqiValue: currentValue,
                station: station,
              });
            }
            
            // Alert for very high pollution levels
            else if (currentValue >= 200 && lastValue < 200) {
              addNotification({
                type: 'critical',
                title: 'Unhealthy Air Quality Alert',
                message: `Air quality has reached unhealthy levels (AQI: ${Math.round(currentValue)}) in ${station.name}. Avoid outdoor activities.`,
                location: station.name,
                aqiValue: currentValue,
                station: station,
              });
            }
            
            // Positive changes
            else if (change < -30 && currentValue <= 100) {
              addNotification({
                type: 'info',
                title: 'Air Quality Improved',
                message: `Good news! AQI decreased from ${Math.round(lastValue)} to ${Math.round(currentValue)} in ${station.name}.`,
                location: station.name,
                aqiValue: currentValue,
                station: station,
              });
            }
          }
          
          // First time check - alert for high values
          else if (currentValue >= 150) {
            addNotification({
              type: currentValue >= 200 ? 'critical' : 'warning',
              title: 'High Air Pollution Detected',
              message: `Current AQI is ${Math.round(currentValue)} in ${station.name}. Consider limiting outdoor exposure.`,
              location: station.name,
              aqiValue: currentValue,
              station: station,
            });
          }
        });
        
        // Update last check values
        const newLastCheck: { [stationId: string]: number } = {};
        stations.forEach(station => {
          newLastCheck[station.id] = station.aqi;
        });
        setLastAQICheck(newLastCheck);
        
      } catch (error) {
        console.error('Error checking AQI updates:', error);
      }
    };

    // Initial check
    checkAQIUpdates();
    
    // Set up periodic checks every 15 minutes
    const interval = setInterval(checkAQIUpdates, 15 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const addNotification = (notificationData: Omit<NotificationData, 'id' | 'time'>) => {
    const newNotification: NotificationData = {
      ...notificationData,
      id: Date.now() + Math.random(),
      time: getTimeAgo(new Date()),
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 20)); // Keep max 20 notifications
  };

  const dismissNotification = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, dismissed: true } : n
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.dismissed).length;

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <NotificationContext.Provider value={{
      notifications: notifications.filter(n => !n.dismissed),
      addNotification,
      dismissNotification,
      clearAllNotifications,
      unreadCount,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
