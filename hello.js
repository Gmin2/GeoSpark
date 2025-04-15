import { getNodeLocation } from './lib/geo.js';
import { enhancedTestRetrieval } from './lib/measure.js';
import { FilecoinRpcClient } from './lib/filecoin-rpc.js';
import { getIndexProviderPeerId } from './lib/miner-info.js';
import { ProviderAnalyzer } from './lib/provider-analysis.js';
import { submitMeasurement } from './lib/submit.js';
import { formatBytes } from './lib/utils.js';
import config from './lib/config.js';

/**
 * Test geo-location detection
 */
async function testGeoLocation() {
  console.log('\n=== Testing Geo-Location Detection ===');
  try {
    const location = await getNodeLocation();
    console.log('Location detected:', location);
    return location;
  } catch (error) {
    console.error('Geo-Location Error:', error);
    return null;
  }
}

/**
 * Test a basic retrieval without specifying provider
 */
async function testGeneralRetrieval() {
  console.log('\n=== Testing General Retrieval ===');
  try {
    const result = await enhancedTestRetrieval(config.testCid);
    console.log('Retrieval result:', result);
    console.log('Size:', formatBytes(result.contentSize));
    console.log('Latency:', result.totalTime.toFixed(2) + 'ms');
    console.log('TTFB:', result.ttfb.toFixed(2) + 'ms');
    return result;
  } catch (error) {
    console.error('General Retrieval Error:', error);
    return null;
  }
}

/**
 * Test retrieval from a specific provider
 */
async function testProviderRetrieval() {
  console.log('\n=== Testing Provider-Specific Retrieval ===');
  try {
    // Using Frisbii test provider 
    const providerId = '12D3KooWC8gXxg9LoJ9h3hy3jzBkEAxamyHEQJKtRmAuBuvoMzpr';
    const result = await enhancedTestRetrieval(config.testCid, providerId);
    console.log('Provider retrieval result:', result);
    console.log('Size:', formatBytes(result.contentSize));
    console.log('Latency:', result.totalTime.toFixed(2) + 'ms');
    console.log('TTFB:', result.ttfb.toFixed(2) + 'ms');
    return result;
  } catch (error) {
    console.error('Provider Retrieval Error:', error);
    return null;
  }
}

/**
 * Test Filecoin RPC with progressively longer timeouts
 */
async function testFilecoinRpc() {
  console.log('\n=== Testing Filecoin RPC ===');
  
  // Test with different timeouts
  const timeouts = [5000, 15000, 30000];
  
  for (const timeout of timeouts) {
    console.log(`Testing RPC with ${timeout}ms timeout...`);
    try {
      const rpcClient = new FilecoinRpcClient({ timeout });
      
      console.log('Getting chain head...');
      const chainHead = await rpcClient.getChainHead();
      console.log('Chain head height:', chainHead.Height);
      
      console.log('Getting network version...');
      const networkVersion = await rpcClient.getNetworkVersion();
      console.log('Network version:', networkVersion);
      
      // Only try to get miners list if above succeeded
      try {
        console.log('Getting sample miners list (limited to 5)...');
        const startTime = performance.now();
        const miners = await rpcClient.getActiveMiners();
        const duration = performance.now() - startTime;
        console.log(`Got ${miners.length} miners in ${duration.toFixed(0)}ms`);
        console.log('Sample miners:', miners.slice(0, 5));
        
        // This was working, let's break
        return { success: true, miners, timeout };
      } catch (minersError) {
        console.error('Error getting miners:', minersError);
      }
    } catch (error) {
      console.error(`RPC Error with ${timeout}ms timeout:`, error);
    }
  }
  
  return { success: false };
}

/**
 * Test getting peer ID for a miner
 */
async function testPeerIdLookup() {
  console.log('\n=== Testing Peer ID Lookup ===');
  
  // Test known good miner
  const knownMiner = 'f0frisbii';
  try {
    console.log(`Looking up peer ID for ${knownMiner}...`);
    const peerId = await getIndexProviderPeerId(knownMiner);
    console.log(`Peer ID for ${knownMiner}:`, peerId);
  } catch (error) {
    console.error(`Error looking up peer ID for ${knownMiner}:`, error);
  }
  
  // Test the problematic miner
  const problemMiner = 'f01606244';
  try {
    console.log(`Looking up peer ID for ${problemMiner}...`);
    const peerId = await getIndexProviderPeerId(problemMiner);
    console.log(`Peer ID for ${problemMiner}:`, peerId);
  } catch (error) {
    console.error(`Error looking up peer ID for ${problemMiner}:`, error);
  }
}

/**
 * Test provider analyzer
 */
async function testProviderAnalyzer() {
  console.log('\n=== Testing Provider Analyzer ===');
  try {
    const analyzer = new ProviderAnalyzer();
    const location = await getNodeLocation();
    
    console.log(`Finding providers for ${location.continent}...`);
    const providers = await analyzer.findRegionOptimizedProviders(location.continent, { limit: 3 });
    console.log(`Found ${providers.length} providers`);
    console.log('Providers:', providers);
    return providers;
  } catch (error) {
    console.error('Provider Analyzer Error:', error);
    return [];
  }
}

/**
 * Test measurement submission
 */
async function testSubmitMeasurement() {
  console.log('\n=== Testing Measurement Submission ===');
  try {
    const location = await getNodeLocation();
    const measurement = {
      success: true,
      location,
      minerId: 'f0frisbii'
    };
    
    console.log('Submitting test measurement...');
    await submitMeasurement(measurement);
    console.log('Measurement submitted successfully');
    return true;
  } catch (error) {
    console.error('Measurement Submission Error:', error);
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log('=== Starting Individual Component Tests ===\n');
  
  // Test geo-location
  const location = await testGeoLocation();
  
  // Test retrievals
  await testGeneralRetrieval();
  await testProviderRetrieval();
  
  // Test RPC functionality
  const rpcResult = await testFilecoinRpc();
  
  // Only run these tests if RPC is working
  if (rpcResult.success) {
    await testPeerIdLookup();
    await testProviderAnalyzer();
  } else {
    console.log('\nSkipping provider tests due to RPC failure');
  }
  
  // Test measurement submission
  await testSubmitMeasurement();
  
  console.log('\n=== All Tests Completed ===');
}

// Run the tests
runTests();