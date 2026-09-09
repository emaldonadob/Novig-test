import {
  cancelOrder,
  collateral,
  emptyBook,
  midPrice,
  nextId,
  placeOrder,
  removeOrdersBy,
  type Book,
  type Fill,
  type Order,
  type Side,
} from '../engine/orderbook';
import { applyFill, emptyPosition, settle, type Position } from '../engine/positions';
import { seedMarkets, type Market } from '../data/markets';
import { clamp } from '../lib/format';

export const ME = 'me';
export const CROWD = 'crowd';
export const STORAGE_KEY = 'cancha.v1';
export const DEMO_BALANCE = 100_000; // MX$1,000.00 en centavos

export type TxKind = 'deposito' | 'retiro' | 'operacion' | 'liberacion' | 'liquidacion' | 'anulacion' | 'bono';

export interface Tx {
  id: string;
  at: number;
  kind: TxKind;
  amount: number; // centavos, con signo
  note: string;
  ref?: string;
}

export interface Profile {
  name: string;
  ageConfirmed: boolean;
  curp: string;
  verified: boolean;
  monthlyLimit: number; // centavos
  selfExcludedUntil: number | null;
}

export interface State {
  version: 1;
  seededAt: number;
  balance: number;
  books: Record<string, Book>;
  fairs: Record<string, number>;
  positions: Record<string, Position>;
  fills: Fill[];
  txs: Tx[];
  resolved: Record<string, string | null>;
  profile: Profile;
}

export type Action =
  | { type: 'DEPOSIT'; amount: number; method: string; ref: string }
  | { type: 'WITHDRAW'; amount: number; clabe: string }
  | { type: 'PLACE'; outcomeId: string; side: Side; price: number; qty: number }
  | { type: 'CANCEL'; orderId: string }
  | { type: 'PULSE'; outcomeId: string; fair: number }
  | { type: 'RESOLVE'; marketId: string; winnerOutcomeId: string | null }
  | { type: 'PROFILE'; patch: Partial<Profile> }
  | { type: 'RESET' };

// ── Liquidez simulada ("la afición") ───────────────────────────────────────

const LADDER: [offset: number, qty: number][] = [
  [1, 25],
  [2, 40],
  [4, 60],
  [7, 90],
  [12, 150],
];

function crowdOrders(outcomeId: string, fair: number, now: number): Order[] {
  const out: Order[] = [];
  let n = 0;
  for (const [off, qty] of LADDER) {
    const siPrice = clamp(fair - off, 1, 98);
    const noPrice = clamp(100 - fair - off, 1, 98);
    out.push({ id: nextId('crowd'), outcomeId, owner: CROWD, side: 'si', price: siPrice, qty, createdAt: now + n++ });
    out.push({ id: nextId('crowd'), outcomeId, owner: CROWD, side: 'no', price: noPrice, qty, createdAt: now + n++ });
  }
  return out;
}

/** Retira las órdenes de la afición y vuelve a sembrarlas alrededor de `fair`, cruzando con órdenes del usuario si aplica. */
export function reseedCrowd(book: Book, outcomeId: string, fair: number, now: number): { book: Book; fills: Fill[] } {
  let { book: b } = removeOrdersBy(book, (o) => o.owner === CROWD);
  const fills: Fill[] = [];
  for (const o of crowdOrders(outcomeId, fair, now)) {
    const r = placeOrder(b, o, now);
    b = r.book;
    fills.push(...r.fills);
  }
  return { book: b, fills };
}

// ── Estado inicial ─────────────────────────────────────────────────────────

export function initialState(now = Date.now()): State {
  const markets = seedMarkets(now);
  const books: Record<string, Book> = {};
  const fairs: Record<string, number> = {};
  for (const m of markets) {
    for (const o of m.outcomes) {
      fairs[o.id] = o.fair;
      books[o.id] = reseedCrowd(emptyBook(), o.id, o.fair, now).book;
    }
  }
  return {
    version: 1,
    seededAt: now,
    balance: DEMO_BALANCE,
    books,
    fairs,
    positions: {},
    fills: [],
    txs: [
      {
        id: nextId('tx'),
        at: now,
        kind: 'bono',
        amount: DEMO_BALANCE,
        note: 'Saldo de demostración',
      },
    ],
    resolved: {},
    profile: {
      name: 'Invitado',
      ageConfirmed: false,
      curp: '',
      verified: false,
      monthlyLimit: 500_000,
      selfExcludedUntil: null,
    },
  };
}

export function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && parsed.version === 1 && parsed.books && parsed.profile) return parsed;
    }
  } catch {
    /* ignore */
  }
  return initialState();
}

