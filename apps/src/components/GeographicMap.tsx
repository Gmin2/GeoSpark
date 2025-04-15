import { useMemo } from 'react';
import { GeoMeasurement } from '@/types';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker 
} from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

// You'll need to download this file and place it in your public directory
const geoUrl = "/world-110m.json";

interface GeographicMapProps {
  data: GeoMeasurement[] | null;
}

// Mapping of continents to coordinates (approximate centers)
const continentCoordinates = {
  "North America": { coordinates: [-100, 40], name: "North America" },
  "South America": { coordinates: [-60, -20], name: "South America" },
  "Europe": { coordinates: [15, 50], name: "Europe" },
  "Africa": { coordinates: [20, 0], name: "Africa" },
  "Asia": { coordinates: [80, 30], name: "Asia" },
  "Oceania": { coordinates: [135, -25], name: "Oceania" },
  "Antarctica": { coordinates: [0, -80], name: "Antarctica" },
  "Unknown": { coordinates: [0, 0], name: "Unknown" }
};

export function GeographicMap({ data }: GeographicMapProps) {
  // Process data by continent
  const continentStats = useMemo(() => {
    if (!data || !data.length) return [];
    
    const stats = new Map<string, {
      total: number;
      successful: number;
      avgLatency: number;
      count: number;
    }>();
    
    data.forEach(entry => {
      if (!entry.continent) return;
      
      if (!stats.has(entry.continent)) {
        stats.set(entry.continent, {
          total: 0,
          successful: 0,
          avgLatency: 0,
          count: 0
        });
      }
      
      const continentStat = stats.get(entry.continent)!;
      continentStat.total += parseInt(entry.total_checks.toString() || '0');
      continentStat.successful += parseInt(entry.successful_checks.toString() || '0');
      
      if (entry.avg_latency) {
        continentStat.avgLatency += parseFloat(entry.avg_latency.toString());
        continentStat.count++;
      }
    });
    
    return Array.from(stats.entries()).map(([continent, stat]) => ({
      ...continentCoordinates[continent as keyof typeof continentCoordinates] || 
        continentCoordinates.Unknown,
      continent,
      successRate: stat.total > 0 ? (stat.successful / stat.total * 100) : 0,
      avgLatency: stat.count > 0 ? Math.round(stat.avgLatency / stat.count) : 0,
      markerSize: Math.max(10, Math.min(30, (stat.total / 10) + 10)) // Size based on total checks
    }));
  }, [data]);
  
  if (!data || !data.length) {
    return (
      <div className="flex justify-center items-center h-64 bg-slate-50 rounded-md">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto text-muted-foreground animate-spin" />
          <p className="mt-2 text-muted-foreground">Loading geographic data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="h-[400px] w-full">
        <ComposableMap projectionConfig={{ scale: 150 }}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#D6D6DA"
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: "#F5F5F5" },
                    pressed: { outline: "none" }
                  }}
                />
              ))
            }
          </Geographies>
          
          {continentStats.map(({ coordinates, continent, successRate, markerSize }) => (
            <Marker key={continent} coordinates={coordinates}>
              <circle
                r={markerSize}
                fill={getColorFromSuccessRate(successRate)}
                fillOpacity={0.8}
                stroke="#FFFFFF"
                strokeWidth={1}
              />
              <text
                textAnchor="middle"
                y={-markerSize - 5}
                style={{
                  fontFamily: "system-ui",
                  fontSize: 10,
                  fill: "#333",
                  fontWeight: "bold"
                }}
              >
                {continent}
              </text>
              <text
                textAnchor="middle"
                y={-markerSize + 5}
                style={{
                  fontFamily: "system-ui",
                  fontSize: 8,
                  fill: "#333"
                }}
              >
                {successRate.toFixed(1)}%
              </text>
            </Marker>
          ))}
        </ComposableMap>
      </div>
      
      {/* Display continent stats in cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-50">
        {continentStats.map(({ continent, successRate, avgLatency }) => (
          <Card key={continent} className="p-4">
            <h3 className="font-medium">{continent}</h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-lg font-semibold">{successRate.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Latency</p>
                <p className="text-lg font-semibold">{avgLatency} ms</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper function to get color based on success rate
function getColorFromSuccessRate(rate: number): string {
  if (rate >= 90) return "hsl(var(--chart-1))"; // Green
  if (rate >= 70) return "hsl(var(--chart-4))"; // Yellow
  return "hsl(var(--chart-5))";                // Red
}