// Goan heritage artwork drawn in SVG: Indo-Portuguese houses, a whitewashed church, palms and azulejo tiles.
// Houses: lime-washed walls (ochre, indigo, pink, green), white trim and pilasters, red Mangalore-tile roof,
// a raised balcão porch with seats, tall shuttered windows with oyster-shell (carepa) panes.

export const WALLS = {
  yellow: '#E9B634', blue: '#3D6FB6', pink: '#E87EA1', green: '#4FA36B', orange: '#E98A3C', skyblue: '#6EC1E4', purple: '#8E6BBF', red: '#C9473D',
};
const ROOF = '#B5442E', ROOF_D = '#8E3220', TRIM = '#FFFDF6', SHELL = '#F4EEDC', SHELL_L = '#D9CFB4';

function shellWindow(x, y, w, hgt, shutter) {
  const cols = 3, rows = 4, cw = (w - 6) / cols, rh = (hgt - 6 - w / 2) / rows;
  let panes = '';
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) panes += `<rect x="${x + 3 + c * cw}" y="${y + 3 + w / 2 + r * rh}" width="${cw - 1}" height="${rh - 1}" fill="${SHELL}" stroke="${SHELL_L}" stroke-width=".6"/>`;
  return `<g>
    <rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${hgt + 6}" rx="${w / 2 + 3}" ry="${w / 2 + 3}" fill="${TRIM}"/>
    <path d="M${x} ${y + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${y + w / 2} V${y + hgt} H${x} Z" fill="#7B5A3A"/>
    <path d="M${x + 3} ${y + w / 2 + 1} A${w / 2 - 3} ${w / 2 - 3} 0 0 1 ${x + w - 3} ${y + w / 2 + 1} Z" fill="${SHELL}" stroke="${SHELL_L}" stroke-width=".6"/>
    ${panes}
    ${shutter ? `<rect x="${x - 8}" y="${y + w / 2}" width="6" height="${hgt - w / 2}" fill="${shutter}" opacity=".9"/><rect x="${x + w + 2}" y="${y + w / 2}" width="6" height="${hgt - w / 2}" fill="${shutter}" opacity=".9"/>` : ''}
  </g>`;
}

/** One Goan house. opts: {wall, windows (0-4), balcao (bool), door (colour), roof} */
export function houseSVG({ wall = WALLS.yellow, windows = 2, balcao = true, door = '#2F6B4F', roof = ROOF, label = '' } = {}) {
  const W = 220, H = 190, wx = 20, ww = 180, wy = 62, wh = 108;
  // roof with Mangalore tile rows
  let tiles = '';
  for (let r = 0; r < 4; r++) {
    const y = 22 + r * 10, inset = 26 - r * 6;
    for (let x = wx - 8 + inset; x < wx + ww + 8 - inset; x += 12) tiles += `<path d="M${x} ${y + 10} q6 -9 12 0" fill="none" stroke="${ROOF_D}" stroke-width="1.4" opacity=".55"/>`;
  }
  const roofPath = `<path d="M${wx - 12} ${wy + 2} L${wx + 28} 18 H${wx + ww - 28} L${wx + ww + 12} ${wy + 2} Z" fill="${roof}"/>${tiles}
    <rect x="${wx - 14}" y="${wy - 2}" width="${ww + 28}" height="7" rx="2" fill="${TRIM}"/>`;
  // windows spaced around the door
  const many = windows > 2, winW = many ? 20 : 26, winH = many ? 40 : 46;
  const picks = windows === 1 ? [52] : windows === 2 ? [52, 168] : windows === 3 ? [38, 64, 168] : windows >= 4 ? [38, 64, 156, 182] : [];
  const wins = picks.map(cx => shellWindow(cx - winW / 2, wy + 22, winW, winH, '#2F6B4F')).join('');
  const pl = many ? 82 : 74, pr = many ? 130 : 138;
  // door + balcão
  const door1 = `<path d="M96 ${wy + wh} V${wy + 44} a14 14 0 0 1 28 0 V${wy + wh} Z" fill="${door}"/><path d="M110 ${wy + 30} v${wh - 30}" stroke="rgba(0,0,0,.25)" stroke-width="1.2"/>
    <path d="M92 ${wy + wh} V${wy + 44} a18 18 0 0 1 36 0 V${wy + wh}" fill="none" stroke="${TRIM}" stroke-width="5"/>`;
  const porch = balcao ? `<g>
      <rect x="${pl - 4}" y="${wy + 26}" width="${pr - pl + 16}" height="8" fill="${TRIM}"/>
      <path d="M${pl - 4} ${wy + 26} L${pl + 6} ${wy + 12} H${pr + 2} L${pr + 12} ${wy + 26} Z" fill="${roof}"/>
      <rect x="${pl}" y="${wy + 34}" width="8" height="${wh - 22}" fill="${TRIM}"/><rect x="${pr}" y="${wy + 34}" width="8" height="${wh - 22}" fill="${TRIM}"/>
      <rect x="62" y="${wy + wh - 6}" width="30" height="18" rx="2" fill="${TRIM}" stroke="#E4DCC8"/><rect x="128" y="${wy + wh - 6}" width="30" height="18" rx="2" fill="${TRIM}" stroke="#E4DCC8"/>
      <rect x="92" y="${wy + wh + 4}" width="36" height="5" fill="#E4DCC8"/><rect x="88" y="${wy + wh + 8}" width="44" height="5" fill="#D8CEB6"/>
    </g>` : `<rect x="94" y="${wy + wh}" width="32" height="5" fill="#D8CEB6"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label || 'A Goan house'}">
    ${roofPath}
    <rect x="${wx}" y="${wy + 5}" width="${ww}" height="${wh - 5}" fill="${wall}"/>
    <rect x="${wx}" y="${wy + 5}" width="8" height="${wh - 5}" fill="${TRIM}"/><rect x="${wx + ww - 8}" y="${wy + 5}" width="8" height="${wh - 5}" fill="${TRIM}"/>
    <rect x="${wx}" y="${wy + wh - 10}" width="${ww}" height="10" fill="${TRIM}" opacity=".9"/>
    ${wins}${door1}${porch}
  </svg>`;
}

