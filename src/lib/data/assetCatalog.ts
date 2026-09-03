import type { AssetCatalogEntry } from '@/lib/types';

export const ASSET_CATALOG: AssetCatalogEntry[] = [
  { id: 'used_sedan', type: 'car', name: 'Used Sedan', cost: 4000, happinessBonus: 5, upkeepPerYear: 400 },
  { id: 'compact_car', type: 'car', name: 'Compact Car', cost: 12000, happinessBonus: 8, upkeepPerYear: 800 },
  { id: 'sports_car', type: 'car', name: 'Sports Car', cost: 60000, happinessBonus: 15, upkeepPerYear: 3000 },
  { id: 'luxury_suv', type: 'car', name: 'Luxury SUV', cost: 90000, happinessBonus: 18, upkeepPerYear: 4500 },

  { id: 'starter_apartment', type: 'house', name: 'Starter Apartment', cost: 50000, happinessBonus: 8, upkeepPerYear: 2000 },
  { id: 'suburban_house', type: 'house', name: 'Suburban House', cost: 200000, happinessBonus: 15, upkeepPerYear: 6000 },
  { id: 'city_condo', type: 'house', name: 'City Condo', cost: 350000, happinessBonus: 18, upkeepPerYear: 9000 },
  { id: 'luxury_mansion', type: 'house', name: 'Luxury Mansion', cost: 1200000, happinessBonus: 30, upkeepPerYear: 30000 },

  { id: 'pet_dog', type: 'item', name: 'Dog', cost: 20, happinessBonus: 8, upkeepPerYear: 200 },
  { id: 'pet_fish', type: 'item', name: 'Fish', cost: 5, happinessBonus: 3, upkeepPerYear: 20 },
  { id: 'gaming_setup', type: 'item', name: 'Gaming Setup', cost: 1500, happinessBonus: 6, upkeepPerYear: 0 },
];

export function getAssetCatalogEntryById(id: string): AssetCatalogEntry | undefined {
  return ASSET_CATALOG.find((a) => a.id === id);
}
