/**
 * Reverse geocoding: Convert coordinates to address using OpenStreetMap Nominatim API
 * @param {number} latitude - Latitude coordinate
 * @param {number} longitude - Longitude coordinate
 * @returns {Promise<Object>} Address information
 */
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ReCommerce/1.0' // Nominatim requires a User-Agent
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract useful address information
    const address = data.address || {};
    
    return {
      // Full formatted address
      displayName: data.display_name,
      
      // Structured address components
      address: {
        road: address.road || '',
        suburb: address.suburb || address.neighbourhood || '',
        district: address.district || address.city_district || '',
        city: address.city || address.town || address.village || '',
        state: address.state || '',
        postcode: address.postcode || '',
        country: address.country || '',
        countryCode: address.country_code || ''
      },
      
      // Coordinates
      coordinates: {
        latitude: data.lat,
        longitude: data.lon
      },
      
      // Raw data for advanced usage
      raw: data
    };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    throw error;
  }
};

/**
 * Get user's current location and convert to address
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Location data with address
 */
export const getUserLocationWithAddress = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: false, // Use network location for faster results
      timeout: 15000, // Increase timeout to 15 seconds
      maximumAge: 300000, // Accept cached position up to 5 minutes old
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Get address from coordinates
          const addressData = await reverseGeocode(latitude, longitude);
          
          resolve({
            coordinates: { latitude, longitude },
            address: addressData,
            timestamp: position.timestamp
          });
          console.log('Geolocation position obtained:', addressData);
        } catch (error) {
          // If reverse geocoding fails, still return coordinates
          resolve({
            coordinates: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            address: null,
            error: error.message,
            timestamp: position.timestamp
          });
        }
      },
      (error) => {
        reject(error);
      },
      defaultOptions
    );
  });
};