export function churchSVG() {
  return `<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" aria-label="A whitewashed Goan church">
    <rect x="20" y="70" width="40" height="140" fill="#FFFDF6" stroke="#E6DFCC"/><rect x="140" y="70" width="40" height="140" fill="#FFFDF6" stroke="#E6DFCC"/>
    <path d="M18 72 L40 40 L62 72Z M138 72 L160 40 L182 72Z" fill="#FFFDF6" stroke="#E6DFCC"/>
    <rect x="34" y="82" width="12" height="20" rx="6" fill="#3D6FB6"/><rect x="154" y="82" width="12" height="20" rx="6" fill="#3D6FB6"/>
    <rect x="56" y="100" width="88" height="110" fill="#FFFDF6" stroke="#E6DFCC"/>
    <path d="M56 102 Q100 50 144 102Z" fill="#FFFDF6" stroke="#E6DFCC"/>
    <rect x="97" y="46" width="6" height="26" fill="#C9A227"/><rect x="90" y="54" width="20" height="6" fill="#C9A227"/>
    <circle cx="100" cy="92" r="9" fill="#3D6FB6"/>
    <path d="M84 210 V160 a16 16 0 0 1 32 0 V210Z" fill="#7B5A3A"/>
    <rect x="66" y="120" width="12" height="24" rx="6" fill="#3D6FB6"/><rect x="122" y="120" width="12" height="24" rx="6" fill="#3D6FB6"/>
  </svg>`;
}

export function palmSVG() {
  return `<svg viewBox="0 0 80 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M42 160 C38 110 44 70 38 42" stroke="#8B6A44" stroke-width="7" fill="none" stroke-linecap="round"/>
    <g fill="#3E9B55"><path d="M38 42 C20 30 6 36 0 48 C14 40 26 40 38 44Z"/><path d="M38 42 C56 28 72 32 80 44 C64 38 52 40 38 44Z"/>
    <path d="M38 42 C30 22 16 14 6 16 C20 22 30 30 37 44Z"/><path d="M38 42 C46 20 60 12 72 14 C58 22 48 30 39 44Z"/><path d="M38 42 C38 22 42 8 50 2 C44 16 42 28 40 44Z"/></g>
    <circle cx="36" cy="46" r="4" fill="#7A5A2E"/><circle cx="42" cy="47" r="4" fill="#7A5A2E"/>
  </svg>`;
}

