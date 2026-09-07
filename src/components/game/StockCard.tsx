'use client';

import { useState } from 'react';
import type { StockDefinition } from '@/lib/market/types';
import type { StockHolding } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const CATEGORY_CLASSES: Record<StockDefinition['category'], string> = {
  stock: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  crypto: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export function StockCard({
  definition,
  price,
  history,
  holding,
  money,
  onBuy,
  onSell,
}: {
  definition: StockDefinition;
  price: number;
  history: number[];
  holding?: StockHolding;
  money: number;
  onBuy: (symbol: string, shares: number) => void;
  onSell: (symbol: string, shares: number) => void;
}) {
  const [quantity, setQuantity] = useState(1);

  const sparkline = history.slice(-8).join(' → ');
  const shares = Math.max(1, Math.floor(quantity) || 1);
  const buyCost = price * shares;
  const canBuy = buyCost <= money;
  const owned = holding?.shares ?? 0;
  const canSell = owned >= shares;

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-ink">{definition.symbol}</p>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${CATEGORY_CLASSES[definition.category]}`}
          >
            {definition.category}
          </span>
        </div>
        <p className="text-sm font-semibold text-ink">${price.toLocaleString()}</p>
      </div>
      <p className="text-xs text-ink-muted">{definition.name}</p>
      <p className="text-xs text-ink-muted font-mono">{sparkline}</p>
      {owned > 0 && holding && (
        <p className="text-xs text-ink-muted">
          You own {owned} share(s) at avg ${holding.avgCost.toFixed(2)}.
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border border-border bg-surface px-2 py-1 text-sm text-ink"
        />
        <Button onClick={() => onBuy(definition.symbol, shares)} disabled={!canBuy}>
          Buy
        </Button>
        <Button variant="secondary" onClick={() => onSell(definition.symbol, shares)} disabled={!canSell}>
          Sell
        </Button>
      </div>
    </Card>
  );
}
