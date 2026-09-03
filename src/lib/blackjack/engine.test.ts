import { describe, it, expect } from 'vitest';
import { handValue, isBlackjack, isBust, dealInitial, hit, stand, settle } from './engine';
import type { Card, GameState } from './types';

function card(rank: Card['rank'], suit: Card['suit'] = 'spades'): Card {
  return { rank, suit };
}

describe('handValue', () => {
  it('sums number and face cards, treating face cards as 10', () => {
    expect(handValue([card('7'), card('K')])).toBe(17);
  });

  it('counts a single ace as 11 when it fits', () => {
    expect(handValue([card('A'), card('5')])).toBe(16);
  });

  it('drops an ace to 1 when 11 would bust the hand', () => {
    expect(handValue([card('A'), card('9'), card('5')])).toBe(15); // 11+9+5=25 -> ace as 1 -> 15
  });

  it('handles two aces correctly', () => {
    expect(handValue([card('A'), card('A')])).toBe(12); // 11+11=22 -> one ace drops to 1 -> 12
  });
});

describe('isBlackjack', () => {
  it('is true for an ace + ten-value card in a 2-card hand', () => {
    expect(isBlackjack([card('A'), card('K')])).toBe(true);
  });

  it('is false for 21 reached with more than 2 cards', () => {
    expect(isBlackjack([card('7'), card('7'), card('7')])).toBe(false);
  });

  it('is false for a non-21 two-card hand', () => {
    expect(isBlackjack([card('10'), card('9')])).toBe(false);
  });
});

describe('isBust', () => {
  it('is true above 21', () => {
    expect(isBust([card('K'), card('Q'), card('5')])).toBe(true);
  });

  it('is false at or below 21', () => {
    expect(isBust([card('K'), card('Q')])).toBe(false);
  });
});

describe('dealInitial', () => {
  it('deals two cards each from the front of the deck and starts the player turn', () => {
    const deck: Card[] = [card('7'), card('8'), card('2'), card('3'), card('9')];
    const state = dealInitial(deck, 10);
    expect(state.playerHand).toEqual([card('7'), card('8')]);
    expect(state.dealerHand).toEqual([card('2'), card('3')]);
    expect(state.phase).toBe('playerTurn');
    expect(state.deck).toEqual([card('9')]);
  });

  it('auto-resolves immediately on a natural player blackjack', () => {
    const deck: Card[] = [card('A'), card('K'), card('9'), card('9')];
    const state = dealInitial(deck, 10);
    expect(state.phase).toBe('settled');
    expect(state.outcome).toBe('blackjack');
  });

  it('pushes when both player and dealer have a natural blackjack', () => {
    const deck: Card[] = [card('A'), card('K'), card('A', 'hearts'), card('K', 'hearts')];
    const state = dealInitial(deck, 10);
    expect(state.phase).toBe('settled');
    expect(state.outcome).toBe('push');
  });
});

describe('hit', () => {
  it('adds a card and stays in playerTurn if not bust', () => {
    const deck: Card[] = [card('7'), card('8'), card('2'), card('3'), card('4')];
    let state = dealInitial(deck, 10);
    state = hit(state);
    expect(state.playerHand).toHaveLength(3);
    expect(state.phase).toBe('playerTurn');
  });

  it('busts and settles as a loss when going over 21', () => {
    const deck: Card[] = [card('K'), card('Q'), card('2'), card('3'), card('5')];
    let state = dealInitial(deck, 10);
    state = hit(state);
    expect(state.phase).toBe('settled');
    expect(state.outcome).toBe('lose');
  });

  it('is a no-op outside the player turn', () => {
    const settled: GameState = {
      deck: [card('5')],
      playerHand: [card('K'), card('Q')],
      dealerHand: [card('9'), card('9')],
      phase: 'settled',
      bet: 10,
      outcome: 'win',
    };
    expect(hit(settled)).toBe(settled);
  });
});

describe('stand', () => {
  it('dealer stands on 17, including a soft 17, without drawing', () => {
    const deck: Card[] = [card('9'), card('8'), card('A'), card('6'), card('5')];
    let state = dealInitial(deck, 10); // player 9+8=17, dealer A+6=17 (soft)
    state = stand(state);
    expect(state.dealerHand).toEqual([card('A'), card('6')]);
    expect(state.outcome).toBe('push'); // both 17
  });

  it('dealer draws until reaching 17 or higher', () => {
    const deck: Card[] = [card('10'), card('9'), card('2'), card('3'), card('9', 'hearts'), card('3', 'hearts')];
    let state = dealInitial(deck, 10); // player 10+9=19, dealer starts 2+3=5
    state = stand(state);
    // dealer draws 9 (->14) then 3 (->17) and stops
    expect(state.dealerHand).toEqual([card('2'), card('3'), card('9', 'hearts'), card('3', 'hearts')]);
    expect(state.outcome).toBe('win'); // player 19 beats dealer 17
  });

  it('is a no-op outside the player turn', () => {
    const settled: GameState = {
      deck: [],
      playerHand: [card('K'), card('Q')],
      dealerHand: [card('9'), card('9')],
      phase: 'settled',
      bet: 10,
      outcome: 'win',
    };
    expect(stand(settled)).toBe(settled);
  });
});

describe('settle', () => {
  function baseSettled(outcome: GameState['outcome'], bet = 10): GameState {
    return { deck: [], playerHand: [], dealerHand: [], phase: 'settled', bet, outcome };
  }

  it('blackjack pays 1.5x the bet', () => {
    expect(settle(baseSettled('blackjack', 10)).payout).toBe(15);
  });

  it('a regular win pays 1x the bet', () => {
    expect(settle(baseSettled('win', 10)).payout).toBe(10);
  });

  it('a push nets zero', () => {
    expect(settle(baseSettled('push', 10)).payout).toBe(0);
  });

  it('a loss forfeits the bet', () => {
    expect(settle(baseSettled('lose', 10)).payout).toBe(-10);
  });

  it('returns a zero payout for an unsettled hand', () => {
    const state: GameState = { deck: [], playerHand: [], dealerHand: [], phase: 'playerTurn', bet: 10 };
    expect(settle(state).payout).toBe(0);
  });
});
