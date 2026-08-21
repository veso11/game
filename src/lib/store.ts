import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import type { Character, GameSave, HistoryEntry } from '@/lib/types';
import { ageUp as runAgeUp } from '@/lib/engine/ageUp';
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
    money: 0,
    relationships: [],
    job: null,
    education: { level: 'none', enrolled: false, dropoutFlag: false },
    assets: [],
    achievements: [],
    criminalRecord: { inJail: false, yearsLeft: 0, convictions: 0 },
    firedEventIds: [],
    history: [{ id: nanoid(), age: 0, text: `${name} was born in ${country}.` }],
    pendingEventId: null,
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
  pushHistory: (text: string) => void;
  updateCharacter: (updater: (character: Character) => Character) => void;
  setHasHydrated: (hydrated: boolean) => void;
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
        if (!current.alive) return;
        const nextCharacter = runAgeUp(current);
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
      name: 'lifeline-save-v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ saves: state.saves, activeId: state.activeId }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
