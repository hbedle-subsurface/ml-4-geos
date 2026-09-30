/* start.js - the opening tab. The same 300 rock samples, described by three measurements, are grouped
   two ways (k-means and a self-organizing map). A second cloud shows the true rock types once revealed. */
(function (g) {
  const { ML, DATA: D, Plot, H, MODULES: M, SEIS: S } = g;
  const C = Plot.C;

  M.push({
    id: 'start', part: 0, title: 'Machine learning in the geosciences',
    sub: 'An interactive lecture for incoming graduate students, School of Geosciences, University of Oklahoma',
    steps: [],
    html: () => `
      <div class="row2">
        <div><h5>What the method found</h5>${H.cv('st-a', 0.79)}</div>
        <div><h5>The true rock types</h5>${H.cv('st-b', 0.79)}</div>
      </div>
      <div class="ctlrow st-top">
        <label class="switch"><input type="checkbox" id="st-true"><span class="sw"></span><b>Reveal the true rock types</b></label>
        <label class="chk"><input type="checkbox" id="st-auto" checked> Keep turning</label>
        <div class="hintline">Drag either cloud to turn it.</div>
      </div>
      <div class="ctlrow">
        <div class="ctl"><label for="st-method">Method</label><select id="st-method"><option value="km">k-means</option><option value="som">Self-organizing map</option></select></div>
        ${H.S('st-k', 'Number of groups, k', 2, 6, 1, 3)}
        ${H.S('st-side', 'Neurons per side (map only)', 2, 6, 1, 4)}
      </div>
      <div class="ctlrow"><button type="button" class="btn primary" id="st-run">Watch it run</button><button type="button" class="btn" id="st-new">New start</button>
        <label class="chk" id="st-mergerow"><input type="checkbox" id="st-merge"> Merge the neurons into k groups (map only)</label></div>
      <div class="row2">
        <div><h5 id="st-mh">What k-means built</h5>${H.cv('st-m', 0.79)}</div>
        <div><div class="legend" id="st-legend"></div><div class="readout" id="st-out"></div><div class="readout" id="st-cmp" hidden></div></div>
      </div>`,
    init(root) {
      const R = H.R, Z3 = R.Z.map(z => [z[0], z[1], z[2]]), NAMES = ['Gamma ray', 'Density', 'Sonic'];
      const q = id => root.querySelector('#' + id);
      const st = { method: 'km', k: 3, side: 4, merge: false, seed: 31, show: false, rot: 30, auto: true, note: '' };
      let view = null, timer = 0, scores = null;
      const rr = ML.rng(12), elbow = Array.from({ length: 6 }, (_, i) => ML.kmeansBest(Z3, i + 1, rr, 6).inertia);
      const tilt = 0.4;
      const proj = (p, a) => { const x1 = p[0] * Math.cos(a) + p[2] * Math.sin(a), z1 = -p[0] * Math.sin(a) + p[2] * Math.cos(a); return [x1, p[1] * Math.cos(tilt) - z1 * Math.sin(tilt), z1]; };
      const opt = { xr: [-4.4, 4.4], yr: [-3.4, 3.4], noAxes: true, aspect: 0.79, m: { l: 3, r: 3, t: 3, b: 3 } };
      const pA = new Plot(q('st-a'), opt), pB = new Plot(q('st-b'), opt);
      const pM = new Plot(q('st-m'), { aspect: 0.79, xr: [0.5, 6.5], yr: [0, 1500], nx: 6, ny: 5, xl: 'Number of groups, k', yl: 'Total distance to the centers', fmtx: v => (Number.isInteger(v) ? v : '') });

      /* colors for the map: blend four corner colors across the grid so neighbors get similar colors */
      const CORN = [[59, 111, 182], [78, 159, 61], [224, 112, 60], [176, 74, 158]];
      const neuronRGB = (i, j, side) => { const u = side > 1 ? i / (side - 1) : 0, v = side > 1 ? j / (side - 1) : 0; return [0, 1, 2].map(c => Math.round((CORN[0][c] * (1 - u) + CORN[1][c] * u) * (1 - v) + (CORN[2][c] * (1 - u) + CORN[3][c] * u) * v)); };
      function order(lab, k) {
        const m = new Array(k).fill(0), n = new Array(k).fill(0); lab.forEach((l, i) => { m[l] += R.X[i][0]; n[l]++; });
        const ord = m.map((v, i) => [n[i] ? v / n[i] : 1e9, i]).sort((a, b) => a[0] - b[0]), rank = new Array(k); ord.forEach((o, r) => { rank[o[1]] = r; });
        return { lab: lab.map(l => rank[l]), rank };
      }
      function buildSom(P) {
        const nn = P.length, k = Math.min(st.k, nn), bmu = S.bmu(Z3, P), km = ML.kmeansBest(P, k, ML.rng(1), 4), o = order(bmu.map(b => km.labels[b]), k);
        const hits = new Array(nn).fill(0); bmu.forEach(b => hits[b]++);
        return { kind: 'som', P, bmu, hits, group: o.lab, protoGroup: km.labels.map(l => o.rank[l]), k, side: st.side };
      }
      function computeScores() {
        const km = ML.kmeans(Z3, st.k, ML.rng(st.seed)), s2 = S.somInit(Z3, st.side, st.seed); S.somAdvance(s2, s2.T); const sm = buildSom(s2.P);
        scores = { km: ML.purity(km.labels, R.y, st.k, 3), neurons: ML.purity(sm.bmu, R.y, st.side * st.side, 3), merged: ML.purity(sm.group, R.y, sm.k, 3), k: st.k, nn: st.side * st.side, mk: sm.k };
      }
      function compute() {
        if (st.method === 'km') { const m = ML.kmeans(Z3, st.k, ML.rng(st.seed)), o = order(m.labels, st.k); view = { kind: 'km', lab: o.lab, cen: m.centers, k: st.k }; }
        else { const state = S.somInit(Z3, st.side, st.seed); S.somAdvance(state, state.T); view = buildSom(state.P); }
        st.note = ''; computeScores();
      }
      const stop = () => { if (timer) { clearInterval(timer); timer = 0; } };

      /* ---- the two clouds ---- */
      function colorOf(i, depth) {
        if (!view) return `rgba(92,102,112,${(depth * 0.75).toFixed(2)})`;
        if (view.kind === 'km') return view.lab ? Plot.hex2rgba(Plot.CLUSTER[view.lab[i] % 8], depth) : `rgba(92,102,112,${(depth * 0.75).toFixed(2)})`;
        if (st.merge) return Plot.hex2rgba(Plot.CLUSTER[view.group[i] % 8], depth);
        const b = view.bmu[i], rgb = neuronRGB(b % view.side, Math.floor(b / view.side), view.side); return `rgba(${rgb.join(',')},${depth.toFixed(2)})`;
      }
      function cloud(pl, colorFn, overlay) {
        const a = st.rot * Math.PI / 180, c = pl.ctx;
        pl.rect(-4.4, -3.4, 4.4, 3.4, '#FBFCFC', C.GRID);
        [[3.2, 0, 0], [0, 3.2, 0], [0, 0, 3.2]].forEach((e, k) => {
          const qq = proj(e, a), o = proj([0, 0, 0], a); c.save(); c.strokeStyle = 'rgba(92,102,112,0.55)'; c.lineWidth = 1.4; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(pl.x(o[0]), pl.y(o[1])); c.lineTo(pl.x(qq[0]), pl.y(qq[1])); c.stroke(); c.restore();
          pl.ptext(NAMES[k], pl.x(qq[0]) + 4, pl.y(qq[1]) - 5, { color: C.SLATE, font: 'bold 12px system-ui' });
        });
        Z3.map((p, i) => ({ q: proj(p, a), i })).sort((u, v) => u.q[2] - v.q[2]).forEach(o => { const d = (o.q[2] + 3) / 6; pl.dot(o.q[0], o.q[1], 3 + 1.4 * d, colorFn(o.i, 0.55 + 0.45 * d)); });
        if (overlay) overlay(a);
      }
      pA.onDraw = pl => cloud(pl, colorOf, a => {
        if (!view) return;
        if (view.kind === 'km' && view.cen) view.cen.forEach(cn => { const p2 = proj(cn, a); pl.dot(p2[0], p2[1], 9, '#fff', C.INK, 2.6); pl.text('×', p2[0], p2[1] + 0.06, { align: 'center', font: 'bold 14px system-ui' }); });
        if (view.kind === 'som') {
          const P = view.P.map(p => proj(p, a)), side = view.side; pl.clipStart();
          for (let k = 0; k < P.length; k++) { if (k % side < side - 1) pl.line([P[k], P[k + 1]], 'rgba(22,25,28,0.8)', 1.8); if (k + side < P.length) pl.line([P[k], P[k + side]], 'rgba(22,25,28,0.8)', 1.8); }
          P.forEach((p2, k) => { const rgb = st.merge ? null : neuronRGB(k % side, Math.floor(k / side), side); pl.dot(p2[0], p2[1], 6.5, st.merge ? Plot.hex2rgba(Plot.CLUSTER[view.protoGroup[k] % 8], 1) : `rgb(${rgb.join(',')})`, C.INK, 2); });
          pl.clipEnd();
        }
      });
      pB.onDraw = pl => {
        cloud(pl, (i, d) => (st.show ? Plot.hex2rgba(D.LCOL[R.y[i]], d) : `rgba(92,102,112,${(d * 0.45).toFixed(2)})`));
        if (!st.show) { const c = pl.ctx; c.save(); c.fillStyle = 'rgba(255,255,255,0.88)'; c.fillRect(pl.W / 2 - 118, pl.H / 2 - 20, 236, 40); c.restore(); pl.ptext('Rock types hidden. Turn on the switch.', pl.W / 2, pl.H / 2, { align: 'center', font: '600 14px system-ui', color: C.INK }); }
      };
      pM.onDraw = p => {
        q('st-mh').textContent = st.method === 'km' ? 'What k-means built: how far the samples are from their centers' : 'What the map built: one square per neuron';
        if (st.method === 'km') {
          p.o.noAxes = false; p.axes(); p.line(elbow.map((v, i) => [i + 1, v]), C.SLATE, 2); elbow.forEach((v, i) => p.dot(i + 1, v, 3, C.SLATE)); p.dot(st.k, elbow[st.k - 1], 7, C.RED);
          p.ptext('Each extra group helps a little less.', p.o.m.l + 10, p.o.m.t + 16, { color: C.SLATE, font: '12.5px system-ui' });
        } else if (view && view.kind === 'som') {
          p.o.noAxes = true; const side = view.side, c = p.ctx, cw = Math.min((p.W - 20) / side, (p.H - 46) / side), m = (p.W - cw * side) / 2, top = 8, mx = Math.max(...view.hits, 1);
          for (let k = 0; k < side * side; k++) {
            const i = k % side, j = Math.floor(k / side), col = st.merge ? Plot.hex2rgba(Plot.CLUSTER[view.protoGroup[k] % 8], 1) : `rgb(${neuronRGB(i, j, side).join(',')})`;
            c.fillStyle = col; c.globalAlpha = 0.32; c.fillRect(m + i * cw + 1, top + j * cw + 1, cw - 2, cw - 2); c.globalAlpha = 1;
            if (view.hits[k]) { c.beginPath(); c.arc(m + (i + 0.5) * cw, top + (j + 0.5) * cw, Math.max(4, 0.42 * cw * Math.sqrt(view.hits[k] / mx)), 0, 6.2832); c.fillStyle = col; c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 1.6; c.stroke(); }
          }
          p.ptext('Dot size: how many samples are closest to that neuron.', p.W / 2, p.H - 24, { align: 'center', font: '12px system-ui', color: C.SLATE });
          p.ptext('Neurons next to each other describe similar rocks.', p.W / 2, p.H - 8, { align: 'center', font: '12px system-ui', color: C.SLATE });
        } else { p.o.noAxes = true; p.ptext('Press Watch it run, or move a slider.', p.W / 2, p.H / 2, { align: 'center', color: C.SLATE, font: '14px system-ui' }); }
        readout();
      };

      function legend() {
        const sw = c => `<i style="background:${c}"></i>`;
        let h = '';
        if (!view) h = `<span>${sw('#8A929A')}One rock sample, not grouped yet</span>`;
        else if (view.kind === 'km' && !view.lab) h = `<span>${sw('#8A929A')}One rock sample, not grouped yet</span><span><i class="ctr">×</i>Center</span>`;
        else if (view.kind === 'km') h = Array.from({ length: view.k }, (_, k) => `<span>${sw(Plot.CLUSTER[k])}Group ${k + 1}</span>`).join('') + '<span><i class="ctr">×</i>Center</span>';
        else if (st.merge) h = Array.from({ length: view.k }, (_, k) => `<span>${sw(Plot.CLUSTER[k])}Group ${k + 1}</span>`).join('') + '<span><i class="dotc"></i>Neuron</span>';
        else h = '<span>Each neuron has its own color, blended across the grid.</span><span><i class="dotc"></i>Neuron</span>';
        if (st.show) h += D.LITH.map((n, k) => `<span>${sw(D.LCOL[k])}${n} (right plot)</span>`).join('');
        q('st-legend').innerHTML = h;
      }
      function readout() {
        const nn = st.side * st.side;
        q('st-out').innerHTML = st.note || (!view ? 'Nothing is grouped yet. Press Watch it run to see the method work, or move a slider to see the result right away.' : st.method === 'km' ? `k-means with k = ${st.k}: ${st.k} centers, each one the middle of its group.` : `A ${st.side} by ${st.side} map: ${nn} neurons${st.merge ? `, merged into ${view.k} groups` : ', each with its own color'}.`);
        const cmp = q('st-cmp');
        if (st.show && scores) {
          cmp.hidden = false;
          cmp.innerHTML = `<b>Score against the true rock types.</b> Each sample lands in a group. The score is the share of samples whose own rock type is the most common one in their group.<br>k-means, ${scores.k} groups: <b>${H.pct(scores.km)}</b><br>Map, ${scores.nn} neurons: <b>${H.pct(scores.neurons)}</b> (more groups make a high score easier)<br>Map merged into ${scores.mk} groups: <b>${H.pct(scores.merged)}</b>`;
        } else cmp.hidden = true;
      }
      function redraw() {
        q('st-side-o'); const som = st.method === 'som';
        q('st-side').disabled = !som; q('st-side').closest('.ctl').style.opacity = som ? 1 : 0.4;
        q('st-merge').disabled = !som; q('st-mergerow').style.opacity = som ? 1 : 0.4;
        legend(); pA.draw(); pB.draw(); pM.draw();
      }
      const redrawClouds = () => { pA.draw(); pB.draw(); };

      /* ---- controls ---- */
      H.bind(root, 'st-k', v => { st.k = v; stop(); compute(); redraw(); }, v => v);
      H.bind(root, 'st-side', v => { st.side = v; stop(); compute(); redraw(); }, v => v);
      q('st-method').addEventListener('change', e => { stop(); st.method = e.target.value; compute(); redraw(); });
      q('st-merge').addEventListener('change', e => { st.merge = e.target.checked; redraw(); });
      q('st-true').addEventListener('change', e => { st.show = e.target.checked; redraw(); });
      q('st-auto').addEventListener('change', e => { st.auto = e.target.checked; });
      q('st-new').addEventListener('click', () => { stop(); st.seed += 17; compute(); redraw(); });

      q('st-run').addEventListener('click', () => {
        stop(); const reduce = g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (st.method === 'km') {
          const r = ML.rng(st.seed + 5), k = st.k, frames = []; let cen = ML.kppInit(Z3, k, r), lab = null;
          frames.push({ lab: null, cen, note: 'Step 1: the computer drops k centers into the data. No sample belongs to a group yet.' });
          for (let it = 1; it <= 14; it++) {
            const nl = ML.assign(Z3, cen); if (lab && nl.every((v, i) => v === lab[i])) { frames.push({ lab, cen, note: `Round ${it - 1}: no sample changed groups, so k-means is finished.` }); break; }
            lab = nl; frames.push({ lab, cen, note: `Round ${it}, part 1: every sample joins its closest center.` });
            cen = ML.update(Z3, lab, k, r); frames.push({ lab, cen, note: `Round ${it}, part 2: every center moves to the middle of its samples.` });
          }
          let f = 0; const step = () => { const fr = frames[Math.min(f, frames.length - 1)]; view = { kind: 'km', lab: fr.lab ? order(fr.lab, k).lab : null, cen: fr.cen, k }; st.note = fr.note; redraw(); if (++f >= frames.length) { stop(); computeScores(); redraw(); } };
          if (reduce) { f = frames.length - 1; step(); } else { step(); timer = setInterval(step, 850); }
        } else {
          const state = S.somInit(Z3, st.side, st.seed);
          const step = () => { const done = S.somAdvance(state, reduce ? state.T : 60); view = buildSom(state.P); st.note = `Training: ${Math.round(state.t / state.T * 100)}% done. Each sample pulls its closest neuron, and the neurons beside it, a little closer.`; redraw(); if (done) { stop(); st.note = ''; computeScores(); redraw(); } };
          step(); if (!reduce) timer = setInterval(step, 90);
        }
      });

      /* ---- turning ---- */
      const spin = () => { if (st.auto && q('st-a').isConnected && q('st-a').clientWidth) { st.rot = (st.rot + 0.35) % 360; redrawClouds(); } requestAnimationFrame(spin); };
      requestAnimationFrame(spin);
      [pA.c, pB.c].forEach(cv => {
        let drag = false, lx = 0;
        cv.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; if (cv.setPointerCapture) cv.setPointerCapture(e.pointerId); });
        cv.addEventListener('pointermove', e => { if (!drag) return; st.rot = (st.rot + (e.clientX - lx) * 0.6 + 360) % 360; lx = e.clientX; redrawClouds(); });
        ['pointerup', 'pointercancel'].forEach(ev => cv.addEventListener(ev, () => { drag = false; }));
      });
      computeScores(); redraw();
      g.START_DEBUG = { st, get view() { return view; } };
    }
  });
})(window);
