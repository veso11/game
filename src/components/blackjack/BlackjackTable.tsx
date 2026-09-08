'use client';

import { useEffect, useReducer, useRef, useState } from 'react';
import { createShoe, shuffle, dealInitial, hit, stand, settle, handValue } from '@/lib/blackjack/engine';
import type { Card as CardType, GameState } from '@/lib/blackjack/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AmountSlider } from '@/components/ui/AmountSlider';

const INITIAL_STATE: GameState = { deck: [], playerHand: [], dealerHand: [], phase: 'betting', bet: 0 };

type Action = { type: 'deal'; bet: number } | { type: 'hit' } | { type: 'stand' } | { type: 'reset' };

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'deal':
      return dealInitial(shuffle(createShoe(1)), action.bet);
    case 'hit':
      return hit(state);
    case 'stand':
      return stand(state);
    case 'reset':
      return INITIAL_STATE;
    default:
      return state;
  }
}

const SUIT_SYMBOL: Record<CardType['suit'], string> = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };

function cardLabel(card: CardType): string {
  return `${card.rank}${SUIT_SYMBOL[card.suit]}`;
}

const OUTCOME_LABEL: Record<NonNullable<GameState['outcome']>, string> = {
  blackjack: 'Blackjack! You win big.',
  win: 'You win!',
  push: 'Push — bet returned.',
  lose: 'You lose.',
};

export function BlackjackTable({ money, onSettle }: { money: number; onSettle: (payout: number) => void }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const [betInput, setBetInput] = useState(10);
  const settledRef = useRef(false);

  useEffect(() => {
    if (state.phase === 'settled' && !settledRef.current) {
      settledRef.current = true;
      const { payout } = settle(state);
      onSettle(payout);
    }
  }, [state, onSettle]);

  const maxBet = Math.floor(money);
  const canPlay = maxBet >= 1;
  const inRound = state.phase === 'playerTurn' || state.phase === 'dealerTurn';
  const inBettingPhase = state.phase === 'betting' || state.phase === 'settled';

  function handleDeal() {
    settledRef.current = false;
    dispatch({ type: 'deal', bet: Math.max(1, Math.min(betInput, maxBet)) });
  }

  return (
    <div className="space-y-4">
      <Card className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Dealer</p>
        <p className="text-lg text-ink">
          {state.dealerHand.length > 0 ? state.dealerHand.map(cardLabel).join(' ') : '—'}
          {state.phase === 'settled' && state.dealerHand.length > 0 && ` (${handValue(state.dealerHand)})`}
        </p>
      </Card>

      <Card className="space-y-2">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">You</p>
        <p className="text-lg text-ink">
          {state.playerHand.length > 0 ? state.playerHand.map(cardLabel).join(' ') : '—'}
          {state.playerHand.length > 0 && ` (${handValue(state.playerHand)})`}
        </p>
      </Card>

      {state.phase === 'settled' && state.outcome && (
        <p className="text-center font-semibold text-ink">{OUTCOME_LABEL[state.outcome]}</p>
      )}

      {inBettingPhase ? (
        <div className="space-y-3">
          <AmountSlider label="Bet" value={betInput} max={maxBet} onChange={setBetInput} />
          <Button className="w-full" onClick={handleDeal} disabled={!canPlay}>
            Deal
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => dispatch({ type: 'hit' })} disabled={!inRound}>
            Hit
          </Button>
          <Button variant="secondary" onClick={() => dispatch({ type: 'stand' })} disabled={!inRound}>
            Stand
          </Button>
        </div>
      )}

      {!canPlay && <p className="text-sm text-ink-muted">You need at least $1 to play.</p>}
    </div>
  );
}
