import { describe, expect, it } from 'vitest';
import {
  americanOdds,
  askPrice,
  cancelOrder,
  collateral,
  decimalOdds,
  emptyBook,
  midPrice,
  placeOrder,
  potentialProfit,
  type Order,
} from './orderbook';
import { applyFill, emptyPosition, settle } from './positions';

const mk = (over: Partial<Order>): Order => ({
  id: over.id ?? Math.random().toString(36).slice(2),
  outcomeId: 'o1',
  owner: 'crowd',
  side: 'si',
  price: 50,
  qty: 10,
  createdAt: 0,
  ...over,
});

describe('placeOrder', () => {
  it('descansa en el libro cuando no hay contraparte', () => {
    const r = placeOrder(emptyBook(), mk({ owner: 'me', side: 'si', price: 60, qty: 5 }));
    expect(r.fills).toHaveLength(0);
    expect(r.resting?.qty).toBe(5);
    expect(r.book.si).toHaveLength(1);
    expect(askPrice(r.book, 'no')).toBe(40);
  });

  it('casa Sí a 62 con No a 38 sin vig', () => {
    const b1 = placeOrder(emptyBook(), mk({ owner: 'crowd', side: 'no', price: 38, qty: 10 })).book;
    const r = placeOrder(b1, mk({ owner: 'me', side: 'si', price: 62, qty: 4 }));
    expect(r.fills).toHaveLength(1);
    expect(r.fills[0].siPrice).toBe(62);
    expect(r.fills[0].qty).toBe(4);
    expect(r.resting).toBeNull();
    expect(r.book.no[0].qty).toBe(6);
  });

  it('da mejora de precio al taker cuando el cruce excede 100', () => {
    const b1 = placeOrder(emptyBook(), mk({ owner: 'crowd', side: 'no', price: 45, qty: 10 })).book;
    // Estoy dispuesto a pagar 70, pero solo se necesitan 55 para completar 100
    const r = placeOrder(b1, mk({ owner: 'me', side: 'si', price: 70, qty: 10 }));
    expect(r.fills[0].siPrice).toBe(55);
  });

  it('camina el libro por prioridad de precio y deja el resto descansando', () => {
    let book = emptyBook();
    book = placeOrder(book, mk({ id: 'a', side: 'no', price: 40, qty: 3, createdAt: 1 })).book;
    book = placeOrder(book, mk({ id: 'b', side: 'no', price: 38, qty: 3, createdAt: 2 })).book;
    book = placeOrder(book, mk({ id: 'c', side: 'no', price: 30, qty: 3, createdAt: 3 })).book; // no cruza con 65
    const r = placeOrder(book, mk({ owner: 'me', side: 'si', price: 65, qty: 10 }));
    expect(r.fills.map((f) => [f.makerOrderId, f.siPrice, f.qty])).toEqual([
      ['a', 60, 3],
      ['b', 62, 3],
    ]);
    expect(r.resting?.qty).toBe(4);
    expect(r.book.si[0].price).toBe(65);
    expect(r.book.no.map((o) => o.id)).toEqual(['c']);
  });

  it('respeta prioridad de tiempo a igual precio', () => {
    let book = emptyBook();
    book = placeOrder(book, mk({ id: 'late', side: 'no', price: 40, qty: 2, createdAt: 10 })).book;
    book = placeOrder(book, mk({ id: 'early', side: 'no', price: 40, qty: 2, createdAt: 1 })).book;
    const r = placeOrder(book, mk({ owner: 'me', side: 'si', price: 60, qty: 2 }));
    expect(r.fills[0].makerOrderId).toBe('early');
  });

  it('no se casa contigo mismo', () => {
    const b1 = placeOrder(emptyBook(), mk({ owner: 'me', side: 'no', price: 50, qty: 5 })).book;
    const r = placeOrder(b1, mk({ owner: 'me', side: 'si', price: 50, qty: 5 }));
    expect(r.fills).toHaveLength(0);
    expect(r.book.si).toHaveLength(1);
    expect(r.book.no).toHaveLength(1);
  });

  it('rechaza precios fuera de rango', () => {
    expect(() => placeOrder(emptyBook(), mk({ price: 0 }))).toThrow();
    expect(() => placeOrder(emptyBook(), mk({ price: 100 }))).toThrow();
    expect(() => placeOrder(emptyBook(), mk({ qty: 0 }))).toThrow();
  });
});

describe('precios derivados', () => {
  it('calcula mid, ask y momios', () => {
    let book = emptyBook();
    book = placeOrder(book, mk({ side: 'si', price: 58, qty: 1 })).book;
    book = placeOrder(book, mk({ side: 'no', price: 40, qty: 1 })).book;
    expect(askPrice(book, 'si')).toBe(60);
    expect(midPrice(book)).toBe(59);
    expect(decimalOdds(50)).toBe(2);
    expect(americanOdds(60)).toBe(-150);
    expect(americanOdds(25)).toBe(300);
    expect(collateral({ price: 60, qty: 5 })).toBe(300);
    expect(potentialProfit(60, 5)).toBe(200);
  });

  it('cancela órdenes', () => {
    const book = placeOrder(emptyBook(), mk({ id: 'x', side: 'si', price: 50, qty: 1 })).book;
    const r = cancelOrder(book, 'x');
    expect(r.cancelled?.id).toBe('x');
    expect(r.book.si).toHaveLength(0);
  });
});

describe('posiciones', () => {
  it('acumula costo y liquida', () => {
    let pos = emptyPosition('o1');
    const r = applyFill(
      pos,
      { id: 'f', outcomeId: 'o1', qty: 4, siPrice: 60, siOwner: 'me', noOwner: 'crowd', takerOrderId: 't', makerOrderId: 'm', at: 0 },
      'me',
    );
    pos = r.position;
    expect(pos.si).toBe(4);
    expect(pos.siCost).toBe(240);
    expect(r.released).toBe(0);
    expect(settle(pos, true)).toBe(400);
    expect(settle(pos, false)).toBe(0);
  });

  it('netea Sí y No del mismo resultado y libera efectivo', () => {
    let pos = emptyPosition('o1');
    pos = applyFill(
      pos,
      { id: 'f1', outcomeId: 'o1', qty: 4, siPrice: 60, siOwner: 'me', noOwner: 'crowd', takerOrderId: 't', makerOrderId: 'm', at: 0 },
      'me',
    ).position;
    // Ahora "vendo" 3 Sí comprando 3 No a 45¢ (Sí a 55¢)
    const r = applyFill(
      pos,
      { id: 'f2', outcomeId: 'o1', qty: 3, siPrice: 55, siOwner: 'crowd', noOwner: 'me', takerOrderId: 't', makerOrderId: 'm', at: 0 },
      'me',
    );
    expect(r.released).toBe(300);
    expect(r.position.si).toBe(1);
    expect(r.position.no).toBe(0);
    expect(r.position.siCost).toBe(60);
    expect(r.position.noCost).toBe(0);
  });
});
