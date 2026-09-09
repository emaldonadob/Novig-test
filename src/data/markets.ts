export type Sport = 'futbol' | 'nfl' | 'nba' | 'mlb' | 'box' | 'f1' | 'lmb' | 'ufc';

export interface SportMeta {
  id: Sport;
  label: string;
  emoji: string;
}

export const SPORTS: SportMeta[] = [
  { id: 'futbol', label: 'Fútbol', emoji: '⚽' },
  { id: 'nfl', label: 'NFL', emoji: '🏈' },
  { id: 'nba', label: 'NBA', emoji: '🏀' },
  { id: 'mlb', label: 'MLB', emoji: '⚾' },
  { id: 'lmb', label: 'LMB', emoji: '🇲🇽' },
  { id: 'box', label: 'Box', emoji: '🥊' },
  { id: 'ufc', label: 'UFC', emoji: '🥋' },
  { id: 'f1', label: 'F1', emoji: '🏎️' },
];

export type MarketKind = 'match' | 'futures' | 'prop';

export interface Outcome {
  id: string;
  label: string;
  short?: string;
  /** Probabilidad inicial (centavos) alrededor de la cual se siembra liquidez */
  fair: number;
}

export interface Market {
  id: string;
  sport: Sport;
  league: string;
  kind: MarketKind;
  title: string;
  subtitle?: string;
  startsAt: number; // epoch ms
  outcomes: Outcome[];
  featured?: boolean;
  /** Reglas de liquidación, en lenguaje claro */
  rules: string;
}

const H = 3600_000;
const D = 24 * H;

