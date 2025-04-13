import config from './config.js';
import { retry } from '../vendor/deno-deps.js';

/**
 * Client for Filecoin JSON-RPC API interactions
 */
export class FilecoinRpcClient {
  constructor(options = {}) {
    this.rpcUrl = options.rpcUrl || config.filecoin.rpcUrl;
    this.rpcAuth = options.rpcAuth || config.filecoin.rpcAuth;
    this.timeout = options.timeout || 15000;
  }

  /**
   * Make a JSON-RPC call to the Filecoin API
   * @param {string} method - RPC method name
   * @param {Array} params - Parameters for the method
   * @returns {Promise<any>} - The result field from the response
   */
  async call(method, params = []) {
    try {
      const response = await retry(
        async () => {
          const res = await fetch(this.rpcUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': this.rpcAuth ? `Bearer ${this.rpcAuth}` : undefined
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method,
              params,
              id: Date.now()
            }),
            signal: AbortSignal.timeout(this.timeout)
          });

          if (!res.ok) {
            throw new Error(`HTTP error ${res.status}`);
          }

          return res;
        },
        {
          maxAttempts: 3,
          minTimeout: 1000,
          maxTimeout: 5000
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(`RPC error: ${data.error.message}`);
      }
      
      return data.result;
    } catch (error) {
      console.error(`Error calling ${method}:`, error);
      throw error;
    }
  }

  /**
   * Get chain head information
   * @returns {Promise<object>} Chain head info
   */
  async getChainHead() {
    return this.call('Filecoin.ChainHead');
  }

  /**
   * Get information about a miner
   * @param {string} minerId - Miner ID (e.g., 'f01234')
   * @returns {Promise<object>} Miner information
   */
  async getMinerInfo(minerId) {
    const head = await this.getChainHead();
    return this.call('Filecoin.StateMinerInfo', [minerId, head.Cids]);
  }

  /**
   * Get all active miners
   * @returns {Promise<string[]>} Array of miner IDs
   */
  async getActiveMiners() {
    return this.call('Filecoin.StateListMiners', [null]);
  }

  /**
   * Get miner power information
   * @param {string} minerId - Miner ID
   * @returns {Promise<object>} Miner power data
   */
  async getMinerPower(minerId) {
    const head = await this.getChainHead();
    return this.call('Filecoin.StateMinerPower', [minerId, head.Cids]);
  }

  /**
   * Get miner sectors
   * @param {string} minerId - Miner ID
   * @returns {Promise<object>} Miner sectors information
   */
  async getMinerSectors(minerId) {
    const head = await this.getChainHead();
    return this.call('Filecoin.StateMinerSectors', [minerId, null, head.Cids]);
  }

  /**
   * Get active deals for a miner
   * @param {string} minerId - Miner ID
   * @returns {Promise<Array>} List of active deals
   */
  async getMinerDeals(minerId) {
    const head = await this.getChainHead();
    return this.call('Filecoin.StateMarketDeals', [head.Cids])
      .then(deals => {
        // Filter deals for this miner
        const minerDeals = [];
        for (const [dealId, deal] of Object.entries(deals)) {
          if (deal.Proposal.Provider === minerId) {
            minerDeals.push({
              dealId,
              ...deal
            });
          }
        }
        return minerDeals;
      });
  }

  /**
   * Get network version
   * @returns {Promise<number>} Network version
   */
  async getNetworkVersion() {
    const head = await this.getChainHead();
    return this.call('Filecoin.StateNetworkVersion', [head.Cids]);
  }
}