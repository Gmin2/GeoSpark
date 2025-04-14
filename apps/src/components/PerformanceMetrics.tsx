import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SuccessRateData, GeoMeasurement } from '@/types';

interface PerformanceMetricsProps {
  successRate: SuccessRateData[] | null;
  stats: GeoMeasurement[] | null;
}

export function PerformanceMetrics({ successRate, stats }: PerformanceMetricsProps) {
  // Calculate overall statistics
  const overallSuccess = parseInt(successRate?.[0]?.successful || '0');
  const overallTotal = parseInt(successRate?.[0]?.total || '0');
  const successRatePercentage = overallTotal > 0 
    ? ((overallSuccess / overallTotal) * 100).toFixed(1) 
    : '0';
    
  // Calculate average latency and TTFB if available
  const latencyValues = stats?.filter(s => s.avg_latency).map(s => parseFloat(s.avg_latency.toString())) || [];
  const avgLatency = latencyValues.length 
    ? Math.round(latencyValues.reduce((sum, val) => sum + val, 0) / latencyValues.length).toString()
    : 'N/A';
    
  const ttfbValues = stats?.filter(s => s.avg_ttfb).map(s => parseFloat(s.avg_ttfb.toString())) || [];
  const avgTtfb = ttfbValues.length 
    ? Math.round(ttfbValues.reduce((sum, val) => sum + val, 0) / ttfbValues.length).toString()
    : 'N/A';
  
  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <p className="text-3xl font-semibold">{successRatePercentage}%</p>
            <p className="ml-2 text-sm text-muted-foreground">of {overallTotal} retrievals</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average Latency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <p className="text-3xl font-semibold">{avgLatency}</p>
            <p className="ml-2 text-sm text-muted-foreground">ms</p>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Average TTFB</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline">
            <p className="text-3xl font-semibold">{avgTtfb}</p>
            <p className="ml-2 text-sm text-muted-foreground">ms</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}