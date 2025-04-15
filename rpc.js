import { FilecoinRpcClient } from './lib/filecoin-rpc.js';
import config from './lib/config.js';

/**
 * Test StateListMiners with progressively longer timeouts
 */
async function testStateListMiners() {
  console.log('=== Testing Filecoin.StateListMiners API ===');
  
  // Test with different timeouts
  const timeouts = [10000, 30000, 60000, 120000, 240000];
  
  for (const timeout of timeouts) {
    console.log(`\nTesting StateListMiners with ${timeout}ms timeout...`);
    
    try {
      const rpcClient = new FilecoinRpcClient({ 
        timeout,
        rpcUrl: config.filecoin.rpcUrl,
        rpcAuth: config.filecoin.rpcAuth
      });
      
      // First, let's test a simple API call to make sure the connection works
      try {
        console.log('Testing connection with ChainHead call...');
        const startTime = performance.now();
        const chainHead = await rpcClient.getChainHead();
        const duration = performance.now() - startTime;
        console.log(`Got chain head (height: ${chainHead.Height}) in ${duration.toFixed(0)}ms`);
      } catch (chainHeadError) {
        console.error('Error getting chain head:', chainHeadError);
        console.log('Skipping StateListMiners test for this timeout due to connection issues');
        continue;
      }
      
      // Now test the StateListMiners call
      console.log(`Calling StateListMiners with ${timeout}ms timeout...`);
      const startTime = performance.now();
      
      try {
        const miners = await rpcClient.call('Filecoin.StateListMiners', [null]);
        const duration = performance.now() - startTime;
        
        console.log(`SUCCESS: Got ${miners.length} miners in ${duration.toFixed(0)}ms`);
        console.log('Sample miners:', miners.slice(0, 5));
        
        console.log(`\n✅ StateListMiners worked with ${timeout}ms timeout`);
        return { success: true, miners, timeout };
      } catch (minersError) {
        const duration = performance.now() - startTime;
        console.error(`FAILED: StateListMiners failed after ${duration.toFixed(0)}ms:`, minersError);
      }
    } catch (error) {
      console.error(`Setup error with ${timeout}ms timeout:`, error);
    }
  }
  
  console.log('\n❌ All timeout values failed for StateListMiners');
  return { success: false };
}

// Run the test
testStateListMiners();