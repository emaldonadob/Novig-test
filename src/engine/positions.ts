import { PAYOUT, type Fill } from './orderbook';

/**
 * Posición del usuario en un resultado. Guardamos ambos lados por separado y
 * los "neteamos": tener 1 Sí + 1 No del mismo resultado siempre vale exactamente
 * 100¢, así que se liquidan de inmediato y se devuelve el efectivo.
 */
export interface Position {
  outcomeId: string;
  si: number;
  no: number;
  siCost: number; // centavos totales pagados por los Sí que aún se tienen
  noCost: number;
}

export function emptyPosition(outcomeId: string): Position {
  return { outcomeId, si: 0, no: 0, siCost: 0, noCost: 0 };
}

export interface ApplyResult {
  position: Position;
  /** Efectivo liberado por netear pares Sí+No (centavos). */
  released: number;
}

export function applyFill(pos: Position, fill: Fill, me: string): ApplyResult {
  let { si, no, siCost, noCost } = pos;
  if (fill.siOwner === me) {
    si += fill.qty;
    siCost += fill.siPrice * fill.qty;
  }
  if (fill.noOwner === me) {
    no += fill.qty;
    noCost += (PAYOUT - fill.siPrice) * fill.qty;
  }
  // Netear
  const pairs = Math.min(si, no);
  let released = 0;
  if (pairs > 0) {
    const avgSi = siCost / si;
    const avgNo = noCost / no;
    siCost = Math.round(avgSi * (si - pairs));
    noCost = Math.round(avgNo * (no - pairs));
    si -= pairs;
    no -= pairs;
    released = pairs * PAYOUT;
  }
  return { position: { outcomeId: pos.outcomeId, si, no, siCost, noCost }, released };
}

/** Valor de mercado de la posición dado el precio medio de Sí (centavos). */
export function markValue(pos: Position, siMid: number | undefined): number {
  if (siMid === undefined) return pos.siCost + pos.noCost;
  return pos.si * siMid + pos.no * (PAYOUT - siMid);
}

export function costBasis(pos: Position): number {
  return pos.siCost + pos.noCost;
}

/** Pago al liquidar el resultado: si ganó, cada Sí paga 100; si no, cada No paga 100. */
export function settle(pos: Position, won: boolean): number {
  return won ? pos.si * PAYOUT : pos.no * PAYOUT;
}
