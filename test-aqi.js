// Test script to verify AQI API integrations
const fetch = require('node-fetch');

// API keys from your .env file
const WAQI_API_KEY = '2c34ad2e91ceb878e4dea711e2b7c5a8b4c36dcf';
const DATA_GOV_API_KEY = '579b464db66ec23bdd000001268a4642d5404aa74e28444e3b573da6';
const OPENWEATHER_API_KEY = '428dde87525789f1d5212da55a5f2aa2';

async function testWAQI() {
  console.log('\n=== Testing WAQI API ===');
  
  try {
    // Test WAQI bounds API for India
    console.log('Testing WAQI bounds API...');
    const response = await fetch(
      `https://api.waqi.info/v2/map/bounds?latlng=8,68,37,97&networks=all&token=${WAQI_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ WAQI bounds API success: ${data.status}`);
      console.log(`📍 Found ${data.data ? data.data.length : 0} stations`);
      
      if (data.data && data.data.length > 0) {
        const sample = data.data[0];
        console.log(`📊 Sample station: ${sample.uid} at [${sample.lat}, ${sample.lon}]`);
        
        // Test detailed station data
        console.log('Testing WAQI station details...');
        const detailResponse = await fetch(
          `https://api.waqi.info/feed/@${sample.uid}/?token=${WAQI_API_KEY}`
        );
        
        if (detailResponse.ok) {
          const detailData = await detailResponse.json();
          console.log(`✅ Station details: ${detailData.data?.city?.name || 'Unknown'} - AQI: ${detailData.data?.aqi || 'N/A'}`);
          
          if (detailData.data?.iaqi) {
            const pollutants = Object.keys(detailData.data.iaqi);
            console.log(`🧪 Available pollutants: ${pollutants.join(', ')}`);
          }
        }
      }
    } else {
      console.log(`❌ WAQI bounds API failed: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ WAQI API error:', error.message);
  }
}

async function testDataGov() {
  console.log('\n=== Testing Data.gov.in API ===');
  
  const resourceIds = [
    '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69',
    '1dcb8424-9bb1-4756-9b95-c12b5b23db60'
  ];
  
  for (const resourceId of resourceIds) {
    try {
      console.log(`Testing Data.gov.in resource: ${resourceId}`);
      
      // Test JSON format
      const jsonResponse = await fetch(
        `https://api.data.gov.in/resource/${resourceId}?api-key=${DATA_GOV_API_KEY}&format=json&limit=5`
      );
      
      if (jsonResponse.ok) {
        const jsonData = await jsonResponse.json();
        console.log(`✅ JSON format success for ${resourceId}`);
        console.log(`📊 Records found: ${jsonData.records ? jsonData.records.length : 0}`);
        
        if (jsonData.records && jsonData.records.length > 0) {
          const sample = jsonData.records[0];
          console.log(`📍 Sample record keys: ${Object.keys(sample).join(', ')}`);
          break; // Found working resource
        }
      } else {
        console.log(`❌ JSON format failed for ${resourceId}: ${jsonResponse.status}`);
        
        // Try XML format as fallback
        console.log(`Trying XML format for ${resourceId}...`);
        const xmlResponse = await fetch(
          `https://api.data.gov.in/resource/${resourceId}?api-key=${DATA_GOV_API_KEY}&format=xml&limit=5`
        );
        
        if (xmlResponse.ok) {
          const xmlText = await xmlResponse.text();
          console.log(`✅ XML format success for ${resourceId}`);
          console.log(`📄 XML length: ${xmlText.length} characters`);
          
          // Check if XML contains data
          if (xmlText.includes('<record>') || xmlText.includes('<data>')) {
            console.log('✅ XML contains data records');
            break;
          }
        } else {
          console.log(`❌ XML format also failed for ${resourceId}: ${xmlResponse.status}`);
        }
      }
    } catch (error) {
      console.error(`❌ Data.gov.in error for ${resourceId}:`, error.message);
    }
  }
}

async function testOpenWeather() {
  console.log('\n=== Testing OpenWeather API ===');
  
  try {
    // Test with Delhi coordinates
    const response = await fetch(
      `http://api.openweathermap.org/data/2.5/air_pollution?lat=28.6139&lon=77.2090&appid=${OPENWEATHER_API_KEY}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ OpenWeather API success');
      
      if (data.list && data.list.length > 0) {
        const pollution = data.list[0];
        console.log(`📊 AQI: ${pollution.main.aqi} (1-5 scale)`);
        console.log(`🧪 Pollutants: PM2.5=${pollution.components.pm2_5}, PM10=${pollution.components.pm10}, NO2=${pollution.components.no2}`);
      }
    } else {
      console.log(`❌ OpenWeather API failed: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ OpenWeather API error:', error.message);
  }
}

async function runTests() {
  console.log('🧪 Testing AQI API Integrations...');
  console.log('=====================================');
  
  await testWAQI();
  await testDataGov();
  await testOpenWeather();
  
  console.log('\n✅ API testing complete!');
  console.log('Check the results above to see which APIs are working.');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testWAQI, testDataGov, testOpenWeather };
