import { useState } from 'react';
import { useExchange } from '../store/ExchangeContext';

export default function AgeGate() {
  const { state, dispatch } = useExchange();
  const [age, setAge] = useState(false);
  const [mx, setMx] = useState(false);
  const [terms, setTerms] = useState(false);
  if (state.profile.ageConfirmed) return null;
  const ok = age && mx && terms;
  return (
    <div className="overlay" role="dialog" aria-modal="true">
      <div className="sheet stack">
        <div className="row">
          <span className="logo">
            <span className="dot" /> CANCHA
          </span>
          <span className="age">18+</span>
        </div>
        <h1>
          Solo deportes. <mark>Solo mayores de edad.</mark>
        </h1>
        <p className="muted">
          Cancha es un mercado de predicción deportiva donde la gente opera entre sí. Antes de entrar, confirma lo siguiente:
        </p>
        <label className="check">
          <input type="checkbox" checked={age} onChange={(e) => setAge(e.target.checked)} />
          <span>Tengo 18 años o más.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={mx} onChange={(e) => setMx(e.target.checked)} />
          <span>Resido en México y no estoy en un registro de autoexclusión.</span>
        </label>
        <label className="check">
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
          <span>Entiendo que esta es una versión de demostración con saldo ficticio y acepto los términos de uso.</span>
        </label>
        <button className="btn lime" disabled={!ok} onClick={() => dispatch({ type: 'PROFILE', patch: { ageConfirmed: true } })}>
          Entrar a la cancha
        </button>
        <p className="legal">
          Juega responsablemente. Los juegos con apuesta en México están regulados por la Secretaría de Gobernación conforme a la Ley Federal de
          Juegos y Sorteos. Si sientes que el juego se está convirtiendo en un problema, busca ayuda: Línea de la Vida 800 911 2000.
        </p>
      </div>
    </div>
  );
}
