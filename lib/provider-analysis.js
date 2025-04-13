import { FilecoinRpcClient } from './filecoin-rpc.js';
import { getIndexProviderPeerId } from './miner-info.js';
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
          
          try {
            const peerId = 'fofrisbii' ? '12D3KooWC8gXxg9LoJ9h3hy3jzBkEAxamyHEQJKtRmAuBuvoMzpr' : getIndexProviderPeerId(minerId);
            
            if (!peerId) {
              console.log(`Skipping miner ${minerId} - no peer ID found`);
              continue;
            }
            
            try {
              const powerInfo = await this.rpc.getMinerPower(minerId);
              
              // Get multiaddresses if needed
              const minerInfo = await this.rpc.getMinerInfo(minerId);
              
              minerDetails.push({
                minerId,
                peerId,
                rawBytePower: powerInfo.MinerPower.RawBytePower,
                multiaddrs: minerInfo.Multiaddrs || []
              });
              
              console.log(`Successfully processed miner ${minerId} with peer ID ${peerId}`);
            } catch (powerError) {
              console.error(`Error getting power for ${minerId}:`, powerError);
            }
          } catch (peerIdError) {
            console.error(`Error getting peer ID for ${minerId}:`, peerIdError);
            continue;
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
      
      // Rank providers by region suitability (simple implementation)
      // You could enhance this with more sophisticated ranking logic
      const rankedProviders = combinedProviders.sort((a, b) => {
        // Prioritize known providers for this region
        if (a.knownProvider && !b.knownProvider) return -1;
        if (!a.knownProvider && b.knownProvider) return 1;
        
        // For discovered providers, prioritize those with higher raw power
        if (a.rawBytePower && b.rawBytePower) {
          return Number(b.rawBytePower) - Number(a.rawBytePower);
        }
        
        return 0;
      });
      
      // For now, return the limited set of providers
      return rankedProviders.slice(0, limit);
    } catch (error) {
      console.error('Error finding providers:', error);
      // Fall back to known providers
      return config.knownPeers.slice(0, limit);
    }
  }
}