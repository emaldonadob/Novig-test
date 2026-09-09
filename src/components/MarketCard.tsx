import { Link, useNavigate } from 'react-router-dom';
import type { Market } from '../data/markets';
import { SPORTS } from '../data/markets';
import { askPrice } from '../engine/orderbook';
import { cents, when } from '../lib/format';
import { useExchange } from '../store/ExchangeContext';

export default function MarketCard({ market }: { market: Market }) {
  const { state } = useExchange();
  const nav = useNavigate();
  const sport = SPORTS.find((s) => s.id === market.sport);
  const resolved = market.id in state.resolved;
  const hasPos = market.outcomes.some((o) => state.positions[o.id]);
  const shown = market.kind === 'futures' ? market.outcomes.slice(0, 3) : market.outcomes;
  const more = market.outcomes.length - shown.length;

  const go = (outcomeId: string, side: 'si' | 'no') => nav(`/mercado/${market.id}?o=${encodeURIComponent(outcomeId)}&s=${side}`);

  return (
    <div className="card">
      <div className="between">
        <span className="eyebrow">
          {sport?.emoji} {market.league}
        </span>
        <span className="tiny muted">{resolved ? 'Liquidado' : when(market.startsAt)}</span>
      </div>
      <Link to={`/mercado/${market.id}`} className="card-title" style={{ display: 'block', marginTop: 6 }}>
        {market.title}
      </Link>
      {market.subtitle && <div className="small muted">{market.subtitle}</div>}
      <div className="outcomes">
        {shown.map((o) => {
          const book = state.books[o.id];
          const si = book ? askPrice(book, 'si') : undefined;
          const no = book ? askPrice(book, 'no') : undefined;
          const winner = state.resolved[market.id] === o.id;
          return (
            <div className="outcome-row" key={o.id}>
              <span className="name">
                {o.label}
                {winner && <span className="badge lime" style={{ marginLeft: 6 }}>Ganó</span>}
                {state.positions[o.id] && !resolved && (
                  <span className="badge" style={{ marginLeft: 6 }}>Posición</span>
                )}
              </span>
              {resolved ? (
                <span className="pbtn ghost" style={{ gridColumn: 'span 2' }}>
                  —
                </span>
              ) : (
                <>
                  <button className="pbtn si" onClick={() => go(o.id, 'si')} disabled={si === undefined}>
                    {si === undefined ? '—' : cents(si)}
                    <small>SÍ</small>
                  </button>
                  <button className="pbtn no" onClick={() => go(o.id, 'no')} disabled={no === undefined}>
                    {no === undefined ? '—' : cents(no)}
                    <small>NO</small>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      {more > 0 && (
        <Link to={`/mercado/${market.id}`} className="small bold" style={{ display: 'block', marginTop: 8 }}>
          +{more} más →
        </Link>
      )}
      {hasPos && !resolved && <div className="tiny muted" style={{ marginTop: 8 }}>Tienes contratos en este mercado</div>}
    </div>
  );
}
