// Test script to simulate CORS request
const axios = require('axios');

async function testCORS() {
  try {
    console.log('Testing CORS with production URLs...');
    
    // Test from production frontend to production backend
    const response = await axios.get('https://backend.conducky.com/api/auth/session', {
      headers: {
        'Origin': 'https://app.conducky.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('CORS test successful:', response.status);
    console.log('Response headers:', response.headers);
    
  } catch (error) {
    console.error('CORS test failed:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.message);
    if (error.response?.headers) {
      console.error('Response headers:', error.response.headers);
    }
  }
}

testCORS();
