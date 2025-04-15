export default {
  version: "1.0.0",

  // Filecoin RPC configuration
  filecoin: {
    rpcUrl: "https://api.node.glif.io/",
    rpcAuth: "KZLIUb9ejreYOm-mZFM3UNADE0ux6CrHjxnS2D2Qgb8=",
  },

  // Test CIDs
  testCid: "bafkreifzjut3te2nhyekklss27nh3k72ysco7y32koao5eei66wof36n5e",

  // API endpoints
  geoIpUrl: "https://ipinfo.io/json",
  submissionUrl: "http://localhost:8080/geo-filecoin/measurement",

  // Known good peers for testing from different regions
  knownPeers: [
    {
      minerId: "f0frisbii",
      peerId: "12D3KooWC8gXxg9LoJ9h3hy3jzBkEAxamyHEQJKtRmAuBuvoMzpr",
      description: "Frisbii test provider",
      region: null, // Works globally
    },
    {
      minerId: "f01606244",
      description: "North America reference provider",
      region: "North America",
    },
    // Add more providers by region
    {
      minerId: "f0803216",
      description: "Europe provider",
      region: "Europe",
    },
    {
      minerId: "f0127595",
      description: "Asia provider",
      region: "Asia",
    },
    {
      minerId: "f0412727",
      description: "South America provider",
      region: "South America",
    },
    {
      minerId: "f0303251",
      description: "Africa provider",
      region: "Africa",
    },
    {
      minerId: "f0799110",
      description: "Oceania provider",
      region: "Oceania",
    },
  ],

  // Check intervals
  checkInterval: 5 * 60 * 1000, // 5 minutes

  testing: {
    timeouts: {
      retrieval: 30000,
      rpc: 10000,
    },
  },

  // to simulate for different geoLocations
  simulation: {
    enabled: false,
    locations: [
      { city: "New York", region: "NY", country: "US", continent: "North America" },
      { city: "London", region: "England", country: "GB", continent: "Europe" },
      { city: "Sydney", region: "NSW", country: "AU", continent: "Oceania" },
      { city: "Rio de Janeiro", region: "RJ", country: "BR", continent: "South America" },
      { city: "Cairo", region: "Cairo", country: "EG", continent: "Africa" },
      { city: "Tokyo", region: "Tokyo", country: "JP", continent: "Asia" }
    ],
    currentLocationIndex: 3
  }
};
