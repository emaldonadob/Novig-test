import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { outcomeById } from '../data/markets';
import { costBasis, markValue } from '../engine/positions';
import { cents, money, signedMoney, when } from '../lib/format';
import { useExchange } from '../store/ExchangeContext';
import { myOrders, outcomeMid, portfolioValue, reserved } from '../store/exchange';

export default function Portfolio() {
  const { state, dispatch, markets } = useExchange();
  const { toast } = useToast();
  const positions = Object.values(state.positions).filter((p) => p.si > 0 || p.no > 0);
  const orders = myOrders(state);
  const value = portfolioValue(state);
  const basis = positions.reduce((s, p) => s + costBasis(p), 0);
  const settled = state.txs.filter((t) => t.kind === 'liquidacion' || t.kind === 'anulacion');
  const realized = state.txs.reduce((s, t) => (t.kind === 'liquidacion' || t.kind === 'operacion' || t.kind === 'liberacion' || t.kind === 'anulacion' ? s + t.amount : s), 0);

  return (
    <>
      <Header title="Posiciones" />
      <div className="page stack">
        <div className="tiles">
          <div className="tile">
            <div className="tiny muted">Valor de posiciones</div>
            <div className="v">{money(value)}</div>
            <div className={`tiny ${value - basis >= 0 ? 'pos' : 'neg'}`}>{signedMoney(value - basis)} vs. costo</div>
          </div>
          <div className="tile">
            <div className="tiny muted">En órdenes abiertas</div>
            <div className="v">{money(reserved(state))}</div>
            <div className="tiny muted">{orders.length} órdenes</div>
          </div>
          <div className="tile">
            <div className="tiny muted">Disponible</div>
            <div className="v">{money(state.balance)}</div>
          </div>
          <div className="tile">
            <div className="tiny muted">Resultado histórico</div>
            <div className={`v ${realized >= 0 ? 'pos' : 'neg'}`}>{signedMoney(realized)}</div>
            <div className="tiny muted">{settled.length} liquidaciones</div>
          </div>
        </div>

        <h2>Abiertas</h2>
        {positions.length === 0 && (
          <div className="card center muted">
            Aún no tienes contratos. <Link to="/" className="link">Explora los mercados</Link>.
          </div>
        )}
        {positions.map((p) => {
          const found = outcomeById(markets, p.outcomeId);
          if (!found) return null;
          const mid = outcomeMid(state, p.outcomeId);
          const mv = markValue(p, mid);
          const cb = costBasis(p);
          const side = p.si > 0 ? 'SÍ' : 'NO';
          const n = p.si > 0 ? p.si : p.no;
          const avg = Math.round((p.si > 0 ? p.siCost : p.noCost) / n);
          const now = mid === undefined ? undefined : p.si > 0 ? mid : 100 - mid;
          return (
            <Link to={`/mercado/${found.market.id}?o=${encodeURIComponent(p.outcomeId)}&s=${p.si > 0 ? 'no' : 'si'}`} className="card" key={p.outcomeId}>
              <div className="between">
                <span className="eyebrow">{found.market.league}</span>
                <span className="tiny muted">{when(found.market.startsAt)}</span>
              </div>
              <div className="card-title" style={{ marginTop: 4 }}>
                {found.market.title}
              </div>
              <div className="between" style={{ marginTop: 8 }}>
                <div>
                  <span className={`badge ${side === 'SÍ' ? 'lime' : ''}`}>{side}</span> <b>{found.outcome.label}</b>
                  <div className="tiny muted">
                    {n} contratos · promedio {cents(avg)} → ahora {now === undefined ? '—' : cents(now)}
                  </div>
                </div>
                <div className="right">
                  <b className="mono">{money(mv)}</b>
                  <div className={`tiny ${mv - cb >= 0 ? 'pos' : 'neg'}`}>{signedMoney(mv - cb)}</div>
                </div>
              </div>
            </Link>
          );
        })}

        {orders.length > 0 && (
          <>
            <h2>Órdenes abiertas</h2>
            <div className="card">
              <div className="list">
                {orders.map((o) => {
                  const found = outcomeById(markets, o.outcomeId);
                  return (
                    <div className="between" key={o.id}>
                      <div>
                        <b>
                          {o.qty} × {o.side === 'si' ? 'SÍ' : 'NO'} a {cents(o.price)}
                        </b>
                        <div className="tiny muted">
                          {found?.outcome.label} · {found?.market.title}
                        </div>
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
                  );
                })}
              </div>
            </div>
          </>
        )}

        {settled.length > 0 && (
          <>
            <h2>Liquidadas</h2>
            <div className="card">
              <div className="list">
                {[...settled].reverse().map((t) => (
                  <div className="between" key={t.id}>
                    <div>
                      <div className="small bold">{t.note}</div>
                      <div className="tiny muted">{when(t.at)}</div>
                    </div>
                    <b className={`mono ${t.amount > 0 ? 'pos' : 'muted'}`}>{t.amount > 0 ? `+${money(t.amount)}` : money(0)}</b>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
