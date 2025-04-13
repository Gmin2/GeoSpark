/**
 * Generate visualization data from test results
 * @param {Array} testResults Array of test results
 * @returns {object} Visualization data object
 */
export const generateVisualizationData = (testResults) => {
    try {
      console.log('Generating visualization data...')
      
      // Group by continent
      const continentStats = {}
      
      testResults.forEach(result => {
        const continent = result.location.continent || 'Unknown'
        
        if (!continentStats[continent]) {
          continentStats[continent] = {
            total: 0,
            successful: 0,
            totalLatency: 0,
            miners: {}
          }
        }
        
        // Update continent stats
        continentStats[continent].total++
        if (result.success) {
          continentStats[continent].successful++
          continentStats[continent].totalLatency += result.latency
        }
        
        // Track per-miner stats within continent
        if (result.minerId) {
          if (!continentStats[continent].miners[result.minerId]) {
            continentStats[continent].miners[result.minerId] = {
              total: 0,
              successful: 0,
              totalLatency: 0
            }
          }
          
          continentStats[continent].miners[result.minerId].total++
          if (result.success) {
            continentStats[continent].miners[result.minerId].successful++
            continentStats[continent].miners[result.minerId].totalLatency += result.latency
          }
        }
      })
      
      // Calculate averages and success rates
      Object.keys(continentStats).forEach(continent => {
        const stats = continentStats[continent]
        
        // Calculate continent-level averages
        stats.successRate = stats.successful / stats.total * 100
        stats.averageLatency = stats.successful > 0 
          ? stats.totalLatency / stats.successful 
          : 0
        
        // Calculate miner-level stats within continent
        Object.keys(stats.miners).forEach(minerId => {
          const minerStats = stats.miners[minerId]
          minerStats.successRate = minerStats.successful / minerStats.total * 100
          minerStats.averageLatency = minerStats.successful > 0 
            ? minerStats.totalLatency / minerStats.successful 
            : 0
        })
      })
      
      // Create global stats
      const globalStats = {
        total: testResults.length,
        successful: testResults.filter(r => r.success).length,
        totalLatency: testResults.reduce((sum, r) => r.success ? sum + r.latency : sum, 0)
      }
      
      globalStats.successRate = globalStats.successful / globalStats.total * 100
      globalStats.averageLatency = globalStats.successful > 0 
        ? globalStats.totalLatency / globalStats.successful 
        : 0
      
      return {
        timestamp: new Date().toISOString(),
        global: globalStats,
        continents: continentStats
      }
    } catch (error) {
      console.error('Error generating visualization data:', error)
      return {
        timestamp: new Date().toISOString(),
        global: { total: 0, successful: 0, successRate: 0, averageLatency: 0 },
        continents: {}
      }
    }
  }