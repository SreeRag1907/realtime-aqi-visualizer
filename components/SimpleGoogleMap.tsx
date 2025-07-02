import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import { Target, Info } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface SimpleGoogleMapProps {
  apiKey?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

export default function SimpleGoogleMap({ 
  apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || 'YOUR_API_KEY',
  center = { lat: 28.6139, lng: 77.2090 }, // Delhi, India
  zoom = 10 
}: SimpleGoogleMapProps) {

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
            
            // Add a marker for the center location
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

            // Add info window
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
        <Text style={styles.infoTitle}>Google Maps</Text>
      </View>
      <Text style={styles.infoText}>
        Interactive map view of Delhi, India
      </Text>
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
});
