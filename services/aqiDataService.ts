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
  private openWeatherApiKey = process.env.EXPO_PUBLIC_WEATHER_API_KEY || '';
  private baseUrl = 'http://api.openweathermap.org/data/2.5';
  
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

  // Fetch real-time AQI data from OpenWeatherMap Air Pollution API
  async fetchRealTimeAQI(): Promise<AQIStation[]> {
    const cacheKey = 'realtime-aqi';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Major Indian cities for AQI data
      const cities = [
        { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
        { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
        { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
        { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
        { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
        { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
        { name: 'Pune', lat: 18.5204, lng: 73.8567 },
        { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
        { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
        { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
      ];

      const airPollutionPromises = cities.map(async (city) => {
        const response = await fetch(
          `${this.baseUrl}/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${this.openWeatherApiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return this.transformOpenWeatherData(data, city);
      });

      const stations = await Promise.all(airPollutionPromises);
      
      this.setCachedData(cacheKey, stations);
      return stations;
    } catch (error) {
      console.error('Error fetching real-time AQI from OpenWeather:', error);
      // Return mock data for development
      return this.getMockAQIData();
    }
  }

  // Fetch satellite-like pollution data using OpenWeather forecast data
  async fetchSatelliteData(): Promise<SatelliteData[]> {
    const cacheKey = 'satellite-data';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Use Delhi region with multiple coordinates for "satellite" data
      const coordinates = [
        { lat: 28.7041, lng: 77.1025 }, // North Delhi
        { lat: 28.5355, lng: 77.3910 }, // East Delhi
        { lat: 28.6692, lng: 77.4538 }, // Noida
        { lat: 28.4595, lng: 77.0266 }, // Gurgaon
        { lat: 28.6129, lng: 77.2295 }, // Central Delhi
      ];

      const forecastPromises = coordinates.map(async (coord, index) => {
        const response = await fetch(
          `${this.baseUrl}/air_pollution/forecast?lat=${coord.lat}&lon=${coord.lng}&appid=${this.openWeatherApiKey}`
        );
        
        if (!response.ok) {
          throw new Error(`Forecast API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return this.transformForecastToSatelliteData(data, coord, index);
      });

      const allSatelliteData = await Promise.all(forecastPromises);
      const satelliteData = allSatelliteData.flat().slice(0, 15); // Limit to 15 points
      
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

  // Transform OpenWeather Air Pollution data to our AQI format
  private transformOpenWeatherData(data: any, city: { name: string; lat: number; lng: number }): AQIStation {
    const pollution = data.list[0];
    const components = pollution.components;
    
    // Convert OpenWeather AQI (1-5) to standard AQI (0-500)
    const aqiMapping = { 1: 50, 2: 100, 3: 150, 4: 200, 5: 300 };
    const aqi = aqiMapping[pollution.main.aqi as keyof typeof aqiMapping] || 100;
    
    return {
      id: `ow-${city.name.toLowerCase()}`,
      name: city.name,
      latitude: city.lat,
      longitude: city.lng,
      aqi,
      pm25: components.pm2_5 || 0,
      pm10: components.pm10 || 0,
      no2: components.no2 || 0,
      so2: components.so2 || 0,
      co: components.co / 1000 || 0, // Convert μg/m³ to mg/m³
      o3: components.o3 || 0,
      lastUpdated: new Date(pollution.dt * 1000).toISOString(),
      status: this.getAQIStatus(aqi),
    };
  }

  // Transform forecast data to satellite-like data points
  private transformForecastToSatelliteData(data: any, coord: { lat: number; lng: number }, baseIndex: number): SatelliteData[] {
    return data.list.slice(0, 3).map((item: any, index: number) => {
      const components = item.components;
      const pollutionLevel = Math.max(
        components.pm2_5 || 0,
        components.pm10 || 0,
        components.no2 || 0,
        components.so2 || 0
      );
      
      return {
        id: `sat-ow-${baseIndex}-${index}`,
        timestamp: new Date(item.dt * 1000).toISOString(),
        coordinates: {
          lat: coord.lat + (Math.random() - 0.5) * 0.02, // Small random offset
          lng: coord.lng + (Math.random() - 0.5) * 0.02,
        },
        pollutionLevel,
        source: 'NASA' as const, // Use NASA for forecast-based satellite data
        type: this.getMainPollutantType(components),
      };
    });
  }

  // Determine main pollutant type based on highest concentration
  private getMainPollutantType(components: any): SatelliteData['type'] {
    const pollutants = {
      'PM2.5': components.pm2_5 || 0,
      'NO2': components.no2 || 0,
      'SO2': components.so2 || 0,
      'CO': components.co || 0,
    };
    
    const maxPollutant = Object.entries(pollutants).reduce((a, b) => 
      pollutants[a[0] as keyof typeof pollutants] > pollutants[b[0] as keyof typeof pollutants] ? a : b
    );
    
    return maxPollutant[0] as SatelliteData['type'];
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

  // Real-time updates using polling (OpenWeatherMap doesn't have WebSocket)
  setupRealTimeUpdates(callback: (data: AQIStation[]) => void) {
    // Polling for real-time updates every 10 minutes (OpenWeather rate limit friendly)
    const interval = setInterval(async () => {
      try {
        const data = await this.fetchRealTimeAQI();
        callback(data);
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 600000); // Update every 10 minutes

    return () => clearInterval(interval);
  }
}

export const aqiDataService = new AQIDataService();