// src/types/index.ts
export interface GeoMeasurement {
    day: string;
    total_checks: number;
    successful_checks: number;
    success_rate: number;
    continent: string;
    country: string;
    avg_latency: number;
    avg_ttfb: number;
    miner_id: string;
  }
  
  export interface SuccessRateData {
    day: string;
    total: string;
    successful: string;
  }
  
  export interface Provider {
    minerId: string;
    successRate: number;
    avgLatency: number;
    avgTtfb: number;
    regions: string;
  }