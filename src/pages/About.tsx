import { Link } from 'react-router-dom';
import Header from '../components/Header';

export default function About() {
  return (
    <>
      <Header title="¿Qué es Cancha?" />
      <div className="page stack">
        <div className="slides">
          <div className="slide">
            <span className="art" aria-hidden>
              🏀
            </span>
            <h2>¿QUÉ ES CANCHA?</h2>
            <p className="big">
              <mark>Cancha es un mercado de predicción deportiva donde la gente opera directamente entre sí</mark>, en lugar de apostar contra una
              casa tradicional.
            </p>
            <div className="small muted">1 / 5 · desliza →</div>
          </div>

          <div className="slide dark">
            <span className="art" aria-hidden>
              🏈
            </span>
            <h2>Nuestra promesa:</h2>
            <p className="big">
              <mark>SOLO DEPORTES.</mark>
              <br />
              <mark>Sin política. Sin guerras.</mark>
              <br />
              <mark>Sin mercados de muerte.</mark>
            </p>
            <div className="small" style={{ color: '#bdbdbd' }}>
              2 / 5
            </div>
          </div>

          <div className="slide">
            <span className="art" aria-hidden>
              ⚽
            </span>
            <h2>¿Cómo funciona?</h2>
            <div className="stack small">
              <p style={{ margin: 0 }}>
                Cada resultado tiene contratos <b>SÍ</b> y <b>NO</b> que pagan <mark>MX$1.00</mark> si aciertan.
              </p>
              <p style={{ margin: 0 }}>
                El precio está en centavos y es la probabilidad: <mark>62¢ = 62%</mark>.
              </p>
              <p style={{ margin: 0 }}>
                Un SÍ a 62¢ se casa con un NO a 38¢: entre los dos ponen el peso completo. <b>El ganador se lo lleva.</b>
              </p>
            </div>
            <div className="small muted">3 / 5</div>
          </div>

          <div className="slide">
            <span className="art" aria-hidden>
              🥊
            </span>
            <h2>Sin vig</h2>
            <div className="stack small">
              <p style={{ margin: 0 }}>
                Las casas tradicionales cobran un margen escondido en el momio ("vig"): en un volado justo pagan 1.91 en lugar de 2.00.
              </p>
              <p style={{ margin: 0 }}>
                En Cancha <mark>el precio lo fija la gente, no la casa</mark>. Si tú y otra persona se ponen de acuerdo en 50¢, es 50¢.
              </p>
              <p style={{ margin: 0 }}>Puedes poner tu propio precio y esperar a que alguien lo acepte, como en una bolsa.</p>
            </div>
            <div className="small muted">4 / 5</div>
          </div>

          <div className="slide">
            <span className="art" aria-hidden>
              🇲🇽
            </span>
            <h2>Hecho para México</h2>
            <div className="stack small">
              <p style={{ margin: 0 }}>Liga MX, Selección, NFL, NBA, MLB, LMB, box, F1 en el Autódromo…</p>
              <p style={{ margin: 0 }}>
                Depósitos por <mark>SPEI, OXXO y tarjeta</mark>. Retiros por SPEI el mismo día.
              </p>
              <p style={{ margin: 0 }}>
                Identidad verificada con CURP e INE. Límites de depósito y autoexclusión desde el día uno. <b>18+.</b>
              </p>
            </div>
            <div className="small muted">5 / 5</div>
          </div>
        </div>

        <div className="card stack">
          <h3>Ejemplo rápido</h3>
          <div className="kv">
            <span>Crees que América le gana a Chivas</span>
            <b>Compras 100 × SÍ a 46¢</b>
          </div>
          <div className="kv">
            <span>Se bloquea de tu saldo</span>
            <b>$46.00</b>
          </div>
          <div className="kv">
            <span>Alguien del otro lado pone</span>
            <b>$54.00 (100 × NO a 54¢)</b>
          </div>
          <div className="kv">
            <span>Si gana América, recibes</span>
            <b className="pos">$100.00 (+$54.00)</b>
          </div>
          <div className="kv">
            <span>Si no, recibes</span>
            <b className="neg">$0.00</b>
          </div>
          <div className="kv">
            <span>Comisión de Cancha en el precio</span>
            <b>$0.00</b>
          </div>
          <div className="tiny muted">¿Cambiaste de opinión antes del partido? Compra NO para cerrar: cada par SÍ+NO se te devuelve como $1.00.</div>
        </div>

        <div className="card stack">
          <h3>Lo que nunca vas a ver aquí</h3>
          <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
            <li>Mercados sobre elecciones o política.</li>
            <li>Mercados sobre guerras, conflictos o desastres.</li>
            <li>Mercados sobre la muerte o salud de personas.</li>
            <li>Mercados sobre menores de edad o deporte amateur infantil.</li>
          </ul>
        </div>

        <div className="card stack">
          <h3>Preguntas frecuentes</h3>
          <details>
            <summary className="bold small">¿Contra quién estoy operando?</summary>
            <p className="small muted">Contra otras personas usuarias de Cancha. Cancha solo casa las órdenes y custodia el colateral hasta la liquidación.</p>
          </details>
          <details>
            <summary className="bold small">¿Qué pasa si nadie toma mi orden?</summary>
            <p className="small muted">Se queda en el libro hasta que alguien la acepte, la canceles o inicie el evento. Tu dinero permanece bloqueado mientras tanto.</p>
          </details>
          <details>
            <summary className="bold small">¿Cómo gana dinero Cancha si no hay vig?</summary>
            <p className="small muted">Con una membresía opcional para operadores de alto volumen y una pequeña comisión sobre ganancias netas retiradas, nunca escondida en el precio.</p>
          </details>
          <details>
            <summary className="bold small">¿Es legal en México?</summary>
            <p className="small muted">
              Los juegos con apuesta requieren permiso de la Secretaría de Gobernación conforme a la Ley Federal de Juegos y Sorteos. Esta app es una demostración con saldo ficticio y no acepta dinero real.
            </p>
          </details>
        </div>

        <Link to="/" className="btn lime center" style={{ display: 'block' }}>
          Ver mercados
        </Link>
      </div>
    </>
  );
}
