'use client';

import { useState } from 'react';
import type { StockDefinition } from '@/lib/market/types';
import type { StockHolding } from '@/lib/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AmountSlider } from '@/components/ui/AmountSlider';

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
  const [buyAmount, setBuyAmount] = useState(1);
  const [sellAmount, setSellAmount] = useState(1);

  const sparkline = history.slice(-8).join(' → ');
  const owned = holding?.shares ?? 0;
  const positionValue = Math.floor(owned * price);

  const canAffordOne = money >= price;
  const buyShares = Math.max(1, Math.floor(buyAmount / price));
  const canBuy = canAffordOne && buyShares >= 1;

  const canSellAny = owned > 0;
  const sellShares = Math.min(owned, Math.max(1, Math.floor(sellAmount / price)));
  const canSell = canSellAny && sellShares >= 1;

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

      <div className="space-y-2 pt-1">
        <AmountSlider label={`Buy (${buyShares} sh)`} value={buyAmount} max={money} onChange={setBuyAmount} />
        <Button className="w-full" onClick={() => onBuy(definition.symbol, buyShares)} disabled={!canBuy}>
          Buy
        </Button>
      </div>

      {canSellAny && (
        <div className="space-y-2 pt-1">
          <AmountSlider
            label={`Sell (${sellShares} sh)`}
            value={sellAmount}
            max={positionValue}
            onChange={setSellAmount}
          />
          <Button className="w-full" variant="secondary" onClick={() => onSell(definition.symbol, sellShares)} disabled={!canSell}>
            Sell
          </Button>
        </div>
      )}
    </Card>
  );
}
