/**
 * Motor de casamiento (matching engine) de Cancha.
 *
 * Modelo: cada resultado ("outcome") tiene contratos binarios Sí / No que pagan
 * MX$1.00 (100 centavos) si aciertan y MX$0 si no. Los precios se expresan en
 * centavos (1–99) y equivalen a la probabilidad implícita.
 *
 * Una orden de Sí a p¢ se casa con una orden de No a q¢ cuando p + q >= 100:
 * entre ambas ponen los 100¢ que pagará el contrato ganador. No hay casa ni
 * "vig": el excedente (p + q - 100) se le regresa a quien llegó después
 * (el "taker") como mejora de precio.
 *
 * Todo el dinero se maneja en centavos enteros para evitar errores de flotante.
 */

export type Side = 'si' | 'no';

export interface Order {
  id: string;
  outcomeId: string;
  owner: string; // 'me' para el usuario, 'crowd' para liquidez simulada
  side: Side;
  price: number; // centavos, 1..99 — precio límite que el dueño está dispuesto a pagar
  qty: number; // contratos restantes
  createdAt: number;
}

export interface Fill {
  id: string;
  outcomeId: string;
  qty: number;
  /** precio pagado por el lado Sí; el lado No pagó 100 - siPrice */
  siPrice: number;
  siOwner: string;
  noOwner: string;
  takerOrderId: string;
  makerOrderId: string;
  at: number;
}

export interface Book {
  si: Order[]; // ordenadas de mejor (mayor precio) a peor, luego por antigüedad
  no: Order[];
}

export const PAYOUT = 100; // centavos por contrato ganador

export function opposite(side: Side): Side {
  return side === 'si' ? 'no' : 'si';
}

export function emptyBook(): Book {
  return { si: [], no: [] };
}

export function sortSide(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => b.price - a.price || a.createdAt - b.createdAt);
}

/** Mejor precio de compra en cada lado (undefined si no hay órdenes). */
export function bestBid(book: Book, side: Side): number | undefined {
  return book[side][0]?.price;
}

/**
 * Precio "ask" para comprar Sí ahora mismo: lo determina la mejor orden de No.
 * Si el mejor No está a 38¢, puedes comprar Sí a 62¢.
 */
export function askPrice(book: Book, side: Side): number | undefined {
  const best = bestBid(book, opposite(side));
  return best === undefined ? undefined : PAYOUT - best;
}

/** Precio medio implícito del lado Sí (probabilidad de mercado). */
export function midPrice(book: Book): number | undefined {
  const siBid = bestBid(book, 'si');
  const siAsk = askPrice(book, 'si');
  if (siBid !== undefined && siAsk !== undefined) return Math.round((siBid + siAsk) / 2);
  if (siBid !== undefined) return siBid;
  if (siAsk !== undefined) return siAsk;
  return undefined;
}

/** Cantidad disponible al mejor precio para comprar `side` de inmediato. */
export function liquidityAtBest(book: Book, side: Side): number {
  const opp = book[opposite(side)];
  if (!opp.length) return 0;
  const best = opp[0].price;
  return opp.filter((o) => o.price === best).reduce((s, o) => s + o.qty, 0);
}

export interface MatchResult {
  book: Book;
  fills: Fill[];
  /** La parte de la orden entrante que quedó descansando en el libro (o null si se llenó por completo). */
  resting: Order | null;
}

let seq = 0;
export function nextId(prefix: string): string {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

/**
 * Ingresa una orden al libro. Es una función pura: devuelve un libro nuevo.
 */
export function placeOrder(book: Book, incoming: Order, now = Date.now()): MatchResult {
  if (incoming.price < 1 || incoming.price > 99 || !Number.isInteger(incoming.price)) {
    throw new Error('El precio debe ser un entero entre 1 y 99 centavos');
  }
  if (incoming.qty < 1 || !Number.isInteger(incoming.qty)) {
    throw new Error('La cantidad debe ser un entero positivo');
  }

  const oppSide = opposite(incoming.side);
  const opp = book[oppSide].map((o) => ({ ...o }));
  const fills: Fill[] = [];
  let remaining = incoming.qty;

  while (remaining > 0 && opp.length > 0 && opp[0].price + incoming.price >= PAYOUT) {
    const maker = opp[0];
    // No te cases contigo mismo: salta tus propias órdenes
    if (maker.owner === incoming.owner) {
      // buscamos la siguiente orden de otro dueño con precio compatible
      const idx = opp.findIndex((o) => o.owner !== incoming.owner && o.price + incoming.price >= PAYOUT);
      if (idx === -1) break;
      const [other] = opp.splice(idx, 1);
      opp.unshift(other);
      continue;
    }
    const q = Math.min(remaining, maker.qty);
    // El taker paga solo lo necesario para completar los 100¢: mejora de precio.
    const takerPrice = PAYOUT - maker.price;
    const siPrice = incoming.side === 'si' ? takerPrice : maker.price;
    fills.push({
      id: nextId('fill'),
      outcomeId: incoming.outcomeId,
      qty: q,
      siPrice,
      siOwner: incoming.side === 'si' ? incoming.owner : maker.owner,
      noOwner: incoming.side === 'no' ? incoming.owner : maker.owner,
      takerOrderId: incoming.id,
      makerOrderId: maker.id,
      at: now,
    });
    maker.qty -= q;
    remaining -= q;
    if (maker.qty === 0) opp.shift();
  }

  const resting = remaining > 0 ? { ...incoming, qty: remaining } : null;
  const own = resting ? sortSide([...book[incoming.side], resting]) : book[incoming.side];

  const newBook: Book = incoming.side === 'si' ? { si: own, no: sortSide(opp) } : { si: sortSide(opp), no: own };
  return { book: newBook, fills, resting };
}

export function cancelOrder(book: Book, orderId: string): { book: Book; cancelled: Order | null } {
  let cancelled: Order | null = null;
  const filter = (orders: Order[]) =>
    orders.filter((o) => {
      if (o.id === orderId) {
        cancelled = o;
        return false;
      }
      return true;
    });
  const si = filter(book.si);
  const no = filter(book.no);
  return { book: { si, no }, cancelled };
}

export function removeOrdersBy(book: Book, pred: (o: Order) => boolean): { book: Book; removed: Order[] } {
  const removed: Order[] = [];
  const keep = (orders: Order[]) =>
    orders.filter((o) => {
      if (pred(o)) {
        removed.push(o);
        return false;
      }
      return true;
    });
  return { book: { si: keep(book.si), no: keep(book.no) }, removed };
}

/** Colateral que se bloquea al poner una orden: precio límite × cantidad. */
export function collateral(order: Pick<Order, 'price' | 'qty'>): number {
  return order.price * order.qty;
}

/** Ganancia potencial (neta) si el contrato paga: (100 - precio) × cantidad. */
export function potentialProfit(price: number, qty: number): number {
  return (PAYOUT - price) * qty;
}

/** Momio decimal equivalente a un precio en centavos. */
export function decimalOdds(price: number): number {
  return PAYOUT / price;
}

/** Momio americano equivalente (por familiaridad con casas tradicionales). */
export function americanOdds(price: number): number {
  const p = price / PAYOUT;
  return p >= 0.5 ? -Math.round((p / (1 - p)) * 100) : Math.round(((1 - p) / p) * 100);
}
