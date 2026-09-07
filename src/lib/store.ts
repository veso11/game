import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Character, GameSave, HistoryEntry } from '@/lib/types';
import { ageUp as runAgeUp } from '@/lib/engine/ageUp';
import { resolveEvent as runResolveEvent } from '@/lib/engine/events';
import {
  applyForJob as runApplyForJob,
  quitJob as runQuitJob,
  requestRaise as runRequestRaise,
} from '@/lib/engine/career';
import {
  addPerson as runAddPerson,
  interact as runInteract,
  propose as runPropose,
  breakUp as runBreakUp,
  createInitialFamily,
} from '@/lib/engine/relationships';
import { enroll as runEnroll, dropOut as runDropOut, study as runStudy } from '@/lib/engine/education';
import { buyAsset as runBuyAsset, sellAsset as runSellAsset } from '@/lib/engine/assets';
import { commitCrime as runCommitCrime } from '@/lib/engine/crime';
import { buy as runBuyStock, sell as runSellStock, initMarket } from '@/lib/market/engine';
import { getEventById } from '@/lib/data/events';
import { randomName, randomCountry } from '@/lib/data/names';

function newCharacter(opts: { name?: string; country?: string }): Character {
  const name = opts.name?.trim() || randomName();
  const country = opts.country || randomCountry();
  return {
    id: nanoid(),
    name,
    country,
    city: '',
    age: 0,
    alive: true,
    health: 90,
    happiness: 80,
    smarts: 50,
    looks: 50,
    talent: 50,
    money: 0,
    relationships: createInitialFamily(),
    job: null,
    education: { level: 'none', enrolled: false, dropoutFlag: false },
    assets: [],
    achievements: [],
    criminalRecord: { inJail: false, yearsLeft: 0, convictions: 0 },
    firedEventIds: [],
    portfolio: [],
    market: initMarket(),
    history: [{ id: nanoid(), age: 0, text: `${name} was born in ${country}.` }],
    pendingEventId: null,
    eventQueue: [],
  };
}

interface GameState {
  saves: Record<string, GameSave>;
  activeId: string | null;
  hasHydrated: boolean;
  createLife: (opts: { name?: string; country?: string }) => string;
  loadLife: (id: string) => void;
  deleteLife: (id: string) => void;
  ageUp: () => void;
  resolveEvent: (choiceIndex: number) => void;
  pushHistory: (text: string) => void;
  updateCharacter: (updater: (character: Character) => Character) => void;
  setHasHydrated: (hydrated: boolean) => void;
  applyForJob: (listingId: string) => void;
  quitJob: () => void;
  requestRaise: () => void;
  addFriend: () => void;
  interactWithPerson: (personId: string, kind: 'talk' | 'gift' | 'date') => void;
  proposeToPartner: (personId: string) => void;
  breakUpWith: (personId: string) => void;
  enrollInSchool: (level: 'university' | 'gradschool', major?: string) => void;
  dropOutOfSchool: () => void;
  studyHard: () => void;
  buyAsset: (catalogId: string) => void;
  sellAsset: (assetId: string) => void;
  applyCasinoResult: (moneyDelta: number) => void;
  commitCrime: (crimeId: string) => void;
  buyStock: (symbol: string, shares: number) => void;
  sellStock: (symbol: string, shares: number) => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      saves: {},
      activeId: null,
      hasHydrated: false,

      createLife: (opts) => {
        const character = newCharacter(opts);
        set((state) => ({
          saves: { ...state.saves, [character.id]: { character, lastPlayed: Date.now() } },
          activeId: character.id,
        }));
        return character.id;
      },

      loadLife: (id) => {
        if (get().saves[id]) set({ activeId: id });
      },

      deleteLife: (id) => {
        set((state) => {
          const nextSaves = { ...state.saves };
          delete nextSaves[id];
          return {
            saves: nextSaves,
            activeId: state.activeId === id ? null : state.activeId,
          };
        });
      },

      ageUp: () => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId) return;
        const nextCharacter = runAgeUp(current);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      resolveEvent: (choiceIndex: number) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.pendingEventId) return;
        const event = getEventById(current.pendingEventId);
        if (!event) return;
        const nextCharacter = runResolveEvent(current, event, choiceIndex);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      applyForJob: (listingId: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const { character: nextCharacter } = runApplyForJob(current, listingId);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      quitJob: () => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId) return;
        const nextCharacter = runQuitJob(current);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      requestRaise: () => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const nextCharacter = runRequestRaise(current);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      addFriend: () => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId) return;
        const nextCharacter = runAddPerson(current, 'friend');
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      interactWithPerson: (personId: string, kind: 'talk' | 'gift' | 'date') => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const nextCharacter = runInteract(current, personId, kind);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      proposeToPartner: (personId: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const { character: nextCharacter } = runPropose(current, personId);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      breakUpWith: (personId: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const nextCharacter = runBreakUp(current, personId);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      enrollInSchool: (level: 'university' | 'gradschool', major?: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const nextCharacter = runEnroll(current, level, major);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      dropOutOfSchool: () => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId) return;
        const nextCharacter = runDropOut(current);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      studyHard: () => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const nextCharacter = runStudy(current);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      buyAsset: (catalogId: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const { character: nextCharacter } = runBuyAsset(current, catalogId);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      sellAsset: (assetId: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId) return;
        const nextCharacter = runSellAsset(current, assetId);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      applyCasinoResult: (moneyDelta: number) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const text =
          moneyDelta > 0
            ? `You won $${moneyDelta.toLocaleString()} at blackjack.`
            : moneyDelta < 0
              ? `You lost $${Math.abs(moneyDelta).toLocaleString()} at blackjack.`
              : 'You broke even at blackjack.';
        const entry: HistoryEntry = { id: nanoid(), age: current.age, text };
        const nextCharacter: Character = {
          ...current,
          money: current.money + moneyDelta,
          history: [...current.history, entry],
        };
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      commitCrime: (crimeId: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const nextCharacter = runCommitCrime(current, crimeId);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      buyStock: (symbol: string, shares: number) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const { character: nextCharacter } = runBuyStock(current, symbol, shares);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      sellStock: (symbol: string, shares: number) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        if (!current.alive || current.pendingEventId || current.criminalRecord.inJail) return;
        const { character: nextCharacter } = runSellStock(current, symbol, shares);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      pushHistory: (text: string) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        const entry: HistoryEntry = { id: nanoid(), age: current.age, text };
        const nextCharacter: Character = { ...current, history: [...current.history, entry] };
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      updateCharacter: (updater) => {
        const { activeId, saves } = get();
        if (!activeId || !saves[activeId]) return;
        const current = saves[activeId].character;
        const nextCharacter = updater(current);
        set((state) => ({
          saves: {
            ...state.saves,
            [activeId]: { character: nextCharacter, lastPlayed: Date.now() },
          },
        }));
      },

      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'lifeline-save-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ saves: state.saves, activeId: state.activeId }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
