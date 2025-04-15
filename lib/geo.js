import config from './config.js'

/**
 * Get the geographic location of this checker node
 * @returns {Promise<{city: string, country: string, continent: string}>}
 */
export const getNodeLocation = async () => {

  if (config.simulation.enabled) {
    // Use the current location from config
    const location = config.simulation.locations[config.simulation.currentLocationIndex];
    
    // Rotate to next location for next call
    config.simulation.currentLocationIndex = 
      (config.simulation.currentLocationIndex + 1) % config.simulation.locations.length;
    
    console.log(`Using simulated location: ${location.city}, ${location.country} (${location.continent})`);
    return location;
  }
  
  try {
    console.log('Getting node location...')
    
    // Using ipinfo.io to get location based on IP
    const response = await fetch(config.geoIpUrl)
    
    if (!response.ok) {
      throw new Error(`Failed to get location: ${response.status}`)
    }
    
    const data = await response.json()
    
    return {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country || 'Unknown',
      continent: getContinentFromCountry(data.country)
    }
  } catch (error) {
    console.error('Error getting node location:', error)
    return {
      city: 'Unknown',
      region: 'Unknown',
      country: 'Unknown',
      continent: 'Unknown'
    }
  }
}

/**
 * Map country code to continent
 * @param {string} countryCode ISO country code
 * @returns {string} Continent name
 */
export function getContinentFromCountry(countryCode) {
  if (!countryCode) return 'Unknown'
  
  // Simple mapping of major countries to continents
  const continentMap = {
    // North America
    'US': 'North America',
    'CA': 'North America',
    'MX': 'North America',
    
    // Europe
    'GB': 'Europe',
    'DE': 'Europe',
    'FR': 'Europe',
    'IT': 'Europe',
    'ES': 'Europe',
    
    // Asia
    'CN': 'Asia',
    'JP': 'Asia',
    'IN': 'Asia',
    'SG': 'Asia',
    
    // South America
    'BR': 'South America',
    'AR': 'South America',
    
    // Africa
    'ZA': 'Africa',
    'NG': 'Africa',
    'EG': 'Africa',
    
    // Oceania
    'AU': 'Oceania',
    'NZ': 'Oceania'
  }
  
  return continentMap[countryCode] || 'Unknown'
}