/** Village skyline for headers: houses, a church and palms. extra = child's own house options. */
export function villageSVG(extra) {
  const cols = [WALLS.yellow, WALLS.blue, WALLS.pink, WALLS.green];
  const enc = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
  const items = [
    ['palm', 0, 34, 70], ['house', 40, 0, 120, cols[0], 2, true], ['house', 150, 10, 110, cols[1], 1, false],
    ['church', 258, -14, 96], ['house', 350, 4, 116, cols[2], 2, true], ['palm', 462, 34, 64],
    ['house', 500, 8, 112, extra ? extra.wall : cols[3], extra ? extra.windows : 2, extra ? extra.balcao : true],
  ];
  let g = '';
  for (const [k, x, y, w, wall, win, bal] of items) {
    const svg = k === 'palm' ? palmSVG() : k === 'church' ? churchSVG() : houseSVG({ wall, windows: win, balcao: bal });
    const ratio = k === 'palm' ? 2 : k === 'church' ? 1.1 : 190 / 220;
    g += `<image href="${enc(svg)}" x="${x}" y="${y + (k === 'palm' ? -20 : 0)}" width="${w}" height="${w * ratio}"/>`;
  }
  return `<svg viewBox="0 0 620 120" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${g}</svg>`;
}

/* ---------- Azulejo tiles (blue and white Portuguese tiles, as seen in Fontainhas, Panjim) ---------- */
const BLUE = '#1F4E9E', CREAM = '#F7F3EA', GOLD = '#E1A92B';
const MOTIFS = {
  flower: `<g fill="${BLUE}"><ellipse cx="50" cy="30" rx="9" ry="16"/><ellipse cx="50" cy="70" rx="9" ry="16"/><ellipse cx="30" cy="50" rx="16" ry="9"/><ellipse cx="70" cy="50" rx="16" ry="9"/></g><circle cx="50" cy="50" r="8" fill="${GOLD}"/>
    <g fill="${BLUE}"><path d="M0 0 h18 a18 18 0 0 1 -18 18Z"/><path d="M100 0 v18 a18 18 0 0 1 -18 -18Z"/><path d="M0 100 v-18 a18 18 0 0 1 18 18Z"/><path d="M100 100 h-18 a18 18 0 0 1 18 -18Z"/></g>`,
  diamond: `<path d="M50 12 L88 50 L50 88 L12 50Z" fill="none" stroke="${BLUE}" stroke-width="7"/><path d="M50 32 L68 50 L50 68 L32 50Z" fill="${BLUE}"/><g fill="${GOLD}"><circle cx="50" cy="4" r="4"/><circle cx="96" cy="50" r="4"/><circle cx="50" cy="96" r="4"/><circle cx="4" cy="50" r="4"/></g>`,
  arc: `<path d="M0 0 H60 A60 60 0 0 1 0 60Z" fill="${BLUE}"/><path d="M0 0 H34 A34 34 0 0 1 0 34Z" fill="${CREAM}"/><path d="M0 0 H18 A18 18 0 0 1 0 18Z" fill="${GOLD}"/><path d="M70 82 q12 -22 24 -8 q-10 18 -24 8Z" fill="${BLUE}"/>`,
  star: `<path d="M50 8 L58 36 L86 26 L68 50 L86 74 L58 64 L50 92 L42 64 L14 74 L32 50 L14 26 L42 36Z" fill="${BLUE}"/><circle cx="50" cy="50" r="10" fill="${CREAM}"/><circle cx="50" cy="50" r="5" fill="${GOLD}"/>`,
  boat: `<path d="M14 62 H86 L74 78 H26Z" fill="${BLUE}"/><path d="M50 20 V60 M50 22 L76 56 H50" stroke="${BLUE}" stroke-width="4" fill="none"/><path d="M8 86 q10 -6 20 0 t20 0 t20 0 t20 0" stroke="${BLUE}" stroke-width="3" fill="none"/>`,
  leaf: `<path d="M50 10 C80 30 80 70 50 90 C20 70 20 30 50 10Z" fill="${BLUE}"/><path d="M50 18 V84" stroke="${CREAM}" stroke-width="3"/><g fill="${GOLD}"><circle cx="12" cy="12" r="6"/><circle cx="88" cy="88" r="6"/></g>`,
};
export const TILE_KINDS = Object.keys(MOTIFS);
export function tileSVG(kind = 'flower', rot = 0, alt = false) {
  const bg = alt ? '#DCE7F7' : CREAM;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="${bg}"/><g transform="rotate(${rot} 50 50)">${MOTIFS[kind]}</g><rect x="1" y="1" width="98" height="98" fill="none" stroke="#C9D3E6" stroke-width="2"/></svg>`;
}
/** CSS background url for a repeating azulejo band. */
export const tileURL = (kind = 'flower') => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(tileSVG(kind))}")`;
