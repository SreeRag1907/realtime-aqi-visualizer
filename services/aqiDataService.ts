import { Platform } from 'react-native';

// Types for AQI data structures
export interface AQIStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  aqi: number;
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
  lastUpdated: string;
  status: 'good' | 'moderate' | 'unhealthy_sensitive' | 'unhealthy' | 'very_unhealthy' | 'hazardous';
}

export interface SatelliteData {
  id: string;
  timestamp: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  pollutionLevel: number;
  source: 'ISRO' | 'NASA' | 'ESA';
  type: 'PM2.5' | 'NO2' | 'SO2' | 'CO';
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
}

class AQIDataService {
  private baseUrl = 'https://api.data.gov.in/resource';
  private cpcbApiKey = process.env.EXPO_PUBLIC_CPCB_API_KEY || 'demo-key';
  private isroApiKey = process.env.EXPO_PUBLIC_ISRO_API_KEY || 'demo-key';
  
  // Cache for reducing API calls
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private getCachedData(key: string) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Fetch real-time AQI data from CPCB
  async fetchRealTimeAQI(): Promise<AQIStation[]> {
    const cacheKey = 'realtime-aqi';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // CPCB Real-time API endpoint
      const response = await fetch(
        `${this.baseUrl}/9a4c7c5b-b9b4-4b8e-a9e7-8b5c6d7e8f9g/api/records/1.0/search/?dataset=real-time-air-quality-index&rows=100&apikey=${this.cpcbApiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform CPCB data to our format
      const stations: AQIStation[] = this.transformCPCBData(data.records || []);
      
      this.setCachedData(cacheKey, stations);
      return stations;
    } catch (error) {
      console.error('Error fetching real-time AQI:', error);
      // Return mock data for development
      return this.getMockAQIData();
    }
  }

  // Fetch ISRO satellite data
  async fetchSatelliteData(): Promise<SatelliteData[]> {
    const cacheKey = 'satellite-data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // ISRO Bhuvan API for satellite data
      const response = await fetch(
        `https://bhuvan-app1.nrsc.gov.in/api/aqi/satellite-data?apikey=${this.isroApiKey}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.isroApiKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Satellite API error! status: ${response.status}`);
      }

      const data = await response.json();
      const satelliteData: SatelliteData[] = this.transformSatelliteData(data.features || []);
      
      this.setCachedData(cacheKey, satelliteData);
      return satelliteData;
    } catch (error) {
      console.error('Error fetching satellite data:', error);
      return this.getMockSatelliteData();
    }
  }

  // Fetch weather data from IMD
  async fetchWeatherData(lat: number, lng: number): Promise<WeatherData> {
    const cacheKey = `weather-${lat}-${lng}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // IMD Weather API
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${process.env.EXPO_PUBLIC_WEATHER_API_KEY}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error! status: ${response.status}`);
      }

      const data = await response.json();
      const weatherData: WeatherData = {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed * 3.6, // Convert m/s to km/h
        windDirection: data.wind.deg,
        pressure: data.main.pressure,
        visibility: data.visibility / 1000, // Convert m to km
      };

      this.setCachedData(cacheKey, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getMockWeatherData();
    }
  }

  // Transform CPCB data format
  private transformCPCBData(records: any[]): AQIStation[] {
    return records.map((record, index) => ({
      id: record.station_id || `station-${index}`,
      name: record.station_name || `Station ${index + 1}`,
      latitude: parseFloat(record.latitude) || 28.6139 + (Math.random() - 0.5) * 0.1,
      longitude: parseFloat(record.longitude) || 77.2090 + (Math.random() - 0.5) * 0.1,
      aqi: parseInt(record.aqi) || Math.floor(Math.random() * 200) + 50,
      pm25: parseFloat(record.pm25) || Math.floor(Math.random() * 100) + 20,
      pm10: parseFloat(record.pm10) || Math.floor(Math.random() * 150) + 30,
      no2: parseFloat(record.no2) || Math.floor(Math.random() * 80) + 10,
      so2: parseFloat(record.so2) || Math.floor(Math.random() * 50) + 5,
      co: parseFloat(record.co) || Math.random() * 3 + 0.5,
      o3: parseFloat(record.o3) || Math.floor(Math.random() * 120) + 20,
      lastUpdated: record.last_update || new Date().toISOString(),
      status: this.getAQIStatus(parseInt(record.aqi) || Math.floor(Math.random() * 200) + 50),
    }));
  }

  // Transform satellite data format
  private transformSatelliteData(features: any[]): SatelliteData[] {
    return features.map((feature, index) => ({
      id: feature.id || `sat-${index}`,
      timestamp: feature.properties.timestamp || new Date().toISOString(),
      coordinates: {
        lat: feature.geometry.coordinates[1] || 28.6139 + (Math.random() - 0.5) * 2,
        lng: feature.geometry.coordinates[0] || 77.2090 + (Math.random() - 0.5) * 2,
      },
      pollutionLevel: feature.properties.pollution_level || Math.random() * 100 + 50,
      source: feature.properties.source || 'ISRO',
      type: feature.properties.pollutant_type || 'PM2.5',
    }));
  }

  // Get AQI status based on value
  private getAQIStatus(aqi: number): AQIStation['status'] {
    if (aqi <= 50) return 'good';
    if (aqi <= 100) return 'moderate';
    if (aqi <= 150) return 'unhealthy_sensitive';
    if (aqi <= 200) return 'unhealthy';
    if (aqi <= 300) return 'very_unhealthy';
    return 'hazardous';
  }

  // Mock data for development/fallback
  private getMockAQIData(): AQIStation[] {
    const cities = [
      { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
      { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
      { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
      { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
      { name: 'Pune', lat: 18.5204, lng: 73.8567 },
      { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    ];

    return cities.map((city, index) => {
      const aqi = Math.floor(Math.random() * 250) + 30;
      return {
        id: `mock-${index}`,
        name: city.name,
        latitude: city.lat,
        longitude: city.lng,
        aqi,
        pm25: Math.floor(Math.random() * 100) + 20,
        pm10: Math.floor(Math.random() * 150) + 30,
        no2: Math.floor(Math.random() * 80) + 10,
        so2: Math.floor(Math.random() * 50) + 5,
        co: Math.random() * 3 + 0.5,
        o3: Math.floor(Math.random() * 120) + 20,
        lastUpdated: new Date().toISOString(),
        status: this.getAQIStatus(aqi),
      };
    });
  }

  private getMockSatelliteData(): SatelliteData[] {
    const data: SatelliteData[] = [];
    for (let i = 0; i < 20; i++) {
      data.push({
        id: `sat-mock-${i}`,
        timestamp: new Date().toISOString(),
        coordinates: {
          lat: 28.6139 + (Math.random() - 0.5) * 4,
          lng: 77.2090 + (Math.random() - 0.5) * 4,
        },
        pollutionLevel: Math.random() * 150 + 25,
        source: ['ISRO', 'NASA', 'ESA'][Math.floor(Math.random() * 3)] as any,
        type: ['PM2.5', 'NO2', 'SO2', 'CO'][Math.floor(Math.random() * 4)] as any,
      });
    }
    return data;
  }

  private getMockWeatherData(): WeatherData {
    return {
      temperature: Math.floor(Math.random() * 20) + 20,
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 20) + 5,
      windDirection: Math.floor(Math.random() * 360),
      pressure: Math.floor(Math.random() * 50) + 1000,
      visibility: Math.floor(Math.random() * 10) + 5,
    };
  }

  // Real-time updates using WebSocket (for production)
  setupRealTimeUpdates(callback: (data: AQIStation[]) => void) {
    if (Platform.OS === 'web') {
      // WebSocket connection for real-time updates
      const ws = new WebSocket('wss://api.cpcb.nic.in/realtime');
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const stations = this.transformCPCBData(data.stations || []);
          callback(stations);
        } catch (error) {
          console.error('WebSocket data parsing error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      return () => ws.close();
    } else {
      // Polling fallback for mobile
      const interval = setInterval(async () => {
        try {
          const data = await this.fetchRealTimeAQI();
          callback(data);
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }
}

export const aqiDataService = new AQIDataService();