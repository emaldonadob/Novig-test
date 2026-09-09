import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import { useToast } from '../components/Toast';
import { money } from '../lib/format';
import { useExchange } from '../store/ExchangeContext';
import { isValidCurp } from '../store/exchange';

export default function Profile() {
  const { state, dispatch } = useExchange();
  const { toast } = useToast();
  const p = state.profile;
  const [name, setName] = useState(p.name);
  const [curp, setCurp] = useState(p.curp);
  const [limit, setLimit] = useState(p.monthlyLimit / 100);
  const curpOk = isValidCurp(curp);
  const excluded = p.selfExcludedUntil !== null && p.selfExcludedUntil > Date.now();

  return (
    <>
      <Header title="Perfil" />
      <div className="page stack">
        <div className="card between">
          <div className="row">
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--lime)', display: 'grid', placeItems: 'center', fontWeight: 900 }}>
              {p.name.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <b>{p.name}</b>
              <div className="tiny muted">{p.verified ? '✅ Identidad verificada' : '⚠️ Sin verificar'}</div>
            </div>
          </div>
          <span className="age">18+</span>
        </div>

        <div className="card stack">
          <span className="eyebrow">Datos</span>
          <div className="field">
            <label>Nombre de usuario</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="field">
            <label>CURP (para verificar identidad y retirar)</label>
            <input
              value={curp}
              onChange={(e) => setCurp(e.target.value.toUpperCase().slice(0, 18))}
              placeholder="GOMJ900101HDFRRN09"
              className={curp && !curpOk ? 'bad' : ''}
              style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            {curp && !curpOk && <div className="tiny neg">Formato de CURP inválido (18 caracteres).</div>}
          </div>
          <button
            className="btn"
            onClick={() => {
              dispatch({ type: 'PROFILE', patch: { name: name.trim() || 'Invitado', curp, verified: curpOk } });
              toast(curpOk ? 'Perfil guardado. Identidad verificada (simulado).' : 'Perfil guardado.');
            }}
          >
            Guardar
          </button>
          <div className="tiny muted">En producción, la CURP se valida contra RENAPO y se pide una identificación oficial (INE) con selfie, como exige la regulación de prevención de lavado de dinero.</div>
        </div>

        <div className="card stack">
          <span className="eyebrow">Juego responsable</span>
          <div className="field">
            <label>Límite de depósito mensual (MXN)</label>
            <input type="number" min={100} step={100} value={limit} onChange={(e) => setLimit(Number(e.target.value))} />
          </div>
          <button
            className="btn ghost"
            onClick={() => {
              dispatch({ type: 'PROFILE', patch: { monthlyLimit: Math.max(10000, Math.round(limit * 100)) } });
              toast(`Límite mensual: ${money(Math.max(10000, Math.round(limit * 100)))}`);
            }}
          >
            Actualizar límite
          </button>
          {excluded ? (
            <div className="card coral">
              <b>Autoexclusión activa</b>
              <div className="small">Hasta el {new Date(p.selfExcludedUntil!).toLocaleDateString('es-MX', { dateStyle: 'long' })}. No puedes operar ni depositar.</div>
              <button className="link small" style={{ marginTop: 6 }} onClick={() => dispatch({ type: 'PROFILE', patch: { selfExcludedUntil: null } })}>
                Cancelar (solo en demo)
              </button>
            </div>
          ) : (
            <div className="row wrap">
              {[
                ['24 h', 1],
                ['7 días', 7],
                ['30 días', 30],
                ['6 meses', 182],
              ].map(([label, days]) => (
                <button
                  key={label}
                  className="btn ghost sm"
                  onClick={() => {
                    dispatch({ type: 'PROFILE', patch: { selfExcludedUntil: Date.now() + Number(days) * 86400000 } });
                    toast(`Autoexclusión activada por ${label}.`);
                  }}
                >
                  Pausar {label}
                </button>
              ))}
            </div>
          )}
          <div className="tiny muted">¿Necesitas hablar con alguien? Línea de la Vida: 800 911 2000, 24/7 y gratuita.</div>
        </div>

        <div className="card stack">
          <span className="eyebrow">Acerca de</span>
          <Link to="/que-es-cancha" className="bold">
            ¿Qué es Cancha? →
          </Link>
          <div className="legal">
            Cancha es un mercado de predicción entre pares: cada contrato lo respaldan dos personas que ponen juntas MX$1.00. Cancha no toma
            el otro lado de tus operaciones ni cobra "vig" en el precio. Esta aplicación es una demostración con saldo ficticio; no acepta
            dinero real y no está operando bajo permiso de SEGOB. Un operador real requiere permiso conforme a la Ley Federal de Juegos y Sorteos
            y su Reglamento.
          </div>
        </div>

        <button
          className="btn ghost"
          onClick={() => {
            if (confirm('¿Reiniciar la demo? Se borrarán tus posiciones, órdenes y movimientos.')) {
              dispatch({ type: 'RESET' });
              toast('Demo reiniciada.');
            }
          }}
        >
          Reiniciar demo
        </button>
      </div>
    </>
  );
}
