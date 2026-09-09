import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import OrderBookView from '../components/OrderBookView';
import TradeTicket from '../components/TradeTicket';
import { useToast } from '../components/Toast';
import { SPORTS } from '../data/markets';
import { askPrice, emptyBook, midPrice, type Side } from '../engine/orderbook';
import { costBasis, markValue } from '../engine/positions';
import { cents, money, signedMoney, whenLong } from '../lib/format';
import { useExchange } from '../store/ExchangeContext';
import { myOrders } from '../store/exchange';

export default function MarketPage() {
  const { id } = useParams();
  const [sp, setSp] = useSearchParams();
  const { state, dispatch, markets } = useExchange();
  const { toast } = useToast();
  const market = markets.find((m) => m.id === id);
  const [outcomeId, setOutcomeId] = useState<string>(sp.get('o') ?? market?.outcomes[0].id ?? '');
  const [side, setSide] = useState<Side>((sp.get('s') as Side) ?? 'si');
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    if (market && !market.outcomes.some((o) => o.id === outcomeId)) setOutcomeId(market.outcomes[0].id);
  }, [market, outcomeId]);

  const orders = useMemo(() => myOrders(state).filter((o) => market?.outcomes.some((x) => x.id === o.outcomeId)), [state, market]);

  if (!market) {
    return (
      <>
        <Header title="Mercado" back />
        <div className="page">
          <div className="card center">
            Este mercado no existe. <Link to="/">Volver</Link>
          </div>
        </div>
      </>
    );
  }

  const outcome = market.outcomes.find((o) => o.id === outcomeId) ?? market.outcomes[0];
  const book = state.books[outcome.id] ?? emptyBook();
  const resolved = market.id in state.resolved;
  const winner = state.resolved[market.id];
  const sport = SPORTS.find((s) => s.id === market.sport);
  const pos = state.positions[outcome.id];
  const mid = midPrice(book);

  const pick = (oid: string, s: Side) => {
    setOutcomeId(oid);
    setSide(s);
    setSp({ o: oid, s }, { replace: true });
  };

  return (
    <>
      <Header title={market.kind === 'match' ? 'Partido' : market.kind === 'futures' ? 'Futuro' : 'Prop'} back />
      <div className="page stack">
        <div>
          <span className="eyebrow">
            {sport?.emoji} {market.league}
          </span>
          <h1 style={{ marginTop: 4 }}>{market.title}</h1>
          <div className="small muted">
            {market.subtitle ? `${market.subtitle} · ` : ''}
            {whenLong(market.startsAt)}
          </div>
        </div>

        {resolved && (
          <div className="card lime">
            <b>Mercado liquidado.</b>{' '}
            {winner === null ? 'Se anuló y se devolvió el colateral.' : `Resultado ganador: ${market.outcomes.find((o) => o.id === winner)?.label}.`}
          </div>
        )}

        <div className="card">
          <span className="eyebrow">Resultados</span>
          <div className="outcomes">
            {market.outcomes.map((o) => {
              const b = state.books[o.id] ?? emptyBook();
              const si = askPrice(b, 'si');
              const no = askPrice(b, 'no');
              const on = o.id === outcome.id;
              return (
                <div className="outcome-row" key={o.id} style={{ background: on ? 'var(--bg-2)' : undefined, borderRadius: 10, padding: on ? 4 : 0 }}>
                  <button className="name" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, fontWeight: on ? 800 : 600 }} onClick={() => pick(o.id, side)}>
                    {o.label}
                    {winner === o.id && <span className="badge lime" style={{ marginLeft: 6 }}>Ganó</span>}
                    {market.kind === 'prop' && <div className="tiny muted">Compra SÍ si crees que ocurrirá; NO si no.</div>}
                  </button>
                  <button className="pbtn si" disabled={resolved || si === undefined} onClick={() => pick(o.id, 'si')}>
                    {si === undefined ? '—' : cents(si)}
                    <small>SÍ</small>
                  </button>
                  <button className="pbtn no" disabled={resolved || no === undefined} onClick={() => pick(o.id, 'no')}>
                    {no === undefined ? '—' : cents(no)}
                    <small>NO</small>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {pos && (pos.si > 0 || pos.no > 0) && (
          <div className="card lime">
            <span className="eyebrow">Tu posición · {outcome.label}</span>
            <div className="tiles" style={{ marginTop: 8 }}>
              <div className="tile">
                <div className="tiny muted">Contratos</div>
                <div className="v">
                  {pos.si > 0 ? `${pos.si} SÍ` : `${pos.no} NO`}
                </div>
                <div className="tiny muted">Costo promedio {pos.si > 0 ? cents(Math.round(pos.siCost / pos.si)) : cents(Math.round(pos.noCost / pos.no))}</div>
              </div>
              <div className="tile">
                <div className="tiny muted">Valor ahora</div>
                <div className="v">{money(markValue(pos, mid))}</div>
                <div className={`tiny ${markValue(pos, mid) - costBasis(pos) >= 0 ? 'pos' : 'neg'}`}>
                  {signedMoney(markValue(pos, mid) - costBasis(pos))} · paga {money((pos.si || pos.no) * 100)} si aciertas
                </div>
              </div>
            </div>
            <div className="tiny muted" style={{ marginTop: 8 }}>
              Para cerrar antes de tiempo, compra el lado contrario ({pos.si > 0 ? 'NO' : 'SÍ'}): los pares se netean y se te devuelve MX$1.00 por cada uno.
            </div>
          </div>
        )}

        {!resolved && <TradeTicket outcomeId={outcome.id} outcomeLabel={outcome.label} book={book} side={side} onSide={(s) => pick(outcome.id, s)} />}

        <div className="card stack">
          <div className="between">
            <span className="eyebrow">Libro de órdenes · {outcome.label}</span>
            {mid !== undefined && <span className="badge">Prob. {mid}%</span>}
          </div>
          <OrderBookView book={book} />
          <div className="tiny muted">Las órdenes con borde punteado son tuyas. Cada fila agrupa las órdenes de varias personas al mismo precio.</div>
        </div>

        {orders.length > 0 && (
          <div className="card">
            <span className="eyebrow">Tus órdenes abiertas en este mercado</span>
            <div className="list">
              {orders.map((o) => (
                <div className="between" key={o.id}>
                  <div>
                    <b>
                      {o.qty} × {o.side === 'si' ? 'SÍ' : 'NO'} a {cents(o.price)}
                    </b>
                    <div className="tiny muted">{market.outcomes.find((x) => x.id === o.outcomeId)?.label} · bloqueado {money(o.price * o.qty)}</div>
                  </div>
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      dispatch({ type: 'CANCEL', orderId: o.id });
                      toast('Orden cancelada; colateral devuelto.');
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card">
          <span className="eyebrow">Reglas de liquidación</span>
          <p className="small" style={{ margin: '6px 0 0' }}>
            {market.rules}
          </p>
        </div>

        {!resolved && (
          <div className="card" style={{ borderStyle: 'dashed' }}>
            <div className="between">
              <span className="eyebrow">Modo demo · simular resultado</span>
              <button className="link small" onClick={() => setShowDemo((v) => !v)}>
                {showDemo ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {showDemo && (
              <div className="stack" style={{ marginTop: 10 }}>
                <div className="tiny muted">En producción esto lo hace el equipo de liquidación con la fuente oficial. Aquí puedes probar cómo se pagan los contratos.</div>
                <div className="row wrap">
                  {market.outcomes.map((o) => (
                    <button
                      key={o.id}
                      className="btn ghost sm"
                      onClick={() => {
                        dispatch({ type: 'RESOLVE', marketId: market.id, winnerOutcomeId: o.id });
                        toast(`Liquidado: ganó ${o.label}`);
                      }}
                    >
                      Ganó {o.short ?? o.label}
                    </button>
                  ))}
                  {market.kind === 'prop' && (
                    <button
                      className="btn ghost sm"
                      onClick={() => {
                        dispatch({ type: 'RESOLVE', marketId: market.id, winnerOutcomeId: '__no__' });
                        toast('Liquidado: no ocurrió (pagan los NO)');
                      }}
                    >
                      No ocurrió
                    </button>
                  )}
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      dispatch({ type: 'RESOLVE', marketId: market.id, winnerOutcomeId: null });
                      toast('Mercado anulado; colateral devuelto');
                    }}
                  >
                    Anular
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
