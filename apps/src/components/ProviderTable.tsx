import { GeoMeasurement, Provider } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ProviderTableProps {
  data: GeoMeasurement[] | null;
}

export function ProviderTable({ data }: ProviderTableProps) {
  if (!data || !data.length) {
    return <p className="text-muted-foreground">No provider data available</p>;
  }
  
  // Process data to group by provider and calculate metrics
  const providerMap = new Map<string, {
    minerId: string;
    total: number;
    successful: number;
    latencyValues: number[];
    ttfbValues: number[];
    regions: Set<string>;
  }>();
  
  data.forEach(entry => {
    if (!entry.miner_id) return;
    
    if (!providerMap.has(entry.miner_id)) {
      providerMap.set(entry.miner_id, {
        minerId: entry.miner_id,
        total: 0,
        successful: 0,
        latencyValues: [],
        ttfbValues: [],
        regions: new Set<string>()
      });
    }
    
    const provider = providerMap.get(entry.miner_id)!;
    provider.total += parseInt(entry.total_checks.toString() || '0');
    provider.successful += parseInt(entry.successful_checks.toString() || '0');
    
    if (entry.avg_latency) {
      provider.latencyValues.push(parseFloat(entry.avg_latency.toString()));
    }
    
    if (entry.avg_ttfb) {
      provider.ttfbValues.push(parseFloat(entry.avg_ttfb.toString()));
    }
    
    if (entry.continent) {
      provider.regions.add(entry.continent);
    }
  });
  
  // Calculate final metrics and sort by success rate
  const providers: Provider[] = Array.from(providerMap.values()).map(p => ({
    minerId: p.minerId,
    successRate: p.total > 0 ? parseFloat((p.successful / p.total * 100).toFixed(1)) : 0,
    avgLatency: p.latencyValues.length > 0 
      ? Math.round(p.latencyValues.reduce((a, b) => a + b, 0) / p.latencyValues.length)
      : 0,
    avgTtfb: p.ttfbValues.length > 0 
      ? Math.round(p.ttfbValues.reduce((a, b) => a + b, 0) / p.ttfbValues.length)
      : 0,
    regions: Array.from(p.regions).join(', ')
  })).sort((a, b) => b.successRate - a.successRate);
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider ID</TableHead>
          <TableHead>Success Rate</TableHead>
          <TableHead>Avg Latency</TableHead>
          <TableHead>Avg TTFB</TableHead>
          <TableHead>Regions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map((provider) => (
          <TableRow key={provider.minerId}>
            <TableCell className="font-medium">{provider.minerId}</TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <span>{provider.successRate}%</span>
                <Progress value={provider.successRate} className="h-2" />
              </div>
            </TableCell>
            <TableCell>{provider.avgLatency} ms</TableCell>
            <TableCell>{provider.avgTtfb} ms</TableCell>
            <TableCell>
              {provider.regions.split(', ').map(region => (
                <Badge key={region} className="mr-1" variant="outline">{region}</Badge>
              ))}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}