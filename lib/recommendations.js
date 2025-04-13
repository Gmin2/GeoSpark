/**
 * Generate performance recommendations based on test results
 * @param {object} visualizationData The visualization data
 * @param {object} location The node's location
 * @returns {Array<string>} Array of recommendations
 */
export const generateRecommendations = (visualizationData, location) => {
    const recommendations = []
    const globalStats = visualizationData.global
    
    // Basic performance recommendations
    if (globalStats.successRate < 50) {
      recommendations.push("Overall retrieval success rate is low. Consider using multiple providers for redundancy.")
    }
    
    if (globalStats.averageLatency > 5000) {
      recommendations.push("Overall latency is high. Content delivery from closer geographic locations may improve performance.")
    }
    
    // Geographic-specific recommendations
    const continentStats = visualizationData.continents[location.continent]
    if (continentStats) {
      if (continentStats.successRate < 30) {
        recommendations.push(`Retrieval success rate in ${location.continent} is very low. Consider localized caching or CDN solutions.`)
      }
      
      if (continentStats.averageLatency > 10000) {
        recommendations.push(`Retrieval latency in ${location.continent} is extremely high. Consider closer storage providers.`)
      }
    }
    
    // Provider recommendations
    const bestProviders = findBestProvidersByContinent(visualizationData)
    if (bestProviders[location.continent]) {
      const best = bestProviders[location.continent]
      recommendations.push(`Recommended provider for ${location.continent}: ${best.minerId} (${best.successRate.toFixed(1)}% success rate, ${best.latency.toFixed(0)}ms latency)`)
    }
    
    return recommendations
  }
  
  /**
   * Find the best provider for each continent
   * @param {object} visualizationData The visualization data
   * @returns {object} Object with best provider by continent
   */
  export const findBestProvidersByContinent = (visualizationData) => {
    const bestProviders = {}
    
    Object.entries(visualizationData.continents).forEach(([continent, stats]) => {
      let bestMinerId = null
      let bestScore = -1
      let bestSuccessRate = 0
      let bestLatency = 0
      
      // Check each miner in this continent
      Object.entries(stats.miners || {}).forEach(([minerId, minerStats]) => {
        if (minerStats.successful === 0) return // Skip miners with no successful retrievals
        
        // Score is success rate minus normalized latency (higher is better)
        const latencyFactor = Math.min(1, minerStats.averageLatency / 10000) * 30
        const score = minerStats.successRate - latencyFactor
        
        if (score > bestScore) {
          bestScore = score
          bestMinerId = minerId
          bestSuccessRate = minerStats.successRate
          bestLatency = minerStats.averageLatency
        }
      })
      
      if (bestMinerId) {
        bestProviders[continent] = {
          minerId: bestMinerId,
          successRate: bestSuccessRate,
          latency: bestLatency
        }
      }
    })
    
    return bestProviders
  }