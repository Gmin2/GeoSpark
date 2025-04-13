/**
 * Perform retrieval test for a specific content CID
 * @param {string} cid Content ID to retrieve
 * @param {string} providerId Provider to test (optional)
 * @returns {Promise<{success: boolean, latency: number, error: string|null}>}
 */
export const testRetrieval = async (cid, providerId = null) => {
    try {
      console.log(`Testing retrieval for content ${cid}${providerId ? ` from provider ${providerId}` : ''}`)
      
      // Record start time for latency measurement
      const startTime = performance.now()
      
      // Create the URL for retrieval
      let url
      if (providerId) {
        // Use ipfs:// scheme with specific provider
        const providerAddress = `/p2p/${providerId}`
        const searchParams = new URLSearchParams({
          'dag-scope': 'block',
          protocols: 'graphsync',
          providers: providerAddress
        })
        url = `ipfs://${cid}?${searchParams.toString()}`
      } else {
        // Use ipfs:// scheme without specifying a provider
        // (will use default Zinnia IPFS client behavior)
        url = `ipfs://${cid}?dag-scope=block`
      }
      
      console.log(`Retrieving from URL: ${url}`)
      
      // Set a reasonable timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds
      
      try {
        const response = await fetch(url, {
          signal: controller.signal
        })
        
        // Clear timeout
        clearTimeout(timeoutId)
        
        // Calculate latency
        const endTime = performance.now()
        const latency = endTime - startTime
        
        // Check if retrieval was successful
        if (!response.ok) {
          return {
            success: false,
            latency,
            error: `HTTP error: ${response.status}`
          }
        }
        
        // For testing, we'll just read the headers, not the full content
        const headers = Object.fromEntries(response.headers.entries())
        console.log(`Headers for ${cid}:`, headers)
        
        return {
          success: true,
          latency,
          error: null
        }
      } catch (error) {
        clearTimeout(timeoutId)
        return {
          success: false,
          latency: performance.now() - startTime,
          error: error.name === 'AbortError' ? 'Timeout' : error.message
        }
      }
    } catch (error) {
      console.error(`Error in testRetrieval for ${cid}:`, error)
      return {
        success: false,
        latency: 0,
        error: error.message
      }
    }
  }