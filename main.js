/* global Zinnia */
import { assertOkResponse } from './lib/http-assertions.js';
import { getNodeLocation } from './lib/geo.js';
import { enhancedTestRetrieval } from './lib/measure.js';
import { submitMeasurement } from './lib/submit.js';
import { generateVisualizationData } from './lib/visualization.js';
import { generateRecommendations } from './lib/recommendations.js';
import { FilecoinRpcClient } from './lib/filecoin-rpc.js';
import { ProviderAnalyzer } from './lib/provider-analysis.js';
import { formatBytes } from './lib/utils.js';
import config from './lib/config.js';

async function runGeoFilecoinCheck() {
  try {
    console.log('Starting Geographic Filecoin Checker');
    Zinnia.activity.info('Starting Geographic Filecoin Checker');
    
    // Get node's geographic location
    const location = await getNodeLocation();
    
    if (location.city === 'Unknown') {
      Zinnia.activity.error('Failed to get node location');
      return false;
    }
    
    Zinnia.activity.info(`Running from ${location.city}, ${location.country} (${location.continent})`);
    
    // Initialize Filecoin RPC client
    const rpcClient = new FilecoinRpcClient();
    
    // Initialize provider analyzer
    const providerAnalyzer = new ProviderAnalyzer();
    
    // Find region-optimized providers
    Zinnia.activity.info(`Finding Filecoin providers optimized for ${location.continent}...`);
    const providers = await providerAnalyzer.findRegionOptimizedProviders(
      location.continent,
      { limit: 3 }
    );
    
    Zinnia.activity.info(`Found ${providers.length} providers to test`);
    
    // Collection for test results
    const testResults = [];
    
    // First, test general retrieval (without specifying provider)
    Zinnia.activity.info(`Testing general retrieval for ${config.testCid}...`);
    const generalResult = await enhancedTestRetrieval(config.testCid);
    
    if (generalResult.success) {
      Zinnia.activity.info(
        `Successfully retrieved content in ${generalResult.totalTime.toFixed(0)}ms ` +
        `(TTFB: ${generalResult.ttfb.toFixed(0)}ms, ` +
        `Size: ${formatBytes(generalResult.contentSize)})`
      );
    } else {
      Zinnia.activity.error(`Failed to retrieve content: ${generalResult.error}`);
    }
    
    // Add general test to results
    testResults.push({
      minerId: null,
      peerId: null,
      cid: config.testCid,
      success: generalResult.success,
      latency: generalResult.totalTime,
      ttfb: generalResult.ttfb,
      size: generalResult.contentSize,
      throughput: generalResult.throughput,
      error: generalResult.error,
      location,
      timestamp: new Date().toISOString()
    });
    
    // Submit measurement
    await submitMeasurement({
      success: generalResult.success,
      location
    });
    
    // Now test each provider
    for (const provider of providers) {
      if (!provider.peerId) {
        console.log(`Skipping ${provider.minerId} - no peer ID available`);
        continue;
      }
      
      Zinnia.activity.info(`Testing retrieval from ${provider.minerId || provider.peerId}...`);
      const result = await enhancedTestRetrieval(config.testCid, provider.peerId);
      
      if (result.success) {
        Zinnia.activity.info(
          `Successfully retrieved from ${provider.minerId || provider.peerId} ` +
          `in ${result.totalTime.toFixed(0)}ms (TTFB: ${result.ttfb.toFixed(0)}ms)`
        );
      } else {
        Zinnia.activity.info(
          `Failed to retrieve from ${provider.minerId || provider.peerId}: ${result.error}`
        );
      }
      
      // Add test to results
      testResults.push({
        minerId: provider.minerId,
        peerId: provider.peerId,
        cid: config.testCid,
        success: result.success,
        latency: result.totalTime,
        ttfb: result.ttfb,
        size: result.contentSize,
        throughput: result.throughput,
        error: result.error,
        location,
        timestamp: new Date().toISOString()
      });
      
      // Submit measurement
      await submitMeasurement({
        success: result.success,
        location,
        minerId: provider.minerId
      });
    }
    
    // Try to get some network stats
    try {
      const chainHead = await rpcClient.getChainHead();
      Zinnia.activity.info(`Filecoin network height: ${chainHead.Height}`);
    } catch (error) {
      console.error('Error getting chain head:', error);
    }
    
    // Generate visualization and recommendations
    const visualizationData = generateVisualizationData(testResults);
    const globalStats = visualizationData.global;
    
    Zinnia.activity.info(
      `Tests completed: ${globalStats.total}, ` +
      `Success rate: ${globalStats.successRate.toFixed(1)}%, ` +
      `Average latency: ${globalStats.averageLatency.toFixed(2)}ms`
    );
    
    // Display recommendations
    const recommendations = generateRecommendations(visualizationData, location);
    if (recommendations.length > 0) {
      Zinnia.activity.info('Geographic performance recommendations:');
      recommendations.forEach(rec => {
        Zinnia.activity.info(`  - ${rec}`);
      });
    }
    
    // Report job completion
    Zinnia.jobCompleted();
    return true;
  } catch (error) {
    console.error('Error in runGeoFilecoinCheck:', error);
    Zinnia.activity.error(`Error: ${error.message}`);
    return false;
  }
}

/**
 * Run checks at regular intervals
 */
async function runPeriodicChecks() {
  while (true) {
    const success = await runGeoFilecoinCheck();
    
    // Wait before next check
    const waitTime = success ? config.checkInterval : 60 * 1000; // 1 minute on error
    console.log(`Waiting ${waitTime / 1000} seconds before next check...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
}

runPeriodicChecks();