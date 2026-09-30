/* ml.js - small, dependency-free machine learning routines used by the lecture page.
   Everything runs in the browser, so the page works without a network connection. */
(function (g) {
  const ML = {};

  ML.rng = function (seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  ML.gauss = function (r) {
    let u = 0; while (u === 0) u = r();
    const v = r();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  ML.shuffle = function (n, r) {
    const a = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  ML.d2 = function (a, b) { let s = 0; for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; s += d * d; } return s; };

  ML.standardize = function (X) {
    const n = X.length, d = X[0].length, mean = new Array(d).fill(0), sd = new Array(d).fill(0);
    X.forEach(x => x.forEach((v, j) => mean[j] += v / n));
    X.forEach(x => x.forEach((v, j) => sd[j] += (v - mean[j]) ** 2 / (n - 1)));
    for (let j = 0; j < d; j++) sd[j] = Math.sqrt(sd[j]) || 1;
    return { Z: X.map(x => x.map((v, j) => (v - mean[j]) / sd[j])), mean, sd };
  };

  /* symmetric eigenproblem, Jacobi rotations (fine for the 2-4 variable matrices used here) */
  ML.eigSym = function (A) {
    const n = A.length, a = A.map(r => r.slice());
    const V = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? 1 : 0)));
    for (let sweep = 0; sweep < 60; sweep++) {
      let off = 0;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) off += a[i][j] ** 2;
      if (off < 1e-20) break;
      for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-16) continue;
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        const t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        const c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (let k = 0; k < n; k++) { const x = a[k][p], y = a[k][q]; a[k][p] = c * x - s * y; a[k][q] = s * x + c * y; }
        for (let k = 0; k < n; k++) { const x = a[p][k], y = a[q][k]; a[p][k] = c * x - s * y; a[q][k] = s * x + c * y; }
        for (let k = 0; k < n; k++) { const x = V[k][p], y = V[k][q]; V[k][p] = c * x - s * y; V[k][q] = s * x + c * y; }
      }
    }
    const idx = Array.from({ length: n }, (_, i) => i).sort((i, j) => a[j][j] - a[i][i]);
    return { vals: idx.map(i => a[i][i]), vecs: idx.map(i => V.map(row => row[i])) };
  };

  ML.cov = function (X) {
    const n = X.length, d = X[0].length, m = new Array(d).fill(0);
    X.forEach(x => x.forEach((v, j) => m[j] += v / n));
    const C = Array.from({ length: d }, () => new Array(d).fill(0));
    X.forEach(x => { for (let i = 0; i < d; i++) for (let j = 0; j < d; j++) C[i][j] += (x[i] - m[i]) * (x[j] - m[j]) / (n - 1); });
    return { C, mean: m };
  };

  ML.pca = function (X) {
    const { C, mean } = ML.cov(X);
    const e = ML.eigSym(C);
    // sign convention: loadings of each component sum to a non-negative value
    e.vecs.forEach(v => { const s = v.reduce((p, c) => p + c, 0); if (s < 0) for (let i = 0; i < v.length; i++) v[i] = -v[i]; });
    const total = e.vals.reduce((p, c) => p + c, 0);
    const scores = X.map(x => e.vecs.map(v => v.reduce((p, c, j) => p + c * (x[j] - mean[j]), 0)));
    return { vals: e.vals, vecs: e.vecs, frac: e.vals.map(v => v / total), scores, mean, C };
  };

  /* k-means */
  ML.assign = function (X, C) {
    return X.map(x => { let b = 0, bd = Infinity; C.forEach((c, j) => { const d = ML.d2(x, c); if (d < bd) { bd = d; b = j; } }); return b; });
  };
  ML.update = function (X, lab, k, r) {
    const d = X[0].length, S = Array.from({ length: k }, () => new Array(d).fill(0)), N = new Array(k).fill(0);
    X.forEach((x, i) => { N[lab[i]]++; for (let j = 0; j < d; j++) S[lab[i]][j] += x[j]; });
    return S.map((s, c) => (N[c] ? s.map(v => v / N[c]) : X[Math.floor(r() * X.length)].slice()));
  };
  ML.kppInit = function (X, k, r) {
    const C = [X[Math.floor(r() * X.length)].slice()];
    while (C.length < k) {
      const D = X.map(x => Math.min(...C.map(c => ML.d2(x, c))));
      let t = r() * D.reduce((p, c) => p + c, 0), i = 0;
      for (; i < D.length - 1; i++) { t -= D[i]; if (t <= 0) break; }
      C.push(X[i].slice());
    }
    return C;
  };
  ML.kmeans = function (X, k, r, iters = 100) {
    let C = ML.kppInit(X, k, r), lab = null;
    for (let it = 0; it < iters; it++) {
      const nl = ML.assign(X, C);
      if (lab && nl.every((v, i) => v === lab[i])) break;
      lab = nl; C = ML.update(X, lab, k, r);
    }
    lab = ML.assign(X, C);
    let inertia = 0; X.forEach((x, i) => inertia += ML.d2(x, C[lab[i]]));
    return { labels: lab, centers: C, inertia };
  };
  ML.kmeansBest = function (X, k, r, tries = 5) {
    let best = null;
    for (let t = 0; t < tries; t++) { const m = ML.kmeans(X, k, r); if (!best || m.inertia < best.inertia) best = m; }
    return best;
  };
  ML.purity = function (lab, truth, k, nc) {
    const T = Array.from({ length: k }, () => new Array(nc).fill(0));
    lab.forEach((l, i) => T[l][truth[i]]++);
    return T.reduce((p, row) => p + Math.max(...row), 0) / lab.length;
  };

  /* k-nearest neighbors */
  ML.knnPredict = function (Xtr, ytr, Xq, k, nc) {
    if (!Xtr.length) return Xq.map(() => 0);
    k = Math.max(1, Math.min(k, Xtr.length));
    return Xq.map(q => {
      const d = Xtr.map((x, i) => [ML.d2(x, q), i]).sort((a, b) => a[0] - b[0]).slice(0, k);
      const v = new Array(nc).fill(0);
      d.forEach(([dd, i], rank) => { v[ytr[i]] += 1 + 1e-6 * (k - rank); });
      let b = 0; v.forEach((c, j) => { if (c > v[b]) b = j; });
      return b;
    });
  };
  ML.acc = function (p, y) { let c = 0; p.forEach((v, i) => { if (v === y[i]) c++; }); return c / y.length; };

  /* binary logistic regression, full-batch gradient descent, optional class weights */
  ML.logistic = function (X, y, o = {}) {
    const iters = o.iters || 400, lr = o.lr || 0.5, l2 = o.l2 === undefined ? 1e-3 : o.l2, cw = o.cw || [1, 1];
    const d = X[0].length, n = X.length;
    let w = new Array(d).fill(0), b = 0;
    const sw = y.map(v => cw[v]); const sws = sw.reduce((p, c) => p + c, 0);
    for (let it = 0; it < iters; it++) {
      const gw = new Array(d).fill(0); let gb = 0;
      for (let i = 0; i < n; i++) {
        let z = b; for (let j = 0; j < d; j++) z += w[j] * X[i][j];
        const e = (1 / (1 + Math.exp(-z)) - y[i]) * sw[i];
        for (let j = 0; j < d; j++) gw[j] += e * X[i][j]; gb += e;
      }
      for (let j = 0; j < d; j++) w[j] -= lr * (gw[j] / sws + l2 * w[j]);
      b -= lr * gb / sws;
    }
    return { w, b, prob: x => { let z = b; for (let j = 0; j < d; j++) z += w[j] * x[j]; return 1 / (1 + Math.exp(-z)); } };
  };

  /* label propagation on a k-nearest-neighbor graph */
  const graphCache = new WeakMap();
  ML.buildGraph = function (X, K) {
    const key = graphCache.get(X);
    if (key && key.K === K) return key.adj;
    const n = X.length;
    const nb = X.map((x, i) => {
      const d = []; for (let j = 0; j < n; j++) if (j !== i) d.push([ML.d2(x, X[j]), j]);
      d.sort((a, b) => a[0] - b[0]); return d.slice(0, K);
    });
    let sig = 0; nb.forEach(l => { sig += l[l.length - 1][0]; }); sig = sig / n || 1;
    const adj = Array.from({ length: n }, () => new Map());
    nb.forEach((l, i) => l.forEach(([dd, j]) => {
      const w = Math.exp(-dd / sig);
      adj[i].set(j, Math.max(adj[i].get(j) || 0, w)); adj[j].set(i, Math.max(adj[j].get(i) || 0, w));
    }));
    graphCache.set(X, { K, adj });
    return adj;
  };
  ML.labelProp = function (X, labIdx, labels, nc, o = {}) {
    const n = X.length, K = o.k || 8, iters = o.iters || 80;
    const adj = ML.buildGraph(X, K);
    const lab = new Map(labIdx.map((i, t) => [i, labels[t]]));
    let F = Array.from({ length: n }, (_, i) => { const f = new Array(nc).fill(0); if (lab.has(i)) f[lab.get(i)] = 1; return f; });
    for (let it = 0; it < iters; it++) {
      const G = F.map((f, i) => {
        if (lab.has(i)) return f;
        const s = new Array(nc).fill(0); let tw = 0;
        adj[i].forEach((w, j) => { tw += w; for (let c = 0; c < nc; c++) s[c] += w * F[j][c]; });
        return tw ? s.map(v => v / tw) : s;
      });
      F = G;
    }
    const fallback = ML.knnPredict(labIdx.map(i => X[i]), labels, X, 1, nc);
    return F.map((f, i) => { const s = f.reduce((p, c) => p + c, 0); if (s < 1e-9) return fallback[i]; let b = 0; f.forEach((v, c) => { if (v > f[b]) b = c; }); return b; });
  };

  /* small multilayer perceptron: tanh hidden layers, softmax output, Adam */
  ML.MLP = class {
    constructor(sizes, r) {
      this.s = sizes; this.L = sizes.length - 1; this.t = 0;
      this.W = []; this.b = []; this.mW = []; this.vW = []; this.mb = []; this.vb = [];
      for (let l = 0; l < this.L; l++) {
        const i = sizes[l], o = sizes[l + 1], sc = Math.sqrt(2 / (i + o));
        this.W.push(Array.from({ length: o }, () => Array.from({ length: i }, () => ML.gauss(r) * sc)));
        this.b.push(new Array(o).fill(0));
        this.mW.push(Array.from({ length: o }, () => new Array(i).fill(0)));
        this.vW.push(Array.from({ length: o }, () => new Array(i).fill(0)));
        this.mb.push(new Array(o).fill(0)); this.vb.push(new Array(o).fill(0));
      }
    }
    forward(x) {
      const a = [x];
      for (let l = 0; l < this.L; l++) {
        const prev = a[l], out = this.W[l].map((row, j) => { let z = this.b[l][j]; for (let i = 0; i < row.length; i++) z += row[i] * prev[i]; return z; });
        a.push(l < this.L - 1 ? out.map(Math.tanh) : out);
      }
      const z = a[this.L], m = Math.max(...z), e = z.map(v => Math.exp(v - m)), s = e.reduce((p, c) => p + c, 0);
      return { a, p: e.map(v => v / s) };
    }
    predict(x) { const p = this.forward(x).p; let b = 0; p.forEach((v, i) => { if (v > p[b]) b = i; }); return b; }
    step(X, y, lr = 0.03) {
      const n = X.length, L = this.L;
      const gW = this.W.map(W => W.map(r => r.map(() => 0))), gb = this.b.map(b => b.map(() => 0));
      let loss = 0;
      for (let s = 0; s < n; s++) {
        const { a, p } = this.forward(X[s]);
        loss -= Math.log(Math.max(p[y[s]], 1e-12));
        let delta = p.slice(); delta[y[s]] -= 1;
        for (let l = L - 1; l >= 0; l--) {
          const prev = a[l];
          for (let j = 0; j < delta.length; j++) { gb[l][j] += delta[j]; for (let i = 0; i < prev.length; i++) gW[l][j][i] += delta[j] * prev[i]; }
          if (l > 0) {
            const nd = new Array(prev.length).fill(0);
            for (let i = 0; i < prev.length; i++) { let t = 0; for (let j = 0; j < delta.length; j++) t += this.W[l][j][i] * delta[j]; nd[i] = t * (1 - prev[i] * prev[i]); }
            delta = nd;
          }
        }
      }
      this.t++; const b1 = 0.9, b2 = 0.999, c1 = 1 - Math.pow(b1, this.t), c2 = 1 - Math.pow(b2, this.t);
      for (let l = 0; l < L; l++) {
        for (let j = 0; j < this.W[l].length; j++) {
          for (let i = 0; i < this.W[l][j].length; i++) {
            const g = gW[l][j][i] / n;
            this.mW[l][j][i] = b1 * this.mW[l][j][i] + (1 - b1) * g; this.vW[l][j][i] = b2 * this.vW[l][j][i] + (1 - b2) * g * g;
            this.W[l][j][i] -= lr * (this.mW[l][j][i] / c1) / (Math.sqrt(this.vW[l][j][i] / c2) + 1e-8);
          }
          const g = gb[l][j] / n;
          this.mb[l][j] = b1 * this.mb[l][j] + (1 - b1) * g; this.vb[l][j] = b2 * this.vb[l][j] + (1 - b2) * g * g;
          this.b[l][j] -= lr * (this.mb[l][j] / c1) / (Math.sqrt(this.vb[l][j] / c2) + 1e-8);
        }
      }
      return loss / n;
    }
  };

  /* polynomial least squares by the normal equations (x should be scaled to about -1..1) */
  ML.polyfit = function (x, y, deg) {
    const n = deg + 1, A = Array.from({ length: n }, () => new Array(n + 1).fill(0));
    for (let k = 0; k < x.length; k++) {
      const pw = [1]; for (let i = 1; i < 2 * n; i++) pw.push(pw[i - 1] * x[k]);
      for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += pw[i + j]; A[i][n] += y[k] * pw[i]; }
    }
    for (let i = 0; i < n; i++) A[i][i] += 1e-9;
    for (let c = 0; c < n; c++) {
      let m = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r;
      [A[c], A[m]] = [A[m], A[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    const co = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let j = i + 1; j < n; j++) s -= A[i][j] * co[j]; co[i] = s / A[i][i]; }
    return co;
  };
  ML.polyval = (co, x) => { let s = 0; for (let i = co.length - 1; i >= 0; i--) s = s * x + co[i]; return s; };

  /* decision tree (CART, Gini) and random forest */
  ML.tree = function (X, y, nc, o) {
    o = o || {}; const maxDepth = o.maxDepth === undefined ? 6 : o.maxDepth, minLeaf = o.minLeaf || 1, d = X[0].length, mtry = o.mtry || d, rng = o.rng || Math.random;
    const gini = (c, n) => { if (!n) return 0; let s = 0; for (let k = 0; k < nc; k++) s += (c[k] / n) ** 2; return 1 - s; };
    function build(idx, depth) {
      const counts = new Array(nc).fill(0); idx.forEach(i => { counts[y[i]]++; });
      const n = idx.length, mx = Math.max(...counts);
      if (depth >= maxDepth || mx === n || n < 2 * minLeaf) return { leaf: true, counts, n };
      let feats = Array.from({ length: d }, (_, i) => i);
      if (mtry < d) { for (let i = d - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [feats[i], feats[j]] = [feats[j], feats[i]]; } feats = feats.slice(0, mtry); }
      let best = null;
      for (const f of feats) {
        const ord = idx.slice().sort((a, b) => X[a][f] - X[b][f]), left = new Array(nc).fill(0), right = counts.slice();
        for (let p = 0; p < n - 1; p++) {
          const c = y[ord[p]]; left[c]++; right[c]--;
          const v0 = X[ord[p]][f], v1 = X[ord[p + 1]][f]; if (v0 === v1) continue;
          const nl = p + 1, nr = n - nl; if (nl < minLeaf || nr < minLeaf) continue;
          const g = (nl * gini(left, nl) + nr * gini(right, nr)) / n;
          if (!best || g < best.g - 1e-12) best = { g, f, t: (v0 + v1) / 2 };
        }
      }
      if (!best) return { leaf: true, counts, n };
      const L = [], Rr = []; idx.forEach(i => { (X[i][best.f] <= best.t ? L : Rr).push(i); });
      return { leaf: false, f: best.f, t: best.t, counts, n, left: build(L, depth + 1), right: build(Rr, depth + 1) };
    }
    return build(X.map((_, i) => i), 0);
  };
  ML.treeLeaf = function (node, x) { while (!node.leaf) node = x[node.f] <= node.t ? node.left : node.right; return node; };
  ML.treeClass = function (node, x) { const c = ML.treeLeaf(node, x).counts; let b = 0; c.forEach((v, i) => { if (v > c[b]) b = i; }); return b; };
  ML.forest = function (X, y, nc, nTrees, rng, o) {
    o = o || {}; const n = X.length, d = X[0].length, mtry = o.mtry || Math.max(1, Math.round(Math.sqrt(d))), trees = [];
    for (let t = 0; t < nTrees; t++) {
      const idx = Array.from({ length: n }, () => Math.floor(rng() * n)), Xb = idx.map(i => X[i]), yb = idx.map(i => y[i]);
      trees.push(ML.tree(Xb, yb, nc, { maxDepth: o.maxDepth === undefined ? 6 : o.maxDepth, mtry, rng, minLeaf: 1 }));
    }
    return trees;
  };
  ML.forestVotes = function (trees, x, nc) { const v = new Array(nc).fill(0); trees.forEach(t => { v[ML.treeClass(t, x)]++; }); return v; };
  ML.argmax = a => { let b = 0; a.forEach((v, i) => { if (v > a[b]) b = i; }); return b; };

  g.ML = ML;
  if (typeof module !== 'undefined') module.exports = ML;
})(typeof window !== 'undefined' ? window : globalThis);
