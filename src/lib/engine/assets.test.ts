import { describe, it, expect } from 'vitest';
import { buyAsset, sellAsset, applyAssetEffect, applyAssetYearlyTick } from './assets';
import { baseCharacter } from '@/lib/testUtils';
import type { AssetItem } from '@/lib/types';

function asset(overrides: Partial<AssetItem> = {}): AssetItem {
  return { id: 'a1', catalogId: 'pet_dog', type: 'item', name: 'Dog', value: 20, happinessBonus: 8, ...overrides };
}

describe('buyAsset', () => {
  it('deducts cost, adds the asset, and bumps happiness once', () => {
    const char = baseCharacter({ money: 100, happiness: 50, assets: [] });
    const { character: next, success } = buyAsset(char, 'pet_dog');
    expect(success).toBe(true);
    expect(next.money).toBe(80);
    expect(next.happiness).toBe(58);
    expect(next.assets).toHaveLength(1);
    expect(next.assets[0]).toMatchObject({ catalogId: 'pet_dog', name: 'Dog', value: 20 });
  });

  it('rejects the purchase when unaffordable', () => {
    const char = baseCharacter({ money: 1, assets: [], history: [] });
    const { character: next, success } = buyAsset(char, 'sports_car');
    expect(success).toBe(false);
    expect(next.assets).toHaveLength(0);
    expect(next.money).toBe(1);
    expect(next.history.at(-1)?.text).toContain("can't afford");
  });

  it('returns the character unchanged for an unknown catalog id', () => {
    const char = baseCharacter({ assets: [] });
    const { character: next, success } = buyAsset(char, 'nonexistent');
    expect(success).toBe(false);
    expect(next).toBe(char);
  });
});

describe('sellAsset', () => {
  it('removes the asset and pays 70% of its value', () => {
    const char = baseCharacter({ money: 0, assets: [asset({ value: 100 })] });
    const next = sellAsset(char, 'a1');
    expect(next.assets).toHaveLength(0);
    expect(next.money).toBe(70);
  });

  it('is a no-op for an unknown asset id', () => {
    const char = baseCharacter({ assets: [] });
    expect(sellAsset(char, 'missing')).toBe(char);
  });
});

describe('applyAssetEffect', () => {
  it('buy adds an asset without touching money or happiness', () => {
    const char = baseCharacter({ money: 100, happiness: 50, assets: [] });
    const next = applyAssetEffect(char, { type: 'buy', catalogId: 'pet_fish' });
    expect(next.assets).toHaveLength(1);
    expect(next.assets[0].catalogId).toBe('pet_fish');
    expect(next.money).toBe(100);
    expect(next.happiness).toBe(50);
  });

  it('buy is a no-op for an unknown catalog id', () => {
    const char = baseCharacter({ assets: [] });
    expect(applyAssetEffect(char, { type: 'buy', catalogId: 'nonexistent' })).toBe(char);
  });

  it('sell removes the asset without paying out', () => {
    const char = baseCharacter({ money: 0, assets: [asset()] });
    const next = applyAssetEffect(char, { type: 'sell', assetId: 'a1' });
    expect(next.assets).toHaveLength(0);
    expect(next.money).toBe(0);
  });
});

describe('applyAssetYearlyTick', () => {
  it('is a no-op with no assets', () => {
    const char = baseCharacter({ assets: [] });
    expect(applyAssetYearlyTick(char)).toBe(char);
  });

  it('deducts total upkeep across all owned assets, silently', () => {
    const char = baseCharacter({
      money: 1000,
      assets: [asset({ id: 'a1', catalogId: 'pet_dog' }), asset({ id: 'a2', catalogId: 'used_sedan' })],
      history: [],
    });
    const next = applyAssetYearlyTick(char);
    // pet_dog upkeep 200 + used_sedan upkeep 400 = 600
    expect(next.money).toBe(400);
    expect(next.history).toHaveLength(0);
  });

  it('is a no-op when every owned asset has zero upkeep', () => {
    const char = baseCharacter({ money: 500, assets: [asset({ catalogId: 'gaming_setup' })] });
    expect(applyAssetYearlyTick(char)).toBe(char);
  });
});
