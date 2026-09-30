/* data.js - every dataset on the page is synthetic and generated here with a fixed seed. */
(function (g) {
  const ML = g.ML;
  const D = {};

  D.LITH = ['Sandstone', 'Shale', 'Limestone'];
  D.LCOL = ['#D9A21B', '#7A4F8F', '#1F8A84'];
  D.VARS = ['Gamma ray (API)', 'Density (g/cc)', 'Sonic slowness (µs/ft)', 'Neutron porosity (v/v)'];
  D.SHORT = ['GR', 'Density', 'Sonic', 'NPHI'];
  D.RANGE = [[0, 150], [2.0, 2.9], [40, 120], [0, 0.45]];

  const MEAN = [[45, 2.30, 84, 0.20], [105, 2.53, 96, 0.30], [28, 2.67, 58, 0.09]];
  const SD = [[13, 0.07, 6, 0.04], [15, 0.06, 7, 0.05], [10, 0.05, 5, 0.04]];
  const LOAD = [8, 0.04, -4, -0.03];

  function clip(v, j) { const r = D.RANGE[j]; return Math.min(r[1] - 0.02 * (r[1] - r[0]), Math.max(r[0] + 0.02 * (r[1] - r[0]), v)); }

  /* 300 samples, 100 per lithology, with a few transitional samples (shaly sandstone, calcareous sandstone) */
  D.rocks = function () {
    const r = ML.rng(7), X = [], y = [];
    for (let c = 0; c < 3; c++) {
      for (let i = 0; i < 100; i++) {
        let m = MEAN[c].slice();
        if (c === 0 && i < 16) m = m.map((v, j) => v + 0.55 * (MEAN[1][j] - v));
        if (c === 0 && i >= 16 && i < 26) m = m.map((v, j) => v + 0.6 * (MEAN[2][j] - v));
        if (c === 1 && i < 12) m = m.map((v, j) => v + 0.5 * (MEAN[0][j] - v));
        const z = ML.gauss(r);
        X.push(m.map((v, j) => clip(v + 1.25 * SD[c][j] * ML.gauss(r) + LOAD[j] * z, j)));
        y.push(c);
      }
    }
    const st = ML.standardize(X);
    return { X, y, Z: st.Z, mean: st.mean, sd: st.sd, n: X.length };
  };

  /* a 200 m well with hand-set beds so the story of the core-length slider is reproducible */
  D.well = function () {
    const beds = [[0, 6, 0], [6, 11, 1], [11, 19, 0], [19, 24, 1], [24, 33, 0], [33, 38, 1], [38, 52, 2], [52, 58, 1], [58, 66, 0], [66, 70, 1],
      [70, 88, 2], [88, 95, 1], [95, 108, 0], [108, 113, 1], [113, 127, 2], [127, 132, 1], [132, 150, 0], [150, 155, 1], [155, 172, 2], [172, 178, 1], [178, 200, 0]];
    const r = ML.rng(21), r2 = ML.rng(22), dz = 0.5, n = 400, depth = [], fac = [], X = [];
    let bedOff = null, bedOff2 = null, cur = -1;
    for (let i = 0; i < n; i++) {
      const z = i * dz, bi = beds.findIndex(b => z >= b[0] && z < b[1]), c = beds[bi][2];
      if (bi !== cur) { cur = bi; bedOff = [6 * ML.gauss(r), 0.03 * ML.gauss(r)]; bedOff2 = [4 * ML.gauss(r2), 0.02 * ML.gauss(r2)]; }
      depth.push(z); fac.push(c);
      X.push([clip(MEAN[c][0] + bedOff[0] + 9 * ML.gauss(r), 0), clip(MEAN[c][1] + bedOff[1] + 0.045 * ML.gauss(r), 1),
        clip(MEAN[c][2] + bedOff2[0] + 4.5 * ML.gauss(r2), 2), clip(MEAN[c][3] + bedOff2[1] + 0.03 * ML.gauss(r2), 3)]);
    }
    return { depth, fac, X };
  };

  /* smooth random field: sum of gaussian bumps of width `range` (unit square) */
  D.field = function (r, range, nb) {
    const B = Array.from({ length: nb }, () => [r(), r(), ML.gauss(r)]);
    return (x, y) => { let s = 0; for (const b of B) { const dx = x - b[0], dy = y - b[1]; s += b[2] * Math.exp(-(dx * dx + dy * dy) / (2 * range * range)); } return s; };
  };
  D.fieldCount = function (range) { return Math.max(8, Math.round(2.5 / (Math.PI * range * range))); };


  /* Redbud Basin sandstone: made-up samples, each a mixture of sand from four made-up mountain ranges, plus a
     few samples from a mega flood that brought sand from a source nobody sampled. Six measurements per sample.
     y is the range that supplied most of the sand, or 4 for the flood samples. */
  D.SRC = ['Boomer Mountains', 'Sooner Range', 'Thunder Ridge Mountains', 'Red Dirt Hills', 'Fits none of the ranges'];
  D.SRCS = ['Boomer', 'Sooner', 'Thunder Ridge', 'Red Dirt', 'Mystery'];
  D.SCOL = ['#C86F8F', '#3E4A56', '#C9A227', '#B5462E', '#9AA1A8'];
  D.PVARS = ['K₂O (%)', 'Zr (ppm)', 'Cr (ppm)', 'Ni (ppm)', 'CaO (%)', 'Sr (ppm)'];
  D.PSHORT = ['K₂O', 'Zr', 'Cr', 'Ni', 'CaO', 'Sr'];
  D.PEND = [[4.5, 260, 20, 8, 1.8, 220], [0.6, 60, 420, 190, 9.0, 350], [1.2, 90, 45, 22, 24, 620], [1.0, 380, 90, 45, 0.5, 45]];
  D.PFLOOD = [5.8, 620, 150, 60, 14, 1150];
  D.provenance = function () {
    const r = ML.rng(52), END = D.PEND;
    const gamma = a => {
      if (a < 1) return gamma(a + 1) * Math.pow(r(), 1 / a);
      const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
      for (;;) { let x, v; do { x = ML.gauss(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r(); if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v; }
    };
    const sig = [0.20, 0.22, 0.25, 0.32, 0.20, 0.22], X = [], y = [];
    const sample = (w, flood) => {
      const t = w.reduce((a, b) => a + b, 0), sort = Math.exp(0.35 * ML.gauss(r)), cement = -1.4 * Math.log(1 - r());
      return END[0].map((_, c) => {
        let mix = w.slice(0, 4).reduce((a, wj, j) => a + wj * END[j][c], 0) + (flood ? w[4] * D.PFLOOD[c] : 0); mix /= t;
        if (c === 1) mix *= sort; if (c === 4) mix += cement; if (c === 5) mix += 22 * cement;
        return mix * Math.exp(sig[c] * ML.gauss(r));
      });
    };
    for (let i = 0; i < 360; i++) { const s = i % 4, w = [0, 1, 2, 3].map(j => gamma(j === s ? 6 : 0.7)).concat([0]); y.push(w.indexOf(Math.max(...w))); X.push(sample(w, false)); }
    for (let i = 0; i < 15; i++) { const w = [0, 1, 2, 3].map(() => gamma(0.9)).concat([gamma(9)]); y.push(4); X.push(sample(w, true)); }
    const st = ML.standardize(X);
    return { X, y, Z: st.Z, mean: st.mean, sd: st.sd, n: X.length };
  };
  /* field samples: stream sand collected in each range itself. Mostly that range's chemistry, with a little of
     the natural mixing, sorting and cement that the basin sands also show. 60 per range. */
  D.fieldBank = function (P) {
    const r = ML.rng(77), X = [], y = [], sig = [0.20, 0.22, 0.25, 0.32, 0.20, 0.22];
    const gamma = a => {
      if (a < 1) return gamma(a + 1) * Math.pow(r(), 1 / a);
      const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
      for (;;) { let x, v; do { x = ML.gauss(r); v = 1 + c * x; } while (v <= 0); v = v * v * v; const u = r(); if (Math.log(u) < 0.5 * x * x + d - d * v + d * Math.log(v)) return d * v; }
    };
    for (let s = 0; s < 4; s++) for (let i = 0; i < 60; i++) {
      const w = [0, 1, 2, 3].map(j => gamma(j === s ? 24 : 0.35)), t = w.reduce((a, b) => a + b, 0), sort = Math.exp(0.3 * ML.gauss(r)), cement = -1.0 * Math.log(1 - r());
      X.push(D.PEND[0].map((_, c) => { let mix = w.reduce((a, wj, j) => a + wj * D.PEND[j][c], 0) / t; if (c === 1) mix *= sort; if (c === 4) mix += cement; if (c === 5) mix += 22 * cement; return mix * Math.exp(sig[c] * ML.gauss(r)); })); y.push(s);
    }
    return { X, y, Z: X.map(x => x.map((v, c) => (v - P.mean[c]) / P.sd[c])), n: X.length };
  };
  D.fieldPick = function (bank, per, seed) {
    const r = ML.rng(seed), idx = [];
    for (let s = 0; s < 4; s++) { const pool = bank.y.map((v, i) => (v === s ? i : -1)).filter(i => i >= 0); ML.shuffle(pool.length, r).slice(0, per).forEach(k => idx.push(pool[k])); }
    return idx;
  };

  g.DATA = D;
  if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
