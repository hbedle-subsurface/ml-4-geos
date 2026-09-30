/* lidarlab.js - a made-up LiDAR scene (96 x 96 cells, 1 m each) with five land-cover classes, the height
   above ground that a LiDAR survey would give for it, a matching aerial photo, and the filters used in the tab. */
(function (g) {
  const ML = g.ML;
  const L = { N: 96 };
  const N = L.N;
  L.CLS = ['Bare soil', 'Grass', 'Shrubs', 'Trees', 'Roofs'];
  L.SHORT = ['Soil', 'Grass', 'Shrub', 'Tree', 'Roof'];
  L.CCOL = ['#C9A66B', '#9BCB5A', '#5E8C31', '#1F5E3A', '#B5462E'];
  const PHOTO = [[176, 150, 112], [168, 160, 102], [92, 122, 62], [70, 106, 56], [142, 128, 126]];

  L.scene = function (seed) {
    const r = ML.rng(seed || 11), cls = new Uint8Array(N * N), h = new Float32Array(N * N), img = new Float32Array(N * N * 3);
    const f = (x, y) => Math.sin(x * 0.09 + 1.3) * Math.sin(y * 0.07 + 0.4) + 0.6 * Math.sin(x * 0.21 + y * 0.13 + 2) + 0.25 * Math.sin(x * 0.5 + y * 0.4);
    const tex = new Float32Array(N * N); for (let i = 0; i < tex.length; i++) tex[i] = ML.gauss(r);
    const base = new Uint8Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) base[y * N + x] = f(x, y) > -0.3 ? 1 : 0;
    const shrub = new Float32Array(N * N), tree = new Float32Array(N * N), roof = new Float32Array(N * N);
    const rects = [];
    for (let k = 0, tries = 0; k < 4 && tries < 200; tries++) {
      const w = 9 + Math.floor(r() * 6), d = 8 + Math.floor(r() * 5), x0 = 4 + Math.floor(r() * (N - w - 8)), y0 = 4 + Math.floor(r() * (N - d - 8));
      if (rects.some(q => x0 < q[0] + q[2] + 8 && x0 + w + 8 > q[0] && y0 < q[1] + q[3] + 8 && y0 + d + 8 > q[1])) continue;
      rects.push([x0, y0, w, d, 5 + 3 * r()]); k++;
    }
    rects.forEach(q => { for (let y = q[1]; y < q[1] + q[3]; y++) for (let x = q[0]; x < q[0] + q[2]; x++) roof[y * N + x] = q[4]; });
    const nearRoof = (x, y, m) => rects.some(q => x > q[0] - m && x < q[0] + q[2] + m && y > q[1] - m && y < q[1] + q[3] + m);
    // tree stands
    for (let s = 0, tries = 0; s < 5 && tries < 100; tries++) {
      const cx = 10 + r() * (N - 20), cy = 10 + r() * (N - 20), R = 11 + r() * 7; if (nearRoof(cx, cy, R * 0.6)) continue; s++;
      const nc = 9 + Math.floor(r() * 7);
      for (let c = 0; c < nc; c++) {
        const a = r() * 6.283, d = R * Math.sqrt(r()), px = cx + d * Math.cos(a), py = cy + d * Math.sin(a), cr = 2.4 + 2 * r(), H = 8 + 9 * r();
        if (nearRoof(px, py, cr + 2)) continue;
        for (let y = Math.max(0, Math.floor(py - cr)); y < Math.min(N, Math.ceil(py + cr)); y++) for (let x = Math.max(0, Math.floor(px - cr)); x < Math.min(N, Math.ceil(px + cr)); x++) {
          const dd = Math.hypot(x - px, y - py) / cr; if (dd < 1) tree[y * N + x] = Math.max(tree[y * N + x], H * Math.sqrt(1 - dd * dd) * (0.9 + 0.2 * Math.abs(tex[y * N + x] % 1)));
        }
      }
    }
    // shrub clumps
    for (let s = 0; s < 110; s++) {
      const px = 3 + r() * (N - 6), py = 3 + r() * (N - 6), cr = 1.8 + 1.8 * r(), H = 1.3 + 1.4 * r(); if (nearRoof(px, py, cr + 2)) continue;
      for (let y = Math.max(0, Math.floor(py - cr)); y < Math.min(N, Math.ceil(py + cr)); y++) for (let x = Math.max(0, Math.floor(px - cr)); x < Math.min(N, Math.ceil(px + cr)); x++) {
        const dd = Math.hypot(x - px, y - py) / cr; if (dd < 1) shrub[y * N + x] = Math.max(shrub[y * N + x], H * (0.75 + 0.25 * Math.cos(tex[y * N + x] * 2)) * Math.sqrt(1 - dd * dd));
      }
    }
    for (let i = 0; i < N * N; i++) {
      let c, hh;
      if (roof[i] > 0) { c = 4; hh = roof[i] + 0.05 * tex[i]; }
      else if (tree[i] > 1.5) { c = 3; hh = tree[i]; }
      else if (shrub[i] > 0.6) { c = 2; hh = shrub[i]; }
      else if (base[i]) { c = 1; hh = 0.35 + 0.07 * tex[i]; }
      else { c = 0; hh = 0.02 + 0.015 * tex[i]; }
      cls[i] = c; h[i] = Math.max(0, hh);
    }
    // aerial photo: class color plus hillshade, with heavy overlap between soil and dry grass and between shrubs and trees
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x, dx = (h[y * N + Math.min(N - 1, x + 1)] - h[y * N + Math.max(0, x - 1)]) / 2, dy = (h[Math.min(N - 1, y + 1) * N + x] - h[Math.max(0, y - 1) * N + x]) / 2;
      const sh = Math.max(0.55, Math.min(1.25, 1 - 0.09 * (dx + dy))), col = PHOTO[cls[i]];
      for (let k = 0; k < 3; k++) img[i * 3 + k] = Math.max(0, Math.min(255, col[k] * sh + 13 * ML.gauss(r)));
    }
    const RET = [1.0, 1.15, 1.6, 2.6, 1.02], ret = new Float32Array(N * N); for (let i = 0; i < ret.length; i++) ret[i] = RET[cls[i]];
    const unit = new Float32Array(N * N), unit2 = new Float32Array(N * N); for (let i = 0; i < unit.length; i++) { unit[i] = ML.gauss(r); unit2[i] = ML.gauss(r); }
    return { cls, h, ret, img, unit, unit2, rects };
  };

  /* what a survey with `density` points per square meter would give: the true heights and the average number of
     returns per laser pulse, each plus noise that shrinks as the density goes up */
  L.observe = function (sc, density) {
    const sd = 0.9 / Math.sqrt(density), sr = 0.6 / Math.sqrt(density), h = new Float32Array(N * N), ret = new Float32Array(N * N);
    for (let i = 0; i < h.length; i++) { h[i] = sc.h[i] + sd * sc.unit[i]; ret[i] = Math.max(1, sc.ret[i] + sr * sc.unit2[i]); }
    return { h, ret };
  };

  const at = (a, x, y) => a[Math.max(0, Math.min(N - 1, y)) * N + Math.max(0, Math.min(N - 1, x))];
  L.smooth = function (a, size) { const o = new Float32Array(N * N), k = (size - 1) / 2; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) s += at(a, x + i, y + j); o[y * N + x] = s / (size * size); } return o; };
  L.median = function (a, size) { const o = new Float32Array(N * N), k = (size - 1) / 2, n = size * size, buf = new Float32Array(n), mid = (n - 1) >> 1; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let m = 0; for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) buf[m++] = at(a, x + i, y + j); buf.sort(); o[y * N + x] = buf[mid]; } return o; };
  L.rough = function (a, size) { const o = new Float32Array(N * N), k = (size - 1) / 2, n = size * size; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0, q = 0; for (let j = -k; j <= k; j++) for (let i = -k; i <= k; i++) { const v = at(a, x + i, y + j); s += v; q += v * v; } const m = s / n; o[y * N + x] = Math.sqrt(Math.max(0, q / n - m * m)); } return o; };
  L.edges = function (a) { const b = L.smooth(a, 3), o = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const gx = at(b, x + 1, y - 1) + 2 * at(b, x + 1, y) + at(b, x + 1, y + 1) - at(b, x - 1, y - 1) - 2 * at(b, x - 1, y) - at(b, x - 1, y + 1), gy = at(b, x - 1, y + 1) + 2 * at(b, x, y + 1) + at(b, x + 1, y + 1) - at(b, x - 1, y - 1) - 2 * at(b, x, y - 1) - at(b, x + 1, y - 1); o[y * N + x] = Math.hypot(gx, gy) / 8; } return o; };

  /* layer 2: combine typical height and average returns. T = { a: grass starts, b: shrubs start, c: tall things start, q: tall things with fewer returns than this are roofs } */
  L.classify = function (hm, rm, T) { const o = new Uint8Array(N * N); for (let i = 0; i < o.length; i++) { const h = hm[i]; o[i] = h < T.a ? 0 : h < T.b ? 1 : h < T.c ? 2 : (rm[i] < T.q ? 4 : 3); } return o; };
  L.accuracy = (pred, truth, idx) => { let ok = 0, n = 0; if (idx) { idx.forEach(i => { n++; if (pred[i] === truth[i]) ok++; }); } else for (let i = 0; i < pred.length; i++) { n++; if (pred[i] === truth[i]) ok++; } return ok / n; };
  L.confusion = (pred, truth) => { const m = Array.from({ length: 5 }, () => new Array(5).fill(0)); for (let i = 0; i < pred.length; i++) m[truth[i]][pred[i]]++; return m; };

  /* learn the four thresholds from labeled pixels by scanning each one in turn */
  L.tune = function (hm, rm, truth, idx, T0) {
    const T = Object.assign({}, T0), grid = { a: [0.05, 0.6, 0.01], b: [0.4, 2.0, 0.02], c: [2, 8, 0.1], q: [1.1, 2.4, 0.02] };
    for (let pass = 0; pass < 3; pass++) for (const k of ['a', 'b', 'c', 'q']) {
      let best = -1, bv = T[k]; for (let v = grid[k][0]; v <= grid[k][1] + 1e-9; v += grid[k][2]) { T[k] = v; const acc = L.accuracy(L.classify(hm, rm, T), truth, idx); if (acc > best + 1e-9) { best = acc; bv = v; } }
      T[k] = Math.round(bv * 100) / 100;
    }
    return T;
  };

  /* color-only classifier: nearest class-average color, learned from the same labeled pixels */
  L.colorOnly = function (sc, idx) {
    const s = Array.from({ length: 5 }, () => [0, 0, 0, 0]); idx.forEach(i => { const c = sc.cls[i]; for (let k = 0; k < 3; k++) s[c][k] += sc.img[i * 3 + k]; s[c][3]++; });
    const m = s.map(v => [v[0] / Math.max(1, v[3]), v[1] / Math.max(1, v[3]), v[2] / Math.max(1, v[3])]), o = new Uint8Array(N * N);
    for (let i = 0; i < o.length; i++) { let b = 0, bd = 1e9; m.forEach((c, j) => { const d = (sc.img[i * 3] - c[0]) ** 2 + (sc.img[i * 3 + 1] - c[1]) ** 2 + (sc.img[i * 3 + 2] - c[2]) ** 2; if (d < bd) { bd = d; b = j; } }); o[i] = b; }
    return o;
  };

  /* colors for drawing */
  const RAMP = [[0, [226, 200, 150]], [0.4, [186, 212, 120]], [1.5, [130, 184, 88]], [6, [56, 132, 78]], [15, [14, 60, 40]]];
  L.heightColor = function (v) { v = Math.max(0, Math.min(15, v)); for (let k = 1; k < RAMP.length; k++) if (v <= RAMP[k][0]) { const [a, ca] = RAMP[k - 1], [b, cb] = RAMP[k], t = (v - a) / (b - a); return ca.map((c, i) => c + (cb[i] - c) * t); } return RAMP[RAMP.length - 1][1]; };
  L.shade = function (a, x, y) { const gx = (at(a, x + 1, y) - at(a, x - 1, y)) / 2, gy = (at(a, x, y + 1) - at(a, x, y - 1)) / 2; return Math.max(0.55, Math.min(1.3, 1 - 0.16 * (gx + gy))); };

  /* pick a 16 x 16 patch whose center is one class, for the labeling game */
  L.pickPatch = function (sc, c, r) {
    for (let t = 0; t < 4000; t++) {
      const x = 8 + Math.floor(r() * (N - 16)), y = 8 + Math.floor(r() * (N - 16)); let ok = true;
      for (let j = -2; j <= 2 && ok; j++) for (let i = -2; i <= 2; i++) if (sc.cls[(y + j) * N + x + i] !== c) { ok = false; break; }
      if (ok) return { x, y, c };
    }
    return null;
  };

  g.LIDARLAB = L;
  if (typeof module !== 'undefined') module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
