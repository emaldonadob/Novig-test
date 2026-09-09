import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', ico: '🏟️', label: 'Mercados' },
  { to: '/portafolio', ico: '📈', label: 'Posiciones' },
  { to: '/cartera', ico: '💵', label: 'Cartera' },
  { to: '/que-es-cancha', ico: '💡', label: 'Cómo' },
  { to: '/perfil', ico: '👤', label: 'Perfil' },
];

export default function BottomNav() {
  return (
    <nav className="nav">
      {items.map((i) => (
        <NavLink key={i.to} to={i.to} end={i.to === '/'} className={({ isActive }) => (isActive ? 'active' : '')}>
          <span className="ico" aria-hidden>
            {i.ico}
          </span>
          {i.label}
        </NavLink>
      ))}
    </nav>
  );
}
