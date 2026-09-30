/* art.js - original line drawings (120 x 84) used in the concept steps, and a strata banner for each tab.
   Each drawing is a function that returns SVG markup; ART.fig(name) wraps it in an <svg>. */
(function (g) {
  const { ML } = g;
  const INK = '#16191C', RED = '#841617', SL = '#5C6670', GR = '#C9CDD2', GOLD = '#D9A21B', PUR = '#7A4F8F', TEAL = '#1F8A84';
  const CL = ['#3B6FB6', '#E0703C', '#4E9F3D', '#B04A9E'];
  const ART = {};

  const dot = (x, y, f, r, st) => `<circle cx="${(+x).toFixed(1)}" cy="${(+y).toFixed(1)}" r="${r || 3.4}" fill="${f}"${st ? ` stroke="${st}" stroke-width="1.8"` : ''}/>`;
  const ln = (a, b, c, d, s, w, dash) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${s || INK}" stroke-width="${w || 2}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`;
  const rc = (x, y, w, h, f, s, sw) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f || 'none'}"${s ? ` stroke="${s}" stroke-width="${sw || 1.4}"` : ''}/>`;
  const tx = (x, y, s, sz, f, a, wt) => `<text x="${x}" y="${y}" font-size="${sz || 9}" fill="${f || INK}" text-anchor="${a || 'middle'}" font-weight="${wt || 600}" font-family="system-ui,sans-serif">${s}</text>`;
  const head = (x, y, ang, f) => `<path d="M0 0 l-7 -4 v8 z" fill="${f || INK}" transform="translate(${x} ${y}) rotate(${ang})"/>`;
  const arrow = (a, b, c, d, s) => ln(a, b, c, d, s, 2) + head(c, d, Math.atan2(d - b, c - a) * 180 / Math.PI, s);
  const blob = (r, cx, cy, sx, sy, n, f, rad) => { let s = ''; for (let i = 0; i < n; i++) s += dot(cx + sx * ML.gauss(r), cy + sy * ML.gauss(r), f, rad || 3.2); return s; };
  const poly = (pts, f, s, sw) => `<polygon points="${pts.map(p => p.join(',')).join(' ')}" fill="${f || 'none'}"${s ? ` stroke="${s}" stroke-width="${sw || 1.6}"` : ''}/>`;

  const F = {
    table() {
      let s = rc(6, 6, 108, 72, '#fff', GR, 1.2);
      const heads = ['GR', 'Dens', 'Sonic', 'Rock']; heads.forEach((h, i) => { s += tx(19 + i * 27, 16, h, 8.5, i === 3 ? RED : SL); });
      s += ln(6, 20, 114, 20, GR, 1.2);
      const rows = [['62', '2.4', '88'], ['118', '2.6', '95'], ['31', '2.7', '56'], ['54', '2.3', '84']];
      rows.forEach((r, j) => { r.forEach((v, i) => { s += tx(19 + i * 27, 32 + j * 13, v, 8.5, INK, 'middle', 500); }); s += tx(100, 32 + j * 13, '?', 11, RED, 'middle', 800); });
      return s;
    },
    bunches() {
      const r = ML.rng(3); let s = ''; [[30, 28], [88, 26], [62, 62]].forEach(c => { s += `<ellipse cx="${c[0]}" cy="${c[1]}" rx="24" ry="17" fill="none" stroke="${SL}" stroke-width="1.4" stroke-dasharray="4 3"/>` + blob(r, c[0], c[1], 8, 6, 9, '#8A929A', 3); });
      return s;
    },
    kmeans() {
      const r = ML.rng(4); let s = ''; [[28, 26, CL[0]], [90, 28, CL[1]], [60, 64, CL[2]]].forEach(c => { s += blob(r, c[0], c[1], 9, 7, 8, c[2], 3); s += `<circle cx="${c[0] + 4}" cy="${c[1] - 3}" r="6" fill="#fff" stroke="${INK}" stroke-width="2"/>` + tx(c[0] + 4, c[1] - 0.5, '×', 10, INK, 'middle', 800); });
      return s + arrow(50, 44, 40, 34, SL);
    },
    som() {
      const r = ML.rng(5); let s = blob(r, 60, 42, 26, 16, 34, '#8A929A', 2.8); const P = [];
      for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) P.push([18 + i * 21 + 3 * Math.sin(j + i), 14 + j * 18 + 4 * Math.cos(i)]);
      for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { const p = P[j * 5 + i]; if (i < 4) s += ln(p[0], p[1], P[j * 5 + i + 1][0], P[j * 5 + i + 1][1], INK, 1.3); if (j < 3) s += ln(p[0], p[1], P[(j + 1) * 5 + i][0], P[(j + 1) * 5 + i][1], INK, 1.3); }
      P.forEach((p, k) => { s += dot(p[0], p[1], CL[(k + Math.floor(k / 5)) % 4], 4.6, INK); });
      return s;
    },
    check() {
      const r = ML.rng(6); let s = ''; [[30, 28, CL[0], GOLD], [90, 28, CL[1], PUR], [60, 62, CL[2], TEAL]].forEach(c => { for (let i = 0; i < 8; i++) { const x = c[0] + 9 * ML.gauss(r), y = c[1] + 7 * ML.gauss(r); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.4" fill="${c[2]}" stroke="${c[3]}" stroke-width="2"/>`; } });
      return s;
    },
    labels() {
      const r = ML.rng(7); let s = ''; [[30, 32, GOLD, 'sand'], [88, 30, PUR, 'shale'], [60, 56, TEAL, 'lime']].forEach(c => { s += blob(r, c[0], c[1], 7, 5, 8, c[2], 3.2) + tx(c[0], c[1] + (c[1] > 50 ? 22 : -14), c[3], 8.5, c[2], 'middle', 700); });
      return s;
    },
    boundary() {
      const r = ML.rng(8); return blob(r, 34, 40, 10, 12, 12, GOLD, 3.2) + blob(r, 88, 44, 10, 12, 12, PUR, 3.2) + ln(60, 4, 62, 80, INK, 2.4, '5 4');
    },
    split() {
      const r = ML.rng(9); let s = ''; for (let i = 0; i < 14; i++) { const c = i % 2 ? [88, 44, PUR] : [34, 40, GOLD]; const x = c[0] + 11 * ML.gauss(r), y = c[1] + 12 * ML.gauss(r); s += i < 9 ? dot(x, y, c[2], 3.4) : `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#fff" stroke="${c[2]}" stroke-width="2"/>`; }
      return s + ln(60, 4, 62, 80, INK, 2, '5 4') + tx(30, 80, 'train', 8, SL) + tx(92, 80, 'test', 8, SL);
    },
    overfit() {
      const r = ML.rng(10); let s = blob(r, 32, 42, 10, 13, 10, GOLD, 3.2) + blob(r, 88, 42, 10, 13, 10, PUR, 3.2);
      return s + `<path d="M58 4 C70 14 48 20 60 28 C74 36 46 44 60 52 C72 60 52 68 62 80" fill="none" stroke="${INK}" stroke-width="2.4"/>`;
    },
    spread() {
      const r = ML.rng(11); let s = ''; for (let i = 0; i < 24; i++) { const t = (i - 12) * 3.6; s += dot(60 + t + 3 * ML.gauss(r), 42 - t * 0.55 + 5 * ML.gauss(r), '#8A929A', 3); }
      return s + arrow(24, 68, 98, 18, RED) + arrow(60, 42, 78, 62, INK) + tx(102, 16, 'PC1', 9, RED, 'start', 800) + tx(80, 76, 'PC2', 9, INK, 'start', 800);
    },
    flatten() {
      const r = ML.rng(12); let s = ''; for (let i = 0; i < 14; i++) s += dot(22 + 6 * ML.gauss(r) + i * 1.6, 34 + 10 * ML.gauss(r) - i, '#8A929A', 2.8);
      s += arrow(46, 42, 66, 42, INK); s += rc(70, 22, 40, 40, '#fff', GR, 1.2); for (let i = 0; i < 14; i++) s += dot(90 + 10 * ML.gauss(r), 42 + 7 * ML.gauss(r), RED, 2.6);
      return s + tx(90, 74, 'PC1, PC2', 8.5, SL);
    },
    loadings() {
      let s = ln(10, 42, 110, 42, GR, 1.4); [['GR', 22, 0.55], ['Dens', 46, -0.35], ['Sonic', 70, 0.6], ['Nphi', 96, 0.5]].forEach(b => { const h = b[2] * 30; s += rc(b[1] - 7, h > 0 ? 42 - h : 42, 14, Math.abs(h), b[2] > 0 ? RED : SL) + tx(b[1], 80, b[0], 7, SL); });
      return s;
    },
    elbow() {
      let s = ln(14, 10, 14, 68, GR, 1.4) + ln(14, 68, 110, 68, GR, 1.4); const pts = [[20, 14], [40, 38], [60, 54], [80, 60], [100, 63]];
      s += `<polyline points="${pts.map(p => p.join(',')).join(' ')}" fill="none" stroke="${SL}" stroke-width="2.4"/>` + pts.map(p => dot(p[0], p[1], SL, 3)).join('') + dot(60, 54, RED, 5.5);
      return s + tx(62, 80, 'number of groups', 8, SL);
    },
    fewlabels() {
      const r = ML.rng(13); let s = blob(r, 60, 42, 30, 16, 30, '#B4BAC1', 3); [[30, 34, GOLD], [86, 30, PUR], [62, 62, TEAL]].forEach(c => { s += dot(c[0], c[1], c[2], 6.5, INK); });
      return s;
    },
    spreadlabels() {
      const r = ML.rng(14); let s = ''; const c0 = [34, 40], c1 = [88, 44]; s += blob(r, c0[0], c0[1], 9, 10, 10, '#B4BAC1', 3) + blob(r, c1[0], c1[1], 9, 10, 10, '#B4BAC1', 3);
      s += dot(c0[0], c0[1], GOLD, 6.5, INK) + dot(c1[0], c1[1], PUR, 6.5, INK);
      [[-10, -8], [8, -10], [-6, 12], [12, 8]].forEach(d => { s += arrow(c0[0], c0[1], c0[0] + d[0] * 1.7, c0[1] + d[1] * 1.7, GOLD); s += arrow(c1[0], c1[1], c1[0] + d[0] * 1.7, c1[1] + d[1] * 1.7, PUR); });
      return s;
    },
    neuron() {
      let s = ''; [16, 42, 68].forEach((y, i) => { s += dot(14, y, '#fff', 6, INK) + tx(14, y + 3, 'x' + (i + 1), 7.5, INK) + ln(20, y, 62, 42, i === 1 ? RED : SL, 1.6 + i * 0.4); s += tx(40, y + (y < 42 ? -3 : y > 42 ? 12 : -4), ['w1', 'w2', 'w3'][i], 7.5, SL); });
      return s + `<circle cx="70" cy="42" r="9" fill="#fff" stroke="${INK}" stroke-width="2"/>` + tx(70, 45, 'Σ', 10, INK) + arrow(80, 42, 108, 42, INK) + tx(100, 34, 'out', 8, SL);
    },
    layers() {
      const L = [3, 4, 4, 2], xs = [16, 44, 76, 104]; let s = ''; const y = (l, i) => 42 + (i - (L[l] - 1) / 2) * 17;
      for (let l = 0; l < 3; l++) for (let i = 0; i < L[l]; i++) for (let j = 0; j < L[l + 1]; j++) s += ln(xs[l], y(l, i), xs[l + 1], y(l + 1, j), (i + j) % 3 ? SL : RED, 1.1).replace('/>', ' stroke-opacity="0.45"/>');
      for (let l = 0; l < 4; l++) for (let i = 0; i < L[l]; i++) s += dot(xs[l], y(l, i), '#fff', 5.2, INK);
      return s + tx(16, 82, 'in', 8, SL) + tx(60, 82, 'hidden', 8, SL) + tx(104, 82, 'out', 8, SL);
    },
    loss() {
      let s = ln(14, 8, 14, 66, GR, 1.4) + ln(14, 66, 112, 66, GR, 1.4); s += `<path d="M16 12 C28 40 40 54 58 58 C76 62 92 62 110 63" fill="none" stroke="${RED}" stroke-width="3"/>`;
      return s + tx(64, 78, 'more passes', 8, SL) + tx(30, 10, 'loss', 8, SL);
    },
    ring() {
      const r = ML.rng(15); let s = ''; for (let i = 0; i < 26; i++) s += dot(10 + 100 * r(), 6 + 72 * r(), '#B4BAC1', 2.8); for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; s += dot(60 + 25 * Math.cos(a), 42 + 25 * Math.sin(a), RED, 3.2); }
      return s + `<circle cx="60" cy="42" r="25" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>`;
    },
    pixels() {
      const pat = ['..##..', '.####.', '.#..#.', '.####.', '..##..', '......']; let s = '';
      pat.forEach((row, j) => [...row].forEach((c, i) => { s += rc(14 + i * 14, 4 + j * 12, 13, 11, c === '#' ? '#2A2A2E' : '#F1DFC3', '#fff', 0.8); s += tx(20.5 + i * 14, 12.5 + j * 12, c === '#' ? '9' : '2', 6.5, c === '#' ? '#ddd' : '#8a7a60', 'middle', 500); }));
      return s;
    },
    kernel() {
      let s = ''; for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) s += rc(8 + i * 11, 10 + j * 11, 11, 11, '#F4F6F7', GR, 1);
      s += rc(19, 21, 33, 33, 'rgba(132,22,23,0.18)', RED, 2.2) + arrow(58, 40, 72, 40, INK);
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) s += rc(78 + i * 11, 24 + j * 11, 11, 11, i === 1 && j === 1 ? RED : '#F4F6F7', GR, 1);
      return s + tx(30, 76, 'filter', 8, RED) + tx(92, 76, 'feature map', 7.5, SL);
    },
    buildup() {
      let s = ''; [[6, 'edges'], [44, 'parts'], [82, 'object']].forEach((t, k) => { s += rc(t[0], 12, 32, 42, '#fff', GR, 1.2) + tx(t[0] + 16, 70, t[1], 8, SL); if (k < 2) s += arrow(t[0] + 34, 33, t[0] + 42, 33, INK); });
      s += ln(12, 44, 34, 20, INK, 2) + ln(16, 22, 34, 44, INK, 2) + dot(56, 28, INK, 3.4) + dot(70, 28, INK, 3.4) + dot(63, 44, INK, 3.4);
      return s + `<circle cx="98" cy="30" r="12" fill="#D9B98B" stroke="${INK}" stroke-width="1.4"/>` + dot(93, 28, INK, 2.6) + dot(103, 28, INK, 2.6) + dot(98, 36, INK, 2.2);
    },
    mask() {
      return poly([[22, 30], [46, 14], [82, 20], [98, 44], [80, 68], [40, 66], [20, 50]], '#DCE3E8', SL, 1.4) + poly([[22, 30], [46, 14], [82, 20], [98, 44], [80, 68], [40, 66], [20, 50]], 'rgba(255,230,0,0.25)', '#E6C800', 3) + dot(58, 42, '#fff', 4.4, INK);
    },
    three() {
      let s = ''; [[10, 10, 100, 64, 'rgba(230,200,0,0.10)', 'group'], [22, 18, 70, 46, 'rgba(230,200,0,0.20)', 'grain'], [30, 26, 24, 28, 'rgba(230,200,0,0.35)', 'part']].forEach(b => { s += `<rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" rx="10" fill="${b[4]}" stroke="#C9A800" stroke-width="2"/>`; });
      return s + dot(42, 40, '#fff', 4, INK) + tx(20, 80, 'part', 8, SL) + tx(60, 80, 'grain', 8, SL) + tx(100, 80, 'group', 8, SL);
    },
    everything() {
      const cols = ['#E4A9A0', '#A9C4E4', '#B9E4A9', '#E4D7A9', '#D2A9E4', '#A9E4DD']; let s = ''; const cells = [[4, 4, 38, 28], [42, 4, 40, 34], [82, 4, 34, 26], [4, 32, 30, 48], [34, 38, 40, 42], [74, 30, 42, 50]];
      cells.forEach((c, i) => { s += rc(c[0], c[1], c[2], c[3], cols[i], '#fff', 2); });
      return s;
    },
    names() {
      let s = ''; const cells = [[4, 4, 50, 34, '#E4A9A0'], [54, 4, 62, 34, '#A9C4E4'], [4, 38, 40, 42, '#B9E4A9'], [44, 38, 72, 42, '#E4D7A9']]; cells.forEach(c => { s += rc(c[0], c[1], c[2], c[3], c[4], '#fff', 2) + tx(c[0] + c[2] / 2, c[1] + c[3] / 2 + 6, '?', 18, INK, 'middle', 800); });
      return s;
    },
    llm() {
      let s = tx(60, 12, 'next word: ___', 9, INK); [['66', 0.7], ['65', 0.16], ['67', 0.08], ['64', 0.04]].forEach((b, i) => { const h = b[1] * 46; s += rc(18 + i * 22, 66 - h, 16, h, i === 0 ? RED : '#8A929A') + tx(26 + i * 22, 78, b[0], 8, SL); });
      return s;
    },
    seismic() {
      let s = ''; for (let i = 0; i < 9; i++) { let d = `M${12 + i * 12} 6`; for (let k = 1; k <= 14; k++) d += ` L${12 + i * 12 + 5 * Math.sin(k * 1.7 + i * 0.6) * (k > 5 && k < 10 ? 1.6 : 0.6)} ${6 + k * 5}`; s += `<path d="${d}" fill="none" stroke="${INK}" stroke-width="1.2"/>`; }
      return s;
    },
    attribute() {
      let s = `<path d="M8 42 C16 20 22 62 30 42 S44 10 52 42 S66 66 74 42 S92 20 112 42" fill="none" stroke="${SL}" stroke-width="2"/>`;
      return s + rc(40, 12, 40, 60, 'rgba(132,22,23,0.12)', RED, 1.6) + tx(60, 82, 'window → one number', 8, RED);
    },
    facies() {
      return `<path d="M0 22 C30 6 50 42 80 26 S110 14 120 24 L120 44 C100 38 80 56 60 50 S20 26 0 40 Z" fill="${GOLD}"/><path d="M0 0 H120 V22 C110 14 100 10 80 26 C50 42 30 6 0 22 Z" fill="#8F8AA0"/><path d="M0 40 C20 26 40 50 60 50 S100 38 120 44 V84 H0 Z" fill="#8F8AA0"/><path d="M0 22 C30 6 50 42 80 26 S110 14 120 24 M0 40 C20 26 40 50 60 50 S100 38 120 44" fill="none" stroke="#B98A55" stroke-width="5" opacity=".7"/>`;
    },
    wells() {
      const r = ML.rng(16); let s = '<path d="M0 46 C30 24 50 60 80 40 S110 30 120 40 L120 54 C100 48 80 68 56 60 S20 40 0 60 Z" fill="' + GOLD + '"/>'; [[24, 58], [58, 30], [92, 62], [100, 26], [40, 20]].forEach(w => { s += dot(w[0], w[1], '#fff', 5.5, INK); }); return s;
    },
    core() {
      let s = rc(8, 6, 26, 72, '#EFE9DC', INK, 1.4); [[6, GOLD], [24, PUR], [40, TEAL], [58, GOLD]].forEach((b, i, a) => { s += rc(8, b[0], 26, (a[i + 1] ? a[i + 1][0] : 78) - b[0], b[1]); });
      return s + `<path d="M52 6 C68 14 44 26 62 34 S72 52 56 60 S70 74 60 78" fill="none" stroke="${INK}" stroke-width="2"/><path d="M84 6 C92 16 100 22 90 34 S78 52 96 62 S86 74 92 78" fill="none" stroke="${RED}" stroke-width="2"/>`;
    },
    elements() {
      let s = ln(8, 66, 112, 66, GR, 1.4); [['Li', 10], ['Cs', 6], ['Rb', 30], ['Ta', 4], ['K', 58], ['Mg', 42]].forEach((b, i) => { s += rc(12 + i * 17, 66 - b[1], 12, b[1], i < 4 ? RED : SL) + tx(18 + i * 17, 78, b[0], 8, SL); });
      return s;
    },
    depmap() {
      const r = ML.rng(17); let s = ''; for (let i = 0; i < 30; i++) s += dot(6 + 108 * r(), 6 + 72 * r(), '#C9CDD2', 2.4); [[44, 34], [52, 40], [48, 28], [60, 36], [56, 46]].forEach(d => { s += dot(d[0], d[1], RED, 3.6); });
      return s;
    },
    shell() {
      return `<path d="M60 10 C90 10 108 34 100 56 C96 68 74 76 60 76 C46 76 24 68 20 56 C12 34 30 10 60 10 Z" fill="#E6D3B0" stroke="${INK}" stroke-width="2"/>` + [0, 1, 2, 3].map(i => `<path d="M${30 + i * 4} ${58 - i * 6} C50 ${24 + i * 3} 70 ${24 + i * 3} ${90 - i * 4} ${58 - i * 6}" fill="none" stroke="#B9A57C" stroke-width="1.6"/>`).join('') + ln(60, 76, 60, 10, SL, 1.2, '3 3');
    },
    fewdots() {
      const r = ML.rng(18); let s = ln(14, 8, 14, 70, GR, 1.4) + ln(14, 70, 112, 70, GR, 1.4); for (let i = 0; i < 4; i++) s += dot(30 + 22 * i, 36 + 18 * ML.gauss(r), RED, 3.6);
      return s + tx(62, 80, 'few samples', 8, SL);
    },
    neighbors() {
      const r = ML.rng(19); let s = ''; for (let j = 0; j < 4; j++) for (let i = 0; i < 6; i++) s += dot(14 + i * 18, 12 + j * 18, i < 3 ? GOLD : PUR, 4.6);
      return s + `<circle cx="50" cy="30" r="8" fill="none" stroke="${INK}" stroke-width="2"/><circle cx="68" cy="30" r="8" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3 2"/>` + tx(60, 82, 'test and train touch', 8, RED);
    },
    rare() {
      const r = ML.rng(20); let s = ''; for (let i = 0; i < 50; i++) s += dot(6 + 108 * r(), 6 + 72 * r(), '#B4BAC1', 2.6);
      return s + dot(84, 40, RED, 4.6) + `<circle cx="84" cy="40" r="9" fill="none" stroke="${RED}" stroke-width="1.6"/>`;
    },
    file() {
      return `<path d="M30 8 H72 L92 28 V76 H30 Z" fill="#fff" stroke="${INK}" stroke-width="2"/><path d="M72 8 V28 H92" fill="none" stroke="${INK}" stroke-width="2"/>` + [36, 46, 56, 66].map((y, i) => ln(38, y, 84, y, i === 0 ? RED : GR, 3)).join('') + arrow(100, 60, 100, 40, SL);
    },
    tick() {
      return `<circle cx="60" cy="42" r="26" fill="none" stroke="${TEAL}" stroke-width="5"/><path d="M46 42 L56 52 L76 30" fill="none" stroke="${TEAL}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    magnify() {
      const r = ML.rng(21); let s = blob(r, 50, 42, 20, 14, 14, '#B4BAC1', 3); return s + `<circle cx="68" cy="36" r="16" fill="rgba(255,255,255,.6)" stroke="${INK}" stroke-width="3"/>` + ln(80, 48, 100, 68, INK, 5);
    }
  };

  ART.names = Object.keys(F);
  ART.fig = name => (F[name] ? `<svg viewBox="0 0 120 84" role="img" aria-hidden="true">${F[name]()}</svg>` : '');

  /* strata banner: wavy layers, dark on top to light below, in the tab's accent color */
  function mix(hex, t, to) { const n = parseInt(hex.slice(1), 16), a = [n >> 16, (n >> 8) & 255, n & 255], b = to || [255, 255, 255]; return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; }
  ART.banner = function (seed, hex) {
    const r = ML.rng(seed * 131 + 7), W = 800, Hh = 110, n = 8; let out = `<svg viewBox="0 0 ${W} ${Hh}" preserveAspectRatio="none" aria-hidden="true">`;
    out += `<rect width="${W}" height="${Hh}" fill="${mix(hex, 0.45, [0, 0, 0])}"/>`;
    for (let i = 0; i < n; i++) {
      const y0 = 26 + i * 11, amp = 3 + 5 * r(), ph = r() * 6.28, fr = 0.006 + 0.008 * r(); let d = `M0 ${Hh} L0 ${y0}`;
      for (let x = 0; x <= W; x += 20) d += ` L${x} ${(y0 + amp * Math.sin(x * fr + ph) + 2.5 * Math.sin(x * fr * 3.1 + i)).toFixed(1)}`;
      d += ` L${W} ${Hh} Z`; out += `<path d="${d}" fill="${i % 2 ? mix(hex, 0.12 + i * 0.07) : mix(hex, i * 0.06, [255, 255, 255])}" opacity="0.96"/>`;
    }
    return out + '</svg>';
  };
  g.ART = ART;
})(window);
