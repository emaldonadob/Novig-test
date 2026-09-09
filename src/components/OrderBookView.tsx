import type { Book } from '../engine/orderbook';
import { ME } from '../store/exchange';

function levels(orders: { price: number; qty: number; owner: string }[], n = 5) {
  const map = new Map<number, { qty: number; mine: boolean }>();
  for (const o of orders) {
    const cur = map.get(o.price) ?? { qty: 0, mine: false };
    cur.qty += o.qty;
    if (o.owner === ME) cur.mine = true;
    map.set(o.price, cur);
  }
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .slice(0, n)
    .map(([price, v]) => ({ price, ...v }));
}

export default function OrderBookView({ book }: { book: Book }) {
  const si = levels(book.si);
  const no = levels(book.no);
  const max = Math.max(1, ...si.map((l) => l.qty), ...no.map((l) => l.qty));
  return (
    <div className="book">
      <div className="side si">
        <div className="between tiny muted">
          <span>Compran SÍ</span>
          <span>Cant.</span>
        </div>
        {si.length === 0 && <div className="tiny muted">Sin órdenes</div>}
        {si.map((l) => (
          <div className={`lvl ${l.mine ? 'mine' : ''}`} key={l.price}>
            <span className="bar" style={{ width: `${(l.qty / max) * 100}%` }} />
            <b>{l.price}¢</b>
            <span>{l.qty}</span>
          </div>
        ))}
      </div>
      <div className="side no">
        <div className="between tiny muted">
          <span>Compran NO</span>
          <span>Cant.</span>
        </div>
        {no.length === 0 && <div className="tiny muted">Sin órdenes</div>}
        {no.map((l) => (
          <div className={`lvl ${l.mine ? 'mine' : ''}`} key={l.price}>
            <span className="bar" style={{ width: `${(l.qty / max) * 100}%`, right: 0, left: 'auto' }} />
            <b>{l.price}¢</b>
            <span>{l.qty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
