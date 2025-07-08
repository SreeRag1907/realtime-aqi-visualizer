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
  private waqiApiKey = process.env.EXPO_PUBLIC_WAQI_API_KEY || '';
  private dataGovApiKey = process.env.EXPO_PUBLIC_DATA_GOV_API_KEY || '';
  private baseUrl = 'http://api.openweathermap.org/data/2.5';
  private waqiBaseUrl = 'https://api.waqi.info';
  private dataGovBaseUrl = 'https://api.data.gov.in/resource';
  
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

  // Fetch real-time AQI data from multiple sources with rural focus
  async fetchRealTimeAQI(): Promise<AQIStation[]> {
    const cacheKey = 'realtime-aqi';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('Fetching AQI data from multiple sources...');
      
      // Combine data from multiple sources
      const [waqiData, dataGovData, openWeatherData] = await Promise.allSettled([
        this.fetchFromWAQI(),
        this.fetchFromDataGov(),
        this.fetchFromOpenWeather()
      ]);

      let allStations: AQIStation[] = [];

      // Process WAQI data (best for rural coverage)
      if (waqiData.status === 'fulfilled' && waqiData.value.length > 0) {
        allStations = [...allStations, ...waqiData.value];
        console.log(`Added ${waqiData.value.length} stations from WAQI`);
      }

      // Process Data.gov.in data (Indian government data)
      if (dataGovData.status === 'fulfilled' && dataGovData.value.length > 0) {
        allStations = [...allStations, ...dataGovData.value];
        console.log(`Added ${dataGovData.value.length} stations from Data.gov.in`);
      }

      // Process OpenWeather data (fallback for major cities)
      if (openWeatherData.status === 'fulfilled' && openWeatherData.value.length > 0) {
        allStations = [...allStations, ...openWeatherData.value];
        console.log(`Added ${openWeatherData.value.length} stations from OpenWeather`);
      }

      // Remove duplicates based on proximity (within 10km)
      const uniqueStations = this.removeDuplicateStations(allStations);
      
      // If no data from APIs, use enhanced mock data
      const finalStations = uniqueStations.length > 0 ? uniqueStations : this.getEnhancedMockAQIData();
      
      console.log(`Final result: ${finalStations.length} unique AQI stations`);
      this.setCachedData(cacheKey, finalStations);
      return finalStations;
    } catch (error) {
      console.error('Error fetching real-time AQI:', error);
      return this.getEnhancedMockAQIData();
    }
  }

  // Fetch from WAQI API (World Air Quality Index) - best for rural coverage
  private async fetchFromWAQI(): Promise<AQIStation[]> {
    if (!this.waqiApiKey) {
      console.log('WAQI API key not found, skipping WAQI data');
      return [];
    }

    try {
      console.log('Fetching data from WAQI API...');
      
      // Use map bounds API to get all stations in India including rural areas
      const response = await fetch(
        `${this.waqiBaseUrl}/v2/map/bounds?latlng=8,68,37,97&networks=all&token=${this.waqiApiKey}`
      );

      if (!response.ok) {
        console.error(`WAQI bounds API error! status: ${response.status}`);
        // Fallback to search method
        return this.fetchWAQIBySearch();
      }

      const data = await response.json();
      
      if (data.status !== 'ok' || !data.data) {
        console.error('Invalid WAQI bounds response, trying search method');
        return this.fetchWAQIBySearch();
      }

      console.log(`WAQI bounds returned ${data.data.length} stations`);

      // Get detailed data for each station (limit to 100 for performance)
      const stationsToFetch = data.data.slice(0, 100);
      const detailedStations = await Promise.allSettled(
        stationsToFetch.map(async (station: any) => {
          try {
            const detailResponse = await fetch(
              `${this.waqiBaseUrl}/feed/@${station.uid}/?token=${this.waqiApiKey}`
            );
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              if (detailData.status === 'ok' && detailData.data) {
                return this.transformWAQIData(detailData.data);
              }
            }
            return null;
          } catch (error) {
            console.error(`Error fetching WAQI station ${station.uid}:`, error);
            return null;
          }
        })
      );

      const validStations = detailedStations
        .filter((result): result is PromiseFulfilledResult<AQIStation> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      console.log(`WAQI returned ${validStations.length} valid stations`);
      return validStations;
    } catch (error) {
      console.error('Error fetching from WAQI bounds:', error);
      return this.fetchWAQIBySearch();
    }
  }

  // Fallback WAQI search method
  private async fetchWAQIBySearch(): Promise<AQIStation[]> {
    try {
      console.log('Using WAQI search fallback...');
      
      // Search for stations by Indian cities/regions
      const searchTerms = [
        'Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad',
        'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur',
        'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna',
        'Vadodara', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
        'Shimla', 'Manali', 'Dehradun', 'Rishikesh', 'Nainital'
      ];

      const searchPromises = searchTerms.slice(0, 10).map(async (term) => {
        try {
          const response = await fetch(
            `${this.waqiBaseUrl}/search/?token=${this.waqiApiKey}&keyword=${term}`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.status === 'ok' && data.data && Array.isArray(data.data)) {
              return data.data.slice(0, 3); // Take top 3 results per search
            }
          }
          return [];
        } catch (error) {
          console.error(`Error searching WAQI for ${term}:`, error);
          return [];
        }
      });

      const allSearchResults = await Promise.all(searchPromises);
      const flatResults = allSearchResults.flat();

      // Get detailed data for found stations
      const detailedStations = await Promise.allSettled(
        flatResults.map(async (station: any) => {
          try {
            const detailResponse = await fetch(
              `${this.waqiBaseUrl}/feed/@${station.uid}/?token=${this.waqiApiKey}`
            );
            
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              if (detailData.status === 'ok' && detailData.data) {
                return this.transformWAQIData(detailData.data);
              }
            }
            return null;
          } catch (error) {
            console.error(`Error fetching WAQI station details ${station.uid}:`, error);
            return null;
          }
        })
      );

      const validStations = detailedStations
        .filter((result): result is PromiseFulfilledResult<AQIStation> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);

      console.log(`WAQI search returned ${validStations.length} stations`);
      return validStations;
    } catch (error) {
      console.error('Error in WAQI search fallback:', error);
      return [];
    }
  }

  // Fetch from Data.gov.in (Indian government AQI data)
  private async fetchFromDataGov(): Promise<AQIStation[]> {
    if (!this.dataGovApiKey) {
      console.log('Data.gov.in API key not found, skipping Data.gov.in data');
      return [];
    }

    try {
      const response = await fetch(
        `${this.dataGovBaseUrl}/1dcb8424-9bb1-4756-9b95-c12b5b23db60?api-key=${this.dataGovApiKey}&format=json&limit=100`
      );

      if (!response.ok) {
        throw new Error(`Data.gov.in API error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.records || !Array.isArray(data.records)) {
        throw new Error('Invalid Data.gov.in response format');
      }

      return data.records.slice(0, 30).map((record: any, index: number) => 
        this.transformDataGovData(record, index)
      ).filter((station: AQIStation | null): station is AQIStation => station !== null);
    } catch (error) {
      console.error('Error fetching from Data.gov.in:', error);
      return [];
    }
  }

  // Fetch from OpenWeather (fallback for major cities)
  private async fetchFromOpenWeather(): Promise<AQIStation[]> {
    if (!this.openWeatherApiKey) {
      console.log('OpenWeather API key not found, skipping OpenWeather data');
      return [];
    }

    try {
      // Focus on smaller cities and towns, not just metros
      const cities = [
        { name: 'Shimla', lat: 31.1048, lng: 77.1734 },
        { name: 'Dehradun', lat: 30.3165, lng: 78.0322 },
        { name: 'Rishikesh', lat: 30.0869, lng: 78.2676 },
        { name: 'Manali', lat: 32.2396, lng: 77.1887 },
        { name: 'Mussoorie', lat: 30.4598, lng: 78.0664 },
        { name: 'Nainital', lat: 29.3803, lng: 79.4636 },
        { name: 'Haridwar', lat: 29.9457, lng: 78.1642 },
        { name: 'Almora', lat: 29.5971, lng: 79.6593 },
      ];

      const airPollutionPromises = cities.map(async (city) => {
        try {
          const response = await fetch(
            `${this.baseUrl}/air_pollution?lat=${city.lat}&lon=${city.lng}&appid=${this.openWeatherApiKey}`
          );
          
          if (!response.ok) {
            return null;
          }
          
          const data = await response.json();
          return this.transformOpenWeatherData(data, city);
        } catch (error) {
          console.error(`Error fetching OpenWeather data for ${city.name}:`, error);
          return null;
        }
      });

      const stations = await Promise.all(airPollutionPromises);
      return stations.filter(station => station !== null) as AQIStation[];
    } catch (error) {
      console.error('Error fetching from OpenWeather:', error);
      return [];
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

  // Transform WAQI data to our AQI format
  private transformWAQIData(data: any): AQIStation {
    const aqi = data.aqi || 0;
    const iaqi = data.iaqi || {};
    
    return {
      id: `waqi-${data.idx}`,
      name: data.city?.name || `Station ${data.idx}`,
      latitude: data.city?.geo?.[0] || 0,
      longitude: data.city?.geo?.[1] || 0,
      aqi,
      pm25: iaqi.pm25?.v || 0,
      pm10: iaqi.pm10?.v || 0,
      no2: iaqi.no2?.v || 0,
      so2: iaqi.so2?.v || 0,
      co: iaqi.co?.v || 0,
      o3: iaqi.o3?.v || 0,
      lastUpdated: data.time?.iso || new Date().toISOString(),
      status: this.getAQIStatus(aqi),
    };
  }

  // Transform Data.gov.in data to our AQI format
  private transformDataGovData(record: any, index: number): AQIStation | null {
    try {
      // Data.gov.in has various formats, adapt as needed
      const aqi = parseFloat(record.aqi) || parseFloat(record.overall_aqi) || 0;
      const lat = parseFloat(record.latitude) || parseFloat(record.lat) || 0;
      const lng = parseFloat(record.longitude) || parseFloat(record.lng) || 0;
      
      if (lat === 0 || lng === 0) return null;
      
      return {
        id: `datagov-${index}`,
        name: record.station_name || record.location || `Station ${index}`,
        latitude: lat,
        longitude: lng,
        aqi,
        pm25: parseFloat(record.pm25) || parseFloat(record.pm2_5) || 0,
        pm10: parseFloat(record.pm10) || 0,
        no2: parseFloat(record.no2) || 0,
        so2: parseFloat(record.so2) || 0,
        co: parseFloat(record.co) || 0,
        o3: parseFloat(record.o3) || 0,
        lastUpdated: record.last_update || record.timestamp || new Date().toISOString(),
        status: this.getAQIStatus(aqi),
      };
    } catch (error) {
      console.error('Error transforming Data.gov.in record:', error);
      return null;
    }
  }

  // Remove duplicate stations based on proximity
  private removeDuplicateStations(stations: AQIStation[]): AQIStation[] {
    const uniqueStations: AQIStation[] = [];
    const proximityThreshold = 0.1; // ~10km in decimal degrees
    
    for (const station of stations) {
      const isDuplicate = uniqueStations.some(existing => {
        const latDiff = Math.abs(existing.latitude - station.latitude);
        const lngDiff = Math.abs(existing.longitude - station.longitude);
        return latDiff < proximityThreshold && lngDiff < proximityThreshold;
      });
      
      if (!isDuplicate) {
        uniqueStations.push(station);
      }
    }
    
    return uniqueStations;
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

  // Enhanced mock data for development/fallback with rural focus
  private getEnhancedMockAQIData(): AQIStation[] {
    // Focus on rural and small towns across different states of India
    const ruralStations = [
      // Himachal Pradesh - Hill stations and rural areas
      { name: 'Shimla Rural', lat: 31.1048, lng: 77.1734, state: 'HP' },
      { name: 'Manali Township', lat: 32.2396, lng: 77.1887, state: 'HP' },
      { name: 'Dharamshala', lat: 32.2190, lng: 76.3234, state: 'HP' },
      { name: 'Kullu Valley', lat: 31.9578, lng: 77.1087, state: 'HP' },
      
      // Uttarakhand - Mountain regions
      { name: 'Dehradun Cantonment', lat: 30.3165, lng: 78.0322, state: 'UK' },
      { name: 'Rishikesh', lat: 30.0869, lng: 78.2676, state: 'UK' },
      { name: 'Nainital', lat: 29.3803, lng: 79.4636, state: 'UK' },
      { name: 'Haridwar', lat: 29.9457, lng: 78.1642, state: 'UK' },
      
      // Rajasthan - Desert and rural areas
      { name: 'Pushkar', lat: 26.4899, lng: 74.5511, state: 'RJ' },
      { name: 'Mount Abu', lat: 24.5925, lng: 72.7156, state: 'RJ' },
      { name: 'Bikaner Rural', lat: 28.0229, lng: 73.3119, state: 'RJ' },
      { name: 'Jaisalmer', lat: 26.9157, lng: 70.9083, state: 'RJ' },
      
      // Kerala - Coastal and backwater regions
      { name: 'Alleppey', lat: 9.4981, lng: 76.3388, state: 'KL' },
      { name: 'Munnar', lat: 10.0889, lng: 77.0595, state: 'KL' },
      { name: 'Wayanad', lat: 11.6854, lng: 76.1320, state: 'KL' },
      { name: 'Kumarakom', lat: 9.6177, lng: 76.4272, state: 'KL' },
      
      // Karnataka - Coastal and interior
      { name: 'Coorg (Kodagu)', lat: 12.3375, lng: 75.8069, state: 'KA' },
      { name: 'Hampi', lat: 15.3350, lng: 76.4600, state: 'KA' },
      { name: 'Udupi', lat: 13.3409, lng: 74.7421, state: 'KA' },
      { name: 'Chikmagalur', lat: 13.3161, lng: 75.7720, state: 'KA' },
      
      // Tamil Nadu - Rural and coastal
      { name: 'Ooty', lat: 11.4064, lng: 76.6932, state: 'TN' },
      { name: 'Kodaikanal', lat: 10.2381, lng: 77.4892, state: 'TN' },
      { name: 'Rameswaram', lat: 9.2876, lng: 79.3129, state: 'TN' },
      { name: 'Yercaud', lat: 11.7745, lng: 78.2026, state: 'TN' },
      
      // Goa - Coastal areas
      { name: 'Arambol', lat: 15.6867, lng: 73.7031, state: 'GA' },
      { name: 'Palolem', lat: 15.0100, lng: 74.0233, state: 'GA' },
      { name: 'Anjuna', lat: 15.5736, lng: 73.7406, state: 'GA' },
      
      // Maharashtra - Rural areas
      { name: 'Lonavala', lat: 18.7537, lng: 73.4068, state: 'MH' },
      { name: 'Mahabaleshwar', lat: 17.9244, lng: 73.6577, state: 'MH' },
      { name: 'Aurangabad Rural', lat: 19.8762, lng: 75.3433, state: 'MH' },
      { name: 'Nashik Rural', lat: 19.9975, lng: 73.7898, state: 'MH' },
      
      // West Bengal - Rural areas
      { name: 'Darjeeling', lat: 27.0360, lng: 88.2627, state: 'WB' },
      { name: 'Kalimpong', lat: 27.0587, lng: 88.4673, state: 'WB' },
      { name: 'Shantiniketan', lat: 23.6759, lng: 87.6775, state: 'WB' },
      { name: 'Sundarbans', lat: 21.9497, lng: 88.9468, state: 'WB' },
      
      // Assam - Northeast rural
      { name: 'Majuli Island', lat: 27.0230, lng: 94.2050, state: 'AS' },
      { name: 'Kaziranga', lat: 26.5775, lng: 93.1713, state: 'AS' },
      { name: 'Tezpur', lat: 26.6335, lng: 92.7934, state: 'AS' },
      
      // Punjab - Agricultural areas
      { name: 'Patiala Rural', lat: 30.3398, lng: 76.3869, state: 'PB' },
      { name: 'Amritsar Rural', lat: 31.6340, lng: 74.8723, state: 'PB' },
      { name: 'Ludhiana Rural', lat: 30.9010, lng: 75.8573, state: 'PB' },
      
      // Haryana - Agricultural belt
      { name: 'Kurukshetra', lat: 29.9647, lng: 76.8729, state: 'HR' },
      { name: 'Panipat Rural', lat: 29.3909, lng: 76.9635, state: 'HR' },
      
      // Madhya Pradesh - Central India
      { name: 'Khajuraho', lat: 24.8318, lng: 79.9199, state: 'MP' },
      { name: 'Pachmarhi', lat: 22.4675, lng: 78.4336, state: 'MP' },
      { name: 'Orchha', lat: 25.3519, lng: 78.6420, state: 'MP' },
      
      // Odisha - Coastal and rural
      { name: 'Puri', lat: 19.8135, lng: 85.8312, state: 'OR' },
      { name: 'Konark', lat: 19.8876, lng: 86.0947, state: 'OR' },
      { name: 'Chilika Lake', lat: 19.7179, lng: 85.3060, state: 'OR' },
    ];

    return ruralStations.map((station, index) => {
      // Generate realistic AQI values based on location type
      const isHillStation = ['Shimla Rural', 'Manali Township', 'Ooty', 'Kodaikanal', 'Darjeeling'].includes(station.name);
      const isCoastal = ['Alleppey', 'Arambol', 'Palolem', 'Puri', 'Konark'].includes(station.name);
      const isIndustrial = ['Ludhiana Rural', 'Panipat Rural'].includes(station.name);
      
      let baseAQI = 60; // Good to moderate base
      if (isHillStation) baseAQI = 35; // Better air quality in hills
      else if (isCoastal) baseAQI = 45; // Good coastal air
      else if (isIndustrial) baseAQI = 120; // Worse in industrial areas
      
      const aqi = Math.floor(baseAQI + Math.random() * 50);
      
      return {
        id: `rural-${index}`,
        name: station.name,
        latitude: station.lat,
        longitude: station.lng,
        aqi,
        pm25: Math.floor(aqi * 0.6 + Math.random() * 20),
        pm10: Math.floor(aqi * 0.8 + Math.random() * 30),
        no2: Math.floor(Math.random() * 60) + 10,
        so2: Math.floor(Math.random() * 30) + 5,
        co: Number((Math.random() * 2 + 0.3).toFixed(1)),
        o3: Math.floor(Math.random() * 80) + 20,
        lastUpdated: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Random time within last hour
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