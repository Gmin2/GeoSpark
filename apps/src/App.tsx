import { useState, useEffect } from 'react';
import { fetchGeoStats, fetchRetrievalSuccessRate } from './api';
import { GeoMeasurement, SuccessRateData } from './types';

import { GeographicMap } from './components/GeographicMap';
import { PerformanceMetrics } from './components/PerformanceMetrics';
import { ProviderTable } from './components/ProviderTable';
import { RegionFilter } from './components/RegionFilter';
import { PerformanceCharts } from './components/PerformanceChart';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

function App() {
  const [stats, setStats] = useState<GeoMeasurement[] | null>(null);
  const [successRate, setSuccessRate] = useState<SuccessRateData[] | null>(null);
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch success rate data
        const rateData = await fetchRetrievalSuccessRate();
        setSuccessRate(rateData);
        
        // Fetch geo stats with possible continent filter
        const params = selectedContinent !== 'all' ? { continent: selectedContinent } : {};
        const statsData = await fetchGeoStats(params);
        setStats(statsData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedContinent]);

  const handleContinentChange = (continent: string) => {
    setSelectedContinent(continent);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">Geo-Filecoin Dashboard</h1>
          <p className="text-sm text-gray-500">Geographic Performance Analyzer for Filecoin Storage Providers</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="providers">Provider Rankings</TabsTrigger>
              <TabsTrigger value="charts">Performance Charts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <PerformanceMetrics successRate={successRate} stats={stats} />
              </div>
              
              <div className="mb-6">
                <RegionFilter 
                  selectedContinent={selectedContinent} 
                  onChange={handleContinentChange} 
                />
              </div>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Geographic Performance Map</CardTitle>
                  <CardDescription>
                    Success rates and latency by geographic region
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GeographicMap data={stats} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="providers">
              <Card>
                <CardHeader>
                  <CardTitle>Provider Rankings</CardTitle>
                  <CardDescription>
                    Performance metrics for Filecoin storage providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProviderTable data={stats} />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="charts">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Charts</CardTitle>
                  <CardDescription>
                    Detailed analysis of geographic performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PerformanceCharts data={stats} successRateData={successRate} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

export default App;