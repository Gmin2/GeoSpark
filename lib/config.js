export default {
  RPC_AUTH: 'KZLIUb9ejreYOm-mZFM3UNADE0ux6CrHjxnS2D2Qgb8=',
  // Test parameters
  testCid: 'bafkreifzjut3te2nhyekklss27nh3k72ysco7y32koao5eei66wof36n5e',
  retrievalTimeout: 30000, // 30 seconds
  
  // API endpoints
  geoIpUrl: 'https://ipinfo.io/json',
  filecoinRpcUrl: 'https://api.node.glif.io/',
  submissionUrl: 'http://localhost:8080/geo-filecoin/measurement',
  
  // Known good peers for testing from different regions
  knownPeers: [
    {
      minerId: 'f0frisbii',
      peerId: '12D3KooWC8gXxg9LoJ9h3hy3jzBkEAxamyHEQJKtRmAuBuvoMzpr',
      description: 'Frisbii test provider'
    }
  ],
  
  // Running interval (5 minutes)
  checkInterval: 5 * 60 * 1000
}