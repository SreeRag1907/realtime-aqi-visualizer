import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  Animated,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Info, RefreshCw } from 'lucide-react-native';
import { aqiDataService, AQIStation } from '@/services/aqiDataService';

const { width, height } = Dimensions.get('window');

interface SimpleGoogleMapProps {
  apiKey?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  showAQIData?: boolean;
}

export default function SimpleGoogleMap({ 
  apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
  center = { lat: 28.6139, lng: 77.2090 }, // Delhi, India
  zoom = 6, // Wider view to see multiple cities
  showAQIData = true
}: SimpleGoogleMapProps) {
  const [stations, setStations] = useState<AQIStation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showNotification, setShowNotification] = useState(false);
  const refreshAnimation = useState(new Animated.Value(0))[0];

  useEffect(() => {
    if (showAQIData) {
      loadAQIData();
    }
  }, [showAQIData]);

  useEffect(() => {
    if (showNotification) {
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 2000); // Hide after 2 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showNotification]);

  const loadAQIData = async () => {
    setIsLoading(true);
    try {
      const aqiData = await aqiDataService.fetchRealTimeAQI();
      setStations(aqiData);
      setLastUpdated(new Date());
      setShowNotification(true); // Show notification when data updates
    } catch (error) {
      console.error('Error loading AQI data:', error);
    } finally {
      setIsLoading(false);
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

  const googleMapsHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          html, body { 
            margin: 0; 
            padding: 0; 
            height: 100%; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          #map { 
            height: 100%; 
            width: 100%; 
          }
          .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #7C3AED;
            font-size: 16px;
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div class="loading">Loading Map...</div>
        <div id="map"></div>
        <script>
          function initMap() {
            // Hide loading text
            document.querySelector('.loading').style.display = 'none';
            
            const mapCenter = { lat: ${center.lat}, lng: ${center.lng} };
            
            const map = new google.maps.Map(document.getElementById("map"), {
              zoom: ${zoom},
              center: mapCenter,
              mapTypeId: 'roadmap',
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: true,
              scaleControl: true,
              streetViewControl: false,
              rotateControl: false,
              fullscreenControl: true,
              styles: [
                {
                  "featureType": "all",
                  "elementType": "geometry.fill",
                  "stylers": [{"lightness": -20}]
                },
                {
                  "featureType": "all",
                  "elementType": "labels.text.fill",
                  "stylers": [{"color": "#ffffff"}]
                },
                {
                  "featureType": "all",
                  "elementType": "labels.text.stroke",
                  "stylers": [{"color": "#000000"}, {"lightness": 13}]
                },
                {
                  "featureType": "administrative",
                  "elementType": "geometry.fill",
                  "stylers": [{"color": "#000000"}]
                },
                {
                  "featureType": "administrative",
                  "elementType": "geometry.stroke",
                  "stylers": [{"color": "#144b53"}, {"lightness": 14}, {"weight": 1.4}]
                },
                {
                  "featureType": "landscape",
                  "elementType": "all",
                  "stylers": [{"color": "#08304b"}]
                },
                {
                  "featureType": "poi",
                  "elementType": "geometry",
                  "stylers": [{"color": "#0c4152"}, {"lightness": 5}]
                },
                {
                  "featureType": "road.highway",
                  "elementType": "geometry.fill",
                  "stylers": [{"color": "#000000"}]
                },
                {
                  "featureType": "road.highway",
                  "elementType": "geometry.stroke",
                  "stylers": [{"color": "#0b434f"}, {"lightness": 25}]
                },
                {
                  "featureType": "road.arterial",
                  "elementType": "geometry.fill",
                  "stylers": [{"color": "#000000"}]
                },
                {
                  "featureType": "road.arterial",
                  "elementType": "geometry.stroke",
                  "stylers": [{"color": "#0b3d51"}, {"lightness": 16}]
                },
                {
                  "featureType": "road.local",
                  "elementType": "geometry",
                  "stylers": [{"color": "#000000"}]
                },
                {
                  "featureType": "transit",
                  "elementType": "all",
                  "stylers": [{"color": "#146474"}]
                },
                {
                  "featureType": "water",
                  "elementType": "all",
                  "stylers": [{"color": "#021019"}]
                }
              ]
            });
            
            ${showAQIData ? `
            // Add AQI markers for Indian cities
            const aqiStations = ${JSON.stringify(stations)};
            
            // Function to get AQI color
            function getAQIColor(aqi) {
              if (aqi <= 50) return '#10B981';
              if (aqi <= 100) return '#F59E0B';
              if (aqi <= 150) return '#F97316';
              if (aqi <= 200) return '#EF4444';
              if (aqi <= 300) return '#8B5CF6';
              return '#7C2D12';
            }
            
            function getAQIStatus(aqi) {
              if (aqi <= 50) return 'Good';
              if (aqi <= 100) return 'Moderate';
              if (aqi <= 150) return 'Unhealthy for Sensitive';
              if (aqi <= 200) return 'Unhealthy';
              if (aqi <= 300) return 'Very Unhealthy';
              return 'Hazardous';
            }
            
            aqiStations.forEach(station => {
              const aqiColor = getAQIColor(station.aqi);
              const aqiStatus = getAQIStatus(station.aqi);
              
              const marker = new google.maps.Marker({
                position: { lat: station.latitude, lng: station.longitude },
                map: map,
                title: station.name,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 12, // Consistent size for all markers
                  fillColor: aqiColor,
                  fillOpacity: 0.9,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF"
                }
              });

              const infoWindow = new google.maps.InfoWindow({
                content: \`
                  <div style="color: #000; padding: 12px; min-width: 220px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <h3 style="margin: 0 0 10px 0; color: #7C3AED; font-size: 16px; font-weight: bold;">\${station.name}</h3>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: \${aqiColor};"></div>
                      <span style="font-weight: bold; color: \${aqiColor}; font-size: 18px;">AQI: \${station.aqi}</span>
                      <span style="font-size: 12px; color: #666; font-weight: 500;">(\${aqiStatus})</span>
                    </div>
                    <div style="font-size: 13px; color: #333; line-height: 1.5; margin-bottom: 8px;">
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span><strong>PM2.5:</strong> \${station.pm25.toFixed(1)} μg/m³</span>
                        <span><strong>PM10:</strong> \${station.pm10.toFixed(1)} μg/m³</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                        <span><strong>NO₂:</strong> \${station.no2.toFixed(1)} μg/m³</span>
                        <span><strong>SO₂:</strong> \${station.so2.toFixed(1)} μg/m³</span>
                      </div>
                      <div style="display: flex; justify-content: space-between;">
                        <span><strong>CO:</strong> \${station.co.toFixed(1)} mg/m³</span>
                        <span><strong>O₃:</strong> \${station.o3.toFixed(1)} μg/m³</span>
                      </div>
                    </div>
                    <div style="font-size: 11px; color: #666; text-align: center; padding-top: 8px; border-top: 1px solid #eee;">
                      Last Updated: \${new Date(station.lastUpdated).toLocaleString()}
                    </div>
                  </div>
                \`
              });

              marker.addListener("click", () => {
                infoWindow.open(map, marker);
              });
            });
            ` : `
            // Add a default marker for Delhi
            const marker = new google.maps.Marker({
              position: mapCenter,
              map: map,
              title: "Delhi, India",
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12, // Same consistent size
                fillColor: "#7C3AED",
                fillOpacity: 0.9,
                strokeWeight: 2,
                strokeColor: "#FFFFFF"
              }
            });

            const infoWindow = new google.maps.InfoWindow({
              content: \`
                <div style="color: #000; padding: 10px;">
                  <h3 style="margin: 0 0 5px 0; color: #7C3AED;">Delhi, India</h3>
                  <p style="margin: 0; font-size: 12px;">📍 \${mapCenter.lat.toFixed(4)}°N, \${mapCenter.lng.toFixed(4)}°E</p>
                </div>
              \`
            });

            marker.addListener("click", () => {
              infoWindow.open(map, marker);
            });
            `}
          }
          
          function onError() {
            document.querySelector('.loading').innerHTML = 'Failed to load Google Maps. Please check your API key.';
            document.querySelector('.loading').style.color = '#EF4444';
          }
          
          window.onload = initMap;
        </script>
        <script async defer
          src="https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=initMap&libraries=geometry"
          onerror="onError()">
        </script>
      </body>
    </html>
  `;

  const MapControls = () => (
    <View style={styles.mapControls}>
      {showAQIData && (
        <TouchableOpacity 
          style={[styles.controlButton, isLoading && styles.loadingButton]} 
          onPress={loadAQIData}
          disabled={isLoading}
        >
          <RefreshCw size={20} color={isLoading ? "#7C3AED" : "#FFFFFF"} />
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.controlButton}>
        <Target size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );

  const MapInfo = () => (
    <LinearGradient
      colors={['#1E293B', '#334155']}
      style={styles.mapInfo}
    >
      <View style={styles.infoHeader}>
        <Info size={16} color="#7C3AED" />
        <Text style={styles.infoTitle}>Air Quality Map</Text>
      </View>
      <Text style={styles.infoText}>
        {showAQIData ? 'Real-time AQI data from OpenWeatherMap' : 'Interactive Google Maps view'}
      </Text>
      {showAQIData && (
        <View style={styles.infoDetails}>
          <Text style={styles.infoTimestamp}>
            Updated: {lastUpdated.toLocaleTimeString()}
          </Text>
          <Text style={styles.stationCount}>
            {stations.length} monitoring stations
          </Text>
        </View>
      )}
    </LinearGradient>
  );

  const UpdateNotification = () => {
    if (!showNotification || !showAQIData) return null;
    
    return (
      <LinearGradient
        colors={['#10B981', '#059669']}
        style={styles.notification}
      >
        <View style={styles.notificationContent}>
          <RefreshCw size={16} color="#FFFFFF" />
          <Text style={styles.notificationText}>Data Updated Successfully</Text>
        </View>
      </LinearGradient>
    );
  };

  const Legend = () => (
    <View style={styles.legend}>
      <LinearGradient
        colors={['#1E293B', '#334155']}
        style={styles.legendContainer}
      >
        <Text style={styles.legendTitle}>AQI Scale</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Good</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>Moderate</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#F97316' }]} />
            <Text style={styles.legendText}>Unhealthy</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Very Unhealthy</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <WebView
        style={styles.map}
        source={{ html: googleMapsHTML }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        scrollEnabled={true}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onError={(error) => {
          console.log('WebView error:', error.nativeEvent);
        }}
        onLoadStart={() => {
          console.log('Google Maps loading...');
        }}
        onLoadEnd={() => {
          console.log('Google Maps loaded successfully');
        }}
      />
      
      <UpdateNotification />
      <MapControls />
      <MapInfo />
      {showAQIData && <Legend />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1426',
  },
  map: {
    flex: 1,
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
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  loadingButton: {
    backgroundColor: '#475569',
  },
  mapInfo: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 80,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoTitle: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  infoDetails: {
    marginTop: 4,
    gap: 2,
  },
  infoTimestamp: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '500',
  },
  stationCount: {
    color: '#94A3B8',
    fontSize: 10,
  },
  notification: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  legendContainer: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  legendTitle: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  legendItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    gap: 8,
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  legendText: {
    color: '#94A3B8',
    fontSize: 10,
    textAlign: 'center',
  },
});