/** Fechas relativas a "ahora" para que la demo siempre tenga eventos próximos. */
export function seedMarkets(now = Date.now()): Market[] {
  const at = (days: number, hour = 20) => {
    const d = new Date(now + days * D);
    d.setHours(hour, 0, 0, 0);
    return d.getTime();
  };
  const m = (
    id: string,
    sport: Sport,
    league: string,
    kind: MarketKind,
    title: string,
    startsAt: number,
    outcomes: [string, number, string?][],
    rules: string,
    extra: Partial<Market> = {},
  ): Market => ({
    id,
    sport,
    league,
    kind,
    title,
    startsAt,
    outcomes: outcomes.map(([label, fair, short], i) => ({ id: `${id}:${i}`, label, fair, short })),
    rules,
    ...extra,
  });

  const ligamx = (id: string, home: string, away: string, days: number, hour: number, fairs: [number, number, number], featured = false) =>
    m(
      id,
      'futbol',
      'Liga MX · Apertura 2026',
      'match',
      `${home} vs ${away}`,
      at(days, hour),
      [
        [home, fairs[0], 'Local'],
        ['Empate', fairs[1], 'Empate'],
        [away, fairs[2], 'Visita'],
      ],
      'Resultado al final del tiempo reglamentario (90 min + añadido). No cuentan tiempos extra ni penales. Si el partido se pospone más de 48 h, el mercado se anula y se devuelve el colateral.',
      { featured, subtitle: 'Resultado final' },
    );

  const nfl = (id: string, home: string, away: string, days: number, hour: number, fairs: [number, number], featured = false) =>
    m(
      id,
      'nfl',
      'NFL · Temporada 2026',
      'match',
      `${away} @ ${home}`,
      at(days, hour),
      [
        [home, fairs[0]],
        [away, fairs[1]],
      ],
      'Ganador del partido incluyendo tiempo extra. Si termina en empate, el mercado se anula y se devuelve el colateral.',
      { featured, subtitle: 'Ganador (incl. tiempo extra)' },
    );

  return [
    // ── Fútbol ──────────────────────────────────────────────────────────
    ligamx('lmx-ame-chi', 'América', 'Chivas', 3, 21, [46, 27, 27], true),
    ligamx('lmx-cru-pum', 'Cruz Azul', 'Pumas', 2, 19, [44, 29, 27]),
    ligamx('lmx-mty-tig', 'Monterrey', 'Tigres', 4, 21, [40, 30, 30], true),
    ligamx('lmx-tol-leo', 'Toluca', 'León', 1, 19, [45, 28, 27]),
    ligamx('lmx-atl-san', 'Atlas', 'Santos', 1, 21, [43, 30, 27]),
    m(
      'lmx-campeon-ap26',
      'futbol',
      'Liga MX · Apertura 2026',
      'futures',
      'Campeón del Apertura 2026',
      at(95, 20),
      [
        ['América', 22],
        ['Toluca', 15],
        ['Cruz Azul', 14],
        ['Monterrey', 13],
        ['Tigres', 12],
        ['Chivas', 8],
        ['Pumas', 5],
        ['Otro equipo', 11],
      ],
      'Se liquida con el campeón oficial de la Liguilla del Apertura 2026 según la Liga MX.',
      { featured: true },
    ),
    m(
      'ucl-campeon-2627',
      'futbol',
      'UEFA Champions League 2026-27',
      'futures',
      'Campeón de la Champions League',
      at(260, 14),
      [
        ['Real Madrid', 18],
        ['Manchester City', 16],
        ['PSG', 14],
        ['Barcelona', 13],
        ['Bayern', 11],
        ['Liverpool', 10],
        ['Otro equipo', 18],
      ],
      'Se liquida con el ganador de la final de la UEFA Champions League 2026-27.',
    ),
    m(
      'mex-gimenez-goles',
      'futbol',
      'Selección Mexicana',
      'prop',
      'Santi Giménez anota en la próxima Fecha FIFA',
      at(30, 20),
      [['Sí', 55]],
      'Sí si Santiago Giménez anota al menos un gol en cualquiera de los partidos de la Selección Mexicana en la próxima ventana FIFA. Autogoles no cuentan.',
      { subtitle: 'Fecha FIFA de octubre' },
    ),

    // ── NFL ─────────────────────────────────────────────────────────────
    nfl('nfl-phi-dal', 'Eagles', 'Cowboys', 4, 19, [60, 40], true),
    nfl('nfl-kc-lac', 'Chiefs', 'Chargers', 5, 15, [57, 43]),
    nfl('nfl-det-gb', 'Lions', 'Packers', 5, 12, [52, 48]),
    nfl('nfl-sf-sea', '49ers', 'Seahawks', 5, 15, [54, 46]),
    m(
      'nfl-sb-2027',
      'nfl',
      'NFL · Super Bowl LXI',
      'futures',
      'Campeón del Super Bowl LXI',
      at(150, 18),
      [
        ['Eagles', 12],
        ['Chiefs', 11],
        ['Bills', 10],
        ['Ravens', 9],
        ['Lions', 9],
        ['49ers', 8],
        ['Cowboys', 5],
        ['Otro equipo', 36],
      ],
      'Se liquida con el ganador del Super Bowl LXI.',
      { featured: true },
    ),
    m(
      'nfl-mexico-2027',
      'nfl',
      'NFL México',
      'prop',
      'La NFL anuncia un partido de temporada regular en el Estadio Azteca para 2027',
      at(120, 12),
      [['Sí', 62]],
      'Sí si la NFL anuncia oficialmente (antes del 31 de diciembre de 2026) un partido de temporada regular 2027 a jugarse en el Estadio Azteca / Banorte, Ciudad de México.',
    ),

    // ── NBA ─────────────────────────────────────────────────────────────
    m(
      'nba-campeon-2627',
      'nba',
      'NBA 2026-27',
      'futures',
      'Campeón de la NBA 2026-27',
      at(280, 19),
      [
        ['Thunder', 24],
        ['Celtics', 14],
        ['Nuggets', 11],
        ['Knicks', 10],
        ['Cavaliers', 9],
        ['Lakers', 7],
        ['Otro equipo', 25],
      ],
      'Se liquida con el campeón de las Finales de la NBA 2026-27.',
      { featured: true },
    ),
    m(
      'nba-mexico-game',
      'nba',
      'NBA México',
      'prop',
      'Capitanes de la Ciudad de México llega a playoffs de la G League',
      at(220, 20),
      [['Sí', 48]],
      'Sí si los Capitanes de la Ciudad de México clasifican a los playoffs de la temporada 2026-27 de la NBA G League.',
    ),

    // ── MLB ─────────────────────────────────────────────────────────────
    m(
      'mlb-ws-2026',
      'mlb',
      'MLB · Postemporada 2026',
      'futures',
      'Campeón de la Serie Mundial 2026',
      at(50, 19),
      [
        ['Dodgers', 26],
        ['Yankees', 14],
        ['Phillies', 12],
        ['Tigers', 10],
        ['Mets', 8],
        ['Otro equipo', 30],
      ],
      'Se liquida con el ganador de la Serie Mundial 2026.',
    ),
    m(
      'mlb-urias-arozarena',
      'mlb',
      'MLB · Mexicanos en Grandes Ligas',
      'prop',
      'Un pelotero mexicano conecta jonrón en la postemporada 2026',
      at(45, 19),
      [['Sí', 58]],
      'Sí si cualquier jugador nacido en México (o de nacionalidad mexicana registrado por MLB) conecta al menos un cuadrangular durante la postemporada 2026.',
    ),

    // ── LMB ─────────────────────────────────────────────────────────────
    m(
      'lmb-serie-rey-2026',
      'lmb',
      'Liga Mexicana de Béisbol · Serie del Rey',
      'futures',
      'Campeón de la Serie del Rey 2026',
      at(12, 19),
      [
        ['Diablos Rojos', 34],
        ['Sultanes', 22],
        ['Pericos', 16],
        ['Leones', 12],
        ['Otro equipo', 16],
      ],
      'Se liquida con el campeón de la Serie del Rey 2026 de la LMB.',
      { featured: true },
    ),
    m(
      'lmp-campeon-2627',
      'lmb',
      'Liga Mexicana del Pacífico 2026-27',
      'futures',
      'Campeón de la LMP',
      at(130, 19),
      [
        ['Naranjeros', 20],
        ['Charros', 17],
        ['Tomateros', 16],
        ['Yaquis', 14],
        ['Otro equipo', 33],
      ],
      'Se liquida con el campeón de la temporada 2026-27 de la Liga Mexicana del Pacífico.',
    ),

    // ── Box / UFC ───────────────────────────────────────────────────────
    m(
      'box-canelo-next',
      'box',
      'Boxeo · Súper mediano',
      'match',
      'Canelo Álvarez — próxima pelea',
      at(6, 21),
      [
        ['Gana Canelo', 68],
        ['Gana el rival', 32],
      ],
      'Se liquida con el resultado oficial de la comisión. Un empate anula el mercado y se devuelve el colateral.',
      { featured: true, subtitle: 'Ganador de la pelea' },
    ),
    m(
      'box-canelo-ko',
      'box',
      'Boxeo · Súper mediano',
      'prop',
      'Canelo gana por nocaut o TKO',
      at(6, 21),
      [['Sí', 30]],
      'Sí si el resultado oficial es KO, TKO o descalificación a favor de Canelo Álvarez.',
    ),
    m(
      'ufc-mexico-main',
      'ufc',
      'UFC Fight Night · Ciudad de México',
      'match',
      'Pelea estelar UFC CDMX',
      at(20, 21),
      [
        ['Peleador mexicano', 55],
        ['Retador', 45],
      ],
      'Se liquida con el resultado oficial anunciado por UFC.',
      { subtitle: 'Ganador' },
    ),

    // ── F1 ──────────────────────────────────────────────────────────────
    m(
      'f1-gp-mexico-2026',
      'f1',
      'Fórmula 1 · GP de la Ciudad de México',
      'futures',
      'Ganador del GP de la Ciudad de México 2026',
      at(52, 14),
      [
        ['Lando Norris', 26],
        ['Max Verstappen', 24],
        ['Oscar Piastri', 20],
        ['Charles Leclerc', 12],
        ['George Russell', 8],
        ['Otro piloto', 10],
      ],
      'Se liquida con la clasificación oficial de la FIA tras sanciones aplicadas el día de la carrera.',
      { featured: true },
    ),
    m(
      'f1-checo-top10',
      'f1',
      'Fórmula 1 · GP de la Ciudad de México',
      'prop',
      'Checo Pérez termina en los puntos en el GP de México',
      at(52, 14),
      [['Sí', 41]],
      'Sí si Sergio Pérez finaliza en la posición 10 o mejor en la clasificación oficial de la FIA.',
    ),
  ];
}

export function outcomeById(markets: Market[], outcomeId: string): { market: Market; outcome: Outcome } | undefined {
  for (const market of markets) {
    const outcome = market.outcomes.find((o) => o.id === outcomeId);
    if (outcome) return { market, outcome };
  }
  return undefined;
}
