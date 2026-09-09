# Cancha — mercado de predicción deportiva para México

**Solo deportes. Sin política. Sin guerras. Sin mercados de muerte.**

Cancha es una app móvil (web, mobile-first) inspirada en el modelo de [Novig](https://novig.us):
un *exchange* de predicción deportiva donde las personas operan **entre sí**, en lugar de
apostar contra una casa. No hay "vig" escondido en el momio: el precio lo fija la gente.

> Esta es una **demostración** con saldo ficticio. No acepta dinero real y no opera bajo permiso
> de la Secretaría de Gobernación. Un operador real en México requiere permiso conforme a la
> Ley Federal de Juegos y Sorteos y su Reglamento.

## Cómo funciona el mercado

- Cada resultado (p. ej. "América gana") tiene contratos **SÍ** y **NO** que pagan **MX$1.00** si aciertan.
- El precio se expresa en **centavos (1–99)** y equivale a la probabilidad implícita: 62¢ = 62 %.
- Una orden de SÍ a *p*¢ se casa con una orden de NO a *q*¢ cuando **p + q ≥ 100**. Entre las dos
  ponen el peso completo; el ganador se lo lleva. El excedente se devuelve a quien llegó después
  (mejora de precio), no a la casa.
- Si nadie toma tu orden, queda descansando en el **libro de órdenes** hasta que alguien la acepte
  o la canceles. El colateral (precio × cantidad) se bloquea mientras tanto.
- Para cerrar una posición antes del evento compras el lado contrario: cada par SÍ + NO se
  **netea** y se te devuelve MX$1.00.
- Al liquidar, los contratos ganadores pagan 100¢; los perdedores, 0.

## Qué incluye la app

| Pantalla | Qué hace |
| --- | --- |
| **Mercados** | Liga MX, Selección, Champions, NFL (incl. NFL México), NBA, MLB, LMB / LMP, box (Canelo), UFC CDMX y F1 (GP de México). Filtros por deporte, búsqueda, precios SÍ/NO en vivo. |
| **Mercado** | Selector de resultado, boleta con precio límite (stepper + slider), momio decimal/americano equivalente, costo bloqueado, ganancia potencial, libro de órdenes con profundidad, tus órdenes abiertas, reglas de liquidación y un **modo demo** para simular el resultado y ver el pago. |
| **Posiciones** | Valor de mercado vs. costo, P&L, órdenes abiertas (cancelables) y liquidaciones históricas. |
| **Cartera** | Saldo, depósitos simulados por **SPEI (CLABE)**, **OXXO Pay** y tarjeta; retiros por SPEI a una CLABE de 18 dígitos; movimientos. |
| **Perfil** | Nombre, **CURP** con validación de formato oficial (verificación simulada, requerida para retirar), límite de depósito mensual, **autoexclusión** (24 h – 6 meses), reinicio de la demo. |
| **¿Qué es Cancha?** | Carrusel con el *pitch*, ejemplo numérico, lista de mercados prohibidos y preguntas frecuentes. |

Además: compuerta de **18+** al entrar, todo en español de México (`es-MX`), montos en MXN,
horarios en `America/Mexico_City`, persistencia en `localStorage`, y una "afición" simulada
que provee liquidez y mueve sus órdenes cada pocos segundos (tus órdenes en el libro pueden
ejecutarse cuando el mercado se mueve hacia tu precio).

## Correr el proyecto

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # pruebas del motor de casamiento
npm run build      # typecheck + build de producción en dist/
```

## Estructura

```
src/
  engine/       motor de casamiento puro (orderbook.ts) y posiciones (positions.ts) + pruebas
  store/        estado de la app: cartera, órdenes, liquidez simulada, liquidación, persistencia
  data/         mercados semilla (fechas relativas a "hoy")
  pages/        Home, MarketPage, Portfolio, Wallet, Profile, About
  components/   Header, BottomNav, AgeGate, MarketCard, OrderBookView, TradeTicket, Toast
  lib/          formato es-MX (moneda, fechas)
```

El motor (`src/engine`) no depende de React ni del navegador: se puede mover tal cual a un
backend. Todo el dinero se maneja en **centavos enteros**.

## Qué faltaría para producción

- Backend con libro de órdenes central, cuentas, custodia de colateral y liquidación con fuente oficial.
- Permiso de SEGOB, cumplimiento PLD (KYC con CURP/RENAPO + INE + prueba de vida), reportes a la UIF.
- Integración real de pagos: SPEI (STP o banco), OXXO Pay/Conekta, tarjetas.
- Feeds de datos deportivos y reglas de liquidación por liga.
- Juego responsable: límites por tiempo y pérdida, registro de autoexclusión, verificación de edad real.
