import { useMemo, useState } from 'react';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { money, when } from '../lib/format';
import { useExchange } from '../store/ExchangeContext';
import { reserved } from '../store/exchange';

type Method = 'spei' | 'oxxo' | 'tarjeta';

const METHODS: { id: Method; label: string; desc: string; emoji: string }[] = [
  { id: 'spei', label: 'SPEI', desc: 'Transferencia bancaria · llega en minutos', emoji: '🏦' },
  { id: 'oxxo', label: 'OXXO Pay', desc: 'Paga en efectivo en cualquier OXXO', emoji: '🏪' },
  { id: 'tarjeta', label: 'Tarjeta', desc: 'Débito o crédito', emoji: '💳' },
];

function fakeClabe() {
  return '646180' + String(Math.floor(Math.random() * 1e12)).padStart(12, '0');
}
function fakeOxxoRef() {
  return Array.from({ length: 14 }, () => Math.floor(Math.random() * 10)).join('').replace(/(\d{4})(?=\d)/g, '$1 ');
}

export default function Wallet() {
  const { state, dispatch } = useExchange();
  const { toast } = useToast();
  const [tab, setTab] = useState<'depositar' | 'retirar'>('depositar');
  const [method, setMethod] = useState<Method>('spei');
  const [amount, setAmount] = useState(500);
  const [clabe, setClabe] = useState('');
  const speiClabe = useMemo(fakeClabe, []);
  const oxxoRef = useMemo(fakeOxxoRef, []);

  const monthDeposits = state.txs
    .filter((t) => t.kind === 'deposito' && t.at > Date.now() - 30 * 86400000)
    .reduce((s, t) => s + t.amount, 0);
  const limitLeft = Math.max(0, state.profile.monthlyLimit - monthDeposits);
  const excluded = state.profile.selfExcludedUntil !== null && state.profile.selfExcludedUntil > Date.now();

  const deposit = () => {
    const cents = Math.round(amount * 100);
    if (excluded) return toast('Tienes activa la autoexclusión; no puedes depositar.', 'bad');
    if (cents < 5000) return toast('El depósito mínimo es $50.00', 'bad');
    if (cents > limitLeft) return toast(`Excede tu límite mensual. Te quedan ${money(limitLeft)}.`, 'bad');
    const ref = method === 'spei' ? `SPEI ${speiClabe.slice(-4)}` : method === 'oxxo' ? `OXXO ${oxxoRef.slice(0, 4)}` : 'Tarjeta ····4242';
    dispatch({ type: 'DEPOSIT', amount: cents, method: METHODS.find((m) => m.id === method)!.label, ref });
    toast(`Depósito de ${money(cents)} acreditado (simulado).`);
  };

  const withdraw = () => {
    const cents = Math.round(amount * 100);
    if (!/^\d{18}$/.test(clabe)) return toast('La CLABE debe tener 18 dígitos.', 'bad');
    if (!state.profile.verified) return toast('Verifica tu identidad (CURP) en Perfil antes de retirar.', 'bad');
    if (cents > state.balance) return toast('No tienes saldo disponible suficiente.', 'bad');
    dispatch({ type: 'WITHDRAW', amount: cents, clabe });
    toast(`Retiro de ${money(cents)} enviado vía SPEI (simulado).`);
  };

  return (
    <>
      <Header title="Cartera" />
      <div className="page stack">
        <div className="card dark">
          <span className="eyebrow">Saldo disponible</span>
          <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', marginTop: 4 }} className="mono">
            {money(state.balance)}
          </div>
          <div className="small" style={{ color: '#bdbdbd' }}>
            + {money(reserved(state))} bloqueados en órdenes abiertas · saldo de demostración
          </div>
        </div>

        <div className="seg">
          <button className={`si ${tab === 'depositar' ? 'on' : ''}`} onClick={() => setTab('depositar')}>
            Depositar
          </button>
          <button className={`no ${tab === 'retirar' ? 'on' : ''}`} onClick={() => setTab('retirar')}>
            Retirar
          </button>
        </div>

        <div className="field">
          <label>Monto (MXN)</label>
          <input type="number" min={50} step={50} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
          <div className="chips">
            {[200, 500, 1000, 2000, 5000].map((n) => (
              <button key={n} className={`chip ${amount === n ? 'active' : ''}`} onClick={() => setAmount(n)}>
                {money(n * 100, { whole: true })}
              </button>
            ))}
          </div>
        </div>

        {tab === 'depositar' ? (
          <>
            <div className="stack" style={{ gap: 8 }}>
              {METHODS.map((m) => (
                <button
                  key={m.id}
                  className="card between"
                  style={{ textAlign: 'left', borderColor: method === m.id ? 'var(--ink)' : undefined, width: '100%' }}
                  onClick={() => setMethod(m.id)}
                >
                  <div className="row">
                    <span style={{ fontSize: 22 }}>{m.emoji}</span>
                    <div>
                      <b>{m.label}</b>
                      <div className="tiny muted">{m.desc}</div>
                    </div>
                  </div>
                  <span>{method === m.id ? '●' : '○'}</span>
                </button>
              ))}
            </div>

            {method === 'spei' && (
              <div className="card lime">
                <span className="eyebrow">Transfiere a esta CLABE</span>
                <div className="mono" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.04em', marginTop: 4 }}>
                  {speiClabe.replace(/(\d{4})(?=\d)/g, '$1 ')}
                </div>
                <div className="tiny muted">Beneficiario: Cancha Deportes SAPI de CV · Banco: STP · Concepto: tu nombre de usuario</div>
              </div>
            )}
            {method === 'oxxo' && (
              <div className="card lime">
                <span className="eyebrow">Referencia OXXO Pay</span>
                <div className="mono" style={{ fontSize: 18, fontWeight: 800, letterSpacing: '0.04em', marginTop: 4 }}>
                  {oxxoRef}
                </div>
                <div className="tiny muted">Muestra este número en caja. Comisión OXXO: $12. Se acredita en menos de 1 h.</div>
              </div>
            )}
            {method === 'tarjeta' && (
              <div className="stack" style={{ gap: 8 }}>
                <div className="field">
                  <label>Número de tarjeta</label>
                  <input placeholder="4242 4242 4242 4242" inputMode="numeric" />
                </div>
                <div className="row">
                  <div className="field grow">
                    <label>Vence</label>
                    <input placeholder="MM/AA" />
                  </div>
                  <div className="field grow">
                    <label>CVV</label>
                    <input placeholder="123" inputMode="numeric" />
                  </div>
                </div>
              </div>
            )}

            <button className="btn lime" onClick={deposit}>
              Simular depósito de {money(Math.round(amount * 100))}
            </button>
            <div className="tiny muted center">
              Límite mensual restante: {money(limitLeft)}. Cámbialo en Perfil. Mínimo $50.
            </div>
          </>
        ) : (
          <>
            <div className="field">
              <label>CLABE interbancaria (18 dígitos)</label>
              <input
                inputMode="numeric"
                placeholder="0123 4567 8901 2345 67"
                value={clabe}
                onChange={(e) => setClabe(e.target.value.replace(/\D/g, '').slice(0, 18))}
                className={clabe && clabe.length !== 18 ? 'bad' : ''}
              />
            </div>
            <button className="btn" onClick={withdraw}>
              Retirar {money(Math.round(amount * 100))} vía SPEI
            </button>
            <div className="tiny muted center">Los retiros requieren identidad verificada. Llegan el mismo día hábil.</div>
          </>
        )}

        <h2>Movimientos</h2>
        <div className="card">
          <div className="list">
            {[...state.txs].reverse().slice(0, 40).map((t) => (
              <div className="between" key={t.id}>
                <div>
                  <div className="small bold">{t.note}</div>
                  <div className="tiny muted">
                    {when(t.at)}
                    {t.ref ? ` · ${t.ref}` : ''}
                  </div>
                </div>
                <b className={`mono ${t.amount > 0 ? 'pos' : ''}`}>{t.amount > 0 ? '+' : ''}{money(t.amount)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
