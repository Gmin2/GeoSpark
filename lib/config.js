export default {
  version: '1.0.0',
  
  // Filecoin RPC configuration
  filecoin: {
    rpcUrl: 'https://api.node.glif.io/',
    rpcAuth: 'KZLIUb9ejreYOm-mZFM3UNADE0ux6CrHjxnS2D2Qgb8='
  },
  
  // Test CIDs
  testCid: 'bafkreifzjut3te2nhyekklss27nh3k72ysco7y32koao5eei66wof36n5e',
  
  // API endpoints
  geoIpUrl: 'https://ipinfo.io/json',
  submissionUrl: 'https://api.checker.network/geo-filecoin/measurement',
  
  // Known good peers for testing from different regions
  knownPeers: [
    {
      minerId: 'f0frisbii',
      peerId: '12D3KooWC8gXxg9LoJ9h3hy3jzBkEAxamyHEQJKtRmAuBuvoMzpr',
      description: 'Frisbii test provider',
      region: null // Works globally
    },
    {
      minerId: 'f01606244',
      description: 'North America reference provider',
      region: 'North America'
    }
  ],
  
  // Check intervals
  checkInterval: 5 * 60 * 1000, // 5 minutes
  
  // Testing parameters
  testing: {
    timeouts: {
      retrieval: 30000, // 30 seconds
      rpc: 10000       // 10 seconds
    }
  }
};