export function saveState(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

// ── Reducer ────────────────────────────────────────────────────────────────

function tx(kind: TxKind, amount: number, note: string, ref?: string, at = Date.now()): Tx {
  return { id: nextId('tx'), at, kind, amount, note, ref };
}

/** Aplica al estado las ejecuciones que involucran al usuario. */
function absorbFills(
  s: State,
  fills: Fill[],
  taker: { orderId: string; limit: number } | null,
  now: number,
): State {
  let balance = s.balance;
  const positions = { ...s.positions };
  const txs = [...s.txs];
  const mine: Fill[] = [];
  for (const f of fills) {
    const iAmSi = f.siOwner === ME;
    const iAmNo = f.noOwner === ME;
    if (!iAmSi && !iAmNo) continue;
    mine.push(f);
    const myPrice = iAmSi ? f.siPrice : 100 - f.siPrice;
    const paid = myPrice * f.qty;
    if (taker && f.takerOrderId === taker.orderId) {
      // Reservamos al precio límite; devolvemos la mejora de precio
      balance += (taker.limit - myPrice) * f.qty;
    }
    const pos = positions[f.outcomeId] ?? emptyPosition(f.outcomeId);
    const r = applyFill(pos, f, ME);
    positions[f.outcomeId] = r.position;
    txs.push(tx('operacion', -paid, `${f.qty} × ${iAmSi ? 'Sí' : 'No'} a ${myPrice}¢`, f.outcomeId, now));
    if (r.released > 0) {
      balance += r.released;
      txs.push(tx('liberacion', r.released, `Se netearon ${r.released / 100} pares Sí/No`, f.outcomeId, now));
    }
  }
  return { ...s, balance, positions, txs, fills: [...s.fills, ...mine] };
}

export function reducer(s: State, a: Action): State {
  const now = Date.now();
  switch (a.type) {
    case 'DEPOSIT': {
      if (a.amount <= 0) return s;
      return {
        ...s,
        balance: s.balance + a.amount,
        txs: [...s.txs, tx('deposito', a.amount, `Depósito vía ${a.method}`, a.ref, now)],
      };
    }
    case 'WITHDRAW': {
      if (a.amount <= 0 || a.amount > s.balance) return s;
      return {
        ...s,
        balance: s.balance - a.amount,
        txs: [...s.txs, tx('retiro', -a.amount, `Retiro SPEI a CLABE ···${a.clabe.slice(-4)}`, undefined, now)],
      };
    }
    case 'PLACE': {
      const book = s.books[a.outcomeId] ?? emptyBook();
      const order: Order = {
        id: nextId('ord'),
        outcomeId: a.outcomeId,
        owner: ME,
        side: a.side,
        price: a.price,
        qty: a.qty,
        createdAt: now,
      };
      const need = collateral(order);
      if (need > s.balance) return s;
      const r = placeOrder(book, order, now);
      const next = absorbFills({ ...s, balance: s.balance - need }, r.fills, { orderId: order.id, limit: a.price }, now);
      return { ...next, books: { ...next.books, [a.outcomeId]: r.book } };
    }
    case 'CANCEL': {
      for (const [outcomeId, book] of Object.entries(s.books)) {
        const r = cancelOrder(book, a.orderId);
        if (r.cancelled && r.cancelled.owner === ME) {
          return {
            ...s,
            balance: s.balance + collateral(r.cancelled),
            books: { ...s.books, [outcomeId]: r.book },
          };
        }
      }
      return s;
    }
    case 'PULSE': {
      const book = s.books[a.outcomeId];
      if (!book) return s;
      const r = reseedCrowd(book, a.outcomeId, a.fair, now);
      const next = absorbFills(s, r.fills, null, now);
      return { ...next, fairs: { ...s.fairs, [a.outcomeId]: a.fair }, books: { ...next.books, [a.outcomeId]: r.book } };
    }
    case 'RESOLVE': {
      if (a.marketId in s.resolved) return s;
      const markets = seedMarkets(s.seededAt);
      const market = markets.find((m) => m.id === a.marketId);
      if (!market) return s;
      let balance = s.balance;
      const books = { ...s.books };
      const positions = { ...s.positions };
      const txs = [...s.txs];
      for (const o of market.outcomes) {
        // Cancela órdenes del usuario y devuelve colateral
        const r = removeOrdersBy(books[o.id] ?? emptyBook(), () => true);
        for (const ord of r.removed) if (ord.owner === ME) balance += collateral(ord);
        books[o.id] = r.book;
        const pos = positions[o.id];
        if (!pos) continue;
        if (a.winnerOutcomeId === null) {
          const refund = pos.siCost + pos.noCost;
          balance += refund;
          if (refund) txs.push(tx('anulacion', refund, `Mercado anulado: ${market.title}`, o.id, now));
        } else {
          const won = o.id === a.winnerOutcomeId;
          const pay = settle(pos, won);
          balance += pay;
          if (pos.si || pos.no) {
            txs.push(
              tx(
                'liquidacion',
                pay,
                `${market.title} · ${o.label}: ${won ? 'ganó' : 'no ganó'}`,
                o.id,
                now,
              ),
            );
          }
        }
        delete positions[o.id];
      }
      return { ...s, balance, books, positions, txs, resolved: { ...s.resolved, [a.marketId]: a.winnerOutcomeId } };
    }
    case 'PROFILE':
      return { ...s, profile: { ...s.profile, ...a.patch } };
    case 'RESET':
      return initialState();
    default:
      return s;
  }
}

// ── Selectores ─────────────────────────────────────────────────────────────

export function myOrders(s: State): Order[] {
  const out: Order[] = [];
  for (const b of Object.values(s.books)) {
    for (const o of [...b.si, ...b.no]) if (o.owner === ME) out.push(o);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export function reserved(s: State): number {
  return myOrders(s).reduce((sum, o) => sum + collateral(o), 0);
}

export function marketsOf(s: State): Market[] {
  return seedMarkets(s.seededAt);
}

export function outcomeMid(s: State, outcomeId: string): number | undefined {
  const b = s.books[outcomeId];
  return b ? midPrice(b) : undefined;
}

/** Suma del valor de mercado de todas las posiciones abiertas. */
export function portfolioValue(s: State): number {
  let v = 0;
  for (const p of Object.values(s.positions)) {
    const mid = outcomeMid(s, p.outcomeId) ?? 50;
    v += p.si * mid + p.no * (100 - mid);
  }
  return v;
}

/** Validación de CURP (formato oficial de 18 caracteres). */
export function isValidCurp(curp: string): boolean {
  return /^[A-Z][AEIOUX][A-Z]{2}\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[A-Z\d]\d$/.test(
    curp.trim().toUpperCase(),
  );
}
