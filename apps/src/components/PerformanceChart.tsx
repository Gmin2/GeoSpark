import { useMemo } from 'react';
import { GeoMeasurement, SuccessRateData } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { BarChart as RechartsBarChart, Bar, LineChart as RechartsLineChart, Line, CartesianGrid, XAxis, YAxis } from 'recharts';

import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";

interface PerformanceChartsProps {
  data: GeoMeasurement[] | null;
  successRateData: SuccessRateData[] | null;
}

export function PerformanceCharts({ data, successRateData }: PerformanceChartsProps) {
  // Prepare success rate trend data
  const successRateTrend = useMemo(() => {
    if (!successRateData) return [];
    
    return successRateData.map(item => ({
      day: item.day,
      successRate: parseFloat(
        ((parseInt(item.successful) / parseInt(item.total)) * 100).toFixed(1)
      )
    })).reverse(); // Reverse to get chronological order
  }, [successRateData]);
  
  // Prepare success rate chart config
  const successRateConfig = {
    successRate: {
      label: "Success Rate",
      color: "hsl(var(--chart-1))", // Using CSS variables defined in your globals.css
    }
  };
  
  // Prepare latency by continent data
  const latencyByContinent = useMemo(() => {
    if (!data) return [];
    
    const continentMap = new Map<string, { latencySum: number, count: number }>();
    
    data.forEach(entry => {
      if (!entry.continent || !entry.avg_latency) return;
      
      if (!continentMap.has(entry.continent)) {
        continentMap.set(entry.continent, { latencySum: 0, count: 0 });
      }
      
      const stats = continentMap.get(entry.continent)!;
      stats.latencySum += parseFloat(entry.avg_latency.toString());
      stats.count++;
    });
    
    return Array.from(continentMap.entries())
      .map(([continent, stats]) => ({
        continent,
        avgLatency: Math.round(stats.latencySum / stats.count)
      }))
      .sort((a, b) => a.avgLatency - b.avgLatency);
  }, [data]);
  
  // Prepare latency chart config
  const latencyConfig = {
    avgLatency: {
      label: "Average Latency",
      color: "hsl(var(--chart-2))",
    }
  };
  
  // Prepare provider performance data
  const providerPerformance = useMemo(() => {
    if (!data) return [];
    
    const providerMap = new Map<string, { 
      successCount: number, 
      totalCount: number,
      latencySum: number,
      latencyCount: number
    }>();
    
    data.forEach(entry => {
      if (!entry.miner_id) return;
      
      if (!providerMap.has(entry.miner_id)) {
        providerMap.set(entry.miner_id, { 
          successCount: 0, 
          totalCount: 0,
          latencySum: 0,
          latencyCount: 0
        });
      }
      
      const stats = providerMap.get(entry.miner_id)!;
      stats.successCount += parseInt(entry.successful_checks.toString());
      stats.totalCount += parseInt(entry.total_checks.toString());
      
      if (entry.avg_latency) {
        stats.latencySum += parseFloat(entry.avg_latency.toString());
        stats.latencyCount++;
      }
    });
    
    return Array.from(providerMap.entries())
      .filter(([_, stats]) => stats.totalCount > 0)
      .map(([providerId, stats]) => ({
        provider: providerId,
        successRate: parseFloat(
          ((stats.successCount / stats.totalCount) * 100).toFixed(1)
        ),
        avgLatency: stats.latencyCount > 0 
          ? Math.round(stats.latencySum / stats.latencyCount) 
          : 0
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10); // Top 10 providers
  }, [data]);
  
  // Prepare provider performance chart config
  const providerConfig = {
    successRate: {
      label: "Success Rate",
      color: "hsl(var(--chart-1))",
    },
    avgLatency: {
      label: "Average Latency",
      color: "hsl(var(--chart-3))",
    }
  };
  
  if (!data || !data.length) {
    return <p className="text-muted-foreground">No data available for charts</p>;
  }
  
  return (
    <Tabs defaultValue="continents">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="trends">Success Rate Trends</TabsTrigger>
        <TabsTrigger value="continents">Latency by Region</TabsTrigger>
        <TabsTrigger value="providers">Provider Performance</TabsTrigger>
      </TabsList>
      
      <TabsContent value="trends">
        <ChartContainer config={successRateConfig} className="h-[400px]">
          <RechartsLineChart data={successRateTrend} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="day" 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line 
              type="monotone" 
              dataKey="successRate" 
              stroke="var(--color-successRate)" 
              strokeWidth={2}
              dot={{ fill: "var(--color-successRate)", strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </RechartsLineChart>
        </ChartContainer>
      </TabsContent>
      
      <TabsContent value="continents">
        <ChartContainer config={latencyConfig} className="h-[400px]">
          <RechartsBarChart data={latencyByContinent} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis 
              dataKey="continent" 
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => `${value} ms`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar 
              dataKey="avgLatency" 
              fill="var(--color-avgLatency)" 
              radius={[4, 4, 0, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      </TabsContent>
      
      <TabsContent value="providers">
        <ChartContainer config={providerConfig} className="h-[400px]">
          <RechartsBarChart 
            data={providerPerformance} 
            layout="vertical"
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} />
            <XAxis 
              type="number"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis
              type="category"
              dataKey="provider"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar 
              dataKey="successRate" 
              fill="var(--color-successRate)" 
              radius={[0, 4, 4, 0]}
            />
          </RechartsBarChart>
        </ChartContainer>
      </TabsContent>
    </Tabs>
  );
}