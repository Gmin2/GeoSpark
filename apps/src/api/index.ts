import { GeoMeasurement, SuccessRateData } from '@/types';

const API_BASE_URL = 'http://localhost:8080';

interface GeoStatsParams {
  continent?: string;
  minerId?: string;
  days?: number;
}

interface SuccessRateParams {
  from?: string;
  to?: string;
}

export async function fetchGeoStats(params: GeoStatsParams = {}): Promise<GeoMeasurement[]> {
  const queryParams = new URLSearchParams();
  
  if (params.continent && params.continent !== 'all') {
    queryParams.append('continent', params.continent);
  }
  if (params.minerId) queryParams.append('minerId', params.minerId);
  if (params.days) queryParams.append('days', params.days.toString());
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/geo-filecoin/stats${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${error}`);
  }
  
  return response.json();
}

export async function fetchRetrievalSuccessRate(params: SuccessRateParams = {}): Promise<SuccessRateData[]> {
  const queryParams = new URLSearchParams();
  
  if (params.from) queryParams.append('from', params.from);
  if (params.to) queryParams.append('to', params.to);
  
  const queryString = queryParams.toString();
  const url = `${API_BASE_URL}/geo-filecoin/retrieval-success-rate${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${error}`);
  }
  
  return response.json();
}