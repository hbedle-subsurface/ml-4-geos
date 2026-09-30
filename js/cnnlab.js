/* cnnlab.js - tiny synthetic "muffin or chihuahua" pictures (32 x 32) and a hand-built two-layer
   convolutional pipeline: a spot filter, then a filter that looks for two eyes above a nose. */
(function (g) {
  const ML = g.ML;
  const L = { N: 32 };
  const N = L.N, clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function blank(v) { return new Float32Array(N * N).fill(v); }
  function disc(img, cx, cy, rx, ry, val) {
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const d = Math.hypot((x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry), a = clamp((1 - d) * Math.min(rx, ry) + 0.5, 0, 1);
      if (a > 0) img[y * N + x] = img[y * N + x] * (1 - a) + val * a;
    }
  }
  function tri(img, p, val) {
    const [a, b, c] = p, sgn = (p1, p2, p3) => (p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const q = [x + 0.5, y + 0.5], d1 = sgn(q, a, b), d2 = sgn(q, b, c), d3 = sgn(q, c, a);
      if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) img[y * N + x] = val;
    }
  }
  function noisy(img, r, sd) { for (let i = 0; i < img.length; i++) img[i] = clamp(img[i] + sd * ML.gauss(r), 0, 1); return img; }

  L.makeMuffin = function (r) {
    const img = blank(0.93), cx = 16 + (r() - 0.5) * 3, cy = 14 + (r() - 0.5) * 2;
    // paper liner and base
    for (let y = 21; y < 29; y++) for (let x = 0; x < N; x++) { const half = 8.5 - (y - 21) * 0.25; if (Math.abs(x + 0.5 - cx) < half) img[y * N + x] = (x % 3 === 0) ? 0.5 : 0.6; }
    disc(img, cx, cy, 12 + r() * 1.5, 9 + r() * 1.2, 0.68);
    const n = 3 + Math.floor(r() * 4), berries = [];
    let tries = 0;
    while (berries.length < n && tries++ < 200) {
      const bx = cx + (r() - 0.5) * 16, by = cy + (r() - 0.5) * 11, br = 1.7 + r() * 1.3;
      if (Math.hypot((bx - cx) / 11, (by - cy) / 8) > 0.95) continue;
      if (berries.every(b => Math.hypot(b[0] - bx, b[1] - by) > 5.5)) berries.push([bx, by, br]);
    }
    berries.forEach(b => disc(img, b[0], b[1], b[2], b[2], 0.12));
    return noisy(img, r, 0.02);
  };
  L.makeDog = function (r) {
    const img = blank(0.93), cx = 16 + (r() - 0.5) * 3, cy = 17 + (r() - 0.5) * 2, e = 4.6 + r() * 1.0;
    tri(img, [[cx - 12, cy - 6], [cx - 5, cy - 9], [cx - 9, cy - 16 + r()]], 0.62);
    tri(img, [[cx + 12, cy - 6], [cx + 5, cy - 9], [cx + 9, cy - 16 + r()]], 0.62);
    disc(img, cx, cy, 10.5, 9.5, 0.68);
    disc(img, cx, cy + 4, 5.5, 3.6, 0.78);
    const er = 2.0 + r() * 0.5;
    disc(img, cx - e, cy - 2, er, er, 0.1); disc(img, cx + e, cy - 2, er, er, 0.1);
    disc(img, cx, cy + 4.2, 2.0 + r() * 0.3, 1.7, 0.1);
    return noisy(img, r, 0.02);
  };

  L.pixelate = function (img, f) {
    if (f <= 1) return img;
    const out = new Float32Array(N * N);
    for (let by = 0; by < N; by += f) for (let bx = 0; bx < N; bx += f) {
      let s = 0, n = 0; for (let y = by; y < Math.min(N, by + f); y++) for (let x = bx; x < Math.min(N, bx + f); x++) { s += img[y * N + x]; n++; }
      for (let y = by; y < Math.min(N, by + f); y++) for (let x = bx; x < Math.min(N, bx + f); x++) out[y * N + x] = s / n;
    }
    return out;
  };

  /* layer 1: spot filter (dark disc of radius r on a lighter ring) */
  L.spots = function (img, rad) {
    const out = new Float32Array(N * N), inner = [], ring = [];
    for (let dy = -rad - 3; dy <= rad + 3; dy++) for (let dx = -rad - 3; dx <= rad + 3; dx++) { const d = Math.hypot(dx, dy); if (d <= rad) inner.push([dx, dy]); else if (d > rad + 1 && d <= rad + 3) ring.push([dx, dy]); }
    const at = (x, y) => (x < 0 || y < 0 || x >= N || y >= N ? 0.93 : img[y * N + x]);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let a = 0, b = 0; inner.forEach(([dx, dy]) => { a += at(x + dx, y + dy); }); ring.forEach(([dx, dy]) => { b += at(x + dx, y + dy); });
      out[y * N + x] = Math.max(0, b / ring.length - a / inner.length);
    }
    return out;
  };
  L.edges = function (img, dir) {
    const out = new Float32Array(N * N), at = (x, y) => img[clamp(y, 0, N - 1) * N + clamp(x, 0, N - 1)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const gx = at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1);
      const gy = at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1) - at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1);
      out[y * N + x] = Math.abs(dir === 'v' ? gx : gy) / 4;
    }
    return out;
  };
  L.blur = function (img) {
    const out = new Float32Array(N * N), at = (x, y) => img[clamp(y, 0, N - 1) * N + clamp(x, 0, N - 1)];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { let s = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += at(x + dx, y + dy); out[y * N + x] = s / 9; }
    return out;
  };

  /* layer 2: two spots side by side with a third below and between them */
  L.face = function (B, s) {
    const out = new Float32Array(N * N), dy = Math.round(1.25 * s);
    const mx = (x, y) => { let m = 0; for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx >= 0 && yy >= 0 && xx < N && yy < N) m = Math.max(m, B[yy * N + xx]); } return m; };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) out[y * N + x] = Math.min(mx(x - s, y), mx(x + s, y), mx(x, y + dy));
    return out;
  };
  L.maxOf = m => { let v = 0; for (let i = 0; i < m.length; i++) if (m[i] > v) v = m[i]; return v; };

  /* forty test pictures, twenty of each */
  L.testSet = function () {
    const set = [];
    for (let i = 0; i < 20; i++) { set.push({ img: L.makeMuffin(ML.rng(1000 + i)), dog: false }); set.push({ img: L.makeDog(ML.rng(2000 + i)), dog: true }); }
    return set;
  };

  g.CNNLAB = L;
  if (typeof module !== 'undefined') module.exports = L;
})(typeof window !== 'undefined' ? window : globalThis);
