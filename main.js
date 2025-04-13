/* global Zinnia */
import { assertOkResponse } from './lib/http-assertions.js'
import { getActiveMiners, getMinerPeerId } from './lib/miners.js'
import { testRetrieval } from './lib/measure.js'
import { submitMeasurement } from './lib/submit.js'
import { generateVisualizationData } from './lib/visualization.js'
import { generateRecommendations } from './lib/recommendations.js'
import config from './lib/config.js'

/**
 * Get the geographic location of this checker node
 */
async function getNodeLocation() {
  try {
    console.log('Getting node location...')
    const response = await fetch(config.geoIpUrl)
    await assertOkResponse(response, 'Failed to get location')
    
    const data = await response.json()
    console.log('Location data:', data)
    
    return {
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      country: data.country || 'Unknown',
      continent: getContinentFromCountry(data.country || 'Unknown')
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
function getContinentFromCountry(countryCode) {
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

/**
 * Run a single geographic check
 */
async function runCheck() {
  try {
    console.log('Starting Geographic Filecoin Checker')
    Zinnia.activity.info('Starting Geographic Filecoin Checker')
    
    // Get node's geographic location
    const location = await getNodeLocation()
    
    if (location.city === 'Unknown') {
      Zinnia.activity.error('Failed to get node location')
      return false
    }
    
    Zinnia.activity.info(`Running from ${location.city}, ${location.country} (${location.continent})`)
    
    // Test results to collect
    const testResults = []
    
    // Test retrieval using the test CID (without specifying a provider)
    Zinnia.activity.info(`Testing general retrieval for ${config.testCid}...`)
    const generalResult = await testRetrieval(config.testCid)
    
    if (generalResult.success) {
      Zinnia.activity.info(`Successfully retrieved content in ${generalResult.latency.toFixed(0)}ms`)
    } else {
      Zinnia.activity.error(`Failed to retrieve content: ${generalResult.error}`)
    }
    
    // Add the general test to our results
    testResults.push({
      minerId: null,
      peerId: null,
      cid: config.testCid,
      success: generalResult.success,
      latency: generalResult.latency,
      error: generalResult.error,
      location,
      timestamp: new Date().toISOString()
    })
    
    // Submit this measurement
    await submitMeasurement({
      success: generalResult.success,
      location
    })
    
    // Test with known good peers
    for (const peer of config.knownPeers) {
      Zinnia.activity.info(`Testing retrieval from ${peer.description || peer.minerId}...`)
      const peerResult = await testRetrieval(config.testCid, peer.peerId)
      
      if (peerResult.success) {
        Zinnia.activity.info(`Successfully retrieved from ${peer.minerId} in ${peerResult.latency.toFixed(0)}ms`)
      } else {
        Zinnia.activity.info(`Failed to retrieve from ${peer.minerId}: ${peerResult.error}`)
      }
      
      // Add the test to our results
      testResults.push({
        minerId: peer.minerId,
        peerId: peer.peerId,
        cid: config.testCid,
        success: peerResult.success,
        latency: peerResult.latency,
        error: peerResult.error,
        location,
        timestamp: new Date().toISOString()
      })
      
      // Submit this measurement too
      await submitMeasurement({
        success: peerResult.success,
        location
      })
    }
    
    // Try to find some actual miners from the network
    Zinnia.activity.info('Looking for active miners...')
    const miners = await getActiveMiners(3)
    if (miners && miners.length > 0) {
      Zinnia.activity.info(`Found ${miners.length} miners, checking for peer IDs...`)
      
      // Get peer IDs for each miner
      for (const miner of miners) {
        const peerId = await getMinerPeerId(miner.minerId)
        if (peerId) {
          miner.peerId = peerId
          
          // Test this miner
          Zinnia.activity.info(`Testing miner ${miner.minerId}...`)
          const result = await testRetrieval(config.testCid, peerId)
          
          // Add to results
          testResults.push({
            minerId: miner.minerId,
            peerId,
            cid: config.testCid,
            success: result.success,
            latency: result.latency,
            error: result.error,
            location,
            timestamp: new Date().toISOString()
          })
          
          // Submit measurement
          await submitMeasurement({
            success: result.success,
            location
          })
        }
      }
    }
    
    // Generate visualization data
    const visualizationData = generateVisualizationData(testResults)
    console.log('Visualization data:', JSON.stringify(visualizationData, null, 2))
    
    // Log some analysis
    const globalStats = visualizationData.global
    Zinnia.activity.info(`Tests completed: ${globalStats.total}, Success rate: ${globalStats.successRate.toFixed(1)}%`)
    Zinnia.activity.info(`Average latency: ${globalStats.averageLatency.toFixed(2)}ms`)
    
    // Generate and display recommendations
    const recommendations = generateRecommendations(visualizationData, location)
    if (recommendations.length > 0) {
      Zinnia.activity.info('Geographic performance recommendations:')
      recommendations.forEach(rec => {
        Zinnia.activity.info(`  - ${rec}`)
      })
    }
    
    // Report completion
    Zinnia.jobCompleted()
    return true
  } catch (error) {
    console.error('Error in runCheck:', error)
    Zinnia.activity.error(`Error: ${error.message}`)
    return false
  }
}

/**
 * Run checks at regular intervals
 */
async function runPeriodicChecks() {
  while (true) {
    const success = await runCheck()
    
    // Wait before next check
    const waitTime = success ? config.checkInterval : 60 * 1000 // 1 minute on error
    console.log(`Waiting ${waitTime / 1000} seconds before next check...`)
    await new Promise(resolve => setTimeout(resolve, waitTime))
  }
}


runPeriodicChecks()