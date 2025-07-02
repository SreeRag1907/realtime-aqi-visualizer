import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
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

  useEffect(() => {
    if (showAQIData) {
      loadAQIData();
    }
  }, [showAQIData]);

  const loadAQIData = async () => {
    setIsLoading(true);
    try {
      const aqiData = await aqiDataService.fetchRealTimeAQI();
      setStations(aqiData);
      setLastUpdated(new Date());
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
            
            aqiStations.forEach(station => {
              const marker = new google.maps.Marker({
                position: { lat: station.latitude, lng: station.longitude },
                map: map,
                title: station.name,
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: Math.max(8, Math.min(20, station.aqi / 10)),
                  fillColor: "${stations.length > 0 ? '#7C3AED' : '#7C3AED'}",
                  fillOpacity: 0.9,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF"
                }
              });

              const infoWindow = new google.maps.InfoWindow({
                content: \`
                  <div style="color: #000; padding: 10px; min-width: 200px;">
                    <h3 style="margin: 0 0 8px 0; color: #7C3AED;">\${station.name}</h3>
                    <div style="display: flex; gap: 10px; margin-bottom: 5px;">
                      <span style="font-weight: bold; color: \${station.aqi <= 50 ? '#10B981' : station.aqi <= 100 ? '#F59E0B' : station.aqi <= 150 ? '#F97316' : station.aqi <= 200 ? '#EF4444' : '#8B5CF6'};">AQI: \${station.aqi}</span>
                      <span style="font-size: 12px; color: #666;">(\${station.status.replace('_', ' ').toUpperCase()})</span>
                    </div>
                    <div style="font-size: 12px; color: #333; line-height: 1.4;">
                      <div>PM2.5: \${station.pm25.toFixed(1)} μg/m³</div>
                      <div>PM10: \${station.pm10.toFixed(1)} μg/m³</div>
                      <div>NO₂: \${station.no2.toFixed(1)} μg/m³</div>
                    </div>
                    <div style="font-size: 10px; color: #666; margin-top: 5px;">
                      Updated: \${new Date(station.lastUpdated).toLocaleTimeString()}
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
                scale: 10,
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
        <Text style={styles.infoTimestamp}>
          Updated: {lastUpdated.toLocaleTimeString()}
        </Text>
      )}
    </LinearGradient>
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
      
      <MapControls />
      <MapInfo />
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
  infoTimestamp: {
    color: '#7C3AED',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
