import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { loadState, marketsOf, reducer, saveState, type Action, type State } from './exchange';
import type { Market } from '../data/markets';
import { clamp } from '../lib/format';

interface Ctx {
  state: State;
  dispatch: (a: Action) => void;
  markets: Market[];
}

const ExchangeContext = createContext<Ctx | null>(null);

export function ExchangeProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const markets = useMemo(() => marketsOf(state), [state.seededAt]);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // "Pulso" del mercado: la afición mueve sus órdenes cada pocos segundos.
  useEffect(() => {
    const seedFair = new Map<string, number>();
    for (const m of markets) for (const o of m.outcomes) seedFair.set(o.id, o.fair);
    const ids = [...seedFair.keys()];
    const t = setInterval(() => {
      const id = ids[Math.floor(Math.random() * ids.length)];
      const current = state.fairs[id] ?? seedFair.get(id) ?? 50;
      const base = seedFair.get(id) ?? 50;
      const drift = Math.round((base - current) * 0.2);
      const jitter = Math.round((Math.random() - 0.5) * 4);
      const fair = clamp(current + drift + jitter, 3, 97);
      if (fair !== current) dispatch({ type: 'PULSE', outcomeId: id, fair });
    }, 5000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markets, state.fairs]);

  const value = useMemo(() => ({ state, dispatch, markets }), [state, markets]);
  return <ExchangeContext.Provider value={value}>{children}</ExchangeContext.Provider>;
}

export function useExchange(): Ctx {
  const ctx = useContext(ExchangeContext);
  if (!ctx) throw new Error('useExchange debe usarse dentro de ExchangeProvider');
  return ctx;
}
