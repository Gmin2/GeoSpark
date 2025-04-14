import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RegionFilterProps {
  selectedContinent: string;
  onChange: (continent: string) => void;
}

export function RegionFilter({ selectedContinent, onChange }: RegionFilterProps) {
  const continents = [
    { id: 'all', name: 'All Regions' },
    { id: 'North America', name: 'North America' },
    { id: 'Europe', name: 'Europe' },
    { id: 'Asia', name: 'Asia' },
    { id: 'South America', name: 'South America' },
    { id: 'Africa', name: 'Africa' },
    { id: 'Oceania', name: 'Oceania' }
  ];
  
  return (
    <div className="flex items-center space-x-4">
      <Label htmlFor="continent-filter" className="text-sm font-medium">
        Filter by Region:
      </Label>
      <Select value={selectedContinent} onValueChange={onChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select region" />
        </SelectTrigger>
        <SelectContent>
          {continents.map(continent => (
            <SelectItem key={continent.id} value={continent.id}>
              {continent.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}