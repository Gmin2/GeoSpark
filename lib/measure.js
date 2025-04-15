import config from './config.js';
import { formatBytes } from './utils.js';

/**
 * Perform enhanced retrieval test for a specific content CID
 * @param {string} cid Content ID to retrieve
 * @param {string} providerId Provider to test (optional)
 * @returns {Promise<{success: boolean, ttfb: number, totalTime: number, contentSize: number, throughput: number, error: string|null}>}
 */
export const enhancedTestRetrieval = async (cid, providerId = null) => {
  try {
    console.log(`Testing retrieval for content ${cid}${providerId ? ` from provider ${providerId}` : ''}`);
    
    // Record start time for latency measurement
    const startTime = performance.now();
    
    // Create the URL for retrieval
    let url;
    if (providerId) {
      // Used ipfs:// scheme with specific provider
      const providerAddress = `/p2p/${providerId}`;
      const searchParams = new URLSearchParams({
        'dag-scope': 'block',
        protocols: 'graphsync',
        providers: providerAddress
      });
      url = `https://ipfs.io/ipfs/${cid}?${searchParams.toString()}`;
    } else {
      // Used ipfs:// scheme without specifying a provider
      url = `https://ipfs.io/ipfs/${cid}?dag-scope=block`;
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('timeout'), config.testing.timeouts.retrieval);
    
    try {
      const response = await fetch(url, {
        signal: controller.signal
      });
      
      // Calculating TTFB (Time To First Byte)
      const ttfbTime = performance.now();
      const ttfb = ttfbTime - startTime;
      
      if (!response.ok) {
        clearTimeout(timeoutId);
        return {
          success: false,
          ttfb,
          totalTime: performance.now() - startTime,
          contentSize: 0,
          throughput: 0,
          error: `HTTP error: ${response.status}`
        };
      }
      
      // Read the content and measure throughput
      const reader = response.body.getReader();
      let receivedSize = 0;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedSize += value.length;
      }
      
      clearTimeout(timeoutId);
      
      // Calculating total time and throughput
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const throughput = receivedSize / (totalTime / 1000); // bytes per second
      
      console.log(`Successfully retrieved ${formatBytes(receivedSize)} in ${totalTime.toFixed(0)}ms (TTFB: ${ttfb.toFixed(0)}ms)`);
      
      return {
        success: true,
        ttfb,
        totalTime,
        contentSize: receivedSize,
        throughput,
        error: null
      };
    } catch (error) {
      clearTimeout(timeoutId);
      return {
        success: false,
        ttfb: 0,
        totalTime: performance.now() - startTime,
        contentSize: 0,
        throughput: 0,
        error: error.name === 'AbortError' ? 'Timeout' : error.message
      };
    }
  } catch (error) {
    console.error(`Error in enhancedTestRetrieval for ${cid}:`, error);
    return {
      success: false,
      ttfb: 0,
      totalTime: 0,
      contentSize: 0,
      throughput: 0,
      error: error.message
    };
  }
};