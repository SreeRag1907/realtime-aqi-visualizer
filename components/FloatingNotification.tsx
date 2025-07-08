import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ScrollView,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, X, AlertTriangle, Clock, MapPin, Settings } from 'lucide-react-native';
import { useNotifications } from '@/context/NotificationContext';
import { router } from 'expo-router';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FloatingNotification() {
  const { notifications, dismissNotification, unreadCount } = useNotifications();
  const [modalVisible, setModalVisible] = useState(false);
  
  // Position state - fixed to right side, only Y can change
  const [position, setPosition] = useState({
    x: screenWidth - 80, // Always on the right side
    y: screenHeight / 2 - 100,
  });
  
  const translateY = useRef(new Animated.Value(position.y)).current; // Only Y movement
  const scale = useRef(new Animated.Value(1)).current; // For tap feedback
  const pulseAnim = useRef(new Animated.Value(1)).current; // For pulse animation

  const criticalCount = notifications.filter(n => n.type === 'critical').length;
  const totalCount = unreadCount;

  // Initialize position
  useEffect(() => {
    translateY.setValue(position.y);
  }, []);

  // Pulse animation for critical alerts
  useEffect(() => {
    if (criticalCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [criticalCount]);

  // Pan responder for vertical dragging only
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical movement
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderGrant: () => {
        // Add a slight scale feedback when starting to drag
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: false, // Changed to false to avoid conflict
        }).start();
      },
      onPanResponderMove: (event, gestureState) => {
        // Update only Y position based on gesture
        translateY.setValue(position.y + gestureState.dy);
      },
      onPanResponderRelease: (event, gestureState) => {
        // Reset scale
        Animated.timing(scale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false, // Changed to false to avoid conflict
        }).start();

        // Calculate final Y position
        const newY = position.y + gestureState.dy;
        
        // Keep within vertical bounds
        const finalY = Math.max(100, Math.min(screenHeight - 150, newY));
        
        // Update position state
        setPosition({ x: screenWidth - 80, y: finalY }); // X stays fixed to right
        
        // Animate to final Y position
        Animated.spring(translateY, {
          toValue: finalY,
          useNativeDriver: false,
          tension: 150,
          friction: 8,
        }).start();

        // If it was just a tap (small movement), open modal
        if (Math.abs(gestureState.dx) < 10 && Math.abs(gestureState.dy) < 10) {
          setTimeout(() => setModalVisible(true), 100);
        }
      },
    })
  ).current;

  const handleDismiss = (notificationId: number) => {
    dismissNotification(notificationId);
  };

  const handleViewAllAlerts = () => {
    setModalVisible(false);
    router.push('/(tabs)/alerts');
  };

  // Don't show widget if no notifications
  if (totalCount === 0) {
    return null;
  }

  const getSeverityColor = (type: string): [string, string] => {
    switch (type) {
      case 'critical': return ['#EF4444', '#DC2626'];
      case 'warning': return ['#F59E0B', '#D97706'];
      case 'info': return ['#3B82F6', '#2563EB'];
      default: return ['#6B7280', '#4B5563'];
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle size={16} color="#FFFFFF" />;
      case 'warning': return <AlertTriangle size={16} color="#FFFFFF" />;
      case 'info': return <Bell size={16} color="#FFFFFF" />;
      default: return <Bell size={16} color="#FFFFFF" />;
    }
  };

  return (
    <>
      {/* Floating Notification Widget */}
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.floatingWidget,
          {
            right: 20, // Fixed to right side
            transform: [
              { translateY },
              { scale },
            ],
          },
        ]}
      >
        <LinearGradient
          colors={criticalCount > 0 ? ['#EF4444', '#DC2626'] : ['#7C3AED', '#6D28D9']}
          style={styles.widgetContent}
        >
          <Bell size={20} color="#FFFFFF" />
          {totalCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalCount}</Text>
            </View>
          )}
          
          {/* Pulse animation for critical alerts */}
          {criticalCount > 0 && (
            <Animated.View 
              style={[
                styles.pulseCircle,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]} 
            />
          )}
        </LinearGradient>
      </Animated.View>

      {/* Notification Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <LinearGradient
              colors={['#0B1426', '#1A0B2E']}
              style={styles.modalHeader}
            >
              <View style={styles.modalTitleContainer}>
                <Bell size={24} color="#7C3AED" />
                <Text style={styles.modalTitle}>Recent Alerts</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#94A3B8" />
              </TouchableOpacity>
            </LinearGradient>

            {/* Notifications List */}
            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color="#6B7280" />
                  <Text style={styles.emptyTitle}>No Active Alerts</Text>
                  <Text style={styles.emptyMessage}>
                    You'll be notified when air quality changes require attention
                  </Text>
                </View>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <LinearGradient
                    key={notification.id}
                    colors={['#1E293B', '#334155']}
                    style={styles.notificationCard}
                  >
                    <View style={styles.notificationHeader}>
                      <LinearGradient
                        colors={getSeverityColor(notification.type)}
                        style={styles.notificationIcon}
                      >
                        {getTypeIcon(notification.type)}
                      </LinearGradient>
                      <View style={styles.notificationInfo}>
                        <Text style={styles.notificationTitle}>{notification.title}</Text>
                        <View style={styles.notificationMeta}>
                          <Clock size={12} color="#94A3B8" />
                          <Text style={styles.notificationTime}>{notification.time}</Text>
                          {notification.location && (
                            <>
                              <Text style={styles.metaDivider}>•</Text>
                              <MapPin size={12} color="#94A3B8" />
                              <Text style={styles.notificationLocation}>{notification.location}</Text>
                            </>
                          )}
                        </View>
                      </View>
                    </View>
                    <Text style={styles.notificationMessage}>{notification.message}</Text>
                    
                    <View style={styles.notificationActions}>
                      <TouchableOpacity 
                        style={styles.dismissButton}
                        onPress={() => handleDismiss(notification.id)}
                      >
                        <Text style={styles.dismissButtonText}>Dismiss</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                ))
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={handleViewAllAlerts}
              >
                <LinearGradient
                  colors={['#7C3AED', '#6D28D9']}
                  style={styles.viewAllGradient}
                >
                  <Settings size={16} color="#FFFFFF" />
                  <Text style={styles.viewAllText}>Manage Alerts</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingWidget: {
    position: 'absolute',
    top: screenHeight / 2 - 100, // Initial vertical position
    width: 60,
    height: 60,
    zIndex: 1000,
    elevation: 1000,
  },
  widgetContent: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pulseCircle: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EF4444',
    opacity: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    minHeight: screenHeight * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    color: '#E2E8F0',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  notificationsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#E2E8F0',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  notificationHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  notificationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  notificationTime: {
    color: '#94A3B8',
    fontSize: 12,
  },
  metaDivider: {
    color: '#94A3B8',
    fontSize: 12,
  },
  notificationLocation: {
    color: '#94A3B8',
    fontSize: 12,
  },
  notificationMessage: {
    color: '#94A3B8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dismissButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  dismissButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  viewAllButton: {
    borderRadius: 12,
  },
  viewAllGradient: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  viewAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
