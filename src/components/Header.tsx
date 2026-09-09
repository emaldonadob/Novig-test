import { Link, useNavigate } from 'react-router-dom';
import { useExchange } from '../store/ExchangeContext';
import { money } from '../lib/format';

export default function Header({ title, back }: { title?: string; back?: boolean }) {
  const { state } = useExchange();
  const nav = useNavigate();
  return (
    <header className="header">
      <div className="row">
        {back && (
          <button className="back" onClick={() => nav(-1)} aria-label="Regresar">
            ←
          </button>
        )}
        {title ? (
          <h2>{title}</h2>
        ) : (
          <Link to="/" className="logo">
            <span className="dot" /> CANCHA
          </Link>
        )}
      </div>
      <Link to="/cartera" className="balance-chip demo mono">
        {money(state.balance)}
      </Link>
    </header>
  );
}
