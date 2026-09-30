/* start.js - the opening activity: k-means and a self-organizing map on the same 300 rock samples,
   with the true rock type switched on and off. */
(function (g) {
  const { ML, DATA: D, Plot, H, SEIS: S } = g;
  const C = Plot.C;
  g.initStart = function (root) {
    const R = H.R, Z = H.Z2, q = id => root.querySelector('#' + id);
    const st = { method: 'km', k: 3, side: 4, seed: 31, show: false, note: '' };
    let view = null, timer = 0, som = null, elbow = null;
    const rr = ML.rng(12); elbow = Array.from({ length: 6 }, (_, i) => ML.kmeansBest(Z, i + 1, rr, 6).inertia);
    const toRaw = c => [c[0] * R.sd[0] + R.mean[0], c[1] * R.sd[1] + R.mean[1]];

    const pA = new Plot(q('st-a'), { aspect: 0.85, xr: [0, 150], yr: [2.0, 2.9], xl: D.VARS[0], yl: D.VARS[1], nx: 6, ny: 6 });
    const pM = new Plot(q('st-m'), { aspect: 0.85, xr: [0.5, 6.5], yr: [0, 600], nx: 6, ny: 6, xl: 'Number of clusters, k', yl: 'Total squared distance', fmtx: v => (Number.isInteger(v) ? v : '') });
    const kb = H.bind(root, 'st-k', () => { stop(); compute(); draw(); }, v => v), sb = H.bind(root, 'st-side', () => { stop(); compute(); draw(); }, v => v);

    /* sort group numbers by mean gamma ray so the colors stay put between methods */
    function order(lab, k) {
      const m = new Array(k).fill(0), n = new Array(k).fill(0); lab.forEach((l, i) => { m[l] += R.X[i][0]; n[l]++; });
      const ord = m.map((v, i) => [n[i] ? v / n[i] : 1e9, i]).sort((a, b) => a[0] - b[0]), rank = new Array(k); ord.forEach((o, r) => { rank[o[1]] = r; });
      return lab.map(l => rank[l]);
    }
    function classifySom(P) {
      const nn = P.length, k = Math.min(st.k, nn), bm = S.bmu(Z, P), km = ML.kmeansBest(P, k, ML.rng(1), 4);
      const lab0 = bm.map(b => km.labels[b]), lab = order(lab0, k), hits = new Array(nn).fill(0); bm.forEach(b => hits[b]++);
      const pl = km.labels.map(l => l); const rank = {}; lab0.forEach((l, i) => { rank[l] = lab[i]; });
      return { P, lab, hits, protoLab: pl.map(l => (rank[l] === undefined ? 0 : rank[l])), k };
    }
    function compute() {
      if (st.method === 'km') { const m = ML.kmeans(Z, st.k, ML.rng(st.seed)); view = { lab: order(m.labels, st.k), cen: m.centers, k: st.k }; }
      else { const state = S.somInit(Z, st.side, st.seed); S.somAdvance(state, state.T); som = classifySom(state.P); view = { som, lab: som.lab, k: som.k }; }
      st.note = '';
    }
    function stop() { if (timer) { clearInterval(timer); timer = 0; } }

    function legend() {
      const sw = (c, ring) => `<i style="background:${c};${ring ? 'box-shadow:0 0 0 2.5px ' + ring + ';' : ''}"></i>`;
      const grp = st.method === 'km' ? 'cluster' : 'group of neurons';
      q('st-legend').innerHTML = (view && view.lab ? Array.from({ length: view.k }, (_, k) => `<span>${sw(Plot.CLUSTER[k])}Group ${k + 1}</span>`).join('') + `<span><i class="ctr">×</i>${st.method === 'km' ? 'Cluster center' : 'Neuron'}</span>` : `<span>${sw('#8A929A')}One rock sample, no label</span>`) +
        (st.show ? D.LITH.map((n, k) => `<span>${sw('#fff', D.LCOL[k])}${n} (ring)</span>`).join('') : '');
    }

    pA.onDraw = p => {
      p.axes();
      R.X.forEach((x, i) => p.dot(x[0], x[1], 4, view && view.lab ? Plot.hex2rgba(Plot.CLUSTER[view.lab[i] % 8], 0.85) : 'rgba(92,102,112,0.55)', st.show ? D.LCOL[R.y[i]] : null, 1.8));
      if (st.method === 'km' && view && view.cen) view.cen.forEach(c => { const q2 = toRaw(c); p.dot(q2[0], q2[1], 8, '#fff', C.INK, 2.4); p.text('×', q2[0], q2[1] + 0.004, { align: 'center', font: 'bold 13px system-ui' }); });
      if (st.method === 'som' && view && view.som) {
        const P = view.som.P.map(toRaw), side = st.side; p.clipStart();
        for (let k = 0; k < P.length; k++) { if (k % side < side - 1) p.line([P[k], P[k + 1]], 'rgba(22,25,28,0.7)', 1.6); if (k + side < P.length) p.line([P[k], P[k + side]], 'rgba(22,25,28,0.7)', 1.6); }
        P.forEach((q2, k) => p.dot(q2[0], q2[1], 6.5, Plot.hex2rgba(Plot.CLUSTER[view.som.protoLab[k] % 8], 1), C.INK, 1.8));
        p.clipEnd();
      }
    };
    pM.onDraw = p => {
      q('st-mh').textContent = st.method === 'km' ? 'What k-means built: the total distance for each k' : 'What the SOM built: the map of neurons';
      if (st.method === 'km') {
        p.o.noAxes = false; p.axes(); p.line(elbow.map((v, i) => [i + 1, v]), C.SLATE, 2); elbow.forEach((v, i) => p.dot(i + 1, v, 3, C.SLATE)); p.dot(st.k, elbow[st.k - 1], 6.5, C.RED);
        p.ptext('The bend near k = 3 is one guide.', p.o.m.l + 10, p.o.m.t + 14, { color: C.SLATE, font: '12px system-ui' });
      } else if (view && view.som) {
        p.o.noAxes = true; const side = st.side, c = p.ctx, cw = Math.min((p.W - 20) / side, (p.H - 44) / side), m = (p.W - cw * side) / 2, top = 10, mx = Math.max(...view.som.hits, 1);
        for (let k = 0; k < side * side; k++) {
          const i = k % side, j = Math.floor(k / side), cx = m + (i + 0.5) * cw, cy = top + (j + 0.5) * cw, col = Plot.CLUSTER[view.som.protoLab[k] % 8];
          c.fillStyle = Plot.hex2rgba(col, view.som.hits[k] ? 0.28 : 0.08); c.fillRect(m + i * cw + 1, top + j * cw + 1, cw - 2, cw - 2);
          if (view.som.hits[k]) { c.beginPath(); c.arc(cx, cy, Math.max(4, 0.4 * cw * Math.sqrt(view.som.hits[k] / mx)), 0, 6.2832); c.fillStyle = col; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.5; c.stroke(); }
        }
        p.ptext('Dot size is the number of samples closest to that neuron.', p.W / 2, p.H - 24, { align: 'center', font: '12px system-ui', color: C.SLATE });
        p.ptext('Neighbors on the grid describe similar samples.', p.W / 2, p.H - 8, { align: 'center', font: '12px system-ui', color: C.SLATE });
      }
      readout();
    };
    function purity() {
      const kmM = ML.kmeans(Z, st.k, ML.rng(st.seed)), s2 = S.somInit(Z, st.side, st.seed); S.somAdvance(s2, s2.T); const sm = classifySom(s2.P);
      return [ML.purity(kmM.labels, R.y, st.k, 3), ML.purity(sm.lab, R.y, sm.k, 3), sm.k];
    }
    function readout() {
      const nn = st.side * st.side;
      q('st-out').innerHTML = st.note || (st.method === 'km' ? `k-means with k = ${st.k}. Press Watch it run to see the centers move.` : `A SOM with ${nn} neurons in ${view && view.k} groups. Press Watch it run to see the grid stretch over the samples.`);
      const cmp = q('st-cmp');
      if (st.show) { const [a, b, k] = purity(); cmp.hidden = false; cmp.innerHTML = `With the true rock types on, k-means (k = ${st.k}) puts <b>${H.pct(a)}</b> of the samples in a group whose most common rock matches theirs, and the SOM (${nn} neurons, ${k} groups) puts <b>${H.pct(b)}</b>. Change k and the number of neurons and watch both numbers.`; } else cmp.hidden = true;
    }
    function draw() {
      q('st-siderow').style.opacity = st.method === 'som' ? 1 : 0.4;
      q('st-side').disabled = st.method !== 'som';
      legend(); pA.draw(); pM.draw();
    }

    /* animation */
    q('st-run').addEventListener('click', () => {
      stop(); const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (st.method === 'km') {
        const r = ML.rng(st.seed + 5), k = st.k, frames = []; let cen = ML.kppInit(Z, k, r), lab = null;
        frames.push({ lab: null, cen, note: 'Starting positions chosen. No sample belongs to a group yet.' });
        for (let it = 1; it <= 14; it++) {
          const nl = ML.assign(Z, cen); if (lab && nl.every((v, i) => v === lab[i])) { frames.push({ lab, cen, note: `Round ${it - 1}: no sample changed group, so k-means has converged.` }); break; }
          lab = nl; frames.push({ lab, cen, note: `Round ${it}: each sample joins the nearest center.` });
          cen = ML.update(Z, lab, k, r); frames.push({ lab, cen, note: `Round ${it}: each center moves to the mean of its samples.` });
        }
        let f = 0; const step = () => { const fr = frames[Math.min(f, frames.length - 1)]; view = { lab: fr.lab ? order(fr.lab, k) : null, cen: fr.cen, k }; st.note = fr.note; draw(); if (++f >= frames.length) stop(); };
        if (reduce) { f = frames.length - 1; step(); } else { step(); timer = setInterval(step, 800); }
      } else {
        const state = S.somInit(Z, st.side, st.seed); let last = 0;
        const step = () => {
          const done = S.somAdvance(state, reduce ? state.T : 60); som = classifySom(state.P); view = { som, lab: som.lab, k: som.k };
          st.note = `Training: ${Math.round(state.t / state.T * 100)}% of the updates done. Each update pulls the closest neuron and its grid neighbors toward one sample.`; draw();
          if (done) { stop(); st.note = ''; readout(); }
        };
        step(); if (!reduce) timer = setInterval(step, 90);
      }
    });
    q('st-new').addEventListener('click', () => { stop(); st.seed += 17; compute(); draw(); });
    q('st-method').addEventListener('change', e => { stop(); st.method = e.target.value; compute(); draw(); });
    q('st-true').addEventListener('change', e => { st.show = e.target.checked; draw(); });
    compute(); view = { lab: null, cen: view.cen, k: view.k, som: view.som }; if (st.method === 'km') view.cen = []; draw();
    g.START_DEBUG = { st };
  };
})(window);
