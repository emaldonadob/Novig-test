import { useEffect, useState } from 'react';
import { askPrice, americanOdds, collateral, decimalOdds, liquidityAtBest, potentialProfit, type Book, type Side } from '../engine/orderbook';
import { cents, clamp, money } from '../lib/format';
import { useExchange } from '../store/ExchangeContext';
import { useToast } from './Toast';

interface Props {
  outcomeId: string;
  outcomeLabel: string;
  book: Book;
  side: Side;
  onSide: (s: Side) => void;
  disabled?: boolean;
}

export default function TradeTicket({ outcomeId, outcomeLabel, book, side, onSide, disabled }: Props) {
  const { state, dispatch } = useExchange();
  const { toast } = useToast();
  const ask = askPrice(book, side);
  const [price, setPrice] = useState<number>(ask ?? 50);
  const [qty, setQty] = useState<number>(10);
  const [touched, setTouched] = useState(false);

  // Cuando cambia el lado o el resultado, reinicia al precio de mercado
  useEffect(() => {
    setTouched(false);
  }, [side, outcomeId]);
  useEffect(() => {
    if (!touched && ask !== undefined) setPrice(ask);
  }, [ask, touched]);

  const cost = collateral({ price, qty });
  const profit = potentialProfit(price, qty);
  const immediate = ask !== undefined && price >= ask;
  const avail = liquidityAtBest(book, side);
  const insufficient = cost > state.balance;
  const excluded = state.profile.selfExcludedUntil !== null && state.profile.selfExcludedUntil > Date.now();

  const submit = () => {
    if (excluded) return toast('Tienes activa la autoexclusión.', 'bad');
    if (insufficient) return toast('Saldo insuficiente. Deposita en Cartera.', 'bad');
    dispatch({ type: 'PLACE', outcomeId, side, price, qty });
    toast(
      immediate
        ? `Orden enviada: ${qty} × ${side === 'si' ? 'SÍ' : 'NO'} a ${cents(price)}`
        : `Orden colocada en el libro a ${cents(price)}. Se ejecutará cuando alguien tome el otro lado.`,
    );
  };

  return (
    <div className="card stack">
      <div className="between">
        <span className="eyebrow">Operar · {outcomeLabel}</span>
        <span className="tiny muted">Paga MX$1.00 por contrato</span>
      </div>
      <div className="seg">
        <button className={`si ${side === 'si' ? 'on' : ''}`} onClick={() => onSide('si')}>
          SÍ {askPrice(book, 'si') !== undefined && <span className="mono">{cents(askPrice(book, 'si')!)}</span>}
        </button>
        <button className={`no ${side === 'no' ? 'on' : ''}`} onClick={() => onSide('no')}>
          NO {askPrice(book, 'no') !== undefined && <span className="mono">{cents(askPrice(book, 'no')!)}</span>}
        </button>
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <div className="between">
          <label className="small bold">Precio límite (probabilidad)</label>
          <span className="small muted mono">
            {decimalOdds(price).toFixed(2)} · {americanOdds(price) > 0 ? '+' : ''}
            {americanOdds(price)}
          </span>
        </div>
        <div className="stepper">
          <button
            onClick={() => {
              setTouched(true);
              setPrice((p) => clamp(p - 1, 1, 99));
            }}
          >
            −
          </button>
          <input
            type="number"
            min={1}
            max={99}
            value={price}
            onChange={(e) => {
              setTouched(true);
              setPrice(clamp(Number(e.target.value) || 1, 1, 99));
            }}
          />
          <button
            onClick={() => {
              setTouched(true);
              setPrice((p) => clamp(p + 1, 1, 99));
            }}
          >
            +
          </button>
        </div>
        <input
          type="range"
          min={1}
          max={99}
          value={price}
          onChange={(e) => {
            setTouched(true);
            setPrice(Number(e.target.value));
          }}
        />
        <div className="tiny muted">
          {ask === undefined
            ? 'No hay contraparte ahora; tu orden esperará en el libro.'
            : immediate
              ? `Se ejecuta ahora contra ${avail} contratos a ${cents(ask)}${price > ask ? ' (te cobramos el mejor precio disponible)' : ''}.`
              : `Mejor precio ahora: ${cents(ask)}. A ${cents(price)} tu orden esperará a que alguien acepte.`}
        </div>
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <label className="small bold">Contratos</label>
        <div className="stepper">
          <button onClick={() => setQty((q) => Math.max(1, q - 5))}>−</button>
          <input type="number" min={1} value={qty} onChange={(e) => setQty(Math.max(1, Math.floor(Number(e.target.value) || 1)))} />
          <button onClick={() => setQty((q) => q + 5)}>+</button>
        </div>
        <div className="chips">
          {[10, 25, 50, 100, 250].map((n) => (
            <button key={n} className={`chip ${qty === n ? 'active' : ''}`} onClick={() => setQty(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="kv">
          <span>Costo (se bloquea)</span>
          <b className={insufficient ? 'neg' : ''}>{money(cost)}</b>
        </div>
        <div className="kv">
          <span>Si aciertas, recibes</span>
          <b>{money(qty * 100)}</b>
        </div>
        <div className="kv">
          <span>Ganancia neta potencial</span>
          <b className="pos">+{money(profit)}</b>
        </div>
        <div className="kv">
          <span>Comisión de Cancha</span>
          <b>$0.00 · sin vig</b>
        </div>
      </div>

      <button className={`btn ${side === 'si' ? 'lime' : 'coral'}`} onClick={submit} disabled={disabled || insufficient || excluded}>
        {immediate ? 'Comprar' : 'Colocar orden'} {qty} × {side === 'si' ? 'SÍ' : 'NO'} a {cents(price)}
      </button>
      {insufficient && <div className="tiny neg center">Te faltan {money(cost - state.balance)}. Deposita en Cartera.</div>}
    </div>
  );
}
