/* som.js - a small self-organizing map (used by the Start tab). */
(function (g) {
  const ML = g.ML;
  const S = {};

  /* ---- self-organizing map ---- */
  S.somInit = function (X, side, seed) {
    const r = ML.rng(seed), nn = side * side;
    const P = Array.from({ length: nn }, () => X[Math.floor(r() * X.length)].slice());
    return { X, side, r, P, t: 0, T: 3000 };
  };
  S.somAdvance = function (st, n) {
    const { X, side, r, P } = st, nn = side * side, d = X[0].length, sig0 = Math.max(1, side / 2), lr0 = 0.5;
    for (let c = 0; c < n && st.t < st.T; c++, st.t++) {
      const x = X[Math.floor(r() * X.length)], u = st.t / st.T, sig = sig0 * Math.pow(0.4 / sig0, u), lr = lr0 * Math.pow(0.02 / lr0, u);
      let b = 0, bd = Infinity; for (let k = 0; k < nn; k++) { const dd = ML.d2(x, P[k]); if (dd < bd) { bd = dd; b = k; } }
      const bi = b % side, bj = Math.floor(b / side);
      for (let k = 0; k < nn; k++) {
        const di = (k % side) - bi, dj = Math.floor(k / side) - bj, h = Math.exp(-(di * di + dj * dj) / (2 * sig * sig));
        if (h < 1e-3) continue; for (let q = 0; q < d; q++) P[k][q] += lr * h * (x[q] - P[k][q]);
      }
    }
    return st.t >= st.T;
  };
  S.som = function (X, side, seed) { const st = S.somInit(X, side, seed); S.somAdvance(st, st.T); return st.P; };
  S.bmu = function (X, P) { return X.map(x => { let b = 0, bd = Infinity; P.forEach((p, k) => { const dd = ML.d2(x, p); if (dd < bd) { bd = dd; b = k; } }); return b; }); };

  g.SOM = S;
  if (typeof module !== 'undefined') module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
