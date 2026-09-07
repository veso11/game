'use client';

import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { CRIME_CATALOG } from '@/lib/data/crimes';
import { MARKET_CATALOG } from '@/lib/market/catalog';
import { initMarket, currentPrice, portfolioValue } from '@/lib/market/engine';
import { CrimeCard } from '@/components/game/CrimeCard';
import { StockCard } from '@/components/game/StockCard';
import { BlackjackTable } from '@/components/blackjack/BlackjackTable';
import { Card } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { Character } from '@/lib/types';

const CASINO_MIN_AGE = 18;
const INVESTING_MIN_AGE = 18;

type ActivityTab = 'crime' | 'casino' | 'investing';

function CrimeSection({ character }: { character: Character }) {
  const commitCrime = useGameStore((state) => state.commitCrime);

  if (character.criminalRecord.inJail) {
    return (
      <Card className="space-y-2">
        <p className="font-semibold text-ink">Behind Bars</p>
        <p className="text-sm text-ink-muted">
          You&apos;re serving time and can&apos;t do much else right now.
        </p>
        <p className="text-xs text-ink-muted">
          Convictions: {character.criminalRecord.convictions} · Years left: {character.criminalRecord.yearsLeft}
        </p>
      </Card>
    );
  }

  const availableCrimes = CRIME_CATALOG.filter((crime) => character.age >= crime.minAge);

  return (
    <>
      <p className="text-sm text-ink-muted">
        Crime pays until it doesn&apos;t. Higher rewards mean higher risk of getting caught.
      </p>
      {availableCrimes.map((crime) => (
        <CrimeCard key={crime.id} crime={crime} character={character} onAttempt={commitCrime} />
      ))}
      {availableCrimes.length === 0 && (
        <p className="text-sm text-ink-muted">Nothing available at your age yet.</p>
      )}
    </>
  );
}

function CasinoSection({ character }: { character: Character }) {
  const applyCasinoResult = useGameStore((state) => state.applyCasinoResult);
  return <BlackjackTable money={character.money} onSettle={applyCasinoResult} />;
}

function InvestingSection({ character }: { character: Character }) {
  const buyStock = useGameStore((state) => state.buyStock);
  const sellStock = useGameStore((state) => state.sellStock);

  const market = character.market ?? initMarket();
  const portfolio = character.portfolio ?? [];
  const holdingsValue = portfolioValue(character);
  const netWorth = character.money + holdingsValue;

  return (
    <>
      <Card className="space-y-1">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Portfolio</p>
        <p className="text-sm text-ink">Cash: ${character.money.toLocaleString()}</p>
        <p className="text-sm text-ink">Holdings value: ${holdingsValue.toLocaleString()}</p>
        <p className="text-sm font-semibold text-ink">Net worth: ${netWorth.toLocaleString()}</p>
        {portfolio.length > 0 && (
          <div className="pt-2 space-y-1">
            {portfolio.map((holding) => {
              const price = currentPrice(market, holding.symbol);
              const pl = (price - holding.avgCost) * holding.shares;
              return (
                <p key={holding.symbol} className="text-xs text-ink-muted">
                  {holding.symbol}: {holding.shares} sh @ avg ${holding.avgCost.toFixed(2)} —{' '}
                  <span className={pl >= 0 ? 'text-accent' : 'text-danger'}>
                    {pl >= 0 ? '+' : ''}${pl.toFixed(2)}
                  </span>
                </p>
              );
            })}
          </div>
        )}
      </Card>

      {MARKET_CATALOG.map((definition) => (
        <StockCard
          key={definition.symbol}
          definition={definition}
          price={currentPrice(market, definition.symbol)}
          history={market.prices[definition.symbol] ?? [definition.startingPrice]}
          holding={portfolio.find((h) => h.symbol === definition.symbol)}
          money={character.money}
          onBuy={buyStock}
          onSell={sellStock}
        />
      ))}
    </>
  );
}

export default function ActivitiesPage() {
  const activeId = useGameStore((state) => state.activeId);
  const saves = useGameStore((state) => state.saves);

  const character = activeId ? saves[activeId]?.character : undefined;

  const unlocked: { id: ActivityTab; label: string }[] = character
    ? [
        { id: 'crime' as const, label: 'Crime' },
        ...(character.age >= CASINO_MIN_AGE ? [{ id: 'casino' as const, label: 'Casino' }] : []),
        ...(character.age >= INVESTING_MIN_AGE ? [{ id: 'investing' as const, label: 'Investing' }] : []),
      ]
    : [];

  const [tab, setTab] = useState<ActivityTab>('crime');

  if (!character) return null;

  const activeTab = unlocked.some((o) => o.id === tab) ? tab : unlocked[0]?.id;

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
      {unlocked.length > 1 && <SegmentedControl options={unlocked} value={activeTab ?? 'crime'} onChange={setTab} />}
      {activeTab === 'crime' && <CrimeSection character={character} />}
      {activeTab === 'casino' && <CasinoSection character={character} />}
      {activeTab === 'investing' && <InvestingSection character={character} />}
    </div>
  );
}
