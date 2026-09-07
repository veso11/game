'use client';

import { useGameStore } from '@/lib/store';
import { ASSET_CATALOG } from '@/lib/data/assetCatalog';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function AssetsPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);
  const buyAsset = useGameStore((state) => state.buyAsset);
  const sellAsset = useGameStore((state) => state.sellAsset);

  const character = activeId ? saves[activeId]?.character : undefined;
  if (!character) return null;

  const ownedCatalogIds = new Set(character.assets.map((a) => a.catalogId));
  const shopEntries = ASSET_CATALOG.filter((entry) => !ownedCatalogIds.has(entry.id));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
          Your Assets
        </h2>
        {character.assets.length === 0 && (
          <p className="text-sm text-ink-muted">You don&apos;t own anything yet.</p>
        )}
        {character.assets.map((asset) => (
          <Card key={asset.id} className="flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink">{asset.name}</p>
              <p className="text-xs text-ink-muted">Worth ${asset.value.toLocaleString()}</p>
            </div>
            <Button variant="danger" onClick={() => sellAsset(asset.id)}>
              Sell
            </Button>
          </Card>
        ))}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">Shop</h2>
        {shopEntries.map((entry) => {
          const affordable = character.money >= entry.cost;
          return (
            <Card key={entry.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{entry.name}</p>
                <p className="text-xs text-ink-muted">
                  ${entry.cost.toLocaleString()} · ${entry.upkeepPerYear.toLocaleString()}/yr upkeep
                </p>
              </div>
              <Button variant="secondary" onClick={() => buyAsset(entry.id)} disabled={!affordable}>
                Buy
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
