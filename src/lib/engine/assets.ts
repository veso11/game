import { nanoid } from 'nanoid';
import type { AssetEffect, AssetItem, Character, HistoryEntry } from '@/lib/types';
import { getAssetCatalogEntryById } from '@/lib/data/assetCatalog';

const RESALE_RATE = 0.7;

function entry(character: Character, text: string): HistoryEntry {
  return { id: nanoid(), age: character.age, text };
}

function withHistory(character: Character, text: string): Character {
  return { ...character, history: [...character.history, entry(character, text)] };
}

export function buyAsset(character: Character, catalogId: string): { character: Character; success: boolean } {
  const catalogEntry = getAssetCatalogEntryById(catalogId);
  if (!catalogEntry) return { character, success: false };

  if (character.money < catalogEntry.cost) {
    return { character: withHistory(character, `You can't afford a ${catalogEntry.name} yet.`), success: false };
  }

  const asset: AssetItem = {
    id: nanoid(),
    catalogId: catalogEntry.id,
    type: catalogEntry.type,
    name: catalogEntry.name,
    value: catalogEntry.cost,
    happinessBonus: catalogEntry.happinessBonus,
  };
  const next: Character = {
    ...character,
    money: character.money - catalogEntry.cost,
    assets: [...character.assets, asset],
    happiness: Math.min(100, character.happiness + catalogEntry.happinessBonus),
  };
  return { character: withHistory(next, `You bought a ${catalogEntry.name}!`), success: true };
}

export function sellAsset(character: Character, assetId: string): Character {
  const asset = character.assets.find((a) => a.id === assetId);
  if (!asset) return character;

  const proceeds = Math.round(asset.value * RESALE_RATE);
  const next: Character = {
    ...character,
    money: character.money + proceeds,
    assets: character.assets.filter((a) => a.id !== assetId),
  };
  return withHistory(next, `You sold your ${asset.name} for $${proceeds.toLocaleString()}.`);
}

export function applyAssetEffect(character: Character, effect: AssetEffect): Character {
  switch (effect.type) {
    case 'buy': {
      const catalogEntry = getAssetCatalogEntryById(effect.catalogId);
      if (!catalogEntry) return character;
      const asset: AssetItem = {
        id: nanoid(),
        catalogId: catalogEntry.id,
        type: catalogEntry.type,
        name: catalogEntry.name,
        value: catalogEntry.cost,
        happinessBonus: catalogEntry.happinessBonus,
      };
      return { ...character, assets: [...character.assets, asset] };
    }
    case 'sell':
      return { ...character, assets: character.assets.filter((a) => a.id !== effect.assetId) };
    default:
      return character;
  }
}

/**
 * Deducts yearly upkeep for every owned asset. No bankruptcy/repossession
 * handling — money is allowed to go negative, same as everywhere else in
 * the engine. Routine upkeep is silent (no history entry).
 */
export function applyAssetYearlyTick(character: Character): Character {
  if (character.assets.length === 0) return character;

  const totalUpkeep = character.assets.reduce((sum, asset) => {
    const catalogEntry = getAssetCatalogEntryById(asset.catalogId);
    return sum + (catalogEntry?.upkeepPerYear ?? 0);
  }, 0);

  if (totalUpkeep === 0) return character;
  return { ...character, money: character.money - totalUpkeep };
}
