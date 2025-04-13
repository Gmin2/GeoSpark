import { FilecoinRpcClient } from './filecoin-rpc.js';
import config from './config.js';

export class ProviderAnalyzer {
  constructor() {
    this.rpc = new FilecoinRpcClient();
    this.providerCache = new Map();
  }

  /**
   * Find providers optimized for specific regions
   * @param {string} targetRegion - Target region or continent
   * @param {object} options - Search options
   * @returns {Promise<Array>} Ranked list of suitable providers
   */
  async findRegionOptimizedProviders(targetRegion, options = {}) {
    const { limit = 5 } = options;
    
    try {
      // First try to get from known providers for the region
      const knownProviders = config.knownPeers.filter(p => 
        p.region === targetRegion || !p.region);
        
      if (knownProviders.length > 0) {
        console.log(`Using ${knownProviders.length} known providers`);
      }
      
      // Get some additional miners from the network
      console.log('Fetching additional miners from the Filecoin network...');
      const minerIds = await this.rpc.getActiveMiners();
      
      // Used a limited sample to avoid excessive API calls
      const minerSample = minerIds.slice(0, 10);
      console.log(`Sampling ${minerSample.length} miners from ${minerIds.length} total miners`);
      
      // Process miners to get their details
      const minerDetails = [];
      for (const minerId of minerSample) {
        try {
          console.log(`Getting info for miner ${minerId}...`);
          const minerInfo = await this.rpc.getMinerInfo(minerId);
          
          // Skip miners with no peer ID
          if (!minerInfo.PeerId) {
            console.log(`Skipping miner ${minerId} - no peer ID`);
            continue;
          }
          
          try {
            const powerInfo = await this.rpc.getMinerPower(minerId);
            
            minerDetails.push({
              minerId,
              peerId: minerInfo.PeerId,
              rawBytePower: powerInfo.MinerPower.RawBytePower,
              multiaddrs: minerInfo.Multiaddrs || []
            });
          } catch (powerError) {
            console.error(`Error getting power for ${minerId}:`, powerError);
          }
        } catch (error) {
          console.error(`Error getting info for miner ${minerId}:`, error);
        }
      }
      
      // Combined our known providers with discovered ones
      const combinedProviders = [
        ...knownProviders.map(p => ({
          minerId: p.minerId,
          peerId: p.peerId,
          description: p.description,
          knownProvider: true
        })),
        ...minerDetails
      ];
      
      // For now, return the limited set of providers
      return combinedProviders.slice(0, limit);
    } catch (error) {
      console.error('Error finding providers:', error);
      // Fall back to known providers
      return config.knownPeers.slice(0, limit);
    }
  }
}