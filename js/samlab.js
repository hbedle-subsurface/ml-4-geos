/* samlab.js - a synthetic thin section (about 64 grains) and a simple region-growing segmenter that
   behaves like a promptable segmentation model in the ways we want to show: a click returns masks of
   different sizes, a grid of clicks segments everything, and the masks carry no mineral names. */
(function (g) {
  const ML = g.ML;
  const S = { W: 200, H: 150 };
  const W = S.W, H = S.H;
  S.MIN = ['Quartz', 'Plagioclase', 'K-feldspar', 'Biotite', 'Amphibole', 'Opaque'];
  S.MCOL = ['#DCE3E8', '#B9C4CF', '#E7A9A0', '#8C5A32', '#5E7F3F', '#2A2A2E'];
  const BASE = [[226, 226, 220], [214, 212, 204], [224, 194, 178], [122, 86, 54], [94, 112, 72], [26, 26, 28]];
  const PROB = [0.30, 0.30, 0.20, 0.10, 0.06, 0.04];

  S.build = function (seed) {
    const r = ML.rng(seed), pts = [];
    let tries = 0; while (pts.length < 70 && tries++ < 4000) { const p = [r() * W, r() * H]; if (pts.every(q => Math.hypot(q[0] - p[0], q[1] - p[1]) > 15)) pts.push(p); }
    const n = pts.length, mineral = pts.map(() => { let u = r(), k = 0; while (k < 5 && u > PROB[k]) { u -= PROB[k]; k++; } return k; });
    const shade = pts.map(() => 1 + (r() - 0.5) * 0.06), ang = pts.map(() => r() * Math.PI), ph = pts.map(() => r() * 10);
    const wx = [r() * 6, r() * 6], wy = [r() * 6, r() * 6];
    const grain = new Int16Array(W * H), rgb = new Float32Array(W * H * 3);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const px = x + 3.2 * Math.sin(y / 17 + wx[0]) + 2.2 * Math.sin(y / 7 + wx[1]), py = y + 3.2 * Math.sin(x / 19 + wy[0]) + 2.2 * Math.sin(x / 8 + wy[1]);
      let b = 0, bd = 1e9; for (let i = 0; i < n; i++) { const d = (pts[i][0] - px) ** 2 + (pts[i][1] - py) ** 2; if (d < bd) { bd = d; b = i; } }
      grain[y * W + x] = b;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gi = grain[y * W + x], m = mineral[gi]; let c = BASE[m].map(v => v * shade[gi]);
      const t = x * Math.cos(ang[gi]) + y * Math.sin(ang[gi]);
      if (m === 1) { const s = Math.floor((t + ph[gi]) / 5) % 2 ? 1 : -1; c = c.map(v => v + s * 13); }
      if (m === 3) { const s = Math.floor((t + ph[gi]) / 3) % 2 ? 1 : -1; c = c.map(v => v + s * 9); }
      if (m === 2) { c = c.map((v, k) => v + 6 * Math.sin(x / 5 + y / 7 + gi) * (k === 0 ? 1 : 0.6)); }
      const o = (y * W + x) * 3; for (let k = 0; k < 3; k++) rgb[o + k] = Math.max(0, Math.min(255, c[k] + 3 * ML.gauss(r)));
    }
    // dark grain boundaries
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const gi = grain[y * W + x]; let edge = false;
      if (x + 1 < W && grain[y * W + x + 1] !== gi) edge = true; if (y + 1 < H && grain[(y + 1) * W + x] !== gi) edge = true;
      if (x > 0 && grain[y * W + x - 1] !== gi) edge = true; if (y > 0 && grain[(y - 1) * W + x] !== gi) edge = true;
      if (edge) { const o = (y * W + x) * 3; for (let k = 0; k < 3; k++) rgb[o + k] *= 0.5; }
    }
    return { pts, n, mineral, grain, rgb, mmap: Int8Array.from(grain, gi => mineral[gi]) };
  };

  const dist = (rgb, i, m) => Math.hypot(rgb[i * 3] - m[0], rgb[i * 3 + 1] - m[1], rgb[i * 3 + 2] - m[2]);

  /* grow a region from a seed pixel; a pixel joins when its color is within tol of the region's running mean */
  S.grow = function (sec, sx, sy, tol, blocked) {
    const rgb = sec.rgb, mask = new Uint8Array(W * H), q = [sy * W + sx], m = [rgb[q[0] * 3], rgb[q[0] * 3 + 1], rgb[q[0] * 3 + 2]];
    if (blocked && blocked[q[0]]) return { mask, area: 0 };
    mask[q[0]] = 1; let area = 1, head = 0;
    while (head < q.length) {
      const p = q[head++], x = p % W, y = (p - x) / W;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
        const pi = yy * W + xx; if (mask[pi] || (blocked && blocked[pi])) continue;
        if (dist(rgb, pi, m) <= tol) {
          mask[pi] = 1; q.push(pi); area++;
          m[0] += (rgb[pi * 3] - m[0]) / area; m[1] += (rgb[pi * 3 + 1] - m[1]) / area; m[2] += (rgb[pi * 3 + 2] - m[2]) / area;
        }
      }
    }
    return { mask, area };
  };

  /* three masks for one click: a part (one twin lamella), a grain, and a grain plus touching look-alikes */
  S.TOL = [12, 56];
  S.threeMasks = function (sec, sx, sy, cache) {
    const small = S.grow(sec, sx, sy, S.TOL[0]), grainM = S.grow(sec, sx, sy, S.TOL[1]);
    // large: add neighboring grains that look like this one
    const seg = cache.seg, id = seg.map[sy * W + sx], out = new Uint8Array(W * H), same = new Set([id]);
    const c0 = seg.mean[id];
    (seg.adj[id] || []).forEach(j => { if (Math.hypot(c0[0] - seg.mean[j][0], c0[1] - seg.mean[j][1], c0[2] - seg.mean[j][2]) < 60) same.add(j); });
    for (let i = 0; i < W * H; i++) if (same.has(seg.map[i])) out[i] = 1;
    let area = 0; for (let i = 0; i < out.length; i++) area += out[i];
    return [small, grainM, { mask: out, area }];
  };

  /* automatic mask generation: a grid of clicks, each growing a grain-sized mask */
  S.segmentAll = function (sec, step, tol, minArea, mergeD) {
    const map = new Int32Array(W * H).fill(-1); const masks = []; const done = new Uint8Array(W * H);
    for (let y = Math.floor(step / 2); y < H; y += step) for (let x = Math.floor(step / 2); x < W; x += step) {
      if (done[y * W + x]) continue;
      const r = S.grow(sec, x, y, tol, done), id = masks.length; let area = 0;
      for (let i = 0; i < r.mask.length; i++) if (r.mask[i]) { done[i] = 1; map[i] = id; area++; }
      masks.push({ id, area });
    }
    // small masks (boundary lines, slivers) are absorbed by the neighbor they touch most
    const isSmall = masks.map(m => m.area < minArea);
    const nb = () => { for (let it = 0; it < 6; it++) { let changed = false; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, m = map[i]; if (m < 0 || !isSmall[m]) continue; const c = {}; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; const k = map[yy * W + xx]; if (k >= 0 && !isSmall[k]) c[k] = (c[k] || 0) + 1; } const ks = Object.keys(c); if (ks.length) { map[i] = +ks.sort((a, b) => c[b] - c[a])[0]; changed = true; } } if (!changed) break; } };
    nb();
    return S.finish(sec, map, mergeD);
  };

  /* relabel, compute mean colors and adjacency, optionally merge look-alike neighbors */
  S.finish = function (sec, map0, mergeD) {
    let map = Int32Array.from(map0);
    const stats = () => {
      const ids = {}; for (let i = 0; i < map.length; i++) if (map[i] >= 0) { const k = map[i]; (ids[k] = ids[k] || { n: 0, s: [0, 0, 0], q: 0 }); const o = ids[k]; o.n++; for (let c = 0; c < 3; c++) o.s[c] += sec.rgb[i * 3 + c]; o.q += (sec.rgb[i * 3] + sec.rgb[i * 3 + 1] + sec.rgb[i * 3 + 2]) ** 2 / 9; }
      return ids;
    };
    const adjOf = () => { const a = {}; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x, m = map[i]; if (m < 0) continue; for (const j of [x + 1 < W ? i + 1 : -1, y + 1 < H ? i + W : -1]) { if (j < 0) continue; const k = map[j]; if (k >= 0 && k !== m) { (a[m] = a[m] || new Set()).add(k); (a[k] = a[k] || new Set()).add(m); } } } return a; };
    if (mergeD > 0) {
      for (let pass = 0; pass < 8; pass++) {
        const st = stats(), adj = adjOf(); let merged = false; const remap = {};
        Object.keys(adj).forEach(a => { a = +a; if (remap[a] !== undefined) return; adj[a].forEach(b => { if (remap[b] !== undefined || remap[a] !== undefined) return; const ma = st[a].s.map(v => v / st[a].n), mb = st[b].s.map(v => v / st[b].n); if (Math.hypot(ma[0] - mb[0], ma[1] - mb[1], ma[2] - mb[2]) < mergeD) { remap[b] = a; merged = true; } }); });
        if (!merged) break; for (let i = 0; i < map.length; i++) if (map[i] >= 0 && remap[map[i]] !== undefined) map[i] = remap[map[i]];
      }
    }
    const st = stats(), keys = Object.keys(st).map(Number).sort((a, b) => a - b), re = {}; keys.forEach((k, i) => { re[k] = i; });
    for (let i = 0; i < map.length; i++) if (map[i] >= 0) map[i] = re[map[i]];
    const st2 = stats(), adj2 = adjOf(), n = keys.length;
    const mean = Array.from({ length: n }, (_, i) => st2[i].s.map(v => v / st2[i].n)), area = Array.from({ length: n }, (_, i) => st2[i].n);
    const tex = Array.from({ length: n }, (_, i) => Math.sqrt(Math.max(0, st2[i].q / st2[i].n - ((mean[i][0] + mean[i][1] + mean[i][2]) / 3) ** 2)));
    const adj = Array.from({ length: n }, (_, i) => [...(adj2[i] || [])]);
    return { map, n, mean, area, tex, adj };
  };

  /* how well do the masks follow the real grains */
  S.evaluate = function (sec, seg) {
    const per = Array.from({ length: seg.n }, () => ({})), gcount = new Int32Array(sec.n);
    for (let i = 0; i < seg.map.length; i++) { const m = seg.map[i]; if (m < 0) continue; const gi = sec.grain[i]; per[m][gi] = (per[m][gi] || 0) + 1; }
    const gmask = Array.from({ length: sec.n }, () => ({})), impure = new Array(seg.n).fill(false);
    per.forEach((o, m) => { const tot = Object.values(o).reduce((a, b) => a + b, 0), top = Math.max(0, ...Object.values(o)); if (tot && top / tot < 0.85) impure[m] = true; Object.keys(o).forEach(gi => { gmask[gi][m] = o[gi]; }); });
    const gsize = new Int32Array(sec.n); for (let i = 0; i < sec.grain.length; i++) gsize[sec.grain[i]]++;
    let split = 0, merged = 0;
    gmask.forEach((o, gi) => {
      const ks = Object.keys(o); if (!ks.length) return;
      const big = ks.filter(k => o[k] >= 0.15 * gsize[gi]).length; if (big > 1) split++;
      const main = ks.sort((a, b) => o[b] - o[a])[0]; if (impure[+main]) merged++;
    });
    let covered = 0; for (let i = 0; i < seg.map.length; i++) if (seg.map[i] >= 0) covered++;
    return { merged, split, covered: covered / seg.map.length };
  };

  /* modal percentages by area for a mineral-per-pixel map */
  S.modal = function (mmap, n) { const c = new Array(n).fill(0); let t = 0; for (let i = 0; i < mmap.length; i++) if (mmap[i] >= 0) { c[mmap[i]]++; t++; } return c.map(v => (t ? v / t * 100 : 0)); };

  g.SAMLAB = S;
  if (typeof module !== 'undefined') module.exports = S;
})(typeof window !== 'undefined' ? window : globalThis);
