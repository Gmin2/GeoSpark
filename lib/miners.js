import config from './config.js'

/**
 * Fetch a list of active Filecoin miners with their addresses
 * @param {number} limit Maximum number of miners to fetch
 * @returns {Promise<Array<{minerId: string}>>}
 */
export const getActiveMiners = async (limit = 5) => {
    try {
      console.log(`Fetching up to ${limit} active miners from Filecoin network`)
      const response = await fetch('https://api.node.glif.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.RPC_AUTH ? `Bearer ${config.RPC_AUTH}` : undefined
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'Filecoin.StateListMiners',
          params: [null],
          id: 1
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch miners: ${response.status}`)
      }
      
      const data = await response.json()
      if (!data.result || !Array.isArray(data.result)) {
        throw new Error('Invalid response from API')
      }
      
      // Limit the number of miners
      const limitedMiners = data.result.slice(0, limit)
      
      console.log(`Successfully fetched ${limitedMiners.length} miners`)
      return limitedMiners.map(minerId => ({ minerId }))
    } catch (error) {
      console.error('Error fetching miners:', error)
      return []
    }
  }
  
  /**
   * Get peer ID for a specific miner
   * @param {string} minerId The miner's ID
   * @returns {Promise<string|null>} The peer ID or null if not found
   */
  export const getMinerPeerId = async (minerId) => {
    try {
      console.log(`Fetching peer ID for miner ${minerId}`)
      
      const response = await fetch('https://api.node.glif.io/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': config.RPC_AUTH ? `Bearer ${config.RPC_AUTH}` : undefined
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'Filecoin.StateMinerInfo',
          params: [minerId, null],
          id: 1
        })
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch miner info: ${response.status}`)
      }
      
      const data = await response.json()
      return data.result?.PeerId || null
    } catch (error) {
      console.error(`Error getting peer ID for miner ${minerId}:`, error)
      return null
    }
  }
