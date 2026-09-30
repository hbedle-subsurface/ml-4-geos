/* seismic.js - a small synthetic channel system: facies map, reflectivity, wavelet convolution,
   and four attributes measured in a window around the target interval. */
(function (g) {
  const ML = g.ML;
  const S = {};
  S.N = 64;            // traces per side
  S.NS = 120;          // samples per trace
  S.DT = 2;            // ms
  S.C0 = 60;           // center sample of the target interval (120 ms)
  S.FAC = ['Floodplain shale', 'Channel sand', 'Levee'];
  S.FCOL = ['#8F8AA0', '#E0B22B', '#B98A55'];
  S.ANAMES = ['RMS amplitude', 'Peak envelope', 'Mean frequency', 'Local variability'];
  S.ASHORT = ['RMS', 'Envelope', 'Mean freq.', 'Variability'];
  S.ARANGE = [[0, 0.25], [0, 0.6], [10, 80], [0, 0.07]];
  S.AUNIT = ['', '', ' Hz', ''];

  const N = S.N, NS = S.NS;

  /* ---- geology: facies map, channel thickness ---- */
  (function () {
    const fac = new Uint8Array(N * N), th = new Float32Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const cy = 32 + 13 * Math.sin(i / N * 2 * Math.PI * 1.3 + 0.5), dd = Math.abs(j - cy);
      fac[j * N + i] = dd < 3.5 ? 1 : dd < 8 ? 2 : 0;
      th[j * N + i] = dd < 3.5 ? 3 + 13 * (1 - (dd / 3.5) * (dd / 3.5)) : 0;
    }
    S.fac = fac; S.th = th;
  })();

  /* ---- reflectivity, built once ---- */
  (function () {
    const r = ML.rng(77), refl = new Float32Array(N * N * NS);
    const bg = new Float32Array(NS), fl = new Float32Array(NS), lv = new Float32Array(NS);
    for (let s = 0; s < NS; s++) { bg[s] = 0.05 * ML.gauss(r); fl[s] = 0.035 * ML.gauss(r); }
    for (let s = 0; s < NS;) { lv[s] = (r() < 0.5 ? -1 : 1) * (0.06 + 0.1 * r()); s += 2 + Math.floor(r() * 2); }
    const T0 = 46, T1 = 76;
    for (let t = 0; t < N * N; t++) {
      const f = S.fac[t], o = t * NS, tr = 1 + 0.08 * ML.gauss(r);
      for (let s = 0; s < NS; s++) {
        let v = bg[s];
        if (s >= T0 && s < T1) v = f === 0 ? fl[s] * tr : f === 2 ? lv[s] * tr : 0;
        refl[o + s] = v;
      }
      if (f === 1) {
        const top = 52, base = top + Math.round(S.th[t]);
        refl[o + top] += -0.24; refl[o + base] += 0.22;
      }
    }
    S.refl = refl;
  })();

  S.noiseField = (function () { const r = ML.rng(5), a = new Float32Array(N * N * NS); for (let i = 0; i < a.length; i++) a[i] = ML.gauss(r); return a; })();

  S.ricker = function (f) {
    const L = 32, w = new Float32Array(2 * L + 1);
    for (let j = -L; j <= L; j++) { const t = j * S.DT / 1000, a = Math.PI * Math.PI * f * f * t * t; w[j + L] = (1 - 2 * a) * Math.exp(-a); }
    return w;
  };
  /* noise-free traces for one wavelet frequency; the channel sand attenuates the wavelet, so its
     reflections are convolved with a lower-frequency wavelet (0.7 of the source frequency) */
  const cache = { f: null, data: null };
  S.clean = function (f) {
    if (cache.f === f) return cache.data;
    const L = 32, w = S.ricker(f), wc = S.ricker(0.7 * f), out = new Float32Array(N * N * NS);
    for (let t = 0; t < N * N; t++) {
      const o = t * NS, W = S.fac[t] === 1 ? wc : w;
      for (let s = 8; s < NS - 8; s++) {
        let v = 0;
        const j0 = Math.max(-L, s - NS + 1), j1 = Math.min(L, s);
        for (let j = j0; j <= j1; j++) v += W[j + L] * S.refl[o + s - j];
        out[o + s] = v;
      }
    }
    cache.f = f; cache.data = out; return out;
  };
  S.synth = function (f, noisePct) {
    const c = S.clean(f), out = new Float32Array(c.length), sd = noisePct / 100 * 0.2;
    for (let i = 0; i < c.length; i++) out[i] = c[i] + sd * S.noiseField[i];
    return out;
  };

  /* ---- FFT (radix 2, in place) ---- */
  const M = 128;
  const cosT = new Float64Array(M / 2), sinT = new Float64Array(M / 2);
  for (let k = 0; k < M / 2; k++) { cosT[k] = Math.cos(2 * Math.PI * k / M); sinT[k] = Math.sin(2 * Math.PI * k / M); }
  const rev = new Uint8Array(M); for (let i = 0; i < M; i++) { let x = i, r = 0; for (let b = 0; b < 7; b++) { r = (r << 1) | (x & 1); x >>= 1; } rev[i] = r; }
  function fft(re, im, inv) {
    for (let i = 0; i < M; i++) { const j = rev[i]; if (j > i) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let size = 2; size <= M; size <<= 1) {
      const half = size >> 1, step = M / size;
      for (let i = 0; i < M; i += size) for (let k = 0; k < half; k++) {
        const c = cosT[k * step], s = (inv ? 1 : -1) * sinT[k * step], a = i + k, b = a + half;
        const tr = re[b] * c - im[b] * s, ti = re[b] * s + im[b] * c;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
    if (inv) for (let i = 0; i < M; i++) { re[i] /= M; im[i] /= M; }
  }
  const RE = new Float64Array(M), IM = new Float64Array(M);

  /* ---- attributes in a window of +/- half samples around the target ---- */
  S.attributes = function (tr, half) {
    const rms = new Float32Array(N * N), env = new Float32Array(N * N), fq = new Float32Array(N * N), vr = new Float32Array(N * N);
    const w0 = S.C0 - half, w1 = S.C0 + half, len = w1 - w0 + 1, df = 1000 / (M * S.DT);
    for (let t = 0; t < N * N; t++) {
      const o = t * NS;
      let ss = 0; for (let s = w0; s <= w1; s++) ss += tr[o + s] * tr[o + s];
      rms[t] = Math.sqrt(ss / len);
      // envelope from the analytic signal of the whole trace
      RE.fill(0); IM.fill(0); for (let s = 0; s < NS; s++) RE[s] = tr[o + s];
      fft(RE, IM, false);
      for (let k = 1; k < M / 2; k++) { RE[k] *= 2; IM[k] *= 2; }
      for (let k = M / 2 + 1; k < M; k++) { RE[k] = 0; IM[k] = 0; }
      fft(RE, IM, true);
      let mx = 0; for (let s = w0; s <= w1; s++) { const e = Math.hypot(RE[s], IM[s]); if (e > mx) mx = e; }
      env[t] = mx;
      // mean frequency of the windowed amplitude spectrum
      RE.fill(0); IM.fill(0);
      for (let s = w0; s <= w1; s++) RE[s - w0] = tr[o + s] * (0.5 - 0.5 * Math.cos(2 * Math.PI * (s - w0 + 0.5) / len));
      fft(RE, IM, false);
      let num = 0, den = 0; for (let k = 0; k <= 26; k++) { const a = Math.hypot(RE[k], IM[k]); num += a * k * df; den += a; }
      fq[t] = den > 1e-12 ? num / den : 0;
    }
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      let n = 0, m = 0, q = 0;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N) continue; const v = rms[b * N + a]; n++; m += v; q += v * v; }
      m /= n; vr[j * N + i] = Math.sqrt(Math.max(0, q / n - m * m));
    }
    return [rms, env, fq, vr];
  };

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

  g.SEIS = S;
  if (typeof module !== 'undefined') module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
