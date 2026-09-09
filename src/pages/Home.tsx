import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import MarketCard from '../components/MarketCard';
import { SPORTS, type Sport } from '../data/markets';
import { useExchange } from '../store/ExchangeContext';

type Filter = 'todos' | 'destacados' | Sport;

export default function Home() {
  const { markets, state } = useExchange();
  const [filter, setFilter] = useState<Filter>('todos');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    const now = Date.now();
    return markets
      .filter((m) => (filter === 'todos' ? true : filter === 'destacados' ? m.featured : m.sport === filter))
      .filter((m) => (q ? `${m.title} ${m.league} ${m.outcomes.map((o) => o.label).join(' ')}`.toLowerCase().includes(q.toLowerCase()) : true))
      .sort((a, b) => {
        const ra = a.id in state.resolved ? 1 : 0;
        const rb = b.id in state.resolved ? 1 : 0;
        if (ra !== rb) return ra - rb;
        return Math.abs(a.startsAt - now) - Math.abs(b.startsAt - now);
      });
  }, [markets, filter, q, state.resolved]);

  return (
    <>
      <Header />
      <div className="page stack">
        <div className="hero">
          <span className="ball" aria-hidden>
            ⚽
          </span>
          <span className="eyebrow" style={{ color: '#bdbdbd' }}>
            <span className="pulse" /> Mercado abierto · México
          </span>
          <h1 style={{ marginTop: 8 }}>
            <span className="hl">Solo deportes.</span>
            <br />
            Sin política. Sin guerras.
            <br />
            Sin mercados de muerte.
          </h1>
          <p>
            Opera directamente contra otras personas, no contra la casa. <b style={{ color: '#fff' }}>0% de vig.</b>{' '}
            <Link to="/que-es-cancha" className="link" style={{ color: 'var(--lime)' }}>
              ¿Cómo funciona?
            </Link>
          </p>
        </div>

        <div className="field">
          <input placeholder="Buscar equipo, liga o evento…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        <div className="chips">
          <button className={`chip ${filter === 'todos' ? 'active' : ''}`} onClick={() => setFilter('todos')}>
            Todos
          </button>
          <button className={`chip ${filter === 'destacados' ? 'active' : ''}`} onClick={() => setFilter('destacados')}>
            ⭐ Destacados
          </button>
          {SPORTS.map((s) => (
            <button key={s.id} className={`chip ${filter === s.id ? 'active' : ''}`} onClick={() => setFilter(s.id)}>
              {s.emoji} {s.label}
            </button>
          ))}
        </div>

        {list.length === 0 && <div className="card center muted">No hay mercados con ese filtro.</div>}
        {list.map((m) => (
          <MarketCard key={m.id} market={m} />
        ))}

        <p className="legal center">
          Los precios son en centavos de peso y equivalen a la probabilidad implícita. Cada contrato paga MX$1.00 si acierta. 18+.
        </p>
      </div>
    </>
  );
}
