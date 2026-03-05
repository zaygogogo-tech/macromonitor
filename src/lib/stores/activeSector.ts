import { writable } from 'svelte/store';

export interface ActiveSectorState {
  sector: string | null;
  symbol: string | null;
  drillTarget: string | null; // Phase 3: For auto-drill
  timestamp: number;
}

function createActiveSectorStore() {
  const { subscribe, set, update } = writable<ActiveSectorState>({
    sector: null,
    symbol: null,
    drillTarget: null,
    timestamp: 0,
  });

  return {
    subscribe,
    set,
    update,
    // Helper to activate a sector
    activate: (sector: string, symbol: string) => {
      set({
        sector,
        symbol,
        drillTarget: null,
        timestamp: Date.now(),
      });
    },
    // Phase 3: Activate with drill target for cross-module linkage
    activateWithDrill: (sector: string, symbol: string, drillTarget: string) => {
      set({
        sector,
        symbol,
        drillTarget,
        timestamp: Date.now(),
      });
    },
    // Helper to clear active sector
    clear: () => {
      set({
        sector: null,
        symbol: null,
        drillTarget: null,
        timestamp: 0,
      });
    },
  };
}

export const activeSector = createActiveSectorStore